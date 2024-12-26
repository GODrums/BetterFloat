import type { Bitskins } from '~lib/@typings/BitskinsTypes';

let bitskinsItems: Bitskins.Item[] = [];
let bitskinsPopoutItem: Bitskins.Item | null = null;
let currencyList: Bitskins.CurrencyList | null = null;

export function cacheBitskinsItems(data: Bitskins.Item[]) {
	bitskinsItems = data;
}

export function cacheBitskinsPopoutItem(data: Bitskins.Item) {
	bitskinsPopoutItem = data;
}

export function cacheBitskinsCurrencyList(data: Bitskins.CurrencyList) {
	currencyList = data;
}

export function getBitskinsPopoutItem() {
	return bitskinsPopoutItem;
}

export function getFirstBitskinsItem() {
	return bitskinsItems.pop();
}

export function getSpecificBitskinsItem(id: string) {
	return bitskinsItems.find((item) => item.id === id);
}

export function getBitskinsCurrencyRate(currency: string) {
	if (!currencyList) {
		currencyList = JSON.parse(localStorage.getItem('cache.currencies') ?? '{}').data as Bitskins.CurrencyList;
	}
	return currencyList?.fiat[currency]?.value;
}
