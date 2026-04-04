import type { Skinflow } from '~lib/@typings/SkinflowTypes';

const botsItems: { [realId: string]: Skinflow.Item } = {};
const inventoryItems: { [mhn: string]: Skinflow.Item } = {};

export function cacheSkinflowBotsItems(items: Skinflow.BotsItemsTradeResponse) {
	for (const item of items.results) {
		botsItems[item.realitem_id] = item;
	}
}

export function cacheSkinflowInventoryItems(items: Skinflow.Item[]) {
	console.log('[BetterFloat] Caching Skinflow inventory items:', items);
	for (const item of items) {
		inventoryItems[item.market_hash_name] = item;
	}
}

export function getSkinflowBotsItem(realId: string) {
	return botsItems[realId];
}

export function getSkinflowInventoryItem(mhn: string) {
	return inventoryItems[mhn];
}

export function isSkinflowInventoryEmpty() {
	return Object.keys(inventoryItems).length === 0;
}
