import Decimal from 'decimal.js';
import type { CSFloat } from '~lib/@typings/FloatTypes';
import { Queue } from '~lib/util/queue';

type CSFloatAPIStorage = {
	items: Queue<CSFloat.ListingData>;
	popupItem: CSFloat.ListingData | null;
	similarItems: Queue<CSFloat.ListingData>;
	inventory: CSFloat.Item[];
	historyGraph: CSFloat.HistoryGraphData[];
	historySales: Queue<CSFloat.HistorySalesData>;
	offers: CSFloat.Offer[];
	rates: { [key: string]: number };
	location: CSFloat.Location | null;
};

// intercepted csfloat api data
const CSFLOAT_API_DATA: CSFloatAPIStorage = {
	// item previews
	items: new Queue<CSFloat.ListingData>(),
	// opened popup item
	popupItem: null,
	// similar item section of item popup
	similarItems: new Queue<CSFloat.ListingData>(),
	// user inventory
	inventory: [],
	// sales graph of item popup
	historyGraph: [],
	// latest sales of item popup
	historySales: new Queue<CSFloat.HistorySalesData>(),
	// p2p offers timeline
	offers: [],
	// currency exchange rates
	rates: {},
	location: null,
};

export function cacheCSFHistoryGraph(data: CSFloat.HistoryGraphData[]) {
	if (CSFLOAT_API_DATA.historyGraph.length > 0) {
		console.debug('[BetterFloat] History graph already cached, deleting history: ', CSFLOAT_API_DATA.historyGraph);
		CSFLOAT_API_DATA.historyGraph = [];
	}
	// original price is in cents, convert to dollars
	CSFLOAT_API_DATA.historyGraph = data.map((history) => {
		return {
			avg_price: history.avg_price / 100,
			count: history.count,
			day: history.day,
		};
	});
}

export function cacheCSFOffers(data: CSFloat.Offer[]) {
	CSFLOAT_API_DATA.offers = data;
}

export function cacheCSFHistorySales(data: CSFloat.HistorySalesData[]) {
	CSFLOAT_API_DATA.historySales.reset(data);
}

export function cacheCSFItems(data: CSFloat.ListingData[]) {
	CSFLOAT_API_DATA.items.reset(data);
}

export function cacheCSFSimilarItems(data: CSFloat.ListingData[]) {
	CSFLOAT_API_DATA.similarItems.reset(data);
}

export function cacheCSFInventory(data: CSFloat.Item[]) {
	CSFLOAT_API_DATA.inventory = data;
}

export function cacheCSFExchangeRates(data: CSFloat.ExchangeRates) {
	CSFLOAT_API_DATA.rates = data.data;
}

export function cacheCSFLocation(data: CSFloat.Location) {
	CSFLOAT_API_DATA.location = data;
}

export function cacheCSFPopupItem(data: CSFloat.ListingData) {
	CSFLOAT_API_DATA.popupItem = data;
}

// USD / rate = target currency
export async function getCSFCurrencyRate(currency: string) {
	if (Object.keys(CSFLOAT_API_DATA.rates).length === 0) {
		await fetchCSFCurrencyRates();
	}
	return CSFLOAT_API_DATA.rates[currency.toLowerCase()];
}

export function getCSFUserCurrency() {
	return CSFLOAT_API_DATA.location?.inferred_location.currency ?? 'USD';
}

export function getCSFHistoryGraph() {
	const history = CSFLOAT_API_DATA.historyGraph;
	CSFLOAT_API_DATA.historyGraph = [];
	return history;
}

export function getFirstHistorySale() {
	return CSFLOAT_API_DATA.historySales.dequeue();
}

export function getFirstCSFItem() {
	return CSFLOAT_API_DATA.items.dequeue();
}

export function getFirstCSFSimilarItem() {
	return CSFLOAT_API_DATA.similarItems.dequeue();
}

export function getCSFPopupItem() {
	return CSFLOAT_API_DATA.popupItem;
}

export function getSpecificCSFOffer(index: number) {
	return CSFLOAT_API_DATA.offers[index];
}

export function getSpecificCSFInventoryItem(item_name: string, float?: number) {
	return CSFLOAT_API_DATA.inventory.find((item) => item.item_name === item_name && (!float || !item.float_value || new Decimal(item.float_value).toDP(12).equals(float)));
}

async function fetchCSFCurrencyRates() {
	await fetch('https://csfloat.com/api/v1/meta/exchange-rates')
		.then((response) => response.json())
		.then((data) => {
			console.debug('[BetterFloat] Received currency rates from CSFloat: ', data);
			cacheCSFExchangeRates(data);
		});
}
