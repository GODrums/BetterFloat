import { EventData, CSFloat } from './@typings/FloatTypes';
import { Skinbid } from './@typings/SkinbidTypes';
import { Skinport } from './@typings/SkinportTypes';
import {
    cacheCSFHistoryGraph,
    cacheCSFHistorySales,
    cacheCSFItems,
    cacheCSFPopupItem,
    cacheSkbItems,
    cacheSkinportCurrencyRates,
    cacheSkinbidCurrencyRates,
    loadMapping,
    cacheSkinbidUserCurrency,
    cacheSpItems,
    cacheSpPopupItem,
    cacheSpMinOrderPrice,
    cacheCSFLocation,
    cacheCSFExchangeRates,
} from './mappinghandler';
import { handleListed, handleSold } from './skinport/websockethandler';

type StallData = {
    data: CSFloat.ListingData[];
};

type SkinportWebsocketData = {
    eventType: string;
    data: Skinport.Item[];
};

export function activateHandler() {
    // important: https://stackoverflow.com/questions/9515704/access-variables-and-functions-defined-in-page-context-using-a-content-script/9517879#9517879
    document.addEventListener('BetterFloat_INTERCEPTED_REQUEST', function (e) {
        const eventData = (<CustomEvent>e).detail;
        //switch depending on current site
        if (location.href.includes('csfloat.com')) {
            processCSFloatEvent(eventData);
        } else if (location.href.includes('skinport.com')) {
            processSkinportEvent(eventData);
        } else if (location.href.includes('skinbid.com')) {
            processSkinbidEvent(eventData);
        }
    });

    document.addEventListener('BetterFloat_WEBSOCKET_EVENT', async function (e) {
        const eventData = (<CustomEvent>e).detail as SkinportWebsocketData;
        if (eventData.eventType == 'listed') {
            // console.debug('[BetterFloat] Received data from websocket "listed":', eventData);
            await handleListed(eventData.data);
        } else if (eventData.eventType == 'sold') {
            // console.debug('[BetterFloat] Received data from websocket "sold":', eventData);
            await handleSold(eventData.data);
        }
    });

    //listener for messages from background
    chrome.runtime.onMessage.addListener((request, _sender, sendResponse) => {
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

    // refresh prices if they are older than 1 hour
    chrome.storage.local.get('lastUpdate', (result) => {
        let lastUpdate = result.lastUpdate;
        if (lastUpdate == undefined) {
            lastUpdate = 0;
        }
        // if lastUpdate is older than 1 hour, refresh prices
        if (lastUpdate < Date.now() - 1000 * 60 * 60) {
            console.debug('[BetterFloat] Prices are older than 1 hour, last update:', new Date(lastUpdate), '. Refreshing prices...');
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

    chrome.storage.local.get('displayUpdateMessage', (result) => {
        let displayUpdateMessage = result.displayUpdateMessage as boolean;
        if (displayUpdateMessage == undefined) {
            displayUpdateMessage = true;
        }
        if (displayUpdateMessage) {
            const popup = `<div class="snow" id="BetterFloatUpdateMessage" style="position: fixed;bottom: 0;right: 0;width: 500px;height: 210px;background-color: #303030;border-radius: 20px;border: 1px solid gray;color: white;font-weight: bold;text-align: center;padding: 5px;z-index: 1000;margin: 20px 40px;">
            <h2 style="font-weight: bold;margin-block-start: 0.83em;margin-block-end: 0.83em;"><span style="background: linear-gradient(to right, #FF782C 0%, #5865f2 100%); -webkit-background-clip: text; -webkit-text-fill-color: transparent;">BetterFloat</span> has received a winter update!</h2><div style="display: flex;align-items: center;justify-content: center;"><svg xmlns="http://www.w3.org/2000/svg" width="42" height="42" viewBox="0 0 256 256"><g fill="#ff5a00"><path d="M208 144a80 80 0 0 1-160 0c0-30.57 14.42-58.26 31-80l33 32l26.27-72C159.86 41.92 208 88.15 208 144" opacity=".2"></path><path d="M183.89 153.34a57.6 57.6 0 0 1-46.56 46.55a8.75 8.75 0 0 1-1.33.11a8 8 0 0 1-1.32-15.89c16.57-2.79 30.63-16.85 33.44-33.45a8 8 0 0 1 15.78 2.68ZM216 144a88 88 0 0 1-176 0c0-27.92 11-56.47 32.66-84.85a8 8 0 0 1 11.93-.89l24.12 23.41l22-60.41a8 8 0 0 1 12.63-3.41C165.21 36 216 84.55 216 144m-16 0c0-46.09-35.79-85.92-58.21-106.33l-22.27 61.07a8 8 0 0 1-13.09 3L80.06 76.16C64.09 99.21 56 122 56 144a72 72 0 0 0 144 0"></path></g></svg><p style="color: rgb(255, 120, 44);">You can expect more accurate prices!</p></div><a href="https://discord.gg/VQWXp33nSW" target="_blank"><div style="display: flex;justify-content: center;align-items: center;gap: 10px;"><svg xmlns="http://www.w3.org/2000/svg" width="40" height="31.1" viewBox="0 0 256 199"><path fill="#5865F2" d="M216.856 16.597A208.502 208.502 0 0 0 164.042 0c-2.275 4.113-4.933 9.645-6.766 14.046c-19.692-2.961-39.203-2.961-58.533 0c-1.832-4.4-4.55-9.933-6.846-14.046a207.809 207.809 0 0 0-52.855 16.638C5.618 67.147-3.443 116.4 1.087 164.956c22.169 16.555 43.653 26.612 64.775 33.193A161.094 161.094 0 0 0 79.735 175.3a136.413 136.413 0 0 1-21.846-10.632a108.636 108.636 0 0 0 5.356-4.237c42.122 19.702 87.89 19.702 129.51 0a131.66 131.66 0 0 0 5.355 4.237a136.07 136.07 0 0 1-21.886 10.653c4.006 8.02 8.638 15.67 13.873 22.848c21.142-6.58 42.646-16.637 64.815-33.213c5.316-56.288-9.08-105.09-38.056-148.36M85.474 135.095c-12.645 0-23.015-11.805-23.015-26.18s10.149-26.2 23.015-26.2c12.867 0 23.236 11.804 23.015 26.2c.02 14.375-10.148 26.18-23.015 26.18m85.051 0c-12.645 0-23.014-11.805-23.014-26.18s10.148-26.2 23.014-26.2c12.867 0 23.236 11.804 23.015 26.2c0 14.375-10.148 26.18-23.015 26.18"></path></svg><p style="color: #5865f2;">Join our new Discord server for exclusive features!</p></div></a><button id="BetterFloatUpdateMessageClose" style="font-weight: 700;color: white;background-color: #1565c0;box-shadow: 0 3px 1px -2px #0003, 0 2px 2px #00000024, 0 1px 5px #0000001f;box-sizing: border-box;position: relative;-webkit-user-select: none;-moz-user-select: none;user-select: none;cursor: pointer;outline: none;border: none;-webkit-tap-highlight-color: transparent;display: inline-block;white-space: nowrap;text-decoration: none;vertical-align: baseline;text-align: center;margin: 0;min-width: 64px;line-height: 36px;padding: 0 16px;border-radius: 4px;overflow: visible;transform: translate3d(0, 0, 0);transition: background 400ms cubic-bezier(0.25, 0.8, 0.25, 1),box-shadow 280ms cubic-bezier(0.4, 0, 0.2, 1);">Close</button></div>`;
            document.body.firstElementChild?.insertAdjacentHTML('beforeend', popup);
            document.getElementById('BetterFloatUpdateMessageClose')?.addEventListener('click', () => {
                document.getElementById('BetterFloatUpdateMessage')?.remove();
                chrome.storage.local.set({ displayUpdateMessage: false });
            });
        }
    });
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
    }
}

function processSkinportEvent(eventData: EventData<unknown>) {
    console.debug('[BetterFloat] Received data from url: ' + eventData.url + ', data:', eventData.data);
    if (eventData.url.includes('api/browse/730')) {
        // Skinport.MarketData
        cacheSpItems((eventData.data as Skinport.MarketData).items);
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
    } else if (eventData.url.includes('v1/me')) {
        // user data, repeats often
    } else if (eventData.url.includes('v1/listings/') && eventData.url.split('/').length == 7) {
        // item popup
        cacheCSFPopupItem(eventData.data as CSFloat.ListingData);
    }
}
