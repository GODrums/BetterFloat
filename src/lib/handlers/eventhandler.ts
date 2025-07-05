import { sendToBackground } from '@plasmohq/messaging';
import type { Avanmarket } from '~lib/@typings/AvanTypes';
import type { Bitskins } from '~lib/@typings/BitskinsTypes';
import type { BuffMarket } from '~lib/@typings/BuffmarketTypes';
import type { CSMoney } from '~lib/@typings/CsmoneyTypes';
import type { DMarket } from '~lib/@typings/DMarketTypes';
import type { Shadowpay } from '~lib/@typings/ShadowpayTypes';
import type { Skinbaron } from '~lib/@typings/SkinbaronTypes';
import type { Skinout } from '~lib/@typings/SkinoutTypes';
import type { Skinsmonkey } from '~lib/@typings/Skinsmonkey';
import type { Tradeit } from '~lib/@typings/TradeitTypes';
import type { Waxpeer } from '~lib/@typings/WaxpeerTypes';
import type { WhiteMarket } from '~lib/@typings/WhitemarketTypes';
import { adjustOfferBubbles } from '~lib/helpers/csfloat_helpers';
import { addTotalInventoryPrice } from '~lib/helpers/skinport_helpers';
import { handleListed, handleSold } from '~lib/helpers/websockethandler';
import { MarketSource } from '~lib/util/globals';
import { toTitleCase } from '~lib/util/helperfunctions';
import { getSetting, type IStorage } from '~lib/util/storage';
import type { CSFloat, EventData } from '../@typings/FloatTypes';
import type { Skinbid } from '../@typings/SkinbidTypes';
import type { Skinport } from '../@typings/SkinportTypes';
import { cacheAvanmarketInventory, cacheAvanmarketItems } from './cache/avan_cache';
import { cacheBitskinsCurrencyList, cacheBitskinsItems, cacheBitskinsPopoutItem } from './cache/bitskins_cache';
import { cacheBuffBuyOrders, cacheBuffCurrencyRate, cacheBuffGoodsInfos, cacheBuffMarketItems, cacheBuffPageItems, cacheBuffPopoutData, cacheBuffUserId } from './cache/buffmarket_cache';
import {
	cacheCSFBuyOrders,
	cacheCSFExchangeRates,
	cacheCSFHistoryGraph,
	cacheCSFHistorySales,
	cacheCSFInventory,
	cacheCSFItems,
	cacheCSFLocation,
	cacheCSFOffers,
	cacheCSFPopupItem,
	cacheCSFSimilarItems,
} from './cache/csfloat_cache';
import { cacheCSMoneyBotInventory, cacheCSMoneyItems, cacheCSMoneyPopupItem, cacheCSMoneyUserInventory } from './cache/csmoney_cache';
import { cacheDMarketExchangeRates, cacheDMarketItems, cacheDMarketLatestSales } from './cache/dmarket_cache';
import { cacheShadowpayInventory, cacheShadowpayItems } from './cache/shadowpay_cache';
import { cacheSkinbaronItems, cacheSkinbaronRates } from './cache/skinbaron_cache';
import { cacheSkbInventory, cacheSkbItems, cacheSkinbidCurrencyRates, cacheSkinbidUserCurrency } from './cache/skinbid_cache';
import { cacheSkinoutItems, cacheSkinoutUserInventory } from './cache/skinout_cache';
import { cacheSkinportCurrencyRates, cacheSpItems, cacheSpMinOrderPrice, cacheSpPopupInventoryItem, cacheSpPopupItem } from './cache/skinport_cache';
import { cacheSkinsmonkeyBotInventory, cacheSkinsmonkeyUserInventory } from './cache/skinsmonkey_cache';
import { cacheSwapggCurrencyRates } from './cache/swapgg_cache';
import { cacheTradeitBotItems, cacheTradeitOwnItems } from './cache/tradeit_cache';
import { cacheWaxpeerItems } from './cache/waxpeer_cache';
import { cacheWhiteMarketInventory, cacheWhiteMarketItems } from './cache/whitemarket_cache';
import { loadMapping } from './mappinghandler';
import { urlHandler } from './urlhandler';

type StallData = {
	data: CSFloat.ListingData[];
};

