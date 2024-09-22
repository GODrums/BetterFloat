import { handleListed, handleSold } from '~lib/helpers/websockethandler';

import { sendToBackground } from '@plasmohq/messaging';
import { adjustOfferBubbles } from '~lib/helpers/csfloat_helpers';
import { addTotalInventoryPrice } from '~lib/helpers/skinport_helpers';
import { MarketSource } from '~lib/util/globals';
import { toTitleCase } from '~lib/util/helperfunctions';
import type { IStorage } from '~lib/util/storage';
import type { CSFloat, EventData } from '../@typings/FloatTypes';
import type { Skinbid } from '../@typings/SkinbidTypes';
import type { Skinport } from '../@typings/SkinportTypes';
import {
	cacheCSFExchangeRates,
	cacheCSFHistoryGraph,
	cacheCSFHistorySales,
	cacheCSFInventory,
	cacheCSFItems,
	cacheCSFLocation,
	cacheCSFOffers,
	cacheCSFPopupItem,
	cacheCSFSimilarItems,
	cacheSkbInventory,
	cacheSkbItems,
	cacheSkinbidCurrencyRates,
	cacheSkinbidUserCurrency,
	cacheSkinportCurrencyRates,
	cacheSpItems,
	cacheSpMinOrderPrice,
	cacheSpPopupInventoryItem,
	cacheSpPopupItem,
	loadMapping,
} from './mappinghandler';
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
		const eventData = (<CustomEvent>e).detail;
		//switch depending on current site
		if (location.host === 'csfloat.com') {
			processCSFloatEvent(eventData);
		} else if (location.host === 'skinport.com') {
			processSkinportEvent(eventData);
		} else if (location.host === 'skinbid.com' || location.host === 'api.skinbid.com') {
			processSkinbidEvent(eventData);
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
	if (extensionSettings[`${prefix}-altmarket`] && extensionSettings[`${prefix}-altmarket`] !== 'none') {
		sources.add(extensionSettings[`${prefix}-altmarket`] as MarketSource);
	}
	if (extensionSettings[`${prefix}-steamsupplement`]) {
		sources.add(MarketSource.Steam);
	}
	console.log('[BetterFloat] Sources:', sources);
	console.time('[BetterFloat] PriceRefresh');
	await Promise.all(Array.from(sources).map((source) => sourceRefresh(source)));
	await Promise.all(Array.from(sources).map((source) => loadMapping(source)));
	console.timeEnd('[BetterFloat] PriceRefresh');
}

async function sourceRefresh(source: MarketSource) {
	const updateSetting = `${source}-update`;
	const storageData = await chrome.storage.local.get(updateSetting);
	const lastUpdate = storageData[updateSetting] ?? 0;
	// refresh only if prices are older than 1 hour
	if (lastUpdate < Date.now() - 1000 * 60 * 60) {
		console.debug(`[BetterFloat] ${toTitleCase(source)} prices are older than 1 hour, last update: ${new Date(lastUpdate)}. Refreshing ${toTitleCase(source)} prices...`);

		const response: { status: number } = await sendToBackground({
			name: 'refreshPrices',
			body: {
				source: source,
			},
		});

		console.debug('[BetterFloat] Prices refresh result: ', response.status);
	}
}

function processSkinbidEvent(eventData: EventData<unknown>) {
	if (!eventData.url.includes('ping')) {
		console.debug('[BetterFloat] Received data from url: ' + eventData.url + ', data:', eventData.data);
	}

	if (eventData.url.includes('api/search/auctions')) {
		// Skinbid.MarketData
		cacheSkbItems((eventData.data as Skinbid.MarketData).items);
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
		// Skinbid.Listing
		cacheSkbItems([eventData.data as Skinbid.Listing]);
	} else if (eventData.url.includes('api/public/exchangeRates')) {
		// Skinbid.ExchangeRates
		const rates = eventData.data as Skinbid.ExchangeRates;
		cacheSkinbidCurrencyRates(rates);
	} else if (eventData.url.includes('api/user/whoami')) {
		// Skinbid.UserData
	} else if (eventData.url.includes('api/user/preferences')) {
		// Skinbid.UserPreferences
		cacheSkinbidUserCurrency((eventData.data as Skinbid.UserPreferences).currency);
	} else if (eventData.url.includes('api/user/me/inventory') || eventData.url.includes('api/inventory?')) {
		// Skinbid.UserPreferences
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
	} else if (eventData.url.includes('api/data/')) {
		// Data from first page load
		const data = eventData.data as Skinport.UserData;
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
		cacheCSFItems(eventData.data as CSFloat.ListingData[]);
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
		cacheCSFExchangeRates(eventData.data as CSFloat.ExchangeRates);
	} else if (eventData.url.includes('v1/me/inventory')) {
		// user inventory
		cacheCSFInventory(eventData.data as CSFloat.InventoryReponse);
	} else if (eventData.url.includes('v1/me')) {
		// user data, repeats often
	} else if (eventData.url.includes('v1/listings/')) {
		if (eventData.url.split('/').length === 7) {
			// item popup
			cacheCSFPopupItem(eventData.data as CSFloat.ListingData);
		} else if (eventData.url.includes('/similar')) {
			// item page
			cacheCSFSimilarItems(eventData.data as CSFloat.ListingData[]);
		}
	}
}
