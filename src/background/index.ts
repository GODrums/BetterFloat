import { EVENT_URL_CHANGED, isDevMode } from '~lib/util/globals';
import { DEFAULT_SETTINGS, ExtensionStorage } from '~lib/util/storage';

import type { Extension } from '~lib/@typings/ExtensionTypes';
import type { IStorage } from '~lib/util/storage';

// Check whether new version is installed
chrome.runtime.onInstalled.addListener(async (details) => {
	if (details.reason == 'install') {
		console.log('[BetterFloat] First install of BetterFloat, enjoy the extension!');
		await chrome.storage.sync.set(DEFAULT_SETTINGS);
	} else if (details.reason == 'update') {
		const thisVersion = chrome.runtime.getManifest().version;
		console.log('[BetterFloat] Updated from version ' + details.previousVersion + ' to ' + thisVersion + '!');
		// await chrome.storage.sync.set(DEFAULT_SETTINGS);
		chrome.storage.local.remove('buffMapping');

		const data = await ExtensionStorage.sync.getAll();
		if (!data) {
			console.log('[BetterFloat] No settings found, setting default settings.');
			for (const key in DEFAULT_SETTINGS) {
				const value = typeof DEFAULT_SETTINGS[key] === 'string' ? JSON.stringify(DEFAULT_SETTINGS[key]) : DEFAULT_SETTINGS[key];
				ExtensionStorage.sync.set(key, value);
			}
			return;
		}

		const storedSettings = data as unknown as IStorage;
		console.debug('[BetterFloat] Loaded settings: ', storedSettings);

		for (const key in DEFAULT_SETTINGS) {
			if (!Object.prototype.hasOwnProperty.call(storedSettings, key)) {
				// add missing settings
				console.log('[BetterFloat] Adding missing setting: ', key);
				const value = typeof DEFAULT_SETTINGS[key] === 'string' ? JSON.stringify(DEFAULT_SETTINGS[key]) : DEFAULT_SETTINGS[key];
				ExtensionStorage.sync.set(key, value);
			}
		}
	}
});

export async function refreshPrices() {
	// For no dev restrictions, use an api key from .env instead:
	// /v2/pricempire_usd?api_key=process.env.PLASMO_PUBLIC_RUMSDEV_KEY
	return await fetch('https://prices.rums.dev/v1/pricempire_usd', {
		method: 'GET',
		headers: {
			'Content-Type': 'application/json',
			'X-Via': `BetterFloat/${chrome.runtime.getManifest().version}`,
		},
	})
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

chrome.runtime.onMessage.addListener((request, _sender, sendResponse) => {
	// TODO: Switch to @plasmohq/messaging
	if (request.message == 'fetchPrices') {
		console.time('PriceRefresh');
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
		console.timeEnd('PriceRefresh');
		// this is required to let the message listener wait for the fetch to finish
		// https://github.com/mozilla/webextension-polyfill/issues/130#issuecomment-484772327
		return true;
	}
});

const urlsToListenFor = ['https://csfloat.com', 'https://skinport.com', 'https://skinbid.com'];

chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
	if (tab.url && changeInfo.status === 'complete' && urlsToListenFor.some((url) => tab.url.startsWith(url))) {
		const url = new URL(tab.url);
		const state: Extension.URLState = {
			site: url.hostname,
			path: url.pathname,
			search: url.search,
			hash: url.hash,
		};
		console.debug('[BetterFloat] URL changed to: ', state);
		chrome.tabs.sendMessage(tabId, {
			type: EVENT_URL_CHANGED,
			state,
		});
	}
});

chrome.runtime.onMessageExternal.addListener(function (request, sender, sendResponse) {
	console.log('Received message from external extension', request, sender);

	if (sender.origin !== 'https://betterfloat.rums.dev') {
		sendResponse({ success: false, message: 'Invalid origin' });
		return;
	}

	const newSettings = request.newSettings;

	console.log('[BetterFloat] Received new settings: ', newSettings);
	for (const key in newSettings) {
		ExtensionStorage.sync.set(key, newSettings[key]);
	}
	sendResponse({ success: true });
});

if (isDevMode) {
	const apikey = process.env.PLASMO_PUBLIC_OCO_KEY;
	if (apikey !== undefined) {
		ExtensionStorage.sync.set('sp-ocoapikey', apikey);
	}
}
