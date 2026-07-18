import type { Extension } from '~lib/@typings/ExtensionTypes';
import LisMarketComparison from '~lib/inline/LisMarketComparison';
import { scheduleUpdatePopup } from '~lib/inline/update_popup';
import { getCurrentUrlState, mountShadowRoot, watchUrlStateChanges } from '~lib/shared/url';
import { createUrlListener, waitForElement } from '~lib/util/helperfunctions';
import { ExtensionStorage } from '~lib/util/storage';

function isLisMarketPage(path: string) {
	return path.startsWith('/market/');
}

function isLisItemPage(path: string) {
	return /^\/market\/csgo\/[^/]+/.test(path);
}

export function activateLisskinsUrlHandler(onUrlChange: () => void) {
	void handleLisSkinsChange(getCurrentUrlState(), onUrlChange);
	watchUrlStateChanges(async (state) => await handleLisSkinsChange(state, onUrlChange), 500);
	scheduleUpdatePopup();
}

async function handleLisSkinsChange(state: Extension.URLState, onUrlChange: () => void) {
	const isMarketPage = isLisMarketPage(state.path);
	const isItemPage = isLisItemPage(state.path);
	const comparison = document.querySelector<HTMLElement>('betterfloat-lis-market-comparison');
	if (comparison && comparison.dataset.lisPath !== state.path) comparison.remove();
	onUrlChange();

	if (isMarketPage && !isItemPage) {
		// const lisAutorefresh = await getSetting('lis-autorefresh');
		// if (lisAutorefresh) {
		// 	await waitForElement('html[data-betterfloat-lis-hydrated="true"]', { maxTries: 25 });
		// 	const success = await waitForElement('.top-filters__refresh > button');
		// 	if (success && !document.querySelector('betterfloat-lis-autorefresh')) {
		// 		const topFilters = document.querySelector<HTMLElement>('.top-filters');
		// 		if (!topFilters) return;
		// 		const { root, parentElement } = await mountShadowRoot(<LisAutorefresh />, {
		// 			tagName: 'betterfloat-lis-autorefresh',
		// 			parent: document.querySelector('.top-filters__refresh'),
		// 			position: 'after',
		// 		});
		// 		topFilters.classList.add('betterfloat-has-autorefresh');
		// 		parentElement.classList.add('betterfloat-lis-autorefresh-host');
		// 		const interval = createUrlListener((url) => {
		// 			if (!isLisMarketPage(url.pathname) || isLisItemPage(url.pathname)) {
		// 				root.unmount();
		// 				document.querySelector('betterfloat-lis-autorefresh')?.remove();
		// 				topFilters.classList.remove('betterfloat-has-autorefresh');
		// 				clearInterval(interval);
		// 			}
		// 		}, 1000);
		// 	}
		// }
	}

	if (isItemPage) {
		await mountLisMarketComparison();
	}
}

async function mountLisMarketComparison() {
	const showMarketComparison = await ExtensionStorage.sync.get<boolean>('lis-marketcomparison');
	if (!showMarketComparison) {
		return;
	}

	await waitForElement('html[data-betterfloat-lis-hydrated="true"]', { maxTries: 25 });
	const itemPageContainerResult = await waitForElement('main.skin[data-betterfloat]', { maxTries: 20 });

	if (itemPageContainerResult && !document.querySelector('betterfloat-lis-market-comparison')) {
		const itemPageContainer = document.querySelector<HTMLElement>('main.skin > .skin__description');
		if (!itemPageContainer) return;
		const itemPath = location.pathname;

		const { root, parentElement } = await mountShadowRoot(<LisMarketComparison />, {
			tagName: 'betterfloat-lis-market-comparison',
			parent: itemPageContainer,
			position: 'after',
		});

		if (parentElement) {
			parentElement.dataset.lisPath = itemPath;
			parentElement.style.display = 'block';
			parentElement.style.alignSelf = 'stretch';
			parentElement.style.boxSizing = 'border-box';
			parentElement.style.contain = 'inline-size';
			parentElement.style.maxWidth = '100%';
			parentElement.style.minWidth = '0';
			parentElement.style.overflow = 'hidden';
			parentElement.style.width = '100%';
		}

		const interval = createUrlListener((url) => {
			if (url.pathname !== itemPath || !document.querySelector('main.skin')) {
				root.unmount();
				document.querySelector('betterfloat-lis-market-comparison')?.remove();
				clearInterval(interval);
			}
		}, 1000);
	}
}
