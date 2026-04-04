import type { DMarket } from '~lib/@typings/DMarketTypes';
import type { EventData } from '~lib/@typings/FloatTypes';
import { cacheDMarketExchangeRates, cacheDMarketItems, cacheDMarketLatestSales } from '~lib/handlers/cache/dmarket_cache';
import { activateSiteEventHandler } from '~lib/shared/events';

function processDmarketEvent(eventData: EventData<unknown>) {
	console.debug('[BetterFloat] Received data from url: ' + eventData.url + ', data:', eventData.data);
	if (eventData.url.includes('exchange/v1/market/items')) {
		cacheDMarketItems((eventData.data as DMarket.ExchangeMarket).objects);
	} else if (eventData.url.includes('exchange/v1/user/items')) {
		cacheDMarketItems((eventData.data as DMarket.ExchangeMarket).objects);
	} else if (eventData.url.includes('exchange/v1/selection/item?')) {
		cacheDMarketItems((eventData.data as DMarket.ExchangeMarket).objects);
	} else if (eventData.url.includes('exchange/v1/user/offers?')) {
		cacheDMarketItems((eventData.data as DMarket.ExchangeMarket).objects);
	} else if (eventData.url.includes('currency-rate/v1/rates')) {
		cacheDMarketExchangeRates((eventData.data as DMarket.ExchangeRates).Rates);
	} else if (eventData.url.includes('trade-aggregator/v1/last-sales')) {
		cacheDMarketLatestSales((eventData.data as DMarket.LatestSalesResponse).sales);
	}
}

export function activateDMarketEventHandler() {
	activateSiteEventHandler(processDmarketEvent);
}
