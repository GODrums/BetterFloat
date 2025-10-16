import type { Avanmarket } from '~lib/@typings/AvanTypes';

let avItems: Avanmarket.Item[] = [];
let avInventory: Avanmarket.InventoryItem[] = [];

export function cacheAvanmarketItems(items: Avanmarket.Item[]) {
	avItems = items;
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
