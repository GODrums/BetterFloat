import { defineBackgroundHandler } from '~lib/messaging/background';

export type OpenTabRequest = {
	url: string;
};

export type OpenTabResponse = {
	success: boolean;
};

declare module '~lib/messaging/background' {
	interface BackgroundProtocol {
		openTab: (data: OpenTabRequest) => OpenTabResponse;
	}
}

// Avoid opening the same URL multiple times
let lastOpenedURL = '';

defineBackgroundHandler('openTab', async (data) => {
	const url = data?.url;
	if (!url || url === lastOpenedURL) {
		return { success: false };
	}
	lastOpenedURL = url;
	const tab = await chrome.tabs.create({ url, active: false, index: 0 });
	// close tab automatically after it's fully loaded
	chrome.tabs.onUpdated.addListener(function listener(tabId, info) {
		if (tabId === tab.id && info.status === 'complete') {
			chrome.tabs.onUpdated.removeListener(listener);
			chrome.tabs.remove(tab.id);
		}
	});

	return { success: true };
});
