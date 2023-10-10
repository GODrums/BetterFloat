import { CSGOTraderMapping, CSFloat } from './@typings/FloatTypes';
import { Skinbid } from './@typings/SkinbidTypes';
import { Skinport } from './@typings/SkinportTypes';
import { handleSpecialStickerNames } from './util/helperfunctions';

// maps buff_name to buff_id
let buffMapping: { [name: string]: number } = {};
// maps buff_name to prices and more - from csgotrader
let priceMapping: CSGOTraderMapping = {};
// csfloat: cached items from api
let csfloatItems: CSFloat.ListingData[] = [];
// csfloat: cached popup item from api
let csfloatPopupItem: CSFloat.ListingData | null = null;
// csfloat: history graph for one item
let csfloatHistoryGraph: CSFloat.HistoryGraphData[] = [];
// csfloat: history sales for one item
let csfloatHistorySales: CSFloat.HistorySalesData[] = [];
// skinport: cached items from api
let cachedSpItems: Skinport.Item[] = [];
// skinport: cached currency rates by Skinport: USD -> X
let skinportRatesFromUSD: { [currency: string]: number } = {};
// skinport: cached currency rates by exchangerate.host: USD -> X
let realRatesFromUSD: { [currency: string]: number } = {};
// skinport: user currency (e.g. EUR)
let userCurrency = '';
// skinbid: cached items from api
let skinbidItems: Skinbid.Listing[] = [];

export async function cacheCSFHistoryGraph(data: CSFloat.HistoryGraphData[]) {
    if (csfloatHistoryGraph.length > 0) {
        console.debug('[BetterFloat] History graph already cached, deleting history: ', csfloatHistoryGraph);
        csfloatHistoryGraph = [];
    }
    // original price is in cents, convert to dollars
    csfloatHistoryGraph = data.map((history) => {
        return {
            avg_price: history.avg_price / 100,
            count: history.count,
            day: history.day,
        };
    });
}

export async function cacheCSFHistorySales(data: CSFloat.HistorySalesData[]) {
    if (csfloatHistorySales.length > 0) {
        console.debug('[BetterFloat] History sales already cached, deleting history: ', csfloatHistoryGraph);
        csfloatHistorySales = [];
    }
    // original price is in cents, convert to dollars
    csfloatHistorySales = data;
}

export async function cacheCSFItems(data: CSFloat.ListingData[]) {
    if (csfloatItems.length > 0) {
        console.debug('[BetterFloat] Items already cached, deleting items: ', csfloatItems);
        csfloatItems = [];
    }
    csfloatItems = data;
}

export async function cacheSkbItems(data: Skinbid.Listing[]) {
    if (skinbidItems.length > 0) {
        console.debug('[BetterFloat] Items already cached, deleting items: ', skinbidItems);
        skinbidItems = [];
    }
    skinbidItems = data;
}

export async function cacheCSFPopupItem(data: CSFloat.ListingData) {
    if (csfloatPopupItem) {
        // console.debug('[BetterFloat] Popup item already cached, deleting item: ', csfloatPopupItem);
        csfloatPopupItem = null;
    }
    csfloatPopupItem = data;
}

export async function cacheSpItems(data: Skinport.Item[]) {
    if (cachedSpItems.length > 0) {
        console.debug('[BetterFloat] Items already cached, deleting items: ', cachedSpItems);
        cachedSpItems = [];
    }
    cachedSpItems = data;
}

export async function cacheSkinportCurrencyRates(data: { [currency: string]: number }, user: string) {
    if (Object.keys(skinportRatesFromUSD).length > 0) {
        console.debug('[BetterFloat] Currency rates already cached, overwriting old ones: ', skinportRatesFromUSD);
    }
    skinportRatesFromUSD = data;
    userCurrency = user;
}

export async function cacheRealCurrencyRates(data: { [currency: string]: number }) {
    if (Object.keys(realRatesFromUSD).length > 0) {
        console.debug('[BetterFloat] Real currency rates already cached, overwriting old ones: ', realRatesFromUSD);
    }
    realRatesFromUSD = data;
}

export async function getWholeHistory() {
    const history = csfloatHistoryGraph;
    csfloatHistoryGraph = [];
    return history;
}

export async function getFirstHistorySale() {
    if (csfloatHistorySales.length > 0) {
        const sale = csfloatHistorySales.shift();
        return sale;
    } else {
        return null;
    }
}

export async function getFirstCSFItem() {
    if (csfloatItems.length > 0) {
        const item = csfloatItems.shift();
        return item;
    } else {
        return null;
    }
}

export async function getCSFPopupItem() {
    return csfloatPopupItem;
}

export async function getFirstSpItem() {
    if (cachedSpItems.length > 0) {
        const item = cachedSpItems.shift();
        return item;
    } else {
        return null;
    }
}

