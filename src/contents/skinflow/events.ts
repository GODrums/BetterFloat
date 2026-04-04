import type { EventData } from '~lib/@typings/FloatTypes';
import type { Skinflow } from '~lib/@typings/SkinflowTypes';
import { activateSiteEventHandler } from '~lib/shared/events';
import { cacheSkinflowBotsItems, cacheSkinflowInventoryItems } from './cache';

function processSkinflowEvent(eventData: EventData<unknown>) {
	console.debug('[BetterFloat] Received data from url: ' + eventData.url + ', data:', eventData.data);
	if (eventData.url.includes('bots/items/trade')) {
		cacheSkinflowBotsItems(eventData.data as Skinflow.BotsItemsTradeResponse);
	} else if (eventData.url.includes('me/inv/')) {
		cacheSkinflowInventoryItems((eventData.data as Skinflow.InventoryResponse).inventory);
	}
}

export function activateSkinflowEventHandler() {
	activateSiteEventHandler(processSkinflowEvent);
}
