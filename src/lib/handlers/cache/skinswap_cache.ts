import type { Skinswap } from '~lib/@typings/SkinswapTypes';

const skinswapUserInventory: Record<string, Skinswap.Item> = {};
const skinswapItems: Record<string, Skinswap.Item> = {};

export function cacheSkinswapUserInventory(inventory: Skinswap.InventoryResponse) {
	for (const item of inventory.data) {
		skinswapUserInventory[item.market_hash_name] = item;
	}
}

export function cacheSkinswapItems(items: Skinswap.MarketItemsResponse) {
	for (const item of items.data) {
		skinswapItems[item.market_hash_name] = item;
	}
}

export function getSkinswapUserItem(name: string) {
	return skinswapUserInventory[name];
}

export function getSkinswapItem(name: string) {
	return skinswapItems[name];
}
