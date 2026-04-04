import type { Skinbaron } from '~lib/@typings/SkinbaronTypes';

// skinbaron: cached items from api
let skinbaronItems: Skinbaron.Item[] = [];
// skinbaron: cached currency rates by Skinbaron: EUR -> X
let skinbaronRates: { [key: string]: number } = {};

export async function cacheSkinbaronItems(data: Skinbaron.SingleItem[]) {
	if (skinbaronItems.length > 0) {
		console.debug('[BetterFloat] Items already cached, overwriting old ones.');
	}
	skinbaronItems = data;
}

export function cacheSkinbaronRates(rates: { [key: string]: number }) {
	skinbaronRates = Object.assign(skinbaronRates, rates);
}

export async function getFirstSkinbaronItem() {
	if (skinbaronItems.length > 0) {
		const item = skinbaronItems.shift();
		return item;
	}
	return null;
}

export function getSkinbaronCurrencyRate(currency: string) {
	if (currency === 'EUR') {
		return 1;
	}
	return skinbaronRates[currency] || 1;
}

export function rotateSkinbaronItems(newItem: Skinbaron.Item) {
	skinbaronItems.push(newItem);
}
