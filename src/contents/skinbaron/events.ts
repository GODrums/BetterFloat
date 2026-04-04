import type { EventData } from '~lib/@typings/FloatTypes';
import type { Skinbaron } from '~lib/@typings/SkinbaronTypes';
import { cacheSkinbaronItems, cacheSkinbaronRates } from '~lib/handlers/cache/skinbaron_cache';
import { activateSiteEventHandler } from '~contents/shared/events';

function processSkinbaronEvent(eventData: EventData<unknown>) {
	console.debug(`[BetterFloat] Received data from url: ${eventData.url}, data:`, eventData.data);
	if (eventData.url.includes('appId=') && !eventData.url.includes('appId=730')) {
		console.debug('[BetterFloat] Skinbaron: Ignoring non-csgo request');
		return;
	}
	if (eventData.url.includes('api/v2/Browsing/FilterOffers')) {
		cacheSkinbaronItems((eventData.data as Skinbaron.FilterOffers).aggregatedMetaOffers);
	} else if (eventData.url.includes('api/v2/PromoOffers')) {
		cacheSkinbaronItems((eventData.data as Skinbaron.PromoOffers).bestDeals.aggregatedMetaOffers);
	} else if (eventData.url.includes('api/v2/Application/ExchangeRates')) {
		cacheSkinbaronRates(eventData.data as { [key: string]: number });
	}
}

export function activateSkinbaronEventHandler() {
	activateSiteEventHandler(processSkinbaronEvent);
}
