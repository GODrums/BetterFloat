import { activateSiteEventHandler } from '~contents/shared/events';
import type { EventData } from '~lib/@typings/FloatTypes';
import type { Tradeit } from '~lib/@typings/TradeitTypes';
import { cacheTradeitBotItems, cacheTradeitOwnItems } from '~lib/handlers/cache/tradeit_cache';

function processTradeitEvent(eventData: EventData<unknown>) {
	if (eventData.url.includes('api/v2/inventory/data')) {
		console.debug('[BetterFloat] Received data from url: ' + eventData.url + ', data:', eventData.data);
		cacheTradeitBotItems([...(eventData.data as Tradeit.BotDataResponse).items]);
	} else if (eventData.url.includes('api/v2/inventory/my/data')) {
		console.debug('[BetterFloat] Received data from url: ' + eventData.url + ', data:', eventData.data);
		cacheTradeitOwnItems((eventData.data as Tradeit.OwnInventoryResponse).items);
	}
}

export function activateTradeitEventHandler() {
	activateSiteEventHandler(processTradeitEvent);
}
