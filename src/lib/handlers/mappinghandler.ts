import marketIds from '@/assets/marketids.json';
import Decimal from 'decimal.js';

import { handleSpecialStickerNames } from '../util/helperfunctions';

import { MarketSource } from '~lib/util/globals';
import { Queue } from '~lib/util/queue';
import type { Extension } from '../@typings/ExtensionTypes';
import type { CSFloat, DopplerPhase } from '../@typings/FloatTypes';
import type { Skinbid } from '../@typings/SkinbidTypes';
import type { Skinport } from '../@typings/SkinportTypes';
import { fetchCurrencyRates } from './networkhandler';

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

type MarketIDEntry = {
	buff: number;
	uu: number;
	c5: string | number;
	buff_sticker: number;
	buff_phase: Partial<Record<DopplerPhase, number | null>>;
};

// maps buff_name to buff_id
const marketIdMapping: Record<string, Partial<MarketIDEntry>> = marketIds;
// maps buff_name to prices and more - custom mapping
const priceMapping: {
	buff: Extension.PriceMappingBuff;
	youpin: Extension.PriceMappingMisc;
	c5game: Extension.PriceMappingMisc;
	steam: Extension.PriceMappingSteam;
	csfloat: Extension.PriceMappingMisc;
} = { buff: {}, youpin: {}, c5game: {}, steam: {}, csfloat: {} };
// crimson web mapping
let crimsonWebMapping: Extension.CrimsonWebMapping | null = null;

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
// skinport: cached items from api
let skinportItems: Skinport.Item[] = [];
// skinport: cached popup item from api
let skinportPopupItem: Skinport.ItemData | null = null;
// skinport: cached popup item from api
let skinportPopupInventoryItem: Skinport.InventoryItem | null = null;
// skinport: cached currency rates by Skinport: USD -> X
let skinportRatesFromUSD: { [currency: string]: number } = {};
// skinport: minimum order price (e.g. 0.01)
let skinportMinOrderPrice = 0;
// skinbid: cached currency rates by Skinbid: EUR -> X
let skinbidRates: Skinbid.ExchangeRates = [];
// skinport: cached currency rates by exchangerate.host: USD -> X
let realRatesFromUSD: { [currency: string]: number } = {};
// skinport: user currency (e.g. EUR)
let skinportUserCurrency = '';
// skinbid: user currency (e.g. EUR)
let skinbidUserCurrency = '';
// skinbid: cached items from api
let skinbidItems: Skinbid.Listing[] = [];
// skinbid: inventory items
let skinbidInventory: Skinbid.ListedItem[] = [];

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

export function cacheSkbItems(data: Skinbid.Listing[]) {
	if (skinbidItems.length > 0) {
		console.debug('[BetterFloat] Items already cached, added more items: ', skinbidItems.length);
		skinbidItems = skinbidItems.concat(data);
	} else {
		skinbidItems = data;
	}
}

export function cacheSkbInventory(data: Skinbid.ListedItem[]) {
	if (skinbidInventory.length > 0) {
		console.debug('[BetterFloat] Inventory already cached, added more items: ', skinbidInventory.length);
		skinbidInventory = skinbidInventory.concat(data);
	} else {
		skinbidInventory = data;
	}
}

export function cacheCSFExchangeRates(data: CSFloat.ExchangeRates) {
	CSFLOAT_API_DATA.rates = data.data;
}

export function cacheCSFLocation(data: CSFloat.Location) {
	CSFLOAT_API_DATA.location = data;
}

export function cacheSpMinOrderPrice(price: number) {
	skinportMinOrderPrice = price / 100;
}

export function cacheCSFPopupItem(data: CSFloat.ListingData) {
	CSFLOAT_API_DATA.popupItem = data;
}

export function cacheSpPopupItem(data: Skinport.ItemData) {
	skinportPopupItem = data;
}

export function cacheSpPopupInventoryItem(data: Skinport.InventoryItem) {
	skinportPopupInventoryItem = data;
}

export function cacheSpItems(data: Skinport.Item[]) {
	if (skinportItems.length > 0) {
		console.debug('[BetterFloat] Items already cached, deleting items: ', skinportItems);
		skinportItems = [];
	}
	skinportItems = data;
}

export function cacheSkinportCurrencyRates(data: { [currency: string]: number }, user: string) {
	// maybe cache csrf token here as well
	if (Object.keys(skinportRatesFromUSD).length > 0) {
		console.debug('[BetterFloat] Currency rates already cached, overwriting old ones: ', skinportRatesFromUSD);
	}
	skinportRatesFromUSD = data;
	skinportUserCurrency = user;
}

