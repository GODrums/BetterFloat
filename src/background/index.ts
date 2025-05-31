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

		// make sure we're not in dev mode
		if (details.previousVersion && !details.previousVersion.startsWith('3.') && !chrome.runtime.getManifest().name.includes('DEV')) {
			const onboardingUrl = chrome.runtime.getURL('tabs/onboarding.html');
			await chrome.tabs.create({ url: onboardingUrl });
		}
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

// prevent spamming the same URL
// url -> timestamp
const lastSentMessage: Record<string, number> = {};

chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
	if (tab.url && changeInfo.status === 'complete' && urlsToListenFor.some((url) => tab.url!.startsWith(url))) {
		if (lastSentMessage[tab.url] && Date.now() - lastSentMessage[tab.url] < 200) {
			console.debug('[BetterFloat] URL changed to: ', tab.url, ' but not sending message because it was sent less than 200ms ago');
			return;
		}
		const url = new URL(tab.url);
		const state: Extension.URLState = {
			site: url.hostname,
			path: url.pathname,
			search: url.search,
			hash: url.hash,
		};
		console.debug('[BetterFloat] URL changed to: ', state);

		// retry sending the message if no receiver is found
		const sendMessageWithRetry = async (retryCount = 0) => {
			lastSentMessage[tab.url!] = Date.now();
			try {
				await chrome.tabs.sendMessage(tabId, {
					type: EVENT_URL_CHANGED,
					state,
				});
			} catch (error) {
				// Retry up to 3 times
				if (retryCount < 3) {
					console.debug(`[BetterFloat] Message send failed, retrying (${retryCount + 1}/3)...`);
					setTimeout(() => sendMessageWithRetry(retryCount + 1), 1000); // Retry after 1 second
				} else {
					console.error('[BetterFloat] Failed to send message after 3 retries:', error);
				}
			}
		};

		sendMessageWithRetry();
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
	try {
		const user = await ExtensionStorage.sync.getItem<SettingsUser>('user');
		if (user?.plan.type === 'pro') {
			await synchronizePlanWithStorage(true);
		}
	} catch (error) {
		console.error('[BetterFloat] Failed to check/synchronize user plan:', error);
	}
}

checkUserPlan();
