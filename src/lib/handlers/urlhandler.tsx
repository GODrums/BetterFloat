import globalStyle from 'url:~/style.css';
import { relayMessage } from '@plasmohq/messaging';
import { createIsolatedElement } from '@webext-core/isolated-element';
import { createRoot } from 'react-dom/client';
import type { Extension } from '~lib/@typings/ExtensionTypes';
import { CSFloatHelpers } from '~lib/helpers/csfloat_helpers';
import { createLiveLink, filterDisplay } from '~lib/helpers/skinport_helpers';
import CSFAutorefresh from '~lib/inline/CSFAutorefresh';
import CSFBargainButtons from '~lib/inline/CSFBargainButtons';
import CSFMarketComparison from '~lib/inline/CSFMarketComparison';
import CSFMenuControl from '~lib/inline/CSFMenuControl';
import CSFQuickMenu from '~lib/inline/CSFQuickMenu';
import CSFSellSettings from '~lib/inline/CSFSellSettings';
import CSMAutorefresh from '~lib/inline/CSMAutorefresh';
import DMMarketComparison from '~lib/inline/DMMarketComparison';
import DmAutorefresh from '~lib/inline/DmAutorefresh';
import GPAutorefresh from '~lib/inline/GPAutorefresh';
import LisAutorefresh from '~lib/inline/LisAutorefresh';
import LisMarketComparison from '~lib/inline/LisMarketComparison';
import SkbAutorefresh from '~lib/inline/SkbAutorefresh';
import SpLiveFilter from '~lib/inline/SpLiveFilter';
import SpMarketComparison from '~lib/inline/SpMarketComparison';
import SpNotifications from '~lib/inline/SpNotifications';
import UpdatePopup from '~lib/inline/UpdatePopup';
import { EVENT_URL_CHANGED } from '~lib/util/globals';
import { createUrlListener, waitForElement } from '~lib/util/helperfunctions';
import { ExtensionStorage, getSetting } from '~lib/util/storage';
import { CSMONEY_SELECTORS } from './selectors/csmoney_selectors';

export function urlHandler() {
	chrome.runtime.onMessage.addListener((message) => {
		if (message.type === EVENT_URL_CHANGED) {
			const state: Extension.URLState = message.state;

			console.debug('[BetterFloat] URLHandler - changed to: ', state);

			if (state.site === 'csfloat.com') {
				CSFloatHelpers.adjustCSFTitle(state);
			} else if (state.site === 'skinport.com') {
				createLiveLink();
				if (state.path === '/market' && state.search.includes('sort=date&order=desc')) {
					filterDisplay();
				} else if (state.path.startsWith('/item/')) {
					mountSpMarketComparison();
				}
			} else if (state.site === 'lis-skins.com') {
				if (state.path.includes('/market/csgo/')) {
					mountLisMarketComparison();
				}
			}
		}
	});
}

export function dynamicUIHandler() {
	//listener for messages from background
	chrome.runtime.onMessage.addListener(async (message) => {
		if (message.type === EVENT_URL_CHANGED) {
			const state: Extension.URLState = message.state;

			await handleChange(state);
		}
	});

	const callHandleChange = async (url: URL) => {
		const state: Extension.URLState = {
			site: url.hostname,
			path: url.pathname,
			search: url.search,
			hash: url.hash,
		};
		await handleChange(state);
	};

	// dmarket is a bit special and needs an additional listener
	if (location.hostname === 'dmarket.com') {
		createUrlListener(callHandleChange, 1500);
	} else {
		callHandleChange(new URL(location.href));
	}

	if (['skinport.com', 'csfloat.com', 'lis-skins.com', 'dmarket.com'].includes(location.hostname)) {
		addMessageRelays();
	}

	setTimeout(showUpdatePopup, 3000);
}

async function showUpdatePopup() {
	// minor updates don't receive a new popup
	const extensionVersion = chrome.runtime.getManifest().version;
	const updateVersion = '3.3.0';
	if (extensionVersion !== updateVersion) {
		return;
	}

	const storageKey = `show-update-popup-${updateVersion}`;
	const showUpdate = await ExtensionStorage.sync.get<boolean>(storageKey);
	// show update popup
	if (showUpdate !== false) {
		await mountShadowRoot(<UpdatePopup />, {
			tagName: 'betterfloat-update-popup',
			parent: document.body,
		});
		await ExtensionStorage.sync.set(storageKey, false);
	}
}

