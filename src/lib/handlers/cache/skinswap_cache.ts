import type { Skinswap } from '~lib/@typings/SkinswapTypes';

let skinswapUserInventory: Skinswap.Item[] = [];
let skinswapItems: Skinswap.Item[] = [];

export function cacheSkinswapUserInventory(inventory: Skinswap.InventoryResponse) {
	skinswapUserInventory = inventory.data;
}

export function cacheSkinswapItems(items: Skinswap.MarketItemsResponse) {
	skinswapItems = items.data;
}

export function getFirstSkinswapUserItem() {
	return skinswapUserInventory.shift();
}

export function getFirstSkinswapItem() {
	return skinswapItems.shift();
}
