let lastUpdate = 0;

chrome.storage.local.get('lastUpdate', (data) => {
    if (data.lastUpdate) {
        lastUpdate = data.lastUpdate;
    }
});

// Check whether new version is installed
chrome.runtime.onInstalled.addListener(function (details) {
    if (details.reason == 'install') {
        console.log('[BetterFloat] First install of BetterFloat, enjoy the extension!');
        chrome.storage.local.set({
            buffprice: true,
            autorefresh: true,
            priceReference: 0,
            refreshInterval: 30,
            showSteamPrice: false,
            stickerPrices: true,
            showBuffDifference: true,
            showBuffPercentageDifference: false,
            listingAge: 0,
            showTopButton: true,
            skinportRates: 'real',
            spBuffPrice: true,
            spCheckBoxes: true,
            spPriceReference: 0,
            spBuffDifference: true,
            spBuffLink: 'action',
            spFloatColoring: true,
        });
    } else if (details.reason == 'update') {
        var thisVersion = chrome.runtime.getManifest().version;
        console.log('[BetterFloat] Updated from version ' + details.previousVersion + ' to ' + thisVersion + '!');
    }
});

// update every 8 hours
if (lastUpdate < Date.now() - 1000 * 60 * 60 * 8) {
    refreshPrices();

    lastUpdate = Date.now();
    chrome.storage.local.set({ lastUpdate: lastUpdate });
}

export async function refreshPrices() {
    return await fetch('https://prices.csgotrader.app/latest/prices_v6.json')
        .then((response) => response.json())
        .then(async (data) => {
            //set cookie and wait for finish
            return await new Promise<Boolean>((resolve) => {
                chrome.storage.local.set({ prices: JSON.stringify(data) }).then(() => {
                    console.log('Prices updated. Last update: ' + lastUpdate + '. Current time: ' + Date.now());
                    resolve(true);
                });
            });
        })
        .catch((err) => console.error(err));
}

// receive message from content script to re-fetch prices
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    if (request.message == 'fetchPrices') {
        refreshPrices().then((value) => {
            console.log('[BetterFloat] Prices refreshed via content script due to time limit.');
            if (value) {
                sendResponse({ message: 'Prices fetched successfully.', success: true });
            } else {
                sendResponse({ message: 'Error while fetching prices.', success: false });
            }
        });
        // this is required to let the message listener wait for the fetch to finish
        // https://github.com/mozilla/webextension-polyfill/issues/130#issuecomment-484772327
        return true;
    }
});

// Idea from: https://stackoverflow.com/a/53990245
// the WSS Skinport stream contains the LIVE feed. Does not work yet.
// chrome.webRequest.onBeforeSendHeaders.addListener(
//     (details) => {
//         const { tabId, requestId } = details;
//         console.log('[BetterFloat] Intercepted websocket request: ', details);
//         // do stuff here
//     },
//     {
//         urls: ['wss://skinport.com/socket.io/?EIO=4&transport=websocket'],
//     }
// );
