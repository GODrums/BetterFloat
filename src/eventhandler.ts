import { EventData, HistoryData, ListingData, SellerData } from './@typings/FloatTypes';
import { Skinport } from './@typings/SkinportTypes';
import { cacheHistory, cacheItems, cacheSkinportCurrencyRates, loadMapping } from './mappinghandler';

type StallData = {
    listings: ListingData[];
    user: SellerData;
};

type SkinportWebsocketData = {
    eventType: string;
    data: Skinport.Item[];
};

export function activateHandler() {
    // important: https://stackoverflow.com/questions/9515704/access-variables-and-functions-defined-in-page-context-using-a-content-script/9517879#9517879
    document.addEventListener('BetterFloat_INTERCEPTED_REQUEST', function (e) {
        var eventData = (<CustomEvent>e).detail;
        //switch depending on current site
        if (window.location.href.includes('csfloat.com')) {
            processCSFloatEvent(eventData);
        } else if (window.location.href.includes('skinport.com')) {
            processSkinportEvent(eventData);
        }
    });

    document.addEventListener('BetterFloat_WEBSOCKET_EVENT', function (e) {
        var eventData = (<CustomEvent>e).detail as SkinportWebsocketData;
        if (eventData.eventType == 'listed') {
            console.debug('[BetterFloat] Received data from websocket:', eventData);
        }
        // further process data
    });

    //listener for messages from background
    chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
        if (request.message == 'refreshPrices') {
            loadMapping().then((value) => {
                if (value) {
                    console.log('[BetterFloat] Prices refreshed manually via popup.');
                    sendResponse({ message: 'Prices fetched successfully.' });
                } else {
                    console.log('[BetterFloat] Error refreshing prices manually.');
                    sendResponse({ message: 'Error while fetching prices.' });
                }
            });
        }
    });

    // refresh prices if they are older than 8 hours
    chrome.storage.local.get('lastUpdate', (result) => {
        let lastUpdate = result.lastUpdate;
        if (lastUpdate == undefined) {
            lastUpdate = 0;
        }
        // if lastUpdate is older than 8 hours, refresh prices
        if (lastUpdate < Date.now() - 1000 * 60 * 60 * 8) {
            console.debug('[BetterFloat] Prices are older than 8 hours, last update:', new Date(lastUpdate), '. Refreshing prices...');
            // send message to background to fetch and store new prices
            chrome.runtime.sendMessage({ message: 'fetchPrices' }, (response) => {
                if (!response) return;
                console.debug('[BetterFloat] Prices refresh result: ' + response.message);
                if (response.success) {
                    chrome.storage.local.set({ lastUpdate: Date.now() });
                }
            });
        }
    });
}

function processSkinportEvent(eventData: EventData<unknown>) {
    console.debug('[BetterFloat] Received data from url: ' + eventData.url + ', data:', eventData.data);
    if (eventData.url.includes('api/browse/730')) {
        // Skinport.MarketData
    } else if (eventData.url.includes('api/home')) {
        // Skinport.HomeData
    } else if (eventData.url.includes('api/data/')) {
        // Data from first page load
        let data = eventData.data as Skinport.UserData;
        cacheSkinportCurrencyRates(data.rates, data.currency);
    }
}

// process intercepted data
function processCSFloatEvent(eventData: EventData<unknown>) {
    console.debug('[BetterFloat] Received data from url: ' + eventData.url + ', data:', eventData.data);
    if (eventData.url.includes('v1/listings?')) {
        cacheItems(eventData.data as ListingData[]);
    } else if (eventData.url.includes('v1/listings/recommended')) {
        // recommended for you tab
        cacheItems(eventData.data as ListingData[]);
    } else if (eventData.url.includes('v1/listings/unique-items')) {
        // unique items tab
        cacheItems(eventData.data as ListingData[]);
    } else if (eventData.url.includes('v1/me/watchlist')) {
        // own watchlist
        cacheItems(eventData.data as ListingData[]);
    } else if (eventData.url.includes('v1/me/listings')) {
        // own stall
        cacheItems(eventData.data as ListingData[]);
    } else if (eventData.url.includes('v1/users/')) {
        // url schema: v1/users/[:userid]
        // sellers stall, gives StallData
        cacheItems((eventData.data as StallData).listings);
    } else if (eventData.url.includes('v1/history/')) {
        // item history, gets called on item popup
        cacheHistory(eventData.data as HistoryData[]);
    } else if (eventData.url.includes('v1/me')) {
    } else if (eventData.url.includes('v1/listings/')) {
        // item popup
    }
}