async function handleChange(state: Extension.URLState) {
	console.debug('[BetterFloat] DynamicUIHandler - changed to: ', state);

	if (state.site === 'skinport.com') {
		await handleSkinportChange(state);
	} else if (state.site === 'csfloat.com') {
		await handleCSFloatChange(state);
	} else if (state.site === 'dmarket.com') {
		await handleDMarketChange(state);
	} else if (state.site === 'lis-skins.com') {
		await handleLisSkinsChange(state);
	} else if (state.site === 'cs.money') {
		await handleCSMoneyChange(state);
	} else if (state.site === 'gamerpay.gg') {
		await handleGamerpayChange(state);
	} else if (state.site === 'skinbid.com') {
		await handleSkinbidChange(state);
	}
}

function addMessageRelays() {
	relayMessage({
		name: 'createNotification',
	});

	relayMessage({
		name: 'getMarketComparison',
	});
}

let lastCSFState: Extension.URLState | null = null;

async function handleCSFloatChange(state: Extension.URLState) {
	// csfloat rearranges market parameters on /search when using the back button
	// this causes us to receive the same state multiple times
	if (lastCSFState && state.path === lastCSFState.path && state.search === lastCSFState.search && state.hash === lastCSFState.hash) {
		return;
	}
	lastCSFState = state;
	const sideMenu = document.querySelector<HTMLElement>('app-advanced-search');
	if (sideMenu?.offsetWidth && sideMenu.offsetWidth > 0 && !document.querySelector('betterfloat-menucontrol')) {
		const { root } = await mountShadowRoot(<CSFMenuControl />, {
			tagName: 'betterfloat-menucontrol',
			parent: document.querySelector('.search-bar .drill-down'),
			position: 'before',
		});
		if (Array.from(document.querySelectorAll('betterfloat-menucontrol')).length > 1) {
			root.unmount();
			document.querySelector('betterfloat-menucontrol')?.remove();
		}
	}

	if (state.path === '/search') {
		const csfAutorefresh = await getSetting('csf-autorefresh');
		if (csfAutorefresh) {
			const success = await waitForElement('.refresh > button');
			if (success && !document.querySelector('betterfloat-autorefresh')) {
				const { root } = await mountShadowRoot(<CSFAutorefresh />, {
					tagName: 'betterfloat-autorefresh',
					parent: document.querySelector('.refresh'),
					position: 'before',
				});
				// unmount on url change
				const interval = createUrlListener((newUrl) => {
					if (newUrl.pathname !== '/search' && !newUrl.pathname.startsWith('/item/')) {
						root.unmount();
						document.querySelector('betterfloat-autorefresh')?.remove();
						clearInterval(interval);
					}
				}, 1000);
			}
		}
	} else if (state.path.includes('/item/')) {
		const showMarketComparison = await ExtensionStorage.sync.get<boolean>('csf-marketcomparison');
		if (showMarketComparison) {
			if (document.querySelector('betterfloat-market-comparison')) {
				// wait for the new dialog to replace the old one
				await new Promise((resolve) => setTimeout(resolve, 500));
			}
			const success = await waitForElement('div.full-screen-dialog .container');
			if (!success) return;
			const popup = document.querySelector<HTMLElement>('div.full-screen-dialog');
			const container = popup?.querySelector<HTMLElement>('.container');
			if (popup && container) {
				popup.style.width = Number(popup.style.width.substring(0, popup.style.width.length - 2)) + 230 + 'px';
				container.id = 'bf-popup-item-container';
				const { root: comparisonRoot } = await mountShadowRoot(<CSFMarketComparison />, {
					tagName: 'betterfloat-market-comparison',
					parent: container,
				});
				const ownContainer = document.querySelector<HTMLElement>('betterfloat-market-comparison');
				if (ownContainer) {
					ownContainer.style.gridRow = '1 / span 2';
				}
				const interval = createUrlListener((url) => {
					if (!url.pathname.includes('/item/')) {
						comparisonRoot.unmount();
						ownContainer?.remove();
						clearInterval(interval);
					}
				}, 1000);
			}
		}
	} else if (state.path === '/sell') {
		const showSellPricing = await ExtensionStorage.sync.get<boolean>('csf-sellpricing');
		if (showSellPricing) {
			const success = await waitForElement('app-sell-home .actions');
			if (success && !document.querySelector('betterfloat-sell-settings')) {
				await mountShadowRoot(<CSFSellSettings />, {
					tagName: 'betterfloat-sell-settings',
					parent: document.querySelector('app-sell-home .actions')?.firstElementChild,
					position: 'before',
				});
			}
		}
	}

	const isLoggedIn = !!document.querySelector('app-header .avatar');
	const csfShowQuickMenu = await getSetting<boolean>('csf-quickmenu');
	if (isLoggedIn && csfShowQuickMenu && !document.querySelector('betterfloat-quick-menu')) {
		const { root } = await mountShadowRoot(<CSFQuickMenu />, {
			tagName: 'betterfloat-quick-menu',
			parent: document.querySelector('app-header .balance-container')?.parentElement,
			position: 'before',
		});
		if (Array.from(document.querySelectorAll('betterfloat-quick-menu')).length > 1) {
			root.unmount();
			document.querySelector('betterfloat-quick-menu')?.remove();
		}
	}
}

