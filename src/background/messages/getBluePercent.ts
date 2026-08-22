import type { BlueGem } from '~lib/@typings/ExtensionTypes';
import { defineBackgroundHandler } from '~lib/messaging/background';

export type GetBluePercentRequest = {
	type: string;
	pattern: number;
};

export type GetBluePercentResponse = Partial<BlueGem.PatternData>;

declare module '~lib/messaging/background' {
	interface BackgroundProtocol {
		getBluePercent: (data: GetBluePercentRequest) => GetBluePercentResponse;
	}
}

type PatternMap = Record<string, BlueGem.PatternData>;

const jsonCache: Record<string, PatternMap> = {};

defineBackgroundHandler('getBluePercent', async (data) => {
	if (!data || typeof data.type !== 'string' || typeof data.pattern !== 'number') {
		return {};
	}
	const { type, pattern } = data;

	if (jsonCache[type]) {
		return jsonCache[type][pattern] ?? {};
	}

	// get type data from storage
	const storageKey = `blugem-${type}.json`;
	const typeData = await chrome.storage.local.get(storageKey);
	const storedPatterns = typeData[storageKey] as PatternMap | undefined;
	if (storedPatterns) {
		jsonCache[type] = storedPatterns;
		return storedPatterns[pattern] ?? {};
	}

	// fetch from API
	const responseData = await fetch(`${process.env.PLASMO_PUBLIC_BETTERFLOATCDN}/bluegem-patterns/${type}.json`)
		.then((res) => res.json() as Promise<PatternMap>)
		.catch(() => null);
	if (responseData) {
		jsonCache[type] = responseData;
		// cache in local storage
		await chrome.storage.local.set({ [storageKey]: responseData });
		return responseData[pattern] ?? {};
	}

	// data unavailable
	return {};
});
