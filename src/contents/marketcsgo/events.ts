import { activateSiteEventHandler } from '~contents/shared/events';
import type { EventData } from '~lib/@typings/FloatTypes';

function processMarketCSGOEvent(eventData: EventData<unknown>) {
	console.debug('[BetterFloat] Received data from url: ' + eventData.url + ', data:', eventData.data);
}

export function activateMarketcsgoEventHandler() {
	activateSiteEventHandler(processMarketCSGOEvent);
}
