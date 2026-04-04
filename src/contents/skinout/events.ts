import { activateSiteEventHandler } from '~contents/shared/events';
import type { EventData } from '~lib/@typings/FloatTypes';
import type { Skinout } from '~lib/@typings/SkinoutTypes';
import { cacheSkinoutItems, cacheSkinoutUserInventory } from '~lib/handlers/cache/skinout_cache';

function processSkinoutEvent(eventData: EventData<unknown>) {
	console.debug('[BetterFloat] Received data from url: ' + eventData.url + ', data:', eventData.data);
	if (eventData.url.includes('api/market/items')) {
		cacheSkinoutItems(eventData.data as Skinout.MarketItemsResponse);
	} else if (eventData.url.includes('api/sell/inventory')) {
		cacheSkinoutUserInventory(eventData.data as Skinout.InventoryResponse);
	}
}

export function activateSkinoutEventHandler() {
	activateSiteEventHandler(processSkinoutEvent);
}
