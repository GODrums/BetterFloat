import { ExtensionSettings } from './@typings/FloatTypes';

const defaultSettings: ExtensionSettings = {
    enableCSFloat: true,
    autorefresh: true,
    priceReference: 0,
    refreshInterval: 30,
    showSteamPrice: false,
    stickerPrices: true,
    showBuffDifference: true,
    showBuffPercentageDifference: false,
    listingAge: 0,
    showTopButton: true,
    useTabStates: true,
    enableSkinport: true,
    spCheckBoxes: true,
    spStickerPrices: true,
    spPriceReference: 0,
    skinportRates: 'real',
    spSteamPrice: false,
    spBuffDifference: true,
    spBuffLink: 'action',
    spFloatColoring: true,
    spFilter: {
        priceLow: 0,
        priceHigh: 999999,
        name: '',
        types: [],
    },
    enableSkinbid: true,
    skbPriceReference: 0,
    skbBuffDifference: true,
    skbListingAge: true,
    skbStickerPrices: true,
};

// Check whether new version is installed
chrome.runtime.onInstalled.addListener(function (details) {
    if (details.reason == 'install') {
        console.log('[BetterFloat] First install of BetterFloat, enjoy the extension!');
        chrome.storage.local.set(defaultSettings);
    } else if (details.reason == 'update') {
        const thisVersion = chrome.runtime.getManifest().version;
        console.log('[BetterFloat] Updated from version ' + details.previousVersion + ' to ' + thisVersion + '!');
        chrome.storage.local.get((data) => {
            if (!data) {
                console.log('[BetterFloat] No settings found, setting default settings.');
                chrome.storage.local.set(defaultSettings);
                return;
            }
            const storedSettings = data as ExtensionSettings;
            console.debug('[BetterFloat] Loaded settings: ', storedSettings);
            const newSettings: {
                [x: string]: typeof defaultSettings[keyof typeof defaultSettings];
            } = {};
            let update = false;
            for (const key in defaultSettings) {
                const settingKey = key as keyof ExtensionSettings;
                if (!Object.prototype.hasOwnProperty.call(storedSettings, key)) {
                    // add missing settings
                    console.log('[BetterFloat] Adding missing setting: ', key);
                    update = true;
                    newSettings[key] = defaultSettings[settingKey];
                }
            }
            if (update) {
                console.debug('[BetterFloat] Updating settings: ', newSettings);
                chrome.storage.local.set(newSettings);
            }
        });
    }
});

export async function refreshPrices() {
    return await fetch('https://prices.csgotrader.app/latest/prices_v6.json')
        .then((response) => response.json())
        .then(async (data) => {
            //set cookie and wait for finish
            return await new Promise<boolean>((resolve) => {
                chrome.storage.local.set({ prices: JSON.stringify(data) }).then(() => {
                    console.log('Prices updated. Current time: ' + Date.toString());
                    resolve(true);
                });
            });
        })
        .catch((err) => console.error(err));
}

// receive message from content script to re-fetch prices
chrome.runtime.onMessage.addListener((request, _sender, sendResponse) => {
    if (request.message == 'fetchPrices') {
        refreshPrices().then((value) => {
            console.log('[BetterFloat] Prices refreshed via content script due to time limit.');
            if (value) {
                sendResponse({
                    message: 'Prices fetched successfully.',
                    success: true,
                });
            } else {
                sendResponse({
                    message: 'Error while fetching prices.',
                    success: false,
                });
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
