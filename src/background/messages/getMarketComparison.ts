import type { Extension } from '~lib/@typings/ExtensionTypes';
import { defineBackgroundHandler } from '~lib/messaging/background';
import { FreeMarkets } from '~lib/util/globals';
import { ExtensionStorage, type IStorage } from '~lib/util/storage';

export type GetMarketComparisonRequest = {
	buff_name: string;
	isVIP?: boolean;
};

export type GetMarketComparisonResponse = {
	data: Extension.APIMarketResponse;
	fromCache: boolean;
};

declare module '~lib/messaging/background' {
	interface BackgroundProtocol {
		getMarketComparison: (data: GetMarketComparisonRequest) => GetMarketComparisonResponse;
	}
}

// Cache TTL in milliseconds (15 minutes)
const CACHE_TTL = 15 * 60 * 1000;

// In-memory cache to avoid redundant API calls
const marketComparisonCache: Record<string, { data: Extension.APIMarketResponse; timestamp: number }> = {};

defineBackgroundHandler('getMarketComparison', async (data) => {
	if (!data || typeof data.buff_name !== 'string' || !data.buff_name) {
		throw new Error('Request body is missing');
	}

	const { buff_name: buffName, isVIP } = data;

	// check user subscription and steamid
	const user = await ExtensionStorage.sync.getItem<IStorage['user']>('user');

	const steamId = isVIP ? '76561198112185660' : user?.plan?.type === 'pro' ? user?.steam?.steamid : undefined;

	return fetchMarketComparisonData(buffName, steamId);
});

const fetchMarketComparisonData = async (buffName: string, steamId: IStorage['user']['steam']['steamid']) => {
	const manifestVersion = chrome.runtime.getManifest().version;
	// Check in-memory cache first
	if (marketComparisonCache[buffName] && Date.now() - marketComparisonCache[buffName].timestamp < CACHE_TTL) {
		return {
			data: marketComparisonCache[buffName].data,
			fromCache: true,
		};
	}

	try {
		const response = await fetch(`${process.env.PLASMO_PUBLIC_BETTERFLOATAPI}/v1/price/${buffName}`, {
			method: 'GET',
			headers: {
				'Content-Type': 'application/json',
				'x-via': `BetterFloat/${manifestVersion}`,
				'x-steamid': steamId || '',
			},
		});

		if (!response.ok) {
			const errorData = await response.json();
			throw new Error('Error fetching market comparison data: ' + (errorData.message || 'Unknown error'));
		}

		let data = (await response.json()) as Extension.APIMarketResponse;

		if (!steamId) {
			const newData: Partial<Extension.APIMarketResponse> = {};
			for (const market of FreeMarkets) {
				newData[market] = data[market];
			}
			data = newData as Extension.APIMarketResponse;
		}

		// Update both caches
		const cacheEntry = {
			data,
			timestamp: Date.now(),
		};
		marketComparisonCache[buffName] = cacheEntry;

		return {
			data,
			fromCache: false,
		};
	} catch (error) {
		console.error('[BetterFloat] Error fetching market comparison data:', error);
		return {
			data: {},
			fromCache: false,
		};
	}
};
