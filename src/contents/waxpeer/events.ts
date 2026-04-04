import type { EventData } from '~lib/@typings/FloatTypes';
import type { Waxpeer } from '~lib/@typings/WaxpeerTypes';
import { activateSiteEventHandler } from '~lib/shared/events';
import { cacheWaxpeerItems } from './cache';

function processWaxpeerEvent(eventData: EventData<unknown>) {
	console.debug('[BetterFloat] Received data from url: ' + eventData.url + ', data:', eventData.data);
	if (eventData.url.includes('api/data/index/')) {
		cacheWaxpeerItems((eventData.data as Waxpeer.MarketData).items);
	}
}

export function activateWaxpeerEventHandler() {
	activateSiteEventHandler(processWaxpeerEvent);
}
