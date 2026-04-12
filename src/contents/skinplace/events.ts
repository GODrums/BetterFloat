import type { EventData } from '~lib/@typings/FloatTypes';
import type { Skinplace } from '~lib/@typings/SkinplaceTypes';
import { activateSiteEventHandler } from '~lib/shared/events';
import { cacheSkinplaceMarketItems, cacheSkinplaceMarketOffer, cacheSkinplaceUserInventory } from './cache';

function processSkinplaceEvent(eventData: EventData<unknown>) {
	console.debug('[BetterFloat] Received data from url: ' + eventData.url + ', data:', eventData.data);
	if (eventData.url.includes('api/market/instant/inventory')) {
		cacheSkinplaceUserInventory(eventData.data as Skinplace.InventoryResponse);
	} else if (eventData.url.includes('api/market/get_items')) {
		cacheSkinplaceMarketItems(eventData.data as Skinplace.GetItemsResponse);
	} else if (eventData.url.includes('api/market/items/offers?')) {
		cacheSkinplaceMarketOffer(eventData.data as Skinplace.MarketOffersResponse);
	}
}

export function activateSkinplaceEventHandler() {
	activateSiteEventHandler(processSkinplaceEvent);
}
