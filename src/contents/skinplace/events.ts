import type { EventData } from '~lib/@typings/FloatTypes';
import type { Skinplace } from '~lib/@typings/SkinplaceTypes';
import { activateSiteEventHandler } from '~lib/shared/events';
import { cacheSkinplaceMarketItems, cacheSkinplaceMarketOffer, cacheSkinplaceUserInventory } from './cache';
import { isMarketItemsUrl, isMarketOffersUrl } from './endpoints';

function processSkinplaceEvent(eventData: EventData<unknown>) {
	console.debug('[BetterFloat] Received data from url: ' + eventData.url + ', data:', eventData.data);
	if (eventData.url.includes('api/market/instant/inventory')) {
		cacheSkinplaceUserInventory(eventData.data as Skinplace.InventoryResponse);
	} else if (isMarketItemsUrl(eventData.url)) {
		cacheSkinplaceMarketItems(eventData.data as Skinplace.GetItemsResponse);
	} else if (isMarketOffersUrl(eventData.url)) {
		cacheSkinplaceMarketOffer(eventData.data as Skinplace.MarketOffersResponse, eventData.url);
	}
}

export function activateSkinplaceEventHandler() {
	activateSiteEventHandler(processSkinplaceEvent);
}