async function handleSkinportChange(state: Extension.URLState) {
	if (state.path === '/market' && state.search.includes('sort=date&order=desc')) {
		waitForElement('.CatalogHeader-tooltipLive').then(async (success) => {
			if (success) {
				if (!document.querySelector('betterfloat-skinport-notifications')) {
					const { root: notifyRoot } = await mountShadowRoot(<SpNotifications />, {
						tagName: 'betterfloat-skinport-notifications',
						parent: document.querySelector('.CatalogHeader-tooltipLive'),
						position: 'before',
					});
					const notifyInterval = createUrlListener((url) => {
						if (url.pathname !== '/market' || !url.search.includes('sort=date&order=desc')) {
							notifyRoot.unmount();
							document.querySelector('betterfloat-skinport-notifications')?.remove();
							clearInterval(notifyInterval);
						}
					}, 1000);

					relayMessage({
						name: 'createNotification',
					});
				}

				if (!document.querySelector('betterfloat-live-filter')) {
					const { root } = await mountShadowRoot(<SpLiveFilter />, {
						tagName: 'betterfloat-live-filter',
						parent: document.querySelector('.CatalogHeader-tooltipLive'),
						position: 'before',
					});
					// unmount on url change
					const interval = createUrlListener((url) => {
						if (url.pathname !== '/market' || !url.search.includes('sort=date&order=desc')) {
							root.unmount();
							document.querySelector('betterfloat-live-filter')?.remove();
							clearInterval(interval);
						}
					}, 1000);
				}
			}
		});
	}
	if (state.path.startsWith('/item/')) {
		await mountSpMarketComparison();
	}
}

async function handleDMarketChange(state: Extension.URLState) {
	if (state.path === '/ingame-items/item-list/csgo-skins' && !state.search.includes('exchangeTab=myTargets') && !state.search.includes('exchangeTab=exchange')) {
		const dmAutorefresh = await getSetting('dm-autorefresh');
		if (dmAutorefresh) {
			const success = await waitForElement('button.o-filter--refresh', { maxTries: 30 });
			if (success && !document.querySelector('betterfloat-dm-autorefresh')) {
				const { root } = await mountShadowRoot(<DmAutorefresh />, {
					tagName: 'betterfloat-dm-autorefresh',
					parent: document.querySelector('span.c-assetFilters__spacer'),
					position: 'before',
				});
				// unmount on url change
				const interval = createUrlListener((url) => {
					if (url.pathname !== '/ingame-items/item-list/csgo-skins') {
						root.unmount();
						document.querySelector('betterfloat-dm-autorefresh')?.remove();
						clearInterval(interval);
					}
				}, 1000);
			}
		}
	}
}

async function handleLisSkinsChange(state: Extension.URLState) {
	const isItemPage = state.path.includes('/market/csgo/') || state.path.includes('/market/cs2/');

	if (isItemPage) {
		const lisAutorefresh = await getSetting('lis-autorefresh');
		if (lisAutorefresh) {
			const success = await waitForElement('div.reload');
			if (success && !document.querySelector('betterfloat-lis-autorefresh')) {
				const { root } = await mountShadowRoot(<LisAutorefresh />, {
					tagName: 'betterfloat-lis-autorefresh',
					parent: document.querySelector('div.reload'),
					position: 'after',
				});
				// unmount on url change
				const interval = createUrlListener((url) => {
					if (!url.pathname.includes('/market/')) {
						root.unmount();
						document.querySelector('betterfloat-lis-autorefresh')?.remove();
						clearInterval(interval);
					}
				}, 1000);
			}
		}
	}

	if (isItemPage && document.querySelector('div.skins-market-view')) {
		await mountLisMarketComparison();
	}
}