type SkinportWebsocketData = {
	eventType: string;
	data: Skinport.Item[];
};

export async function activateHandler() {
	// important: https://stackoverflow.com/questions/9515704/access-variables-and-functions-defined-in-page-context-using-a-content-script/9517879#9517879
	document.addEventListener('BetterFloat_INTERCEPTED_REQUEST', (e) => {
		const eventData = (<CustomEvent>e).detail as EventData<unknown>;
		//switch depending on current site
		if (location.host === 'csfloat.com') {
			processCSFloatEvent(eventData);
		} else if (location.host === 'skinport.com') {
			processSkinportEvent(eventData);
		} else if (location.host === 'skinbid.com' || location.host === 'api.skinbid.com') {
			processSkinbidEvent(eventData);
		} else if (location.host === 'buff.market') {
			processBuffMarketEvent(eventData);
		} else if (location.host === 'cs.money') {
			processCSMoneyEvent(eventData);
		} else if (location.host === 'dmarket.com') {
			processDmarketEvent(eventData);
		} else if (location.host === 'skinbaron.de') {
			processSkinbaronEvent(eventData);
		} else if (location.host === 'bitskins.com') {
			processBitskinsEvent(eventData);
		} else if (location.host === 'shadowpay.com') {
			processShadowpayEvent(eventData);
		} else if (location.host === 'waxpeer.com') {
			processWaxpeerEvent(eventData);
		} else if (location.host === 'market.csgo.com') {
			processMarketCSGOEvent(eventData);
		} else if (location.href.includes('swap.gg')) {
			processSwapggEvent(eventData);
		} else if (location.host === 'white.market') {
			processWhiteMarketEvent(eventData);
		} else if (location.host === 'tradeit.gg') {
			processTradeitEvent(eventData);
		} else if (location.host === 'avan.market') {
			processAvanmarketEvent(eventData);
		} else if (location.host === 'skinsmonkey.com') {
			processSkinsmonkeyEvent(eventData);
		} else if (location.host === 'skinout.gg') {
			processSkinoutEvent(eventData);
		}
	});

	if (location.host === 'skinport.com') {
		document.addEventListener('BetterFloat_WEBSOCKET_EVENT', async (e) => {
			const eventData = (<CustomEvent>e).detail as SkinportWebsocketData;
			// console.debug('[BetterFloat] Received data from websocket:', eventData);
			if (eventData.eventType === 'listed') {
				await handleListed(eventData.data);
			} else if (eventData.eventType === 'sold') {
				await handleSold(eventData.data);
			}
		});
	}

	urlHandler();
}

export async function initPriceMapping(extensionSettings: IStorage, prefix: string) {
	const sources = new Set<MarketSource>();
	sources.add(extensionSettings[`${prefix}-pricingsource`] as MarketSource);
	if (
		extensionSettings[`${prefix}-altmarket`] &&
		extensionSettings[`${prefix}-altmarket`] !== 'none' &&
		[MarketSource.Buff, MarketSource.Steam].includes(extensionSettings[`${prefix}-pricingsource`])
	) {
		sources.add(extensionSettings[`${prefix}-altmarket`] as MarketSource);
	}
	if (extensionSettings[`${prefix}-steamsupplement`]) {
		sources.add(MarketSource.Steam);
	}
	console.log('[BetterFloat] Sources:', sources);
	console.time('[BetterFloat] PriceRefresh');
	await Promise.all(Array.from(sources).map((source) => sourceRefresh(source, extensionSettings.user?.steam?.steamid)));
	await Promise.all(Array.from(sources).map((source) => loadMapping(source)));
	console.timeEnd('[BetterFloat] PriceRefresh');
}

export async function sourceRefresh(source: MarketSource, steamId: string | null = null) {
	const updateSetting = `${source}-update`;
	const storageData = await chrome.storage.local.get(updateSetting);
	const lastUpdate = storageData[updateSetting] ?? 0;
	const hasProPlan = (await getSetting<IStorage['user']>('user'))?.plan?.type === 'pro';
	const refreshIntervalPlan = hasProPlan ? 1 : 2;
	// refresh only if prices are older than 1 hour
	if (lastUpdate < Date.now() - 1000 * 60 * 60 * refreshIntervalPlan) {
		console.debug(`[BetterFloat] ${toTitleCase(source)} prices are older than ${refreshIntervalPlan} hour(s), last update: ${new Date(lastUpdate)}. Refreshing ${toTitleCase(source)} prices...`);

		const response: { status: number } = await sendToBackground({
			name: 'refreshPrices',
			body: {
				source: source,
				steamId: steamId,
			},
		});

		console.debug('[BetterFloat] Prices refresh result: ', response.status);
	}
}

