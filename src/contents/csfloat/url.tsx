import type { Extension } from '~lib/@typings/ExtensionTypes';
import { CSFloatHelpers } from '~lib/helpers/csfloat_helpers';
import CSFAutorefresh from '~lib/inline/CSFAutorefresh';
import CSFBargainButtons from '~lib/inline/CSFBargainButtons';
import CSFMarketComparison from '~lib/inline/CSFMarketComparison';
import CSFMenuControl from '~lib/inline/CSFMenuControl';
import CSFQuickMenu from '~lib/inline/CSFQuickMenu';
import CSFSellSettings from '~lib/inline/CSFSellSettings';
import { scheduleUpdatePopup } from '~lib/inline/update_popup';
import { addMessageRelays, RELAY_CREATE_NOTIFICATION } from '~lib/shared/relay';
import { getCurrentUrlState, mountShadowRoot, registerRuntimeUrlHandler } from '~lib/shared/url';
import { createUrlListener, waitForElement } from '~lib/util/helperfunctions';
import { ExtensionStorage, getSetting } from '~lib/util/storage';

let lastCSFState: Extension.URLState | null = null;

async function handleStateChange(state: Extension.URLState) {
	CSFloatHelpers.adjustCSFTitle(state);
	await handleCSFloatChange(state);
}

export function activateCSFloatUrlHandler() {
	registerRuntimeUrlHandler(handleStateChange);
	void handleStateChange(getCurrentUrlState());
	addMessageRelays(RELAY_CREATE_NOTIFICATION);
	scheduleUpdatePopup();
}

async function handleCSFloatChange(state: Extension.URLState) {
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
				const parent = document.querySelector('.refresh');
				const { root } = await mountShadowRoot(<CSFAutorefresh />, {
					tagName: 'betterfloat-autorefresh',
					parent,
					position: 'before',
				});
				if (parent?.previousElementSibling?.previousElementSibling?.tagName === 'BETTERFLOAT-AUTOREFRESH') {
					document.querySelector('betterfloat-autorefresh')?.remove();
				}
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

export async function mountCSFBargainButtons() {
	await mountShadowRoot(<CSFBargainButtons />, {
		tagName: 'betterfloat-bargain-buttons',
		parent: document.querySelector('.details .inputs'),
		position: 'after',
	});
}
