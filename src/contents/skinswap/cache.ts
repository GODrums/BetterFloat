import type { Skinswap } from '~lib/@typings/SkinswapTypes';

const skinswapUserInventory: Record<string, Skinswap.Item> = {};
// uses stackIdWithHold
const skinswapItems: Record<string, Skinswap.Item> = {};
// uses mhn
const skinswapChinaMarket: Record<string, Skinswap.Item> = {};
const skinswapChinaItems: Skinswap.ChinaItem[] = [];

export function cacheSkinswapChinaItems(items: Skinswap.ChinaMarketItemsResponse) {
	skinswapChinaItems.push(...items.data.listings);
}

export function cacheSkinswapUserInventory(inventory: Skinswap.InventoryResponse) {
	console.log('[BetterFloat] Caching Skinswap user inventory:', inventory.data.length);
	for (const item of inventory.data) {
		skinswapUserInventory[item.assetid] = { ...item };
	}
}

export function cacheSkinswapItems(items: Skinswap.MarketItemsResponse, isChina = false) {
	console.log('[BetterFloat] Caching Skinswap items:', items.data.length);
	for (const item of items.data) {
		if (isChina) {
			skinswapChinaMarket[item.market_hash_name] = { ...item };
		} else {
			skinswapItems[item.stackIdWithHold] = { ...item };
		}
	}
}

export function getSkinswapUserItem(assetid: string) {
	return skinswapUserInventory[assetid];
}

export function getSkinswapNextChinaItem() {
	return skinswapChinaItems.shift();
}

export function getSkinswapChinaItem(mhn: string) {
	return skinswapChinaMarket[mhn];
}

export function getSkinswapItem(assetid: string) {
	return skinswapItems[assetid];
}