function processSkinoutEvent(eventData: EventData<unknown>) {
	console.debug('[BetterFloat] Received data from url: ' + eventData.url + ', data:', eventData.data);
	if (eventData.url.includes('api/market/items')) {
		cacheSkinoutItems(eventData.data as Skinout.MarketItemsResponse);
	} else if (eventData.url.includes('api/sell/inventory')) {
		cacheSkinoutUserInventory(eventData.data as Skinout.InventoryResponse);
	}
}

function processSkinsmonkeyEvent(eventData: EventData<unknown>) {
	console.debug('[BetterFloat] Received data from url: ' + eventData.url + ', data:', eventData.data);
	if (eventData.url.includes('api/inventory/user')) {
		cacheSkinsmonkeyUserInventory(eventData.data as Skinsmonkey.InventoryResponse);
	} else if (eventData.url.includes('api/inventory?')) {
		cacheSkinsmonkeyBotInventory(eventData.data as Skinsmonkey.InventoryResponse);
	}
}

function processAvanmarketEvent(eventData: EventData<unknown>) {
	console.debug('[BetterFloat] Received data from url: ' + eventData.url + ', data:', eventData.data);
	if (eventData.url.includes('v1/api/users/catalog')) {
		cacheAvanmarketItems((eventData.data as Avanmarket.CatalogResponse).data);
	} else if (eventData.url.includes('v1/api/users/inventory')) {
		cacheAvanmarketInventory(eventData.data as Avanmarket.InventoryResponse);
	}
}

// whitemarket uses a graphql api, so we need to handle it differently
function processWhiteMarketEvent(eventData: EventData<unknown>) {
	console.debug(`[Plasmo] Received data from url: ${eventData.url}, data:`, eventData.data);

	if (!eventData.url.includes('graphql/api')) {
		return;
	}

	const responseData = (eventData.data as any).data as any;

	if (responseData.market_list) {
		const items = (responseData as WhiteMarket.MarketListResponse).market_list.edges.map((edge) => edge.node);
		cacheWhiteMarketItems(items);
	} else if (responseData.inventory_my) {
		const items = (responseData as WhiteMarket.InventoryMyResponse).inventory_my.edges.map((edge) => edge.node);
		cacheWhiteMarketInventory(items);
	} else if (responseData.market_my) {
		const items = (responseData as WhiteMarket.MarketMyResponse).market_my.edges.map((edge) => edge.node);
		cacheWhiteMarketItems(items);
	} else if (responseData.instant_sell_list) {
		const items = (responseData as WhiteMarket.InstantSellListResponse).instant_sell_list.items.edges.map((edge) => edge.node.item).filter((item) => item !== undefined);
		cacheWhiteMarketInventory(items);
	}
}

function processSwapggEvent(eventData: EventData<unknown>) {
	console.debug('[BetterFloat] Received data from url: ' + eventData.url + ', data:', eventData.data);
	if (eventData.url.includes('v2/currency')) {
		cacheSwapggCurrencyRates((eventData.data as any).result);
	}
}

function processMarketCSGOEvent(eventData: EventData<unknown>) {
	console.debug('[BetterFloat] Received data from url: ' + eventData.url + ', data:', eventData.data);
}

function processShadowpayEvent(eventData: EventData<unknown>) {
	console.debug('[BetterFloat] Received data from url: ' + eventData.url + ', data:', eventData.data);
	if (eventData.url.includes('api/market/get_items')) {
		cacheShadowpayItems((eventData.data as Shadowpay.MarketGetItemsResponse).items);
	} else if (eventData.url.includes('api/market/inventory')) {
		cacheShadowpayInventory((eventData.data as Shadowpay.InventoryResponse).inv);
	}
}

