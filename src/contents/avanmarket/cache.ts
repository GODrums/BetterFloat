import type { Avanmarket } from '~lib/@typings/AvanTypes';

export type AvCurrency = {
	rate: number;
	name: string;
};

let avItems: Avanmarket.Item[] = [];
let avInventory: Avanmarket.InventoryItem[] = [];
let avCurrency: AvCurrency = {
	rate: 1,
	name: 'USD',
};

export function cacheAvanmarketItems(items: Avanmarket.Item[]) {
	avItems = items;
}

export function cacheAvanmarketCurrency(res: Avanmarket.CurrencyResponse) {
	avCurrency = {
		rate: res.courseToUsd || 1,
		name: res.name || 'USD',
	};
}

export function getAvanmarketCurrency() {
	return avCurrency;
}

export function getFirstAvanmarketItem() {
	return avItems.shift();
}

export function cacheAvanmarketInventory(inventory: Avanmarket.InventoryItem[]) {
	avInventory = inventory;
}

export function getAvanmarketInventoryItem(iconPath: string) {
	return avInventory.find((item) => item.iconUrl === iconPath);
}
