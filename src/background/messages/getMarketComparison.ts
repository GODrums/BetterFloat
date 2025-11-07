import type { PlasmoMessaging } from '@plasmohq/messaging';
import type { Extension } from '~lib/@typings/ExtensionTypes';
import { FreeMarkets } from '~lib/util/globals';
import { ExtensionStorage, type IStorage } from '~lib/util/storage';

export type GetMarketComparisonBody = {
	buff_name: string;
	isVIP?: boolean;
};

export type GetMarketComparisonResponse = {
	data: Extension.APIMarketResponse;
	fromCache: boolean;
};

// Cache TTL in milliseconds (15 minutes)
const CACHE_TTL = 15 * 60 * 1000;

const manifestVersion = chrome.runtime.getManifest().version;

// In-memory cache to avoid redundant API calls
const marketComparisonCache: Record<string, { data: Extension.APIMarketResponse; timestamp: number }> = {};

const handler: PlasmoMessaging.MessageHandler<GetMarketComparisonBody, GetMarketComparisonResponse> = async (req, res) => {
	if (!req.body) {
		throw new Error('Request body is missing');
	}

	const { buff_name: buffName, isVIP } = req.body;

	// check user subscription and steamid
	const user = await ExtensionStorage.sync.getItem<IStorage['user']>('user');

	const steamId = isVIP ? '76561198112185660' : user?.plan?.type === 'pro' ? user?.steam?.steamid : undefined;

	const data = await fetchMarketComparisonData(buffName, steamId);
	console.debug('[BetterFloat] Fetched fresh market comparison data for ' + buffName);
	res.send(data);
};

const fetchMarketComparisonData = async (buffName: string, steamId: IStorage['user']['steam']['steamid']) => {
	// Check in-memory cache first
	if (marketComparisonCache[buffName] && Date.now() - marketComparisonCache[buffName].timestamp < CACHE_TTL) {
		console.debug('[BetterFloat] Returning cached market comparison data for ' + buffName);
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

export default handler;
