import type { Extension } from '~lib/@typings/ExtensionTypes';
import LisAutorefresh from '~lib/inline/LisAutorefresh';
import LisMarketComparison from '~lib/inline/LisMarketComparison';
import UpdatePopup from '~lib/inline/UpdatePopup';
import { getCurrentUrlState, mountShadowRoot, registerRuntimeUrlHandler, scheduleVersionedPopup } from '~lib/shared/url';
import { createUrlListener, waitForElement } from '~lib/util/helperfunctions';
import { ExtensionStorage, getSetting } from '~lib/util/storage';

export function activateLisskinsUrlHandler() {
	registerRuntimeUrlHandler(handleLisSkinsChange);
	void handleLisSkinsChange(getCurrentUrlState());
	scheduleVersionedPopup(() => <UpdatePopup />, '3.3.0');
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

async function mountLisMarketComparison() {
	const showMarketComparison = await ExtensionStorage.sync.get<boolean>('lis-marketcomparison');
	if (!showMarketComparison) {
		return;
	}

	const itemPageContainerResult = await waitForElement('div.skins-market-view[data-betterfloat]', { maxTries: 20 });

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
