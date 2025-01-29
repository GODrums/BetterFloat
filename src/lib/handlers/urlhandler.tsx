import globalStyle from 'url:~/style.css';
import { createIsolatedElement } from '@webext-core/isolated-element';

import { createRoot } from 'react-dom/client';

import type { Extension } from '~lib/@typings/ExtensionTypes';
import { CSFloatHelpers } from '~lib/helpers/csfloat_helpers';
import { createLiveLink, filterDisplay } from '~lib/helpers/skinport_helpers';
import CSFAutorefresh from '~lib/inline/CSFAutorefresh';
import CSFBargainButtons from '~lib/inline/CSFBargainButtons';
import CSFMenuControl from '~lib/inline/CSFMenuControl';
import CSFQuickMenu from '~lib/inline/CSFQuickMenu';
import CSFThemeToggle from '~lib/inline/CSFThemeToggle';
import DmAutorefresh from '~lib/inline/DmAutorefresh';
import LisAutorefresh from '~lib/inline/LisAutorefresh';
import SPBuffContainer from '~lib/inline/SpBuffContainer';
import SpLiveFilter from '~lib/inline/SpLiveFilter';
import SpNotifications from '~lib/inline/SpNotifications';
import UpdatePopup from '~lib/inline/UpdatePopup';
import { createUrlListener, waitForElement } from '~lib/util/helperfunctions';
import { ExtensionStorage, getSetting } from '~lib/util/storage';

export function urlHandler() {
	// To be improved: sometimes the page is not fully loaded yet when the initial URL state is sent
	chrome.runtime.onMessage.addListener((message) => {
		if (message.type === 'BetterFloat_URL_CHANGED') {
			const state: Extension.URLState = message.state;

			console.debug('[BetterFloat] URLHandler - changed to: ', state);

			if (state.site === 'csfloat.com') {
				CSFloatHelpers.adjustCSFTitle(state);
			} else if (state.site === 'skinport.com') {
				createLiveLink();
				if (state.path === '/market' && state.search.includes('sort=date&order=desc')) {
					filterDisplay();
				}
			}
		}
	});
}

export function dynamicUIHandler() {
	//listener for messages from background
	chrome.runtime.onMessage.addListener(async (message) => {
		if (message.type === 'BetterFloat_URL_CHANGED') {
			const state: Extension.URLState = message.state;

			await handleChange(state);
		}
	});

	// dmarket is a bit special and needs an additional listener
	if (location.hostname === 'dmarket.com') {
		createUrlListener((newUrl) => {
			handleChange({
				site: newUrl.hostname,
				path: newUrl.pathname,
				search: newUrl.search,
				hash: newUrl.hash,
			});
		}, 1500);
	}

	setTimeout(async () => {
		const state: Extension.URLState = {
			site: location.hostname,
			path: location.pathname,
			search: location.search,
			hash: location.hash,
		};
		await handleChange(state);
	}, 1500);

	// setTimeout(async () => {
	// 	const storageKey = `show-update-popup-${chrome.runtime.getManifest().version}`;
	// 	const showUpdate = await ExtensionStorage.sync.get<boolean>(storageKey);
	// 	// show update popup
	// 	if (showUpdate !== false) {
	// 		await mountShadowRoot(<UpdatePopup />, {
	// 			tagName: 'betterfloat-update-popup',
	// 			parent: document.body,
	// 		});
	// 		await ExtensionStorage.sync.set(storageKey, false);
	// 	}
	// }, 3000);
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
	}
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
		const root = await mountShadowRoot(<CSFMenuControl />, {
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
				const root = await mountShadowRoot(<CSFAutorefresh />, {
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
	}

	const csfShowThemeToggle = await getSetting<boolean>('csf-themetoggle');
	if (csfShowThemeToggle && !document.querySelector('betterfloat-theme-toggle')) {
		const root = await mountShadowRoot(<CSFThemeToggle />, {
			tagName: 'betterfloat-theme-toggle',
			parent: document.querySelector('.toolbar > .mat-mdc-menu-trigger'),
			position: 'after',
		});
		if (Array.from(document.querySelectorAll('betterfloat-theme-toggle')).length > 1) {
			root.unmount();
			document.querySelector('betterfloat-theme-toggle')?.remove();
		}
	}

	const isLoggedIn = !!document.querySelector('app-header .avatar');
	const csfShowQuickMenu = await getSetting<boolean>('csf-quickmenu');
	if (isLoggedIn && csfShowQuickMenu && !document.querySelector('betterfloat-quick-menu')) {
		const root = await mountShadowRoot(<CSFQuickMenu />, {
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
					const notifyRoot = await mountShadowRoot(<SpNotifications />, {
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
				}

				if (!document.querySelector('betterfloat-live-filter')) {
					const root = await mountShadowRoot(<SpLiveFilter />, {
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
}

async function handleDMarketChange(state: Extension.URLState) {
	if (state.path === '/ingame-items/item-list/csgo-skins' && !state.search.includes('exchangeTab=myTargets') && !state.search.includes('exchangeTab=exchange')) {
		const dmAutorefresh = await getSetting('dm-autorefresh');
		if (dmAutorefresh) {
			const success = await waitForElement('button.o-filter--refresh', { maxTries: 30 });
			if (success && !document.querySelector('betterfloat-dm-autorefresh')) {
				const root = await mountShadowRoot(<DmAutorefresh />, {
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
	if (state.path === '/ru/market/cs2/' || state.path === '/ru/market/csgo/') {
		const lisAutorefresh = await getSetting('lis-autorefresh');
		if (lisAutorefresh) {
			const success = await waitForElement('div.reload');
			if (success && !document.querySelector('betterfloat-lis-autorefresh')) {
				const root = await mountShadowRoot(<LisAutorefresh />, {
					tagName: 'betterfloat-lis-autorefresh',
					parent: document.querySelector('div.reload'),
					position: 'after',
				});
				// unmount on url change
				const interval = createUrlListener((url) => {
					if (!url.pathname.includes('/ru/market/')) {
						root.unmount();
						document.querySelector('betterfloat-lis-autorefresh')?.remove();
						clearInterval(interval);
					}
				}, 1000);
			}
		}
	}
}

export async function mountSpItemPageBuffContainer() {
	await mountShadowRoot(<SPBuffContainer />, {
		tagName: 'betterfloat-buff-container',
		parent: document.querySelector('.ItemPage-notListed') ?? document.querySelector('.ItemPage-btns'),
		position: 'before',
	});
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

	// Handle unmounting if the parent element is removed
	parentElement.addEventListener('remove', () => {
		root.unmount();
	});

	return root;
}
