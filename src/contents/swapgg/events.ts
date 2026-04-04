import type { EventData } from '~lib/@typings/FloatTypes';
import type { Swapgg } from '~lib/@typings/SwapggTypes';
import { cacheSwapggInventorySite, cacheSwapggInventoryUser } from '~lib/handlers/cache/swapgg_cache';
import { activateSiteEventHandler } from '~lib/shared/events';

function processSwapggEvent(eventData: EventData<unknown>) {
	console.debug('[BetterFloat] Received data from url: ' + eventData.url + ', data:', eventData.data);
	if (eventData.url.includes('api/inventory/user')) {
		cacheSwapggInventoryUser(eventData.data as Swapgg.InventoryResponse);
	} else if (eventData.url.includes('api/inventory/site')) {
		cacheSwapggInventorySite(eventData.data as Swapgg.InventoryResponse);
	}
}

export function activateSwapggEventHandler() {
	activateSiteEventHandler(processSwapggEvent);
}
