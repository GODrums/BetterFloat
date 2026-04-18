import type { Skinport } from '~lib/@typings/SkinportTypes';
import { fetchCurrencyRates, getRealCurrencyRates } from '~lib/shared/currency';

// skinport: user currency (e.g. EUR)
let skinportUserCurrency = '';
// skinport: cached items from api
const skinportItemsMap: { [saleId: string]: Skinport.Item } = {};
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

	// other sales
	if (data.data?.otherSales?.items && data.data.otherSales.items.length > 0) {
		const otherSalesItems = [...data.data.otherSales.items];
		otherSalesItems.forEach((item) => {
			skinportItemsMap[item.saleId] = { ...item };
		});
	}

	// similar items
	if (data.data?.similarItems && data.data.similarItems.length > 0) {
		const similarItems = [...data.data.similarItems];
		similarItems.forEach((item) => {
			skinportItemsMap[item.saleId] = { ...item };
		});
	}

	// recently viewed items
	if (data.data?.recentViewed?.items && data.data.recentViewed.items.length > 0) {
		const recentlyViewedItems = [...data.data.recentViewed.items];
		recentlyViewedItems.forEach((item) => {
			skinportItemsMap[item.saleId] = { ...item };
		});
	}
}

export function cacheSpPopupInventoryItem(data: Skinport.InventoryItem) {
	skinportPopupInventoryItem = data;
}

export function cacheSpItems(data: Skinport.Item[]) {
	// copy data
	const items = [...data];

	items.forEach((item) => {
		// copy item
		skinportItemsMap[item.saleId] = { ...item };
	});
}

export function cacheSkinportCurrencyRates(data: { [currency: string]: number }, currency: string) {
	// maybe cache csrf token here as well
	if (Object.keys(skinportRatesFromUSD).length > 0) {
		console.debug('[BetterFloat] Currency rates already cached, overwriting old ones: ', skinportRatesFromUSD);
	}
	skinportRatesFromUSD = data;
	skinportUserCurrency = currency;
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

export function getSpItem(saleId: string) {
	return skinportItemsMap[saleId];
}

export async function getSpUserCurrencyRate(rates: 'skinport' | 'real' = 'real') {
	if (Object.keys(skinportRatesFromUSD).length === 0) {
		await fetchSpUserData();
	}
	if (skinportUserCurrency === 'USD') return 1;

	if (rates === 'skinport') return skinportRatesFromUSD['USD'];

	let realRatesFromUSD = getRealCurrencyRates();
	if (rates === 'real' && Object.keys(realRatesFromUSD).length === 0) {
		await fetchCurrencyRates();
		realRatesFromUSD = getRealCurrencyRates();
	}
	return realRatesFromUSD[skinportUserCurrency];
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
			localStorage.setItem('userData', JSON.stringify(data));
			cacheSkinportCurrencyRates(data.rates, data.currency);
			cacheSpMinOrderPrice(data.limits.minOrderValue);
		});
}
