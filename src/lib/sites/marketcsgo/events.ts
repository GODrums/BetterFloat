import type { EventData } from '~lib/@typings/FloatTypes';
import { activateSiteEventHandler } from '~lib/sites/shared/events';

function processMarketCSGOEvent(eventData: EventData<unknown>) {
	console.debug('[BetterFloat] Received data from url: ' + eventData.url + ', data:', eventData.data);
}

export function activateMarketcsgoEventHandler() {
	activateSiteEventHandler(processMarketCSGOEvent);
}
