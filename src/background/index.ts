import { EVENT_URL_CHANGED, WEBSITE_URL } from '~lib/util/globals';
import { DEFAULT_SETTINGS, ExtensionStorage } from '~lib/util/storage';

import type { Extension } from '~lib/@typings/ExtensionTypes';
import type { IStorage, SettingsUser } from '~lib/util/storage';

// Check whether new version is installed
chrome.runtime.onInstalled.addListener(async (details) => {
	if (details.reason === 'install') {
		console.log('[BetterFloat] First install of BetterFloat, enjoy the extension!');

		// set default settings
		for (const key in DEFAULT_SETTINGS) {
			ExtensionStorage.sync.setItem(key, DEFAULT_SETTINGS[key]);
		}

		// get extension url
		// const onboardingUrl = chrome.runtime.getURL('tabs/onboarding.html');
		// await chrome.tabs.create({ url: onboardingUrl });
	} else if (details.reason === 'update') {
		const thisVersion = chrome.runtime.getManifest().version;
		console.log('[BetterFloat] Updated from version ' + details.previousVersion + ' to ' + thisVersion + '!');

		// delete user setting
		// ExtensionStorage.sync.removeItem('user');

		// set default settings
		await initializeSettings();
	}
});

// check user plan
async function checkUserPlan() {
	const user = await ExtensionStorage.sync.getItem<SettingsUser>('user');
	// reset the beta version after the beta period
	if (new Date().getTime() > new Date('2025-01-25').getTime() && user?.plan.type === 'pro') {
		user.plan.type = 'free';
		await ExtensionStorage.sync.setItem('user', user);
	}

	// if (user?.plan.type === 'pro') {
	// 	// check for expiry
	// 	if (!user.plan.expiry || user.plan.expiry < new Date().getTime()) {
	// 		user.plan.type = 'free';
	// 		await ExtensionStorage.sync.setItem('user', user);
	// 	}
	// 	// TODO: verify JWT
	// }
}

checkUserPlan();

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
