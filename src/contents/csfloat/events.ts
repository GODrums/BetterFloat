import type { CSFloat, EventData } from '~lib/@typings/FloatTypes';
import { adjustOfferBubbles } from '~lib/helpers/csfloat_helpers';
import { activateSiteEventHandler } from '~lib/shared/events';
import {
	cacheCSFBuyOrders,
	cacheCSFExchangeRates,
	cacheCSFHistoryGraph,
	cacheCSFHistorySales,
	cacheCSFInventory,
	cacheCSFItems,
	cacheCSFLocation,
	cacheCSFMeBuyOrders,
	cacheCSFOffers,
	cacheCSFPopupItem,
	cacheCSFSimilarItems,
} from './cache';

type StallData = {
	data: CSFloat.ListingData[];
};

function processCSFloatEvent(eventData: EventData<unknown>) {
	console.debug('[BetterFloat] Received data from url: ' + eventData.url + ', data:', eventData.data);

	if (eventData.url.includes('v1/listings?')) {
		cacheCSFItems((eventData.data as CSFloat.ListingsResponse).data);
	} else if (eventData.url.includes('v1/listings/recommended')) {
		cacheCSFItems(eventData.data as CSFloat.ListingData[]);
	} else if (eventData.url.includes('v1/listings/unique-items')) {
		cacheCSFItems(eventData.data as CSFloat.ListingData[]);
	} else if (eventData.url.includes('v1/me/watchlist')) {
		cacheCSFItems((eventData.data as CSFloat.WatchlistData).data);
	} else if (eventData.url.includes('v1/me/listings')) {
		cacheCSFItems(eventData.data as CSFloat.ListingData[]);
	} else if (eventData.url.includes('v1/me/offers-timeline')) {
		cacheCSFOffers((eventData.data as CSFloat.OffersTimeline).offers);
	} else if (eventData.url.includes('v1/offers/')) {
		adjustOfferBubbles(eventData.data as CSFloat.Offer[]);
	} else if (eventData.url.includes('v1/users/') && eventData.url.includes('/stall')) {
		cacheCSFItems((eventData.data as StallData).data);
	} else if (eventData.url.includes('v1/history/')) {
		if (eventData.url.includes('/graph')) {
			cacheCSFHistoryGraph(eventData.data as CSFloat.HistoryGraphData[]);
		} else if (eventData.url.includes('/sales')) {
			cacheCSFHistorySales(eventData.data as CSFloat.HistorySalesData[]);
		}
	} else if (eventData.url.includes('v1/meta/location')) {
		cacheCSFLocation(eventData.data as CSFloat.Location);
	} else if (eventData.url.includes('v1/meta/exchange-rates')) {
		const currencyRates = eventData.data as CSFloat.ExchangeRates;
		cacheCSFExchangeRates(currencyRates);
		localStorage.setItem('currency_rates', JSON.stringify(currencyRates.data));
	} else if (eventData.url.includes('v1/me/inventory')) {
		cacheCSFInventory(eventData.data as CSFloat.InventoryReponse);
	} else if (eventData.url.includes('v1/me/buy-orders')) {
		cacheCSFMeBuyOrders(eventData.data as CSFloat.MeBuyOrderData);
	} else if (eventData.url.includes('v1/listings/')) {
		if (eventData.url.includes('/similar')) {
			cacheCSFSimilarItems(eventData.data as CSFloat.ListingData[]);
		} else if (eventData.url.includes('/buy-orders')) {
			cacheCSFBuyOrders(eventData.data as CSFloat.BuyOrderData[]);
		} else if (eventData.url.split('/').length === 7) {
			cacheCSFPopupItem(eventData.data as CSFloat.ListingData);
		}
	}
}

export function activateCSFloatEventHandler() {
	activateSiteEventHandler(processCSFloatEvent);
}
