import type { Skinswap } from '~lib/@typings/SkinswapTypes';

const skinswapUserInventory: Record<string, Skinswap.Item> = {};
// uses stackId (matches data-item-id / image url of cards)
const skinswapItems: Record<string, Skinswap.Item> = {};
// uses mhn
const skinswapChinaMarket: Record<string, Skinswap.Item> = {};
const skinswapChinaItems: Skinswap.ChinaItem[] = [];

export function cacheSkinswapChinaItems(items: Skinswap.ChinaMarketItemsResponse) {
	skinswapChinaItems.push(...items.data.listings);
}

export function cacheSkinswapUserInventory(inventory: Skinswap.InventoryResponse) {
	if (!Array.isArray(inventory?.data)) return;
	console.log('[BetterFloat] Caching Skinswap user inventory:', inventory.data.length);
	for (const item of inventory.data) {
		skinswapUserInventory[item.assetid!] = { ...item };
	}
}

export function cacheSkinswapItems(items: Skinswap.MarketItemsResponse, isChina = false) {
	if (!Array.isArray(items?.data)) return;
	console.log('[BetterFloat] Caching Skinswap items:', items.data.length);
	for (const item of items.data) {
		if (isChina) {
			skinswapChinaMarket[item.market_hash_name] = { ...item };
		} else {
			skinswapItems[item.stackId ?? item.stackIdWithHold] = { ...item };
			skinswapItems[item.asset.id] = { ...item };
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

export function getSkinswapItem(stackId: string) {
	return skinswapItems[stackId];
}
