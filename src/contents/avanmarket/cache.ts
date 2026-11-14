import type { Avanmarket } from '~lib/@typings/AvanTypes';

export type AvCurrency = {
	rate: number;
	name: string;
};

let avInventory: Avanmarket.InventoryItem[] = [];
let avCurrency: AvCurrency = {
	rate: 1,
	name: 'USD',
};

export function cacheAvanmarketCurrency(res: Avanmarket.CurrencyResponse) {
	avCurrency = {
		rate: res.courseToUsd || 1,
		name: res.name || 'USD',
	};
}

export function getAvanmarketCurrency() {
	return avCurrency;
}

export function cacheAvanmarketInventory(inventory: Avanmarket.InventoryItem[]) {
	avInventory = inventory;
}

export function getAvanmarketInventoryItem(iconPath: string) {
	return avInventory.find((item) => item.iconUrl === iconPath);
}