function processWaxpeerEvent(eventData: EventData<unknown>) {
	console.debug('[BetterFloat] Received data from url: ' + eventData.url + ', data:', eventData.data);
	if (eventData.url.includes('api/data/index/')) {
		cacheWaxpeerItems((eventData.data as Waxpeer.MarketData).items);
	}
}

function processTradeitEvent(eventData: EventData<unknown>) {
	// console.debug('[BetterFloat] Received data from url: ' + eventData.url + ', data:', eventData.data);
	if (eventData.url.includes('api/v2/inventory/data')) {
		// trade page. Bots inventory
		console.debug('[BetterFloat] Received data from url: ' + eventData.url + ', data:', eventData.data);
		cacheTradeitBotItems([...(eventData.data as Tradeit.BotDataResponse).items]);
	} else if (eventData.url.includes('api/v2/inventory/my/data')) {
		// own inventory
		console.debug('[BetterFloat] Received data from url: ' + eventData.url + ', data:', eventData.data);
		cacheTradeitOwnItems((eventData.data as Tradeit.OwnInventoryResponse).items);
	}
}

function processBitskinsEvent(eventData: EventData<unknown>) {
	console.debug('[BetterFloat] Received data from url: ' + eventData.url + ', data:', eventData.data);
	if (eventData.url.includes('market/search/')) {
		if (eventData.url.includes('/730')) {
			cacheBitskinsItems((eventData.data as Bitskins.MarketSearch).list);
		} else if (eventData.url.includes('/get')) {
			cacheBitskinsPopoutItem(eventData.data as Bitskins.PopoutItem);
		}
	} else if (eventData.url.includes('config/currency/get')) {
		cacheBitskinsCurrencyList(eventData.data as Bitskins.CurrencyList);
	}
}

function processSkinbidEvent(eventData: EventData<unknown>) {
	if (!eventData.url.includes('ping')) {
		console.debug('[BetterFloat] Received data from url: ' + eventData.url + ', data:', eventData.data);
	}

	if (eventData.url.includes('api/search/auctions')) {
		cacheSkbItems((eventData.data as Skinbid.MarketData).items);
	} else if (eventData.url.includes('api/search/similar')) {
		cacheSkbItems(eventData.data as Skinbid.Listing[]);
	} else if (eventData.url.includes('api/auction/itemInventoryStatus')) {
		// content: { cachedResult: boolean, inSellerInventory: boolean }
	} else if (eventData.url.includes('api/auction/shop')) {
		// shop data
		if (eventData.url.includes('/data')) {
			// Skinbid.ShopData
		} else {
			cacheSkbItems((eventData.data as Skinbid.MarketData).items);
		}
	} else if (eventData.url.includes('api/auction/')) {
		cacheSkbItems([eventData.data as Skinbid.Listing]);
	} else if (eventData.url.includes('api/public/exchangeRates')) {
		const rates = eventData.data as Skinbid.ExchangeRates;
		cacheSkinbidCurrencyRates(rates);
	} else if (eventData.url.includes('api/user/whoami')) {
		cacheSkinbidUserCurrency((eventData.data as Skinbid.UserData).preferences?.currency);
	} else if (eventData.url.includes('api/user/preferences')) {
		cacheSkinbidUserCurrency((eventData.data as Skinbid.UserPreferences).currency);
	} else if (eventData.url.includes('api/inventory/personal') || eventData.url.includes('api/inventory/bots')) {
		cacheSkbInventory((eventData.data as Skinbid.Inventory).items);
	}
}