async function handleGamerpayChange(state: Extension.URLState) {
	if (!state.path.includes('/item/')) {
		const gpAutorefresh = await getSetting('gp-autorefresh');
		if (gpAutorefresh) {
			const success = await waitForElement('div[class*="Index_typeBar__"]');
			if (success && !document.querySelector('betterfloat-gp-autorefresh')) {
				const parent = document.querySelector<HTMLElement>('div[class*="Index_typeBar__"]')!;
				const { root } = await mountShadowRoot(<GPAutorefresh />, {
					tagName: 'betterfloat-gp-autorefresh',
					parent: parent,
				});
				parent.style.alignItems = 'center';
				// unmount on url change
				const interval = createUrlListener((url) => {
					if (url.pathname.includes('/item/')) {
						root.unmount();
						document.querySelector('betterfloat-gp-autorefresh')?.remove();
						clearInterval(interval);
					}
				}, 1000);
			}
		}
	}
}

async function handleSkinbidChange(state: Extension.URLState) {
	if (state.path.startsWith('/market')) {
		const skbAutorefresh = await getSetting('skb-autorefresh');
		if (skbAutorefresh) {
			const success = await waitForElement('.items-header > app-sort-single-select');
			if (success && !document.querySelector('betterfloat-skb-autorefresh')) {
				const parent = document.querySelector<HTMLElement>('.items-header > app-sort-single-select')!;
				const { root, parentElement } = await mountShadowRoot(<SkbAutorefresh />, {
					tagName: 'betterfloat-skb-autorefresh',
					parent,
					position: 'before',
				});
				if (parentElement.previousElementSibling?.tagName === 'BETTERFLOAT-SKB-AUTOREFRESH') {
					parentElement.previousElementSibling.remove();
				}
				// unmount on url change
				const interval = createUrlListener((url) => {
					if (!url.pathname.startsWith('/market')) {
						root.unmount();
						document.querySelector('betterfloat-skb-autorefresh')?.remove();
						clearInterval(interval);
					}
				}, 1000);
			}
		}
	}
}

export async function mountDMarketMarketComparison(container: HTMLElement) {
	await mountShadowRoot(<DMMarketComparison />, {
		tagName: 'betterfloat-dm-market-comparison',
		parent: container,
	});
}

async function mountLisMarketComparison() {
	const showMarketComparison = await ExtensionStorage.sync.get<boolean>('lis-marketcomparison');
	if (!showMarketComparison) {
		return;
	}

	// Wait for the main item container identified by the content script
	const itemPageContainerResult = await waitForElement('div.skins-market-view[data-betterfloat]', { maxTries: 20 });

	// Check if the result is an Element (truthy and not a boolean)
	if (itemPageContainerResult && !document.querySelector('betterfloat-lis-market-comparison')) {
		const itemPageContainer = document.querySelector<HTMLElement>('div.market-skin-preview');

		const { root } = await mountShadowRoot(<LisMarketComparison />, {
			tagName: 'betterfloat-lis-market-comparison',
			parent: itemPageContainer,
			position: 'after',
		});

		const comparisonElement = document.querySelector('betterfloat-lis-market-comparison');
		if (comparisonElement) {
			(comparisonElement as HTMLElement).style.width = '240px';
			(comparisonElement as HTMLElement).style.flexShrink = '0';
		}

		const interval = createUrlListener((url) => {
			if (!url.pathname.includes('/market/csgo/') || !document.querySelector('div.skins-market-view')) {
				root.unmount();
				document.querySelector('betterfloat-lis-market-comparison')?.remove();
				clearInterval(interval);
			}
		}, 1000);
	}
}

