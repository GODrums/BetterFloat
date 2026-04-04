import type { EventData } from '~lib/@typings/FloatTypes';
import type { Skinbid } from '~lib/@typings/SkinbidTypes';
import { cacheSkbInventory, cacheSkbItems, cacheSkinbidCurrencyRates, cacheSkinbidUserCurrency } from '~lib/handlers/cache/skinbid_cache';
import { activateSiteEventHandler } from '~lib/sites/shared/events';

function processSkinbidEvent(eventData: EventData<unknown>) {
	if (!eventData.url.includes('ping')) {
		console.debug('[BetterFloat] Received data from url: ' + eventData.url + ', data:', eventData.data);
	}

	if (eventData.url.includes('api/search/auctions')) {
		cacheSkbItems((eventData.data as Skinbid.MarketData).items);
	} else if (eventData.url.includes('api/search/similar')) {
		cacheSkbItems(eventData.data as Skinbid.Listing[]);
	} else if (eventData.url.includes('api/auction/shop')) {
		if (eventData.url.includes('/data')) {
			return;
		}
		cacheSkbItems((eventData.data as Skinbid.MarketData).items);
	} else if (eventData.url.includes('api/auction/')) {
		cacheSkbItems([eventData.data as Skinbid.Listing]);
	} else if (eventData.url.includes('api/public/exchangeRates')) {
		cacheSkinbidCurrencyRates(eventData.data as Skinbid.ExchangeRates);
	} else if (eventData.url.includes('api/user/whoami')) {
		cacheSkinbidUserCurrency((eventData.data as Skinbid.UserData).preferences?.currency);
	} else if (eventData.url.includes('api/user/preferences')) {
		cacheSkinbidUserCurrency((eventData.data as Skinbid.UserPreferences).currency);
	} else if (eventData.url.includes('api/inventory/personal') || eventData.url.includes('api/inventory/bots')) {
		cacheSkbInventory((eventData.data as Skinbid.Inventory).items);
	}
}

export function activateSkinbidEventHandler() {
	activateSiteEventHandler(processSkinbidEvent);
}