function processSkinportEvent(eventData: EventData<unknown>) {
	console.debug('[BetterFloat] Received data from url: ' + eventData.url + ', data:', eventData.data);
	if (eventData.url.includes('api/browse/730')) {
		// Skinport.MarketData
		cacheSpItems((eventData.data as Skinport.MarketData).items);
	} else if (eventData.url.includes('api/item/inventory')) {
		cacheSpPopupInventoryItem(eventData.data as Skinport.InventoryItem);
	} else if (eventData.url.includes('api/item')) {
		// Skinport.ItemData
		cacheSpPopupItem(eventData.data as Skinport.ItemData);
	} else if (eventData.url.includes('api/home')) {
		// Skinport.HomeData
		const data = eventData.data as Skinport.HomeData;
		cacheSpItems([...data.sales[0].items]);
	} else if (eventData.url.includes('api/data/')) {
		// Data from first page load
		const data = eventData.data as Skinport.UserData;
		localStorage.setItem('userData', JSON.stringify(data));
		cacheSkinportCurrencyRates(data.rates, data.currency);
		cacheSpMinOrderPrice(data.limits.minOrderValue);
	} else if (eventData.url.includes('api/inventory/listed')) {
		const items = (eventData.data as Skinport.InventoryListed).items.map((x) => x);
		cacheSpItems(items);
		addTotalInventoryPrice(eventData.data as Skinport.InventoryListed);
	} else if (eventData.url.includes('api/inventory/account')) {
		const items = (eventData.data as Skinport.InventoryAccount).items.map((x) => x);
		cacheSpItems(items);
		addTotalInventoryPrice(eventData.data as Skinport.InventoryAccount);
	} else if (eventData.url.includes('api/inventory/followed')) {
		document.querySelector('.betterfloat-totalbuffprice')?.remove();
	}
}

// process intercepted data
function processCSFloatEvent(eventData: EventData<unknown>) {
	console.debug('[BetterFloat] Received data from url: ' + eventData.url + ', data:', eventData.data);

	if (eventData.url.includes('v1/listings?')) {
		cacheCSFItems((eventData.data as CSFloat.ListingsResponse).data);
	} else if (eventData.url.includes('v1/listings/recommended')) {
		// recommended for you tab
		cacheCSFItems(eventData.data as CSFloat.ListingData[]);
	} else if (eventData.url.includes('v1/listings/unique-items')) {
		// unique items tab
		cacheCSFItems(eventData.data as CSFloat.ListingData[]);
	} else if (eventData.url.includes('v1/me/watchlist')) {
		// own watchlist
		cacheCSFItems((eventData.data as CSFloat.WatchlistData).data);
	} else if (eventData.url.includes('v1/me/listings')) {
		// own stall
		cacheCSFItems(eventData.data as CSFloat.ListingData[]);
	} else if (eventData.url.includes('v1/me/offers-timeline')) {
		// /profile/offers
		cacheCSFOffers((eventData.data as CSFloat.OffersTimeline).offers);
	} else if (eventData.url.includes('v1/offers/')) {
		adjustOfferBubbles(eventData.data as CSFloat.Offer[]);
	} else if (eventData.url.includes('v1/users/') && eventData.url.includes('/stall')) {
		// url schema: v1/users/[:userid]/stall
		cacheCSFItems((eventData.data as StallData).data);
	} else if (eventData.url.includes('v1/history/')) {
		// item history, gets called on item popup
		if (eventData.url.includes('/graph')) {
			cacheCSFHistoryGraph(eventData.data as CSFloat.HistoryGraphData[]);
		} else if (eventData.url.includes('/sales')) {
			// item table - last sales
			cacheCSFHistorySales(eventData.data as CSFloat.HistorySalesData[]);
		}
	} else if (eventData.url.includes('v1/meta/location')) {
		cacheCSFLocation(eventData.data as CSFloat.Location);
	} else if (eventData.url.includes('v1/meta/exchange-rates')) {
		const currencyRates = eventData.data as CSFloat.ExchangeRates;
		cacheCSFExchangeRates(currencyRates);
		localStorage.setItem('currency_rates', JSON.stringify(currencyRates.data));
	} else if (eventData.url.includes('v1/me/inventory')) {
		// user inventory
		cacheCSFInventory(eventData.data as CSFloat.InventoryReponse);
	} else if (eventData.url.includes('v1/me')) {
		// user data, repeats often
	} else if (eventData.url.includes('v1/listings/')) {
		if (eventData.url.includes('/similar')) {
			// item page
			cacheCSFSimilarItems(eventData.data as CSFloat.ListingData[]);
		} else if (eventData.url.includes('/buy-orders')) {
			// buy orders
			cacheCSFBuyOrders(eventData.data as CSFloat.BuyOrderData[]);
		} else if (eventData.url.split('/').length === 7) {
			// item popup
			cacheCSFPopupItem(eventData.data as CSFloat.ListingData);
		}
	}
}

