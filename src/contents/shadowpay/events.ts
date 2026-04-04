import type { EventData } from '~lib/@typings/FloatTypes';
import type { Shadowpay } from '~lib/@typings/ShadowpayTypes';
import { cacheShadowpayInventory, cacheShadowpayItems } from '~lib/handlers/cache/shadowpay_cache';
import { activateSiteEventHandler } from '~lib/shared/events';

function processShadowpayEvent(eventData: EventData<unknown>) {
	console.debug('[BetterFloat] Received data from url: ' + eventData.url + ', data:', eventData.data);
	if (eventData.url.includes('api/market/get_items')) {
		cacheShadowpayItems((eventData.data as Shadowpay.MarketGetItemsResponse).items);
	} else if (eventData.url.includes('api/market/inventory')) {
		cacheShadowpayInventory((eventData.data as Shadowpay.InventoryResponse).inv);
	}
}

export function activateShadowpayEventHandler() {
	activateSiteEventHandler(processShadowpayEvent);
}
