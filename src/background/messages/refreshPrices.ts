import type { Extension } from '~lib/@typings/ExtensionTypes';
import { defineBackgroundHandler } from '~lib/messaging/background';

export type RefreshPricesRequest = {
	source: string;
	steamId?: string;
};

export type RefreshPricesResponse = {
	status: number;
};

declare module '~lib/messaging/background' {
	interface BackgroundProtocol {
		refreshPrices: (data: RefreshPricesRequest) => RefreshPricesResponse;
	}
}

const lastRequest: Record<string, number> = {};

defineBackgroundHandler('refreshPrices', async (data) => {
	const source = data?.source;
	if (!source) {
		return { status: 500 };
	}
	if (lastRequest[source] > 0 && Date.now() - lastRequest[source] < 1000 * 60 * 10) {
		console.log('[BetterFloat] Prices were requested within the last 10 minutes. Skipping refresh.');
		return { status: 200 };
	}
	lastRequest[source] = Date.now();
	console.log('[BetterFloat] Refreshing prices from source:', source);
	const pricesURL = `prices${source !== 'buff' ? `_${source.toLowerCase()}` : ''}`;

	// for self builds, make sure to use your own API
	const response = await fetch(`${process.env.PLASMO_PUBLIC_PRICINGAPI}${pricesURL}.json`, {
		method: 'GET',
		headers: {
			'Content-Type': 'application/json',
			'x-via': `BetterFloat/${chrome.runtime.getManifest().version}`,
			'x-id': `chrome-extension://${chrome.runtime.id}`,
			'x-steam': data.steamId || '',
		},
	});

	if (response.ok) {
		const responseJson = (await response.json()) as Extension.ApiBuffResponse;
		if (responseJson?.data) {
			await chrome.storage.local.set({
				[`${pricesURL}`]: JSON.stringify(responseJson.data),
				[`${source}-update`]: Date.now(),
			});
		}
	} else if (response.status === 403) {
		await chrome.storage.local.set({
			[`${source}-update`]: Date.now(), // avoid refetches until auth is resolved
		});
	}
	return { status: response.status };
});
