import buffIds from '@/assets/buffids.json';
import Decimal from 'decimal.js';

import { handleSpecialStickerNames } from '../util/helperfunctions';

import type { Extension } from '../@typings/ExtensionTypes';
import type { CSFloat } from '../@typings/FloatTypes';
import type { Skinbid } from '../@typings/SkinbidTypes';
import type { Skinport } from '../@typings/SkinportTypes';
import { fetchCurrencyRates } from './networkhandler';

// most arrays could be converted to a queue - https://dev.to/glebirovich/typescript-data-structures-stack-and-queue-hld#queue
// e.g. Queue<T extends GeneralItem> = { items: T[]; push: (item: T) => void; pop: () => T | undefined; };

// maps buff_name to buff_id
const buffMapping: { [name: string]: number } = buffIds;
// maps buff_name to prices and more - custom mapping
let priceMapping: Extension.CustomPriceMapping = {};
// crimson web mapping
let crimsonWebMapping: Extension.CrimsonWebMapping | null = null;
// csfloat: cached items from api
let csfloatItems: CSFloat.ListingData[] = [];
// csfloat: cached popup item from api
let csfloatPopupItem: CSFloat.ListingData | null = null;
// csfloat: history graph for one item
let csfloatHistoryGraph: CSFloat.HistoryGraphData[] = [];
// csfloat: history sales for one item
let csfloatHistorySales: CSFloat.HistorySalesData[] = [];
// csfloat: offers timeline
let csfloatOffers: CSFloat.Offer[] = [];
let csfloatRates: { [key: string]: number } = {};
let csfloatLocation: CSFloat.Location | null = null;
// skinport: cached items from api
let skinportItems: Skinport.Item[] = [];
// skinport: cached popup item from api
let skinportPopupItem: Skinport.ItemData | null = null;
// skinport: cached currency rates by Skinport: USD -> X
let skinportRatesFromUSD: { [currency: string]: number } = {};
// skinport: csrf token
let skinportCSRF = '';
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
	if (csfloatHistoryGraph.length > 0) {
		console.debug('[BetterFloat] History graph already cached, deleting history: ', csfloatHistoryGraph);
		csfloatHistoryGraph = [];
	}
	// original price is in cents, convert to dollars
	csfloatHistoryGraph = data.map((history) => {
		return {
			avg_price: history.avg_price / 100,
			count: history.count,
			day: history.day,
		};
	});
}

export function cacheCSFOffers(data: CSFloat.Offer[]) {
	if (csfloatOffers.length > 0) {
		console.debug('[BetterFloat] Offers already cached, deleting offers: ', csfloatOffers);
		csfloatHistorySales = [];
	}
	csfloatOffers = data;
}

export function cacheCSFHistorySales(data: CSFloat.HistorySalesData[]) {
	if (csfloatHistorySales.length > 0) {
		console.debug('[BetterFloat] History sales already cached, deleting history: ', csfloatHistoryGraph);
		csfloatHistorySales = [];
	}
	// original price is in cents, convert to dollars
	csfloatHistorySales = data;
}

export function cacheCSFItems(data: CSFloat.ListingData[]) {
	if (csfloatItems.length > 0) {
		console.debug('[BetterFloat] Items already cached, deleting items: ', csfloatItems);
		csfloatItems = [];
	}
	csfloatItems = data;
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
	csfloatRates = data.data;
}

export function cacheCSFLocation(data: CSFloat.Location) {
	csfloatLocation = data;
}

export function cacheSpMinOrderPrice(price: number) {
	skinportMinOrderPrice = price / 100;
}

export function cacheCSFPopupItem(data: CSFloat.ListingData) {
	csfloatPopupItem = data;
}

