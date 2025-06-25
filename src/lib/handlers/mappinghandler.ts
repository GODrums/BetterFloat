import marketIds from 'raw:@/assets/marketids.json';
import Decimal from 'decimal.js';
import { MarketSource } from '~lib/util/globals';
import type { Extension } from '../@typings/ExtensionTypes';
import { handleSpecialStickerNames } from '../util/helperfunctions';
import { fetchCurrencyRates } from './networkhandler';

// cached currency rates by exchangerate.host: USD -> X
let realRatesFromUSD: { [currency: string]: number } = {};
// maps buff_name to buff_id
let marketIdMapping: Record<string, Partial<Extension.MarketIDEntry>> = {};
// maps buff_name to prices and more - custom mapping
const priceMapping: {
	buff: Extension.PriceMappingBuff;
	youpin: Extension.PriceMappingMisc;
	c5game: Extension.PriceMappingMisc;
	steam: Extension.PriceMappingSteam;
	csfloat: Extension.PriceMappingMisc;
	csmoney: Extension.PriceMappingMisc;
} = { buff: {}, youpin: {}, c5game: {}, steam: {}, csfloat: {}, csmoney: {} };
// crimson web mapping
let crimsonWebMapping: Extension.CrimsonWebMapping | null = null;

export function cacheRealCurrencyRates(data: { [currency: string]: number }) {
	if (Object.keys(realRatesFromUSD).length > 0) {
		console.debug('[BetterFloat] Real currency rates already cached, overwriting old ones: ', realRatesFromUSD);
	}
	realRatesFromUSD = data;
}

export async function getAndFetchCurrencyRate(currency: string) {
	if (Object.keys(realRatesFromUSD).length === 0) {
		await fetchCurrencyRates();
	}
	return realRatesFromUSD[currency];
}

export function getRealCurrencyRates() {
	return realRatesFromUSD;
}

export async function getPriceMapping(source: MarketSource) {
	if (Object.keys(priceMapping[source]).length === 0) {
		await loadMapping(source);
	}
	return priceMapping[source] as Extension.AbstractPriceMapping;
}

/**
 * should only be used for non-weapon as no special conditions are checked
 * @param buff_name
 * @returns
 */
export async function getItemPrice(buff_name: string, source: MarketSource): Promise<{ starting_at: number; highest_order: number }> {
	if (Object.keys(priceMapping[source]).length === 0) {
		await loadMapping(source);
	}
	//removing double spaces
	buff_name = handleSpecialStickerNames(buff_name.replace(/\s+/g, ' '));
	if (!priceMapping[source][buff_name]) {
		console.log(`[BetterFloat] No price mapping found for ${buff_name}`);
		return {
			starting_at: 0,
			highest_order: 0,
		};
	}
	return {
		starting_at: new Decimal(priceMapping[source][buff_name]['ask'] ?? 0).div(100).toNumber(),
		highest_order: new Decimal(priceMapping[source][buff_name]['bid'] ?? 0).div(100).toNumber(),
	};
}

export async function getCrimsonWebMapping(weapon: Extension.CWWeaponTypes, paint_seed: number) {
	if (!crimsonWebMapping) {
		await loadCrimsonWebMapping();
	}
	if (crimsonWebMapping?.[weapon]?.[paint_seed]) {
		return crimsonWebMapping[weapon][paint_seed];
	}
	return null;
}

export async function getMarketID(name: string, source: MarketSource) {
	if (Object.keys(marketIdMapping).length === 0) {
		// console.error('[BetterFloat] ID mapping not loaded yet');
		// return undefined;
		await fetch(marketIds)
			.then((response) => response.json())
			.then((data) => {
				marketIdMapping = data;
			});
	}
	const getSourceKey = (source: MarketSource) => {
		switch (source) {
			case MarketSource.Buff:
				return 'buff';
			case MarketSource.YouPin:
				return 'uu';
			case MarketSource.C5Game:
				return 'c5';
			default:
				// other markets can be queried via buff name
				return null;
		}
	};
	const sourceKey = getSourceKey(source);
	if (!sourceKey) return undefined;
	const queryName = name.replace(/\s+/g, ' ');
	if (marketIdMapping[queryName]?.[sourceKey]) {
		return marketIdMapping[queryName][sourceKey];
	} else {
		console.log(`[BetterFloat] No market ID found for ${name}`);
		return undefined;
	}
}

export async function loadMapping(source: MarketSource) {
	if (Object.keys(priceMapping[source]).length === 0) {
		console.debug(`[BetterFloat] Attempting to load ${source} price mapping from local storage`);

		const sourceName = source !== MarketSource.Buff ? `prices_${source}` : 'prices';
		const data = await chrome.storage.local.get(sourceName);
		if (data?.[sourceName]) {
			priceMapping[source] = JSON.parse(data[sourceName]);
			console.debug(`[BetterFloat] ${source} Price mapping successfully initialized`);
			return true;
		} else {
			console.error(`[BetterFloat] ${source} Price load failed.`);
			return false;
		}
	}
}

export async function loadCrimsonWebMapping() {
	if (!crimsonWebMapping) {
		// load from local storage first to avoid unnecessary requests
		console.debug('[BetterFloat] Attempting to load crimson web mapping from local storage');
		await new Promise<boolean>((resolve) => {
			try {
				chrome.storage.local.get(['crimsonWebMapping'], async (data) => {
					if (data.crimsonWebMapping) {
						crimsonWebMapping = JSON.parse(data.crimsonWebMapping);
					} else {
						console.debug('[BetterFloat] No CW mapping found in local storage. Loading from Github ...');
						await fetch('https://raw.githubusercontent.com/GODrums/cs-tierlist/main/generated/crimson_web.json')
							.then((response) => response.json())
							.then((data) => {
								crimsonWebMapping = data;
								chrome.storage.local.set({ crimsonWebMapping: JSON.stringify(data) });
								console.debug('[BetterFloat] Crimson web mapping successfully loaded from Github');
							})
							.catch((err) => console.error(err));
					}
					resolve(true);
				});
			} catch (err) {
				console.error(err);
				resolve(false);
			}
		});
	}
	return true;
}

export const BigCurrency = (currency: string) =>
	new Intl.NumberFormat('en-US', {
		style: 'currency',
		currency: currency,
		minimumFractionDigits: 0,
		maximumFractionDigits: 0,
	});

export const SmallCurrency = (currency: string) =>
	new Intl.NumberFormat('en-US', {
		style: 'currency',
		currency: currency,
		minimumFractionDigits: 0,
		maximumFractionDigits: 2,
	});
