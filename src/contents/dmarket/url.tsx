import type { Extension } from '~lib/@typings/ExtensionTypes';
import { DMARKET_SELECTORS } from '~lib/handlers/selectors/dmarket_selectors';
import DMMarketComparison from '~lib/inline/DMMarketComparison';
import DmAutorefresh from '~lib/inline/DmAutorefresh';
import { scheduleUpdatePopup } from '~lib/inline/update_popup';
import { getCurrentUrlState, mountShadowRoot, registerRuntimeUrlHandler, watchUrlStateChanges } from '~lib/shared/url';
import { createUrlListener, waitForElement } from '~lib/util/helperfunctions';
import { getSetting } from '~lib/util/storage';

const AUTOREFRESH_HOST_SELECTOR = 'betterfloat-dm-autorefresh';
const REFRESH_SELECTOR = `${DMARKET_SELECTORS.market.refreshButton}, ${DMARKET_SELECTORS.modern.market.refreshButton}`;
let autorefreshMountInProgress = false;

export function activateDMarketUrlHandler() {
	registerRuntimeUrlHandler(handleDMarketChange);
	void handleDMarketChange(getCurrentUrlState());
	watchUrlStateChanges(handleDMarketChange, 1500);
	window.setInterval(() => {
		const state = getCurrentUrlState();
		if (isDMarketMarketPage(state.path, state.search) && !document.querySelector(AUTOREFRESH_HOST_SELECTOR) && document.querySelector(REFRESH_SELECTOR)) {
			void handleDMarketChange(state);
		}
	}, 1500);
	scheduleUpdatePopup();
}

function isDMarketMarketPage(path: string, search: string) {
	if (path !== '/ingame-items/item-list/csgo-skins') return false;
	const exchangeTab = new URLSearchParams(search).get('exchangeTab');
	return exchangeTab === null || exchangeTab === 'market' || exchangeTab === 'dmarketOffers';
}

async function handleDMarketChange(state: Extension.URLState) {
	const isMarketPage = isDMarketMarketPage(state.path, state.search);
	if (!isMarketPage) {
		document.querySelector(AUTOREFRESH_HOST_SELECTOR)?.remove();
		for (const controls of document.querySelectorAll('.betterfloat-refresh-controls')) {
			controls.classList.remove('betterfloat-refresh-controls');
		}
		return;
	}

	const dmAutorefresh = await getSetting('dm-autorefresh');
	if (dmAutorefresh && !autorefreshMountInProgress && !document.querySelector(AUTOREFRESH_HOST_SELECTOR)) {
		autorefreshMountInProgress = true;
		try {
			const success = await waitForElement(REFRESH_SELECTOR, { maxTries: 100 });
			if (success && isDMarketMarketPage(location.pathname, location.search) && !document.querySelector(AUTOREFRESH_HOST_SELECTOR)) {
				const refreshButton = document.querySelector<HTMLElement>(REFRESH_SELECTOR);
				const mountTarget = document.querySelector('span.c-assetFilters__spacer') ?? refreshButton;
				if (!mountTarget) return;
				const isModern = Boolean(refreshButton?.closest('[data-test-id="exchange_market_area"]'));
				const modernRefreshControls = isModern ? refreshButton?.parentElement : null;
				modernRefreshControls?.classList.add('betterfloat-refresh-controls');
				const { root } = await mountShadowRoot(<DmAutorefresh modern={isModern} />, {
					tagName: 'betterfloat-dm-autorefresh',
					parent: mountTarget,
					position: 'before',
				});
				const interval = createUrlListener((url) => {
					if (!isDMarketMarketPage(url.pathname, url.search)) {
						root.unmount();
						document.querySelector(AUTOREFRESH_HOST_SELECTOR)?.remove();
						modernRefreshControls?.classList.remove('betterfloat-refresh-controls');
						clearInterval(interval);
					}
				}, 1000);
			}
		} finally {
			autorefreshMountInProgress = false;
		}
	}
}

export async function mountDMarketMarketComparison(container: HTMLElement, layout: 'vertical' | 'horizontal' = 'vertical') {
	await mountShadowRoot(<DMMarketComparison layout={layout} />, {
		tagName: 'betterfloat-dm-market-comparison',
		parent: container,
	});
}
