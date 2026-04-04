import type { BuffMarket } from '~lib/@typings/BuffmarketTypes';

// buffmarket: cached items from api
let buffItems: { [id: number]: BuffMarket.Item[] } = {};
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
	if (!buffItems) {
		buffItems = {};
	}
	for (const item of data) {
		if ((<BuffMarket.MarketListing>item).id) {
			let key = 0;
			if (typeof (<BuffMarket.MarketListing>item).id === 'string') {
				key = (<any>item).asset_info.goods_id;
			} else {
				key = (<BuffMarket.MarketListing>item).id;
			}
			if (buffItems[key]) {
				buffItems[key].push(item);
			} else {
				buffItems[key] = [item];
			}
		} else if ((<BuffMarket.InventoryItem>item).goods_id) {
			if (buffItems[(<BuffMarket.InventoryItem>item).goods_id]) {
				buffItems[(<BuffMarket.InventoryItem>item).goods_id].push(item);
			} else {
				buffItems[(<BuffMarket.InventoryItem>item).goods_id] = [item];
			}
		}
	}
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
	buffItems = [];
}

export function getBuffMarketItem(id: number) {
	return buffItems[id]?.shift();
}

export function getFirstBuffRecommendation() {
	return buffRecommendations?.shift();
}

export function getFirstBuffPageItem() {
	return buffPageItems.shift();
}
