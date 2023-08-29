import { EventData, HistoryData, ListingData, SellerData, Skinport } from './@typings/FloatTypes';
import { cacheHistory, cacheItems, cacheSkinportCurrencyRates } from './mappinghandler';

type StallData = {
    listings: ListingData[];
    user: SellerData;
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
}

function processSkinportEvent(eventData: EventData<unknown>) {
    console.debug('[BetterFloat] Received data from url: ' + eventData.url + ', data:', eventData.data);
    if (eventData.url.includes('api/browse/730')) {
        // Skinport.MarketData
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
