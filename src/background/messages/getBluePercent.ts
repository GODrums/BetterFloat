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

const jsonCache: {
	[type: string]: {
		[pattern: string]: BlueGem.PatternData;
	};
} = {};

defineBackgroundHandler('getBluePercent', async (data) => {
	if (!data || typeof data.type !== 'string' || typeof data.pattern !== 'number') {
		return {};
	}
	const { type, pattern } = data;

	if (jsonCache[type]) {
		return jsonCache[type][pattern];
	}

	// get type data from storage
	const storageKey = `blugem-${type}.json`;
	const typeData = await chrome.storage.local.get(storageKey);
	if (typeData[storageKey]) {
		jsonCache[type] = typeData[storageKey];
		return jsonCache[type][pattern];
	}

	// fetch from API
	const responseData = await fetch(`${process.env.PLASMO_PUBLIC_BETTERFLOATCDN}/bluegem-patterns/${type}.json`)
		.then((res) => res.json())
		.catch(() => null);
	if (responseData) {
		jsonCache[type] = responseData;
		// cache in local storage
		await chrome.storage.local.set({ [storageKey]: responseData });
		return jsonCache[type][pattern];
	}

	// data unavailable
	return {};
});
