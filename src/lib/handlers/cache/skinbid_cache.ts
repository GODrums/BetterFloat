import type { Skinbid } from '~lib/@typings/SkinbidTypes';

// skinbid: cached currency rates by Skinbid: EUR -> X
let skinbidRates: Skinbid.ExchangeRates = [];
// skinbid: user currency (e.g. EUR)
let skinbidUserCurrency = '';
// skinbid: cached items from api
let skinbidItems: Skinbid.Listing[] = [];
// skinbid: inventory items
let skinbidInventory: Skinbid.ListedItem[] = [];

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

export function cacheSkinbidCurrencyRates(rates: Skinbid.ExchangeRates) {
	skinbidRates = rates;
}

export function cacheSkinbidUserCurrency(currency: string) {
	skinbidUserCurrency = currency;
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

export function getSkbCurrency() {
	if (!skinbidUserCurrency) {
		loadSkbUserCurrency();
	}
	return skinbidUserCurrency;
}

export async function getSkbUserCurrencyRate() {
	const currency = getSkbCurrency();
	if (skinbidRates.length === 0) {
		await fetchSkbExchangeRates();
	}
	if (currency === 'USD') return 1;
	else if (currency === 'EUR') return 1 / skinbidRates[0].rate;
	// origin is USD, first convert to EUR, then to user currency: USD -> EUR -> user currency
	// example: 1 USD -> 1/USDrate EUR -> 1/USDrate * EURUserCurrency
	else return (skinbidRates.find((rate) => rate.currencyCode === currency)?.rate ?? 1) / skinbidRates[0].rate;
}

export async function getSkbUserConversion() {
	const currency = getSkbCurrency();
	if (skinbidRates.length === 0) {
		await fetchSkbExchangeRates();
	}

	if (currency === 'EUR') return 1;
	else return skinbidRates.find((rate) => rate.currencyCode === currency)?.rate ?? 1;
}

async function fetchSkbExchangeRates() {
	await fetch('https://api.skinbid.com/api/public/exchangeRates')
		.then((response) => response.json() as Promise<Skinbid.ExchangeRates>)
		.then((data) => {
			console.debug('[BetterFloat] Received exchange rates from Rums.dev: ', data);
			cacheSkinbidCurrencyRates(data);
		});
}

function loadSkbUserCurrency() {
	const localSettings = localStorage.getItem('settings');
	if (localSettings) {
		const settings = JSON.parse(localSettings);
		cacheSkinbidUserCurrency(settings.currency);
	} else {
		console.warn('[BetterFloat] No currency found in user preferences.');
	}
}
