import type { DMarket } from '~lib/@typings/DMarketTypes';

// dmarket: cached items from api
const dmarketItems: DMarket.Item[] = [];
let dmarketExchangeRates: { [key: string]: number } = {};

export function cacheDMarketItems(data: DMarket.Item[]) {
	data.forEach((item) => {
		if (dmarketItems.findIndex((i) => i.itemId === item.itemId) === -1) {
			dmarketItems.push(item);
		}
	});
}

export function cacheDMarketExchangeRates(data: { [key: string]: number }) {
	dmarketExchangeRates = Object.assign(dmarketExchangeRates, data);
}

export function getSpecificDMarketItem(id: string) {
	return dmarketItems.find((i) => i.itemId === id);
}

export function getDMarketExchangeRate(currency: string) {
	if (Object.keys(dmarketExchangeRates).length === 0) {
		const apiRates = JSON.parse(localStorage.getItem('dmarket/AkitaStores') || '{}').currency?.currencyRates;
		if (apiRates) {
			cacheDMarketExchangeRates(apiRates);
		}
	}
	return dmarketExchangeRates[currency];
}
