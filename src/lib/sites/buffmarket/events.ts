import type { BuffMarket } from '~lib/@typings/BuffmarketTypes';
import type { EventData } from '~lib/@typings/FloatTypes';
import {
	cacheBuffBuyOrders,
	cacheBuffCurrencyRate,
	cacheBuffGoodsInfos,
	cacheBuffMarketItems,
	cacheBuffPageItems,
	cacheBuffPopoutData,
	cacheBuffUserId,
} from '~lib/handlers/cache/buffmarket_cache';
import { activateSiteEventHandler } from '~lib/sites/shared/events';

function processBuffMarketEvent(eventData: EventData<unknown>) {
	console.debug('[BetterFloat] Received data from url: ' + eventData.url + ', data:', eventData.data);
	if (eventData.url.includes('api/market/goods/info')) {
		cacheBuffMarketItems([(eventData.data as BuffMarket.GoodsInfoResponse).data]);
	} else if (eventData.url.includes('api/market/goods/sell_order')) {
		const responseData = (eventData.data as BuffMarket.SellOrderResponse).data;
		cacheBuffGoodsInfos(responseData.goods_infos);
		if (eventData.url.includes('goods_id=')) {
			cacheBuffPageItems(responseData.items);
		} else {
			cacheBuffMarketItems(responseData.items);
		}
	} else if (eventData.url.includes('api/market/goods/buy_order')) {
		cacheBuffBuyOrders((eventData.data as BuffMarket.BuyOrderResponse).data.items);
	} else if (eventData.url.includes('api/market/goods') && !eventData.url.includes('related_recommendation')) {
		cacheBuffMarketItems((eventData.data as BuffMarket.GoodsResponse).data.items);
	} else if (eventData.url.includes('api/market/steam_inventory')) {
		cacheBuffMarketItems((eventData.data as BuffMarket.InventoryResponse).data.items);
	} else if (eventData.url.includes('api/market/sell_order/preview/manual_plus')) {
		cacheBuffMarketItems((eventData.data as BuffMarket.SellingPreviewResponse).data.items);
		cacheBuffGoodsInfos((eventData.data as BuffMarket.SellingPreviewResponse).data.goods_infos);
	} else if (eventData.url.includes('api/market/sell_order/change_preview/v2')) {
		cacheBuffMarketItems((eventData.data as BuffMarket.SellingPreviewResponse).data.items);
		cacheBuffGoodsInfos((eventData.data as BuffMarket.SellingPreviewResponse).data.goods_infos);
	} else if (eventData.url.includes('api/market/sell_order/')) {
		cacheBuffGoodsInfos((eventData.data as BuffMarket.SellingOnSaleResponse).data.goods_infos);
		cacheBuffMarketItems((eventData.data as BuffMarket.SellingOnSaleResponse).data.items);
	} else if (eventData.url.includes('api/user/info')) {
		cacheBuffUserId((eventData.data as any).data?.user_info?.id);
	} else if (eventData.url.includes('account/api/supported_currency')) {
		const selectedCurrency = (eventData.data as BuffMarket.SupportedCurrencyResponse).data.items.find((item) => item.buff_selected);
		if (selectedCurrency) {
			cacheBuffCurrencyRate(selectedCurrency);
		}
	} else if (eventData.url.includes('api/market/shop/') && eventData.url.includes('/sell_order')) {
		cacheBuffMarketItems((eventData.data as BuffMarket.SellingOnSaleResponse).data.items);
		cacheBuffGoodsInfos((eventData.data as BuffMarket.SellingOnSaleResponse).data.goods_infos);
	} else if (eventData.url.includes('api/market/item_detail')) {
		cacheBuffPopoutData((eventData.data as BuffMarket.ItemDetailResponse).data);
	}
}

export function activateBuffmarketEventHandler() {
	activateSiteEventHandler(processBuffMarketEvent);
}
