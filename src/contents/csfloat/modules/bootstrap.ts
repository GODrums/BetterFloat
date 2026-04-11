import { initPriceMapping } from '~lib/shared/pricing';
import { checkUserPlanPro } from '~lib/util/helperfunctions';
import { getAllSettings } from '~lib/util/storage';

import { activateCSFloatEventHandler } from '../events';
import { activateCSFloatUrlHandler } from '../url';
import { addCartButtonListener } from './cart';
import { adjustItem, getInsertTypeForItemCard } from './item';
import { startMutationObserver } from './observer';
import { getRefreshTimer, markObserverStarted, setCSFloatSettings, setRefreshTimer } from './runtime';

async function firstLaunch() {
	let items = document.querySelectorAll('item-card');
	let tries = 20;
	while (items.length === 0 && tries-- > 0) {
		await new Promise((resolve) => setTimeout(resolve, 100));
		items = document.querySelectorAll('item-card');
	}

	for (let i = 0; i < items.length; i++) {
		await adjustItem(items[i], getInsertTypeForItemCard(items[i]));
	}

	if (items.length < 40) {
		const newItems = document.querySelectorAll('item-card');
		for (let i = 0; i < newItems.length; i++) {
			await adjustItem(newItems[i], getInsertTypeForItemCard(newItems[i]));
		}
	}

	if (location.pathname.startsWith('/item/')) {
		let popoutItem = document.querySelector('.grid-item > item-card');
		if (!popoutItem?.querySelector('.betterfloat-buff-a')) {
			while (!popoutItem) {
				await new Promise((resolve) => setTimeout(resolve, 100));
				popoutItem = document.querySelector('.grid-item > item-card');
			}
			await adjustItem(popoutItem, getInsertTypeForItemCard(popoutItem));
		}

		let similarItems = document.querySelectorAll('app-similar-items item-card');
		while (similarItems.length === 0) {
			await new Promise((resolve) => setTimeout(resolve, 100));
			similarItems = document.querySelectorAll('app-similar-items item-card');
		}
		for (const item of similarItems) {
			await adjustItem(item, getInsertTypeForItemCard(item));
		}
	}

	addCartButtonListener();
}

export async function initCSFloat() {
	console.time('[BetterFloat] CSFloat init timer');

	if (location.host !== 'csfloat.com' && !location.host.endsWith('.csfloat.com')) {
		return;
	}

	activateCSFloatEventHandler();

	const settings = await getAllSettings();
	setCSFloatSettings(settings);

	if (!settings['csf-enable']) return;

	await initPriceMapping(settings, 'csf');

	console.timeEnd('[BetterFloat] CSFloat init timer');

	activateCSFloatUrlHandler();
	await firstLaunch();

	if (markObserverStarted()) {
		startMutationObserver();
		console.log('[BetterFloat] Mutation observer started');
	}

	if (await checkUserPlanPro(settings.user)) {
		setRefreshTimer(
			setInterval(
				async () => {
					console.log('[BetterFloat] Refreshing prices (hourly) ...');
					const refreshTimer = getRefreshTimer();
					if (!refreshTimer) {
						return;
					}

					let manifest: chrome.runtime.Manifest | undefined;
					try {
						manifest = chrome.runtime.getManifest();
					} catch (error) {
						console.error('[BetterFloat] Error getting manifest:', error);
					}
					if (!manifest) {
						clearInterval(refreshTimer);
						setRefreshTimer(null);
						return;
					}

					await initPriceMapping(settings, 'csf');
				},
				1000 * 60 * 61
			)
		);
	}
}
