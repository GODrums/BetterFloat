import type { Bitskins } from '~lib/@typings/BitskinsTypes';
import type { EventData } from '~lib/@typings/FloatTypes';
import { activateSiteEventHandler } from '~lib/shared/events';
import { cacheBitskinsItems, cacheBitskinsPopoutItem } from './cache';

function processBitskinsEvent(eventData: EventData<unknown>) {
	console.debug('[BetterFloat] Received data from url: ' + eventData.url + ', data:', eventData.data);
	if (eventData.url.includes('market/search/')) {
		if (eventData.url.includes('/730')) {
			cacheBitskinsItems((eventData.data as Bitskins.MarketSearch).list);
		} else if (eventData.url.includes('/get')) {
			cacheBitskinsPopoutItem(eventData.data as Bitskins.PopoutItem);
		}
	}
}

export function activateBitskinsEventHandler() {
	activateSiteEventHandler(processBitskinsEvent);
}
