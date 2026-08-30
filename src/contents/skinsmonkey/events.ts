import type { EventData } from '~lib/@typings/FloatTypes';
import type { Skinsmonkey } from '~lib/@typings/Skinsmonkey';
import { activateSiteEventHandler } from '~lib/shared/events';
import { cacheSkinsmonkeyBotInventory, cacheSkinsmonkeyUserInventory } from './cache';

function processSkinsmonkeyEvent(eventData: EventData<unknown>, onInventoryUpdate: () => void) {
	console.debug('[BetterFloat] Received data from url: ' + eventData.url + ', data:', eventData.data);
	if (eventData.url.includes('api/inventory/user')) {
		cacheSkinsmonkeyUserInventory(eventData.data as Skinsmonkey.InventoryResponse);
		onInventoryUpdate();
	} else if (eventData.url.includes('api/inventory?') || eventData.url.includes('api/market/inventory?')) {
		cacheSkinsmonkeyBotInventory(eventData.data as Skinsmonkey.InventoryResponse);
		onInventoryUpdate();
	}
}

export function activateSkinsmonkeyEventHandler(onInventoryUpdate: () => void) {
	activateSiteEventHandler((eventData) => processSkinsmonkeyEvent(eventData, onInventoryUpdate));
}