export function cacheSkinbidCurrencyRates(rates: Skinbid.ExchangeRates) {
	skinbidRates = rates;
}

export function cacheSkinbidUserCurrency(currency: string) {
	skinbidUserCurrency = currency;
}

export function cacheRealCurrencyRates(data: { [currency: string]: number }) {
	if (Object.keys(realRatesFromUSD).length > 0) {
		console.debug('[BetterFloat] Real currency rates already cached, overwriting old ones: ', realRatesFromUSD);
	}
	realRatesFromUSD = data;
}

export function getSpMinOrderPrice() {
	return skinportMinOrderPrice;
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

export function getSpPopupItem() {
	return skinportPopupItem;
}

export function getSpPopupInventoryItem() {
	return skinportPopupInventoryItem;
}

export function getFirstSpItem() {
	if (skinportItems.length > 0) {
		const item = skinportItems.shift();
		return item;
	} else {
		return null;
	}
}

export function getFirstSkbItem() {
	if (skinbidItems.length > 0) {
		const item = skinbidItems.shift();
		return item;
	} else {
		return null;
	}
}

export function getSpecificSkbInventoryItem(steamImage: string) {
	return skinbidInventory.find((item) => item?.item.imageUrl === steamImage);
}

export function getSpecificSkbItem(auction_hash: string) {
	const index = skinbidItems.findIndex((item) => item.auction?.auctionHash === auction_hash);
	const item = skinbidItems[index];
	skinbidItems.splice(index, 1);
	return item;
}

export async function getPriceMapping(source: MarketSource) {
	if (Object.keys(priceMapping[source]).length === 0) {
		await loadMapping(source);
	}
	return priceMapping[source] as Extension.AbstractPriceMapping;
}

/**
 * should only be used for non-weapon as no special conditions are checked
 * @param buff_name
 * @returns
 */
export async function getItemPrice(buff_name: string, source: MarketSource): Promise<{ starting_at: number; highest_order: number }> {
	if (Object.keys(priceMapping[source]).length === 0) {
		await loadMapping(source);
	}
	//removing double spaces
	buff_name = handleSpecialStickerNames(buff_name.replace(/\s+/g, ' '));
	if (!priceMapping[source][buff_name]) {
		console.log(`[BetterFloat] No price mapping found for ${buff_name}`);
		return {
			starting_at: 0,
			highest_order: 0,
		};
	}
	return {
		starting_at: new Decimal(priceMapping[source][buff_name]['ask'] ?? 0).div(100).toNumber(),
		highest_order: new Decimal(priceMapping[source][buff_name]['bid'] ?? 0).div(100).toNumber(),
	};
}

async function fetchCSFCurrencyRates() {
	await fetch('https://csfloat.com/api/v1/meta/exchange-rates')
		.then((response) => response.json())
		.then((data) => {
			console.debug('[BetterFloat] Received currency rates from CSFloat: ', data);
			cacheCSFExchangeRates(data);
		});
}

export async function getSpUserCurrency() {
	if (skinportUserCurrency === '') {
		await fetchSpUserData();
	}
	return skinportUserCurrency;
}

export async function getSpUserCurrencyRate(rates: 'skinport' | 'real' = 'real') {
	if (Object.keys(skinportRatesFromUSD).length === 0) {
		await fetchSpUserData();
	}
	if (skinportUserCurrency === 'USD') return 1;
	if (rates === 'real' && Object.keys(realRatesFromUSD).length === 0) {
		await fetchCurrencyRates();
	}
	return rates === 'real' ? realRatesFromUSD[skinportUserCurrency] : skinportRatesFromUSD['USD'];
}

export function getSkbCurrency() {
	return skinbidUserCurrency;
}

export async function getSkbUserCurrencyRate() {
	if (skinbidUserCurrency === '') {
		skinbidUserCurrency = document.querySelector('.currency-selector .hide-mobile')?.textContent?.trim() ?? 'USD';
	}
	if (skinbidRates.length === 0) {
		await fetchSkbExchangeRates();
	}
	if (skinbidUserCurrency === 'USD') return 1;
	else if (skinbidUserCurrency === 'EUR') return 1 / skinbidRates[0].rate;
	// origin is USD, first convert to EUR, then to user currency: USD -> EUR -> user currency
	// example: 1 USD -> 1/USDrate EUR -> 1/USDrate * EURUserCurrency
	else return (skinbidRates.find((rate) => rate.currencyCode === skinbidUserCurrency)?.rate ?? 1) / skinbidRates[0].rate;
}

export async function getSkbUserConversion() {
	if (skinbidUserCurrency === '') {
		skinbidUserCurrency = document.querySelector('.currency-selector .hide-mobile')?.textContent?.trim() ?? 'USD';
	}
	if (skinbidRates.length === 0) {
		await fetchSkbExchangeRates();
	}

	if (skinbidUserCurrency === 'EUR') return 1;
	else return skinbidRates.find((rate) => rate.currencyCode === skinbidUserCurrency)?.rate ?? 1;
}

export async function getStallData(stall_id: string) {
	const request = await fetch('https://api.rums.dev/v2/csfloatstalls/' + stall_id);
	if (request.status !== 200) {
		console.warn('[BetterFloat] Invalid stall data from Rums.dev: ', request);
		return null;
	}
	const response = (await request.json()) as Extension.CustomStallData;
	console.debug('[BetterFloat] Received stall data from Rums.dev: ', response);
	if (response && response.status === 'OK' && response.data) {
		return response.data;
	} else {
		return null;
	}
}

async function fetchSkbExchangeRates() {
	await fetch('https://api.skinbid.com/api/public/exchangeRates')
		.then((response) => response.json() as Promise<Skinbid.ExchangeRates>)
		.then((data) => {
			console.debug('[BetterFloat] Received exchange rates from Rums.dev: ', data);
			cacheSkinbidCurrencyRates(data);
		});
}

// this endpoint sometimes gets called by Skinport itself and provides the user data
async function fetchSpUserData() {
	await fetch('https://skinport.com/api/data/')
		.then((response) => response.json())
		.then((data: Skinport.UserData) => {
			console.debug('[BetterFloat] Received user data from Skinport manually: ', data);
			cacheSkinportCurrencyRates(data.rates, data.currency);
			cacheSpMinOrderPrice(data.limits.minOrderValue);
		});
}

export async function getCrimsonWebMapping(weapon: Extension.CWWeaponTypes, paint_seed: number) {
	if (!crimsonWebMapping) {
		await loadCrimsonWebMapping();
	}
	if (crimsonWebMapping?.[weapon]?.[paint_seed]) {
		return crimsonWebMapping[weapon][paint_seed];
	}
	return null;
}

export function getMarketID(name: string, source: MarketSource) {
	if (Object.keys(marketIdMapping).length === 0) {
		console.error('[BetterFloat] ID mapping not loaded yet');
		return undefined;
	}
	const getSourceKey = (source: MarketSource) => {
		switch (source) {
			case MarketSource.Buff:
				return 'buff';
			case MarketSource.YouPin:
				return 'uu';
			case MarketSource.C5Game:
				return 'c5';
			default:
				return null;
		}
	};
	const sourceKey = getSourceKey(source);
	if (!sourceKey) return undefined;
	const queryName = name.replace(/\s+/g, ' ');
	if (marketIdMapping[queryName]?.[sourceKey]) {
		return marketIdMapping[queryName][sourceKey];
	} else {
		console.log(`[BetterFloat] No market ID found for ${name}`);
		return undefined;
	}
}

export async function loadMapping(source: MarketSource) {
	if (Object.keys(priceMapping[source]).length === 0) {
		console.debug(`[BetterFloat] Attempting to load ${source} price mapping from local storage`);

		const sourceName = source !== MarketSource.Buff ? `prices_${source}` : 'prices';
		const data = await chrome.storage.local.get(sourceName);
		if (data?.[sourceName]) {
			priceMapping[source] = JSON.parse(data[sourceName]);
			console.debug(`[BetterFloat] ${source} Price mapping successfully initialized`);
			return true;
		} else {
			console.error(`[BetterFloat] ${source} Price load failed.`);
			return false;
		}
	}
}

export async function loadCrimsonWebMapping() {
	if (!crimsonWebMapping) {
		// load from local storage first to avoid unnecessary requests
		console.debug('[BetterFloat] Attempting to load crimson web mapping from local storage');
		await new Promise<boolean>((resolve) => {
			try {
				chrome.storage.local.get(['crimsonWebMapping'], async (data) => {
					if (data.crimsonWebMapping) {
						crimsonWebMapping = JSON.parse(data.crimsonWebMapping);
					} else {
						console.debug('[BetterFloat] No CW mapping found in local storage. Loading from Github ...');
						await fetch('https://raw.githubusercontent.com/GODrums/cs-tierlist/main/generated/crimson_web.json')
							.then((response) => response.json())
							.then((data) => {
								crimsonWebMapping = data;
								chrome.storage.local.set({ crimsonWebMapping: JSON.stringify(data) });
								console.debug('[BetterFloat] Crimson web mapping successfully loaded from Github');
							})
							.catch((err) => console.error(err));
					}
					resolve(true);
				});
			} catch (err) {
				console.error(err);
				resolve(false);
			}
		});
	}
	return true;
}
