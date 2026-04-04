import type { EventData } from '~lib/@typings/FloatTypes';
import type { Skinswap } from '~lib/@typings/SkinswapTypes';
import { activateSiteEventHandler } from '~lib/shared/events';
import { cacheSkinswapChinaItems, cacheSkinswapItems, cacheSkinswapUserInventory } from './cache';

function processSkinswapEvent(eventData: EventData<unknown>) {
	console.debug('[BetterFloat] Received data from url: ' + eventData.url + ', data:', eventData.data);
	if (eventData.url.includes('api/user/inventory')) {
		cacheSkinswapUserInventory(eventData.data as Skinswap.InventoryResponse);
	} else if (eventData.url.includes('api/site/inventory/china/listings')) {
		cacheSkinswapChinaItems(eventData.data as Skinswap.ChinaMarketItemsResponse);
	} else if (eventData.url.includes('api/site/inventory')) {
		cacheSkinswapItems(eventData.data as Skinswap.MarketItemsResponse, eventData.url.includes('priceType=china'));
	}
}

export function activateSkinswapEventHandler() {
	activateSiteEventHandler(processSkinswapEvent);
}
