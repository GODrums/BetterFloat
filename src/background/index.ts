import { EVENT_URL_CHANGED, WEBSITE_URL } from '~lib/util/globals';
import { DEFAULT_SETTINGS, ExtensionStorage } from '~lib/util/storage';

import type { Extension } from '~lib/@typings/ExtensionTypes';
import { synchronizePlanWithStorage } from '~lib/util/jwt';
import type { IStorage, SettingsUser } from '~lib/util/storage';

// Check whether new version is installed
chrome.runtime.onInstalled.addListener(async (details) => {
	if (details.reason === 'install') {
		console.log('[BetterFloat] First install of BetterFloat, enjoy the extension!');

		// set default settings
		for (const key in DEFAULT_SETTINGS) {
			ExtensionStorage.sync.setItem(key, DEFAULT_SETTINGS[key]);
		}

		if (!chrome.runtime.getManifest().name.includes('DEV')) {
			const onboardingUrl = chrome.runtime.getURL('tabs/onboarding.html');
			await chrome.tabs.create({ url: onboardingUrl });
		}
	} else if (details.reason === 'update') {
		const thisVersion = chrome.runtime.getManifest().version;
		console.log('[BetterFloat] Updated from version ' + details.previousVersion + ' to ' + thisVersion + '!');

		// set default settings
		await initializeSettings();
	}
});

async function initializeSettings() {
	const data = await ExtensionStorage.sync.getAll();
	if (!data) {
		console.log('[BetterFloat] No settings found, setting default settings.');
		for (const key in DEFAULT_SETTINGS) {
			ExtensionStorage.sync.setItem(key, DEFAULT_SETTINGS[key]);
		}
		return;
	}

	const storedSettings = data as unknown as IStorage;
	console.debug('[BetterFloat] Loaded settings: ', storedSettings);

	for (const key in DEFAULT_SETTINGS) {
		if (!Object.prototype.hasOwnProperty.call(storedSettings, key)) {
			// add missing settings
			console.log('[BetterFloat] Adding missing setting: ', key);
			ExtensionStorage.sync.setItem(key, DEFAULT_SETTINGS[key]);
		}
	}
}

const urlsToListenFor = ['https://csfloat.com', 'https://skinport.com', 'https://skinbid.com'];

chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
	if (tab.url && changeInfo.status === 'complete' && urlsToListenFor.some((url) => tab.url!.startsWith(url))) {
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

chrome.runtime.onMessageExternal.addListener((request, sender, sendResponse) => {
	console.log('Received message from external extension', request, sender);

	if (sender.origin !== WEBSITE_URL) {
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

async function checkUserPlan() {
	const user = await ExtensionStorage.sync.getItem<SettingsUser>('user');
	if (user?.plan.type === 'pro') {
		await synchronizePlanWithStorage();
	}
}

checkUserPlan();
