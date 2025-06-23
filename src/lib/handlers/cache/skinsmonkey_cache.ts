import type { Skinsmonkey } from '~lib/@typings/Skinsmonkey';

let userInventory: Skinsmonkey.Item[] = [];
let botInventory: Skinsmonkey.Item[] = [];

export function cacheSkinsmonkeyUserInventory(inventory: Skinsmonkey.InventoryResponse) {
	userInventory = inventory.assets;
}

export function cacheSkinsmonkeyBotInventory(inventory: Skinsmonkey.InventoryResponse) {
	botInventory = inventory.assets;
}

export function getSpecificSkinsmonkeyUserItem(itemName: string) {
	return userInventory.find((item) => item.item.marketName === itemName);
}

export function getSpecificSkinsmonkeyBotItem(itemName: string) {
	return botInventory.find((item) => item.item.marketName === itemName);
}

export function getFirstSkinsmonkeyUserItem() {
	return userInventory.shift();
}

export function getFirstSkinsmonkeyBotItem() {
	return botInventory.shift();
}
