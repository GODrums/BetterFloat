import type { Skinsmonkey } from '~lib/@typings/Skinsmonkey';

const userInventory: { [name: string]: Skinsmonkey.Item } = {};
const botInventory: { [name: string]: Skinsmonkey.Item } = {};

export function cacheSkinsmonkeyUserInventory(inventory: Skinsmonkey.InventoryResponse) {
	for (const item of inventory.assets) {
		userInventory[item.item.marketName] = { ...item };
	}
}

export function cacheSkinsmonkeyBotInventory(inventory: Skinsmonkey.InventoryResponse) {
	for (const item of inventory.assets) {
		botInventory[item.item.marketName] = { ...item };
	}
}

export function getSpecificSkinsmonkeyUserItem(itemName: string) {
	return userInventory[itemName];
}

export function getSpecificSkinsmonkeyBotItem(itemName: string) {
	return botInventory[itemName];
}
