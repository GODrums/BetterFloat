import type { BuffMarket } from '~lib/@typings/BuffmarketTypes';

// Buff Market routes can identify goods by either the legacy numeric goods ID or
// their MarketHashName. Keep both indexes so old and new routes remain usable.
let buffItems: Record<string, BuffMarket.Item[]> = {};
let buffPageItems: BuffMarket.Item[] = [];
let buffRecommendations: BuffMarket.Item[] = [];
let buffPopoutData: BuffMarket.ItemDetailData | null = null;
let buffBuyOrders: BuffMarket.BuyOrderItem[] = [];
const buffGoodsInfo: { [goods_id: number]: BuffMarket.GoodsInfo } = {};
let buffCurrencyRate: BuffMarket.CurrencyItem | null = null;
// buffmarket: cached own user id
let buffUserId: string | null = null;

export function cacheBuffBuyOrders(data: BuffMarket.BuyOrderItem[]) {
	buffBuyOrders = data;
}

export function cacheBuffPopoutData(data: BuffMarket.ItemDetailData) {
	buffPopoutData = data;
}

export function cacheBuffUserId(id: string) {
	if (id && id.length > 0) {
		buffUserId = id;
	}
}

export function cacheBuffCurrencyRate(currencyItem: BuffMarket.CurrencyItem) {
	buffCurrencyRate = currencyItem;
}

export function cacheBuffGoodsInfos(data: { [goods_id: number]: BuffMarket.GoodsInfo }) {
	for (const key in data) {
		buffGoodsInfo[key] = data[key];
	}
}

export function cacheBuffMarketItems(data: BuffMarket.Item[]) {
	for (const item of data) {
		for (const key of getBuffItemCacheKeys(item)) {
			if (buffItems[key]) {
				buffItems[key].push(item);
			} else {
				buffItems[key] = [item];
			}
		}
	}
}

type CacheableBuffItem = BuffMarket.Item & {
	id?: number | string;
	goods_id?: number;
	market_hash_name?: string;
	asset_info?: {
		goods_id?: number;
	};
};

function getBuffItemCacheKeys(item: BuffMarket.Item): string[] {
	const cacheableItem = item as CacheableBuffItem;
	const keys = new Set<string>();

	if (typeof cacheableItem.id === 'number') {
		keys.add(getBuffItemCacheKey(cacheableItem.id));
	}
	if (cacheableItem.goods_id) {
		keys.add(getBuffItemCacheKey(cacheableItem.goods_id));
	}
	if (cacheableItem.asset_info?.goods_id) {
		keys.add(getBuffItemCacheKey(cacheableItem.asset_info.goods_id));
	}
	if (cacheableItem.market_hash_name) {
		keys.add(getBuffItemCacheKey(cacheableItem.market_hash_name));
	}

	return [...keys];
}

function getBuffItemCacheKey(identifier: number | string): string {
	return typeof identifier === 'number' ? `id:${identifier}` : `name:${identifier}`;
}

export function cacheBuffRecommendations(data: BuffMarket.Item[]) {
	console.log('Caching buff recommendations: ', data);
	buffRecommendations = data;
}

export function cacheBuffPageItems(data: BuffMarket.Item[]) {
	console.log('Caching buff page items: ', data);
	buffPageItems = data;
}

export function getFirstBuffBuyOrder() {
	return buffBuyOrders.shift();
}

export function getBuffPopoutItem() {
	return buffPopoutData?.sell_order;
}

export function getBuffUserId() {
	return buffUserId;
}

export function getBuffCurrencyRate() {
	return buffCurrencyRate;
}

export function getBuffGoodsInfo(goods_id: number) {
	return buffGoodsInfo[goods_id];
}

export function deleteBuffMarketItems() {
	buffItems = {};
}

export function getBuffMarketItem(identifier: number | string) {
	return buffItems[getBuffItemCacheKey(identifier)]?.shift();
}

export function getFirstBuffRecommendation() {
	return buffRecommendations?.shift();
}

export function getFirstBuffPageItem() {
	return buffPageItems.shift();
}
