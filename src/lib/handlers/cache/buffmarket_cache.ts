import type { BuffMarket } from '~lib/@typings/BuffmarketTypes';

// buffmarket: cached items from api
let buffItems: { [id: number]: BuffMarket.Item[] } = {};
let buffPageItems: BuffMarket.Item[] = [];
const buffGoodsInfo: { [goods_id: number]: BuffMarket.GoodsInfo } = {};
let buffCurrencyRate: BuffMarket.CurrencyItem | null = null;
// buffmarket: cached own user id
let buffUserId: string | null = null;

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
			// buffItems[(<BuffMarket.InventoryItem>item).goods_id] = item;
		}
	}
}

export function cacheBuffPageItems(data: BuffMarket.Item[]) {
	buffPageItems = data;
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
	if (buffItems[id]) {
		if (buffItems[id].length > 1) {
			return buffItems[id].shift();
		} else {
			return buffItems[id][0];
		}
	}
	return null;
}

export function getFirstBuffPageItem() {
	if (buffPageItems.length > 0) {
		const item = buffPageItems.shift();
		return item;
	} else {
		return null;
	}
}