export async function getFirstSkbItem() {
    if (skinbidItems.length > 0) {
        const item = skinbidItems.shift();
        return item;
    } else {
        return null;
    }
}

export async function getPriceMapping(): Promise<{ [key: string]: any }> {
    if (Object.keys(priceMapping).length == 0) {
        await loadMapping();
    }
    return priceMapping;
}

export async function getItemPrice(buff_name: string): Promise<{ starting_at: number; highest_order: number }> {
    if (Object.keys(priceMapping).length == 0) {
        await loadMapping();
    }
    //removing double spaces
    buff_name = handleSpecialStickerNames(buff_name.replace(/\s+/g, ' '));
    if (!priceMapping[buff_name] || !priceMapping[buff_name]['buff163'] || !priceMapping[buff_name]['buff163']['starting_at'] || !priceMapping[buff_name]['buff163']['highest_order']) {
        console.log(`[BetterFloat] No price mapping found for ${buff_name}`);
        return {
            starting_at: 0,
            highest_order: 0,
        };
    }
    if (priceMapping[buff_name]) {
        return {
            starting_at: priceMapping[buff_name]['buff163']['starting_at']['price'] ?? 0,
            highest_order: priceMapping[buff_name]['buff163']['highest_order']['price'] ?? 0,
        };
    }
    return {
        starting_at: 0,
        highest_order: 0,
    };
}

export async function getUserCurrencyRate(rates: 'skinport' | 'real' = 'real') {
    if (Object.keys(skinportRatesFromUSD).length == 0) {
        await fetchUserData();
    }
    if (userCurrency == 'USD') return 1;
    if (rates == 'real' && Object.keys(realRatesFromUSD).length == 0) {
        await fetchCurrencyRates();
    }
    return rates == 'real' ? realRatesFromUSD[userCurrency] : skinportRatesFromUSD[userCurrency];
}

// this endpoint sometimes gets called by Skinport itself and provides the user data
async function fetchUserData() {
    await fetch('https://skinport.com/api/data/')
        .then((response) => response.json())
        .then((data: Skinport.UserData) => {
            console.debug('[BetterFloat] Received user data from Skinport manually: ', data);
            cacheSkinportCurrencyRates(data.rates, data.currency);
        });
}

// fetches currency rates from freecurrencyapi via my own server to avoid rate limits
// source code of the server endpoint can be found here: https://gist.github.com/GODrums/9206e8d7ff07bc548c5a28aaeb3f3e74
async function fetchCurrencyRates() {
    await fetch('https://api.rums.dev/v1/currencyrates')
        .then((response) => response.json())
        .then((data) => {
            console.debug('[BetterFloat] Received currency rates from freecurrencyapi: ', data);
            cacheRealCurrencyRates(data.rates);
        });
}

export async function getBuffMapping(name: string) {
    if (Object.keys(buffMapping).length == 0) {
        await loadBuffMapping();
    }
    if (buffMapping[name]) {
        return buffMapping[name];
    } else {
        console.log(`[BetterFloat] No buff mapping found for ${name}`);
        return 0;
    }
}

export async function loadMapping() {
    if (Object.keys(priceMapping).length == 0) {
        console.debug('[BetterFloat] Attempting to load price mapping from local storage');

        let mapping: string | null = null;

        chrome.storage.local.get('prices', (data) => {
            if (data) {
                mapping = data.prices;
            } else {
                mapping = '';
            }
        });

        // since chrome.storage.local.get is async, we might need to wait for it to finish
        let tries = 20;
        while (mapping == null && tries-- > 0) {
            await new Promise((r) => setTimeout(r, 100));
        }

        if (tries == 0) {
            console.debug('[BetterFloat] Did not receive a response from Csgotrader.');
            mapping = '';
            priceMapping = {};
        }

        if (mapping != null && mapping.length > 0) {
            priceMapping = JSON.parse(mapping);
        } else {
            console.debug('[BetterFloat] Failed. Loading price mapping from file is currently disabled.');
            return false;
            // fallback to loading older prices from file currently disabled
            // console.debug('[BetterFloat] Failed. Loading price mapping from file.');
            // let response = await fetch(runtimePublicURL + '/prices_v6.json');
            // priceMapping = await response.json();
        }
        console.debug('[BetterFloat] Price mapping successfully initialized');
    }
    return true;
}

// get mapping from rums.dev
// currently has no fallback if api is down
export async function loadBuffMapping() {
    console.debug('[BetterFloat] Attempting to load buff mapping from rums.dev');
    await fetch('https://api.rums.dev/file/buff_name_to_id')
        .then((response) => response.json())
        .then((data) => {
            buffMapping = data;
            console.debug('[BetterFloat] Buff mapping successfully loaded from rums.dev');
        })
        .catch((err) => console.error(err));
}
