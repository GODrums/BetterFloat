import type { Bitskins } from '~lib/@typings/BitskinsTypes';

const bitskinsItems: { [id: string]: Bitskins.Item } = {};
let bitskinsPopoutItem: Bitskins.Item | null = null;
let currencyList: Bitskins.CurrencyList | null = null;

export function cacheBitskinsItems(data: Bitskins.Item[]) {
	data.forEach((item) => {
		bitskinsItems[item.id] = item;
	});
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

export function getSpecificBitskinsItem(id: string) {
	return bitskinsItems[id];
}

export function getBitskinsCurrencyRate(currency: string) {
	if (!currencyList) {
		currencyList = JSON.parse(localStorage.getItem('cache.currencies') ?? '{}').data as Bitskins.CurrencyList;
	}
	return currencyList?.fiat[currency]?.value;
}