// process intercepted data
function processBuffMarketEvent(eventData: EventData<unknown>) {
	console.debug('[BetterFloat] Received data from url: ' + eventData.url + ', data:', eventData.data);
	if (eventData.url.includes('api/market/goods/info')) {
		// item lists: https://buff.market/market/goods/91?game=csgo
		// caching item just for the name
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

function processCSMoneyEvent(eventData: EventData<unknown>) {
	// if (!eventData.url.includes('notifications')) {
	// 	console.debug('[BetterFloat] Received data from url: ' + eventData.url + ', data:', eventData.data);
	// }
	if (!eventData.data || (typeof eventData.data !== 'object' && !Object.hasOwn(eventData.data, 'error'))) {
		console.error('[BetterFloat] Error:', eventData.data);
		return;
	}

	if (eventData.url.includes('1.0/market/sell-orders/')) {
		// item popup
		cacheCSMoneyPopupItem((eventData.data as CSMoney.SingleSellOrderResponse).item);
	} else if (eventData.url.includes('1.0/market/sell-orders')) {
		cacheCSMoneyItems((eventData.data as CSMoney.SellOrderResponse).items);
	} else if (eventData.url.includes('2.0/market/sell-orders')) {
		cacheCSMoneyItems((eventData.data as CSMoney.SellOrderResponse).items);
	} else if (eventData.url.includes('market/user-inventory')) {
		if (eventData.url.includes('user-inventory/')) {
			cacheCSMoneyPopupItem((eventData.data as CSMoney.UserInventoryPopupResponse).item);
		} else {
			cacheCSMoneyItems((eventData.data as CSMoney.UserInventoryResponse).items);
		}
	} else if (eventData.url.includes('/load_user_inventory/730')) {
		cacheCSMoneyUserInventory((eventData.data as CSMoney.UserInventoryResponse).items);
	} else if (eventData.url.includes('/load_bots_inventory/730')) {
		cacheCSMoneyBotInventory((eventData.data as CSMoney.UserInventoryResponse).items);
	}
}

function processDmarketEvent(eventData: EventData<unknown>) {
	console.debug('[BetterFloat] Received data from url: ' + eventData.url + ', data:', eventData.data);
	if (eventData.url.includes('exchange/v1/market/items')) {
		cacheDMarketItems((eventData.data as DMarket.ExchangeMarket).objects);
	} else if (eventData.url.includes('exchange/v1/user/items')) {
		cacheDMarketItems((eventData.data as DMarket.ExchangeMarket).objects);
	} else if (eventData.url.includes('exchange/v1/selection/item?')) {
		cacheDMarketItems((eventData.data as DMarket.ExchangeMarket).objects);
	} else if (eventData.url.includes('exchange/v1/user/offers?')) {
		cacheDMarketItems((eventData.data as DMarket.ExchangeMarket).objects);
	} else if (eventData.url.includes('currency-rate/v1/rates')) {
		cacheDMarketExchangeRates((eventData.data as DMarket.ExchangeRates).Rates);
	} else if (eventData.url.includes('trade-aggregator/v1/last-sales')) {
		cacheDMarketLatestSales((eventData.data as DMarket.LatestSalesResponse).sales);
	}
}

function processSkinbaronEvent(eventData: EventData<unknown>) {
	console.debug(`[BetterFloat] Received data from url: ${eventData.url}, data:`, eventData.data);
	if (eventData.url.includes('appId=') && !eventData.url.includes('appId=730')) {
		console.debug('[BetterFloat] Skinbaron: Ignoring non-csgo request');
		return;
	}
	if (eventData.url.includes('api/v2/Browsing/FilterOffers')) {
		// Skinbaron.FilterOffers
		cacheSkinbaronItems((eventData.data as Skinbaron.FilterOffers).aggregatedMetaOffers);
	} else if (eventData.url.includes('api/v2/PromoOffers')) {
		// Skinbaron.PromoOffers
		cacheSkinbaronItems((eventData.data as Skinbaron.PromoOffers).bestDeals.aggregatedMetaOffers);
	} else if (eventData.url.includes('api/v2/Application/ExchangeRates')) {
		cacheSkinbaronRates(eventData.data as { [key: string]: number });
	}
}
