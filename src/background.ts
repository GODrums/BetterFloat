import browser from "webextension-polyfill"
import type { Extension } from "~lib/@typings/ExtensionTypes";
import { DEFAULT_SETTINGS, ExtensionStorage } from "~lib/util/storage";

export {};

// Check whether new version is installed
browser.runtime.onInstalled.addListener(async (details) => {
    if (details.reason == 'install') {
        console.log('[BetterFloat] First install of BetterFloat, enjoy the extension!');
        await chrome.storage.sync.set(DEFAULT_SETTINGS);
    } else if (details.reason == 'update') {
        const thisVersion = browser.runtime.getManifest().version;
        console.log('[BetterFloat] Updated from version ' + details.previousVersion + ' to ' + thisVersion + '!');
        // await chrome.storage.sync.set(DEFAULT_SETTINGS);

        // chrome.storage.local.get((data) => {
        //     if (!data) {
        //         console.log('[BetterFloat] No settings found, setting default settings.');
        //         chrome.storage.local.set(DEFAULT_SETTINGS);
        //         return;
        //     }
        //     const storedSettings = data as Extension.Settings;
        //     console.debug('[BetterFloat] Loaded settings: ', storedSettings);
        //     const newSettings: {
        //         [x: string]: (typeof DEFAULT_SETTINGS)[keyof typeof DEFAULT_SETTINGS];
        //     } = {};
        //     let update = false;
        //     for (const key in DEFAULT_SETTINGS) {
        //         const settingKey = key as keyof Extension.Settings;
        //         if (!Object.prototype.hasOwnProperty.call(storedSettings, key)) {
        //             // add missing settings
        //             console.log('[BetterFloat] Adding missing setting: ', key);
        //             update = true;
        //             newSettings[key] = DEFAULT_SETTINGS[settingKey];
        //         }
        //     }
        //     if (update) {
        //         console.debug('[BetterFloat] Updating settings: ', newSettings);
        //         chrome.storage.local.set(newSettings);
        //     }
        // });
    }
});

export async function refreshPrices() {
    // return await fetch('https://prices.rums.dev/v1/pricempire_usd', {
    return await fetch('https://prices.rums.dev/v2/pricempire_usd?api_key=' + process.env.PLASMO_PUBLIC_RUMSDEV_KEY)
        .then((response) => response.json())
        .then(async (reponseData) => {
            const data = reponseData as Extension.ApiBuffResponse;
            console.log('[SkinComparison] Prices fetched from API. Length: ' + Object.keys(data.data).length + ' Time: ' + data.time);
            //set cookie and wait for finish
            return await new Promise<boolean>((resolve) => {
                chrome.storage.local.set({ prices: JSON.stringify(data.data) }).then(() => {
                    console.log('Prices updated. Current time: ' + Date.now());
                    resolve(true);
                });
            });
        })
        .catch((err) => console.error(err));
}

// rewrite for webextension-polyfill
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

if (process.env.NODE_ENV === 'development') {
    const apikey = process.env.PLASMO_PUBLIC_OCO_KEY;
    if (apikey !== undefined) {
        await ExtensionStorage.sync.set("sp-ocoapikey", apikey);
    }
}