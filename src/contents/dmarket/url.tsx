import type { Extension } from '~lib/@typings/ExtensionTypes';
import DMMarketComparison from '~lib/inline/DMMarketComparison';
import DmAutorefresh from '~lib/inline/DmAutorefresh';
import UpdatePopup from '~lib/inline/UpdatePopup';
import { addMessageRelays, getCurrentUrlState, mountShadowRoot, registerRuntimeUrlHandler, scheduleVersionedPopup, watchUrlStateChanges } from '~lib/shared/url';
import { createUrlListener, waitForElement } from '~lib/util/helperfunctions';
import { getSetting } from '~lib/util/storage';

export function activateDMarketUrlHandler() {
	addMessageRelays();
	registerRuntimeUrlHandler(handleDMarketChange);
	void handleDMarketChange(getCurrentUrlState());
	watchUrlStateChanges(handleDMarketChange, 1500);
	scheduleVersionedPopup(() => <UpdatePopup />, '3.3.0');
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

export async function mountDMarketMarketComparison(container: HTMLElement) {
	await mountShadowRoot(<DMMarketComparison />, {
		tagName: 'betterfloat-dm-market-comparison',
		parent: container,
	});
}
