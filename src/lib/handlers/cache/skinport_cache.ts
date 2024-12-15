import type { Skinport } from '~lib/@typings/SkinportTypes';
import { getRealCurrencyRates } from '../mappinghandler';
import { fetchCurrencyRates } from '../networkhandler';

// skinport: user currency (e.g. EUR)
let skinportUserCurrency = '';
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

export function cacheSpMinOrderPrice(price: number) {
	skinportMinOrderPrice = price / 100;
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

export function getSpMinOrderPrice() {
	return skinportMinOrderPrice;
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

export async function getSpUserCurrencyRate(rates: 'skinport' | 'real' = 'real') {
	if (Object.keys(skinportRatesFromUSD).length === 0) {
		await fetchSpUserData();
	}
	if (skinportUserCurrency === 'USD') return 1;
	let realRatesFromUSD = getRealCurrencyRates();
	if (rates === 'real' && Object.keys(realRatesFromUSD).length === 0) {
		await fetchCurrencyRates();
		realRatesFromUSD = getRealCurrencyRates();
	}
	return rates === 'real' ? realRatesFromUSD[skinportUserCurrency] : skinportRatesFromUSD['USD'];
}

export async function getSpUserCurrency() {
	if (!skinportUserCurrency) {
		await fetchSpUserData();
	}
	return skinportUserCurrency;
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