async function mountSpMarketComparison() {
	const showMarketComparison = await ExtensionStorage.sync.get<boolean>('sp-marketcomparison');
	if (!showMarketComparison) {
		return;
	}

	let suggestedPrice = document.querySelector<HTMLElement>('.ItemPage-row .ItemPage-suggested');
	while (!suggestedPrice || !suggestedPrice.textContent?.startsWith('Suggested price')) {
		await new Promise((resolve) => setTimeout(resolve, 100));
		suggestedPrice = document.querySelector<HTMLElement>('.ItemPage-row .ItemPage-suggested');
		if (!suggestedPrice) {
			suggestedPrice = document.querySelector<HTMLElement>('.ItemPage-suggestedPrice');
		}
		let waitCounter = 0;
		if (waitCounter++ > 50) {
			console.warn('[BetterFloat] mountSpMarketComparison: Timeout waiting for suggested price element.');
			return;
		}
	}

	if (suggestedPrice && !document.querySelector('betterfloat-market-comparison')) {
		const leftColumn = document.querySelector<HTMLElement>('.ItemPage-column--left');
		const rightColumn = document.querySelector<HTMLElement>('.ItemPage-column--right');
		const itemPageInfo = suggestedPrice.closest<HTMLElement>('.ItemPage-info');

		if (leftColumn && rightColumn && itemPageInfo) {
			leftColumn.style.width = '55%';
			rightColumn.style.width = '45%';
			itemPageInfo.classList.add('betterfloat-itempage-info');

			const { root } = await mountShadowRoot(<SpMarketComparison />, {
				tagName: 'betterfloat-market-comparison',
				parent: itemPageInfo,
				position: 'after',
			});
			const rootContainer = document.querySelector<HTMLElement>('betterfloat-market-comparison');
			if (rootContainer) {
				rootContainer.style.backgroundColor = '#2b2f30';
				const interval = createUrlListener((url) => {
					if (!url.pathname.startsWith('/item/')) {
						root.unmount();
						rootContainer.remove();
						leftColumn.style.width = '';
						rightColumn.style.width = '';
						clearInterval(interval);
					}
				}, 1000);
			}
		} else {
			console.error('[BetterFloat] mountSpMarketComparison: Could not find required page elements (columns or info container).');
		}
	}
}

export async function mountCSFBargainButtons() {
	await mountShadowRoot(<CSFBargainButtons />, {
		tagName: 'betterfloat-bargain-buttons',
		parent: document.querySelector('.details .inputs'),
		position: 'after',
	});
}

/**
 * Mounts a React component inside a shadow root as child of the given parent element
 * @param component React component to mount
 * @param options mounting options, defaults to appending to document.body
 */
async function mountShadowRoot(component: JSX.Element, options: { tagName: string; parent?: Element | null; position?: 'before' | 'after' }) {
	const { parentElement, isolatedElement } = await createIsolatedElement({
		name: options.tagName,
		css: {
			url: globalStyle,
		},
		isolateEvents: true,
	});

	// Mount our UI inside the isolated element
	const domRoot = document.createElement('div');
	const root = createRoot(domRoot);
	root.render(component);
	isolatedElement.appendChild(domRoot);

	const parent = options.parent || document.getElementById('root') || document.body;
	// Mount the UI to the DOM
	if (options.position === 'before') {
		parent.before(parentElement);
	} else if (options.position === 'after') {
		parent.after(parentElement);
	} else {
		parent.appendChild(parentElement);
	}

	// Handle unmounting if the parent element is removed (e.g., via React Router navigation)
	if (parentElement) {
		const observer = new MutationObserver((mutationsList, obs) => {
			for (const mutation of mutationsList) {
				if (mutation.removedNodes) {
					mutation.removedNodes.forEach((node) => {
						if (node === parentElement) {
							try {
								root.unmount();
							} catch (e) {
								console.warn('[BetterFloat] Error unmounting shadow root:', e);
							}
							obs.disconnect();
							return;
						}
					});
				}
			}
		});

		if (parentElement.parentNode) {
			observer.observe(parentElement.parentNode, { childList: true });
		}
	}

	return { root, parentElement, isolatedElement };
}
async function handleCSMoneyChange(state: Extension.URLState) {
	if (state.path === '/market/buy/') {
		const csmAutorefresh = await getSetting('csm-autorefresh');
		if (csmAutorefresh) {
			const success = await waitForElement(CSMONEY_SELECTORS.market.reloadButton, { maxTries: 30 });
			if (success && !document.querySelector('betterfloat-csm-autorefresh')) {
				const { root } = await mountShadowRoot(<CSMAutorefresh />, {
					tagName: 'betterfloat-csm-autorefresh',
					parent: document.querySelector(CSMONEY_SELECTORS.market.reloadButton)?.parentElement,
				});
				// unmount on url change
				const interval = createUrlListener((url) => {
					if (url.pathname !== '/market/buy/') {
						root.unmount();
						document.querySelector('betterfloat-csm-autorefresh')?.remove();
						clearInterval(interval);
					}
				}, 1000);
			}
		}
	}
}
