import type { Avanmarket } from '~lib/@typings/AvanTypes';
import type { EventData } from '~lib/@typings/FloatTypes';
import { activateSiteEventHandler } from '~lib/shared/events';
import { cacheAvanmarketInventory, cacheAvanmarketItems } from './cache';

function processAvanmarketEvent(eventData: EventData<unknown>) {
	console.debug('[BetterFloat] Received data from url: ' + eventData.url + ', data:', eventData.data);
	if (eventData.url.includes('v1/api/users/catalog')) {
		cacheAvanmarketItems((eventData.data as Avanmarket.CatalogResponse).data);
	} else if (eventData.url.includes('v1/api/users/inventory')) {
		cacheAvanmarketInventory(eventData.data as Avanmarket.InventoryResponse);
	}
}

export function activateAvanmarketEventHandler() {
	activateSiteEventHandler(processAvanmarketEvent);
}
