import type { Skinout } from '~lib/@typings/SkinoutTypes';

let marketItems: Skinout.Item[] = [];
let userInventory: Skinout.InventoryItem[] = [];

export function cacheSkinoutItems(items: Skinout.MarketItemsResponse) {
	marketItems = items.items;
}

export function cacheSkinoutUserInventory(inventory: Skinout.InventoryResponse) {
	userInventory = inventory.items;
}

export function getSpecificSkinoutItem(itemId: string) {
	return marketItems.find((item) => item.id === itemId);
}

export function getFirstSkinoutItem() {
	return marketItems.shift();
}

export function getSpecificSkinoutUserItem(assetId: string) {
	return userInventory.find((item) => item.assetid === assetId);
}
