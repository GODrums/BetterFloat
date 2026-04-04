import type { EventData } from '~lib/@typings/FloatTypes';
import type { Skinsmonkey } from '~lib/@typings/Skinsmonkey';
import { cacheSkinsmonkeyBotInventory, cacheSkinsmonkeyUserInventory } from '~lib/handlers/cache/skinsmonkey_cache';
import { activateSiteEventHandler } from '~contents/shared/events';

function processSkinsmonkeyEvent(eventData: EventData<unknown>) {
	console.debug('[BetterFloat] Received data from url: ' + eventData.url + ', data:', eventData.data);
	if (eventData.url.includes('api/inventory/user')) {
		cacheSkinsmonkeyUserInventory(eventData.data as Skinsmonkey.InventoryResponse);
	} else if (eventData.url.includes('api/inventory?')) {
		cacheSkinsmonkeyBotInventory(eventData.data as Skinsmonkey.InventoryResponse);
	}
}

export function activateSkinsmonkeyEventHandler() {
	activateSiteEventHandler(processSkinsmonkeyEvent);
}