export function cacheSpPopupItem(data: Skinport.ItemData) {
	skinportPopupItem = data;
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

export function cacheSkinportCSRF(token: string) {
	skinportCSRF = token;
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
	if (Object.keys(csfloatRates).length == 0) {
		await fetchCSFCurrencyRates();
	}
	return csfloatRates[currency.toLowerCase()];
}

export function getCSFUserCurrency() {
	return csfloatLocation?.inferred_location.currency ?? 'USD';
}

export function getWholeHistory() {
	const history = csfloatHistoryGraph;
	csfloatHistoryGraph = [];
	return history;
}

export function getFirstHistorySale() {
	if (csfloatHistorySales.length > 0) {
		const sale = csfloatHistorySales.shift();
		return sale;
	} else {
		return null;
	}
}

export function getFirstCSFItem() {
	if (csfloatItems.length > 0) {
		const item = csfloatItems.shift();
		return item;
	} else {
		return null;
	}
}

export function getCSFPopupItem() {
	return csfloatPopupItem;
}

export function getSpPopupItem() {
	return skinportPopupItem;
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

export function getSpecificCSFOffer(index: number) {
	return csfloatOffers[index];
}

export function getSpecificSkbItem(auction_hash: string) {
	const index = skinbidItems.findIndex((item) => item.auction?.auctionHash == auction_hash);
	const item = skinbidItems[index];
	skinbidItems.splice(index, 1);
	return item;
}

export async function getPriceMapping(): Promise<Extension.CustomPriceMapping> {
	if (Object.keys(priceMapping).length == 0) {
		await loadMapping();
	}
	return priceMapping;
}

/**
 * should only be used for non-weapon as no special conditions are checked
 * @param buff_name
 * @returns
 */
export async function getItemPrice(buff_name: string): Promise<{ starting_at: number; highest_order: number }> {
	if (Object.keys(priceMapping).length == 0) {
		await loadMapping();
	}
	//removing double spaces
	buff_name = handleSpecialStickerNames(buff_name.replace(/\s+/g, ' '));
	if (!priceMapping[buff_name]) {
		console.log(`[BetterFloat] No price mapping found for ${buff_name}`);
		return {
			starting_at: 0,
			highest_order: 0,
		};
	}
	return {
		starting_at: new Decimal(priceMapping[buff_name].ask ?? 0).div(100).toNumber(),
		highest_order: new Decimal(priceMapping[buff_name].bid ?? 0).div(100).toNumber(),
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

export async function getSpUserCurrencyRate(rates: 'skinport' | 'real' = 'real') {
	if (Object.keys(skinportRatesFromUSD).length == 0) {
		await fetchSpUserData();
	}
	if (skinportUserCurrency == 'USD') return 1;
	if (rates == 'real' && Object.keys(realRatesFromUSD).length == 0) {
		await fetchCurrencyRates();
	}
	return rates == 'real' ? realRatesFromUSD[skinportUserCurrency] : skinportRatesFromUSD['USD'];
}

export async function getSpCSRF() {
	if (skinportCSRF == '') {
		await fetchSpUserData();
	}
	return skinportCSRF;
}

export function getSkbCurrency() {
	return skinbidUserCurrency;
}

export async function getSkbUserCurrencyRate() {
	if (skinbidUserCurrency == '') {
		skinbidUserCurrency = document.querySelector('.currency-selector .hide-mobile')?.textContent?.trim() ?? 'USD';
	}
	if (skinbidRates.length === 0) {
		await fetchSkbExchangeRates();
	}
	if (skinbidUserCurrency == 'USD') return 1;
	else if (skinbidUserCurrency == 'EUR') return 1 / skinbidRates[0].rate;
	// origin is USD, first convert to EUR, then to user currency: USD -> EUR -> user currency
	// example: 1 USD -> 1/USDrate EUR -> 1/USDrate * EURUserCurrency
	else return (skinbidRates.find((rate) => rate.currencyCode == skinbidUserCurrency)?.rate ?? 1) / skinbidRates[0].rate;
}

export async function getStallData(stall_id: string) {
	const request = await fetch('https://api.rums.dev/v2/csfloatstalls/' + stall_id);
	if (request.status != 200) {
		console.warn('[BetterFloat] Invalid stall data from Rums.dev: ', request);
		return null;
	}
	const response = (await request.json()) as Extension.CustomStallData;
	console.debug('[BetterFloat] Received stall data from Rums.dev: ', response);
	if (response && response.status == 'OK' && response.data) {
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
			cacheSkinportCSRF(data.csrf);
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

export async function getBuffMapping(name: string) {
	if (Object.keys(buffMapping).length == 0) {
		console.error('[BetterFloat] Buff mapping not loaded yet');
	}
	if (buffMapping[name]) {
		return buffMapping[name];
	} else {
		console.log(`[BetterFloat] No buff mapping found for ${name}`);
		return 0;
	}
}

export async function loadMapping() {
	if (Object.keys(priceMapping).length == 0) {
		console.debug('[BetterFloat] Attempting to load price mapping from local storage');

		const success = await new Promise<boolean>((resolve) => {
			chrome.storage.local.get('prices', (data) => {
				if (data?.prices) {
					priceMapping = JSON.parse(data.prices);
					resolve(true);
				} else {
					resolve(false);
				}
			});
		});

		if (success) {
			console.debug('[BetterFloat] Price mapping successfully initialized');
		} else {
			console.error('[BetterFloat] Rums.dev price load failed.');
			return false;
		}
	}
	return true;
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
