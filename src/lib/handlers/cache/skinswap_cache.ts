import type { Skinswap } from '~lib/@typings/SkinswapTypes';

const skinswapUserInventory: Record<string, Skinswap.Item> = {};
const skinswapItems: Record<string, Skinswap.Item> = {};

export function cacheSkinswapUserInventory(inventory: Skinswap.InventoryResponse) {
	console.log('[BetterFloat] Caching Skinswap user inventory:', inventory.data.length);
	for (const item of inventory.data) {
		skinswapUserInventory[item.assetid] = { ...item };
	}
}

export function cacheSkinswapItems(items: Skinswap.MarketItemsResponse) {
	console.log('[BetterFloat] Caching Skinswap items:', items.data.length);
	for (const item of items.data) {
		skinswapItems[item.stackIdWithHold] = { ...item };
	}
}

export function getSkinswapUserItem(assetid: string) {
	return skinswapUserInventory[assetid];
}

export function getSkinswapItem(assetid: string) {
	return skinswapItems[assetid];
}
