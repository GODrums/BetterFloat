import Decimal from 'decimal.js';

import type { CSFloat } from '~lib/@typings/FloatTypes';
import { getJSONAttribute } from '~lib/util/helperfunctions';

import { fetchAndStoreCSFInventory, getCSFPopupItem, getFirstCSFItem, getFirstCSFSimilarItem, getSpecificCSFInventoryItem } from '../../cache';
import { addBargainListener } from '../bargainPopup';
import { addCartListener } from '../cart';
import { addItemScreenshot, copyNameOnClick, getApiItem, removeClustering, storeApiItem } from '../dom';
import { getCSFloatSettings } from '../runtime';
import { addSaleListListener } from '../sell';
import { INSERT_TYPE } from '../types';
import { addCollectionLink, addQuickLinks, addScreenshotListener, adjustActionButtons } from './actions';
import { addListingAge, addSellerDetails, adjustExistingSP } from './metadata';
import { liveNotifications } from './notifications';
import { patternDetections } from './patterns';
import { addBuffPrice, getFloatItem, showBargainPrice } from './pricing';
import { addFloatColoring } from './schema';
import { addStickerInfo } from './stickers';
export function getInsertTypeForItemCard(itemCard: Element) {
	const width = itemCard.getAttribute('width');
	if (width?.includes('100%')) {
		return INSERT_TYPE.PAGE;
	}

	return itemCard.className.includes('flex-item') || location.pathname === '/' ? INSERT_TYPE.NONE : INSERT_TYPE.SIMILAR;
}

function resolveApiItem(insertType: INSERT_TYPE, container: Element, item: CSFloat.FloatItem) {
	switch (insertType) {
		case INSERT_TYPE.NONE:
			if (location.pathname === '/sell') {
				const inventoryItem = getSpecificCSFInventoryItem(item.name, Number.isNaN(item.float) ? undefined : item.float);
				if (!inventoryItem) return undefined;
				return {
					created_at: '',
					id: '',
					is_seller: true,
					is_watchlisted: false,
					item: inventoryItem,
					price: 0,
					state: 'listed',
					type: 'buy_now',
					watchers: 0,
				} satisfies CSFloat.ListingData;
			}
			return getFirstCSFItem();
		case INSERT_TYPE.PAGE: {
			let newItem = getCSFPopupItem();
			if (!newItem || location.pathname.split('/').pop() !== newItem.id) {
				const itemPreview = document.getElementsByClassName('item-' + location.pathname.split('/').pop())[0];
				newItem = getApiItem(itemPreview);
			}
			return newItem;
		}
		case INSERT_TYPE.BARGAIN:
			return getJSONAttribute<CSFloat.ListingData>(container.getAttribute('data-betterfloat'));
		case INSERT_TYPE.SIMILAR:
			return getFirstCSFSimilarItem();
		default:
			console.error('[BetterFloat] Unknown insert type:', insertType);
			return null;
	}
}

async function waitForResolvedApiItem(insertType: INSERT_TYPE, container: Element, item: CSFloat.FloatItem) {
	let apiItem = resolveApiItem(insertType, container, item);

	if (insertType === INSERT_TYPE.NONE) {
		while (
			apiItem &&
			(item.name !== apiItem.item.item_name ||
				(item.quality !== 'Vanilla' && item.float !== undefined && apiItem.item.float_value && !new Decimal(apiItem.item.float_value ?? 0).toDP(12).equals(item.float)))
		) {
			await new Promise((resolve) => setTimeout(resolve, 200));
			apiItem = resolveApiItem(insertType, container, item);
		}

		if (!apiItem && location.pathname === '/sell') {
			await fetchAndStoreCSFInventory();
			apiItem = resolveApiItem(insertType, container, item);
		}

		return apiItem;
	}

	const isMainItem = insertType === INSERT_TYPE.PAGE;
	let tries = 10;
	while (
		(!apiItem ||
			(isMainItem && location.pathname.split('/').pop() !== apiItem.id) ||
			(insertType === INSERT_TYPE.BARGAIN &&
				apiItem.item.float_value &&
				item.quality !== 'Vanilla' &&
				item.float !== undefined &&
				!new Decimal(apiItem.item.float_value).toDP(12).equals(item.float))) &&
		tries-- > 0
	) {
		await new Promise((resolve) => setTimeout(resolve, 200));
		apiItem = resolveApiItem(insertType, container, item);
	}

	return apiItem;
}

export async function adjustItem(container: Element, insertType = INSERT_TYPE.NONE) {
	const extensionSettings = getCSFloatSettings();
	if (container.querySelector('.betterfloat-buff-a')) {
		return;
	}
	if (insertType > 0) {
		await new Promise((resolve) => setTimeout(resolve, 100));
	}

	const item = getFloatItem(container);
	if (Number.isNaN(item.price)) return;

	const priceResult = await addBuffPrice(item, container, insertType);
	const apiItem = await waitForResolvedApiItem(insertType, container, item);

	if (insertType === INSERT_TYPE.NONE) {
		if (!apiItem) {
			console.error('[BetterFloat] No cached item found: ', item.name, container);
			return;
		}

		if (item.name !== apiItem.item.item_name) {
			console.log('[BetterFloat] Item name mismatch:', item.name, apiItem.item.item_name);
			return;
		}

		if (extensionSettings['user']?.plan?.type === 'pro') {
			const autoRefreshLabel = document.querySelector('.refresh > button');
			if (autoRefreshLabel?.getAttribute('data-betterfloat-auto-refresh') === 'true') {
				await liveNotifications(apiItem, priceResult.percentage);
			}
		}

		if (extensionSettings['csf-stickerprices']) {
			await addStickerInfo(container, apiItem, priceResult.price_difference);
		} else {
			adjustExistingSP(container);
		}

		if (extensionSettings['csf-floatcoloring']) {
			addFloatColoring(container, apiItem);
		}
		await patternDetections(container, apiItem, false);
		adjustActionButtons(container, apiItem.item);

		if (location.pathname !== '/sell') {
			if (extensionSettings['csf-listingage']) {
				addListingAge(container, apiItem, false);
			}
			storeApiItem(container, apiItem);

			if (extensionSettings['csf-removeclustering']) {
				removeClustering(container);
			} else if (extensionSettings['csf-sellerstatistics']) {
				addSellerDetails(container, apiItem);
			}

			addBargainListener(container);
			addCartListener(container, item);
			addScreenshotListener(container, apiItem.item);
			if (extensionSettings['csf-showbargainprice']) {
				await showBargainPrice(container, apiItem, insertType);
			}

			if (extensionSettings['csf-showingamess']) {
				addItemScreenshot(container, apiItem.item);
			}
		} else {
			addSaleListListener(container);
		}

		return;
	}

	if (!apiItem) {
		console.warn('[BetterFloat] Could not find item in popout:', item.name);
		return;
	}

	const isMainItem = insertType === INSERT_TYPE.PAGE;
	if (apiItem.id) {
		await addStickerInfo(container, apiItem, priceResult.price_difference);
		addListingAge(container, apiItem, isMainItem);
		addFloatColoring(container, apiItem);
		await patternDetections(container, apiItem, isMainItem);
		if (isMainItem) {
			addQuickLinks(container, apiItem);
			copyNameOnClick(container, apiItem.item);
			addCollectionLink();
		}
		storeApiItem(container, apiItem);
		await showBargainPrice(container, apiItem, insertType);
		if (extensionSettings['csf-showingamess'] || isMainItem) {
			addItemScreenshot(container, apiItem.item);
		}
		addScreenshotListener(container, apiItem.item);
	}
	addBargainListener(container);
	addCartListener(container, item);
}
