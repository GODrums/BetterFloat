import type { DMarket } from '~lib/@typings/DMarketTypes';
import type { EventData } from '~lib/@typings/FloatTypes';
import { activateSiteEventHandler } from '~lib/shared/events';
import { cacheDMarketExchangeRates, cacheDMarketItems, cacheDMarketLatestSales } from './cache';

function processDmarketEvent(eventData: EventData<unknown>, onItemsCached?: () => void) {
	console.debug('[BetterFloat] Received data from url: ' + eventData.url + ', data:', eventData.data);
	if (eventData.url.includes('exchange/v1/market/items/v2')) {
		cacheDMarketItems((eventData.data as DMarket.ExchangeMarketV2).offers);
		onItemsCached?.();
	} else if (eventData.url.includes('exchange/v1/market/items')) {
		cacheDMarketItems((eventData.data as DMarket.ExchangeMarket).objects);
		onItemsCached?.();
	} else if (eventData.url.includes('exchange/v1/user/items')) {
		cacheDMarketItems((eventData.data as DMarket.ExchangeMarket).objects);
		onItemsCached?.();
	} else if (eventData.url.includes('exchange/v1/user/assets')) {
		cacheDMarketItems((eventData.data as DMarket.ExchangeUserAssets).assets);
		onItemsCached?.();
	} else if (eventData.url.includes('exchange/v1/selection/v2/item')) {
		cacheDMarketItems((eventData.data as DMarket.ExchangeSelectionV2).items);
		onItemsCached?.();
	} else if (eventData.url.includes('exchange/v1/selection/item?')) {
		cacheDMarketItems((eventData.data as DMarket.ExchangeMarket).objects);
		onItemsCached?.();
	} else if (eventData.url.includes('exchange/v1/user/offers?')) {
		cacheDMarketItems((eventData.data as DMarket.ExchangeMarket).objects);
		onItemsCached?.();
	} else if (eventData.url.includes('currency-rate/v1/rates')) {
		cacheDMarketExchangeRates((eventData.data as DMarket.ExchangeRates).Rates);
	} else if (eventData.url.includes('trade-aggregator/v1/last-sales')) {
		cacheDMarketLatestSales((eventData.data as DMarket.LatestSalesResponse).sales);
	}
}

export function activateDMarketEventHandler(onItemsCached?: () => void) {
	activateSiteEventHandler((eventData) => processDmarketEvent(eventData, onItemsCached));
}
