import { sendToBackground } from '@plasmohq/messaging';
import Decimal from 'decimal.js';
import type { DopplerPhase, ItemStyle } from '../@typings/FloatTypes';
import { getPriceMapping } from '../handlers/mappinghandler';
import { CHARM_GRADIENTS } from './charms';
import { MarketSource } from './globals';
import { synchronizePlanWithStorage } from './jwt';
import { phaseMapping } from './patterns';
import type { SettingsUser } from './storage';

export function getBlueGemName(name: string) {
	if (name.startsWith('★')) {
		return name.split(' | ')[0].split('★ ')[1];
	} else if (name === 'Five-SeveN | Heat Treated') {
		return 'Five-SeveN Heat Treated';
	} else {
		return name.split(' | ')[0];
	}
}

export function parsePrice(priceText: string) {
	let currency = '';
	// regex also detects &nbsp as whitespace!
	if (priceText.split(/\s/).length > 1) {
		// format: "1 696,00 €" -> Skinport uses &nbsp instead of whitespaces in this format!
		const parts = priceText.replace(',', '').replace('.', '').split(/\s/);
		priceText = String(Number(parts.filter((x) => !Number.isNaN(+x)).join('')) / 100);
		currency = parts.filter((x) => Number.isNaN(+x))[0];
	} else {
		// format: "€1,696.00"
		const firstDigit = Array.from(priceText).findIndex((x) => !Number.isNaN(Number(x)));
		currency = priceText.substring(0, firstDigit);
		priceText = String(Number(priceText.substring(firstDigit).replace(',', '').replace('.', '')) / 100);
	}
	let price = Number(priceText);

	if (Number.isNaN(price) || !Number.isNaN(Number(currency))) {
		price = 0;
		currency = '';
	}
	return { price, currency };
}

export function getBuffLink(buff_id: number, phase?: DopplerPhase | null) {
	const baseUrl = `https://buff.163.com/goods/${buff_id}`;
	if (phase) {
		return `${baseUrl}#tag_ids=${phaseMapping[buff_id][phase]}`;
	}
	return baseUrl;
}

export async function formFetch<T>(url: string, body: string): Promise<T> {
	return fetch(url, {
		method: 'POST',
		headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
		body: encodeURI(body),
	}).then((response) => response.json() as Promise<T>);
}

export async function delay(ms: number) {
	return new Promise((resolve) => setTimeout(resolve, ms));
}

type WaitElementOptions = {
	interval?: number;
	maxTries?: number;
};
/**
 * Wait of an element to appear in the DOM
 * @param selector css selector for the element
 * @param interval interval in ms, default 200
 * @param maxTries maximum tries, default 10
 * @returns true if element was found, false if not
 */
export async function waitForElement(selector: string, { interval = 200, maxTries = 10 }: WaitElementOptions = { interval: 200, maxTries: 10 }) {
	let tries = 0;
	while (!document.querySelector(selector) && tries < maxTries) {
		tries++;
		await new Promise((r) => setTimeout(r, interval));
	}
	return tries < maxTries;
}

/**
 * Listens for url changes and executes the callback function
 * @param urlChangeCallback callback function
 * @param delay interval in ms, default 2000
 * @returns interval id for use with clearInterval
 * @async setInterval executed every 200ms
 */
export function createUrlListener(urlChangeCallback: (newUrl: URL) => void, delay = 2000) {
	// current url, automically updated per interval
	let currentUrl: string = location.href;
	return setInterval(() => {
		const newUrl = location.href;
		if (currentUrl !== newUrl) {
			currentUrl = newUrl;
			urlChangeCallback(new URL(newUrl));
		}
	}, delay);
}

/**
 * Rewrites the current history state with new parameters
 * @param paramsMap key-value pairs of parameters
 */
export function createHistoryRewrite(paramsMap: Record<string, string>, force = false) {
	const url = new URL(location.href);
	for (const [key, value] of Object.entries(paramsMap)) {
		if (!url.searchParams.has(key)) {
			url.searchParams.set(key, value);
		}
	}
	if (!force) {
		history.replaceState({}, '', url.href);
	} else {
		url.pathname = '/';
		sendToBackground({
			name: 'openTab',
			body: {
				url: url.href,
			},
		}).then((response) => {
			console.log('[BetterFloat] Opened tab successfully:', response);
		});
	}
}

let lastProCheck = 0;

/**
 * Checks if the user has a pro plan and validates the plan
 * Only synchronizes once every 5 minutes
 * @param user
 * @returns
 */
export async function checkUserPlanPro(user: SettingsUser) {
	const isPro = isUserPro(user);
	if ((isPro && lastProCheck + 10 * 60 * 1000 < Date.now()) || (!isPro && lastProCheck > 0)) {
		const expired = typeof user?.plan?.expiry === 'number' && user?.plan?.expiry < Date.now();
		try {
			user = await synchronizePlanWithStorage(expired);
		} catch (error) {
			console.error('[BetterFloat] Error synchronizing plan:', error);
			user = { ...user, plan: { type: 'free' } };
		}
		if (isPro) {
			lastProCheck = Date.now();
		} else {
			lastProCheck = 0;
		}
	}

	return isUserPro(user);
}

export function isUserPro(user: SettingsUser) {
	return user?.plan?.type === 'pro';
}

export function getCollectionLink(collectionName: string) {
	return `https://csgoskins.gg/collections/${collectionName.replaceAll('& ', '').replaceAll(' ', '-').replaceAll('.', '').replaceAll(':', '').toLowerCase()}`;
}

export function getMarketURL({ source, buff_name, market_id = 0, phase }: { source: MarketSource; buff_name: string; market_id?: number | string; phase?: DopplerPhase }) {
	switch (source) {
		case MarketSource.Buff: {
			if (Number(market_id) === 0) {
				return `https://buff.163.com/market/csgo#tab=selling&page_num=1&search=${encodeURIComponent(buff_name)}`;
			}
			return `https://buff.163.com/goods/${market_id}${phase && phaseMapping[market_id] ? `#tag_ids=${phaseMapping[market_id][phase]}` : ''}`;
		}
		case MarketSource.Steam:
			return `https://steamcommunity.com/market/listings/730/${encodeURIComponent(buff_name)}`;
		case MarketSource.YouPin:
			if (Number(market_id) > 0) {
				return `https://youpin898.com/market/goods-list?templateId=${market_id}&gameId=730`;
			}
			return `https://youpin898.com/market/csgo?gameId=730&search=${encodeURIComponent(buff_name)}`;
		case MarketSource.C5Game: {
			if (market_id && market_id !== -1) {
				return `https://www.c5game.com/en/csgo/${market_id}/${encodeURIComponent(buff_name.split(' (')[0])}/sell`;
			} else {
				return `https://www.c5game.com/en/csgo?marketKeyword=${encodeURIComponent(buff_name)}`;
			}
		}
		case MarketSource.CSFloat: {
			const extendedName = buff_name + (phase ? ` [${phase}]` : '');
			return `https://csfloat.com/search?sort_by=lowest_price&type=buy_now&market_hash_name=${encodeURIComponent(extendedName)}`;
		}
		case MarketSource.DMarket:
			return `https://dmarket.com/ingame-items/item-list/csgo-skins?title=${encodeURIComponent(buff_name)}&sort-type=5&ref=rqKYzZ36Bw&utm_source=betterfloat`;
		case MarketSource.CSMoney:
			return `https://cs.money/market/buy/?sort=price&order=asc&search=${encodeURIComponent(buff_name)}&utm_source=mediabuy&utm_medium=betterfloat&utm_campaign=regular&utm_content=link`;
		case MarketSource.Bitskins:
			return `https://bitskins.com/market/csgo?search={%22order%22:[{%22field%22:%22price%22,%22order%22:%22ASC%22}],%22where%22:{%22skin_name%22:%22${encodeURIComponent(buff_name)}%22}}&ref_alias=betterfloat`;
		case MarketSource.Lisskins:
			return `https://lis-skins.com/market/csgo/?query=${encodeURIComponent(buff_name)}&rf=130498354&utm_source=betterfloat`;
		case MarketSource.BuffMarket:
			return `https://buff.market/market/all?search=${encodeURIComponent(buff_name)}`;
		case MarketSource.Skinbid:
			return `https://skinbid.com/market?search=${encodeURIComponent(buff_name)}&sort=price%23asc&sellType=all&utm_source=betterfloat&ref=betterfloat`;
		case MarketSource.Skinport:
			return `https://skinport.com/market/730?search=${encodeURIComponent(buff_name)}&sort=price&order=asc&utm_source=betterfloat`;
		case MarketSource.Marketcsgo:
			return `https://market.csgo.com/en/?search=${encodeURIComponent(buff_name)}&utm_campaign=main&utm_source=BetterFloat&utm_medium=referral&cpid=caa655bb-8c34-4013-9427-1a5f842fc898&oid=4c69d079-ad2a-44b0-a9ac-d0afc2167ee7`;
		case MarketSource.Pricempire:
			return `https://pricempire.com/item/${encodeURIComponent(buff_name)}?utm_source=betterfloat`;
		case MarketSource.Gamerpay:
			return `https://gamerpay.gg/?sortBy=price&ascending=true&query=${encodeURIComponent(buff_name)}&page=1&utm_source=betterfloat`;
		case MarketSource.Waxpeer:
			return `https://waxpeer.com/?sort=ASC&order=price&all=0&exact=0&search=${encodeURIComponent(buff_name)}&utm_source=betterfloat`;
		case MarketSource.Skinbaron:
			return `https://skinbaron.de/en/csgo?str=${encodeURIComponent(buff_name)}&sort=CF&utm_source=betterfloat`;
		case MarketSource.Tradeit:
			return `https://tradeit.gg/csgo/store?aff=betterfloat&search=${encodeURIComponent(buff_name)}`;
		case MarketSource.Whitemarket:
			return `https://white.market/market?name=${encodeURIComponent(buff_name)}&sort=pr_a&utm_source=betterfloat`;
		case MarketSource.Swapgg:
			return 'https://swap.gg/?r=X4nFTDBbek';
		case MarketSource.Avanmarket:
			return `https://avan.market/en/market/cs?name=${encodeURIComponent(buff_name)}&utm_source=betterfloat&r=betterfloat&sort=1`;
		case MarketSource.Skinsmonkey:
			return `https://skinsmonkey.com/market/csgo?search=${encodeURIComponent(buff_name)}&sort=price&order=asc&utm_source=betterfloat&r=a0NNFQvBTf4s`;
		case MarketSource.Skinout:
			return `https://skinout.gg/en/market?search=${encodeURIComponent(buff_name)}&utm_source=betterfloat`;
		case MarketSource.Skinflow:
			return `https://skinflow.gg/buy?referral=BETTERFLOAT&search=${encodeURIComponent(buff_name)}`;
		case MarketSource.Shadowpay:
			return `https://shadowpay.com/csgo-items?search=${encodeURIComponent(buff_name)}&utm_campaign=j8MVU4KVXS3Liun`;
	}
	return '';
}

/**
 * Wrapper for price mapping. Returns the price of an item with respect to its style
 * @param buff_name has to follow the exact Buff's naming convention.
 * @param itemStyle e.g. Vanilla, Phase 1, Phase 2, ...
 * @returns
 */
export async function getBuffPrice(buff_name: string, itemStyle: ItemStyle, source: MarketSource = MarketSource.Buff) {
	let queryName = buff_name;

	if ([MarketSource.Buff, MarketSource.YouPin, MarketSource.CSFloat].includes(source) && itemStyle !== '' && itemStyle !== 'Vanilla') {
		queryName = buff_name + ' - ' + itemStyle;
	}

	const values: {
		priceListing?: Decimal;
		priceOrder?: Decimal;
		priceAvg30?: Decimal;
		liquidity?: Decimal;
		count?: Decimal;
	} = {};
	const priceMapping = await getPriceMapping(source);

	if (priceMapping[queryName]) {
		const result = priceMapping[queryName];

		if (result['bid'] !== undefined) {
			values.priceOrder = new Decimal(priceMapping[queryName]['bid'] ?? 0).div(100);
		}
		if (result['ask'] !== undefined) {
			values.priceListing = new Decimal(priceMapping[queryName]['ask'] ?? 0).div(100);
		} else if (result['price'] !== undefined) {
			values.priceListing = new Decimal(priceMapping[queryName]['price'] ?? 0).div(100);
		}
		if (result['avg30'] !== undefined) {
			values.priceAvg30 = new Decimal(priceMapping[queryName]['avg30'] ?? 0).div(100);
		}
		if (result['liquidity'] !== undefined) {
			values.liquidity = new Decimal(priceMapping[queryName]['liquidity'] ?? 0);
		}
		if (result['count'] !== undefined) {
			values.count = new Decimal(priceMapping[queryName]['count'] ?? 0);
		}
	} else {
		console.debug(`[BetterFloat] No price mapping found for ${queryName}`);
	}

	return values;
}

// truncats a number to a given amount of digits
export function toTruncatedString(num: number, digits: number) {
	const regex = new RegExp(`^-?\\d+(?:\\.\\d{0,${digits}})?`).exec(num.toString());
	return regex ? regex[0] : '';
}

/**
 * Convert a string to title case
 * @param str
 * @returns
 */
export function toTitleCase(str: string) {
	const splitStr = str.toLowerCase().split(' ');
	for (let i = 0; i < splitStr.length; i++) {
		splitStr[i] = splitStr[i].charAt(0).toUpperCase() + splitStr[i].substring(1);
	}
	return splitStr.join(' ');
}

export function calculateEpochFromDate(date: string) {
	return Date.parse(date) / 1000;
}

/**
 * get the time difference between now and the creation of the listing
 * @param created_at example format: "2023-10-12T11:06:15"
 */
export function calculateTime(created_at: number) {
	const timeDiff = () => {
		const now = new Date();
		const diff = now.getTime() - created_at * 1000;
		return Math.floor(diff / 60_000);
	};
	const timeMin = timeDiff();
	const timeHours = Math.floor(timeMin / 60);
	let textTime = '';
	if (timeHours < 49) {
		if (timeMin < 120) {
			textTime = `${timeMin} minute${timeMin === 1 ? '' : 's'} ago`;
		} else {
			textTime = `${timeHours} hour${timeHours === 1 ? '' : 's'} ago`;
		}
	} else {
		textTime = `${Math.floor(timeHours / 24)} day${Math.floor(timeHours / 24) === 1 ? '' : 's'} ago`;
	}
	return textTime;
}

export function getSPBackgroundColor(spPercentage: number) {
	if (spPercentage < 0.005 || spPercentage > 2) {
		return '#0003';
	}
	if (spPercentage >= 1) {
		return 'rgb(245 0 0 / 40%)';
	}
	if (spPercentage > 0.5) {
		return 'rgb(245 164 0 / 40%)';
	}
	if (spPercentage > 0.25) {
		return 'rgb(244 245 0 / 40%)';
	}
	return 'rgb(83 245 0 / 40%)';
}

export function handleSpecialStickerNames(name: string): string {
	if (name.includes('Ninjas in Pyjamas | Katowice 2015')) {
		return 'Sticker | Ninjas in Pyjamas  | Katowice 2015';
	} else if (name.includes('Vox Eminor | Katowice 2015')) {
		return 'Sticker | Vox Eminor  | Katowice 2015';
	} else if (name.includes('PENTA Sports | Katowice 2015')) {
		return 'Sticker | PENTA Sports  | Katowice 2015';
	} else if (name.includes('Ground Rebel | Elite Crew')) {
		return 'Ground Rebel  | Elite Crew';
	} else if (name.includes('Michael Syfers | FBI Sniper')) {
		return 'Michael Syfers  | FBI Sniper';
	} else if (name.indexOf('niko') > -1) {
		return name.substring(0, name.lastIndexOf('|')) + ' ' + name.substring(name.lastIndexOf('|'), name.length);
	}
	return name;
}

/**
 * Get a coloring for the float value of an item
 * @param w wear value
 * @param l low: lower float bound
 * @param h high: upper float bound
 * @param isVanilla if the item is a vanilla
 * @returns
 */
export function getFloatColoring(w: number, l = 0, h = 1, isVanilla = false): string {
	const colors = {
		good: 'turquoise',
		bad: 'indianred',
		perfect: 'springgreen',
		worst: 'orangered',
		normal: '',
	};

	// special ranges for vanilla knives
	if (isVanilla) {
		if (w < 0.07) {
			return colors.perfect;
		} else if (w < 0.1) {
			return colors.good;
		} else if (w >= 0.79) {
			return colors.worst;
		} else if (w >= 0.75) {
			return colors.bad;
		}
		return colors.normal;
	}

	const wearRanges = [
		{ low: 0, high: 0.07 },
		{ low: 0.07, high: 0.15 },
		{ low: 0.15, high: 0.38 },
		{ low: 0.38, high: 0.45 },
		{ low: 0.45, high: 1 },
	];
	const actualRanges = wearRanges.filter((range) => l < range.low && h > range.high);
	actualRanges.push({ low: actualRanges[actualRanges.length - 1]?.high ?? 0.07, high: h });
	actualRanges.push({ low: l, high: actualRanges[0]?.low ?? 0.07 });
	// we need >= as Skinport cuts off digits
	const range = actualRanges.find((range) => w >= range.low && w < range.high)!;
	if (w - range.low < 0.001 && l === range.low) {
		return colors.perfect;
	} else if (
		(w - range.low < 0.01 && range.high > w + 0.03) ||
		(range.low === 0.15 && w >= 0.15 && w < 0.18 && range.high > 0.3) ||
		(range.low === 0.45 && w >= 0.45 && w < 0.5 && range.high > 0.55)
	) {
		return colors.good;
	} else if (range.high - w < 0.001 && h === range.high) {
		return colors.worst;
	} else if (range.high - w < 0.01 || (range.high === 0.38 && w > 0.32 && w < 0.38 && range.low < 0.22) || w > 0.9) {
		return colors.bad;
	}
	return colors.normal;
}

/**
 * Get the phase of a Doppler item by the paint index
 * @param paintIndex paint index of the item
 * @returns phase of the item
 */
export function getDopplerPhase(paintIndex: number): DopplerPhase | null {
	switch (paintIndex) {
		case 418:
		case 569:
			return 'Phase 1';
		case 419:
		case 570:
			return 'Phase 2';
		case 420:
		case 571:
			return 'Phase 3';
		case 421:
		case 572:
			return 'Phase 4';
		case 415:
			return 'Ruby';
		case 416:
			return 'Sapphire';
		case 417:
			return 'Black Pearl';
		case 568:
			return 'Emerald';
	}
	return null;
}

/**
 * Helper function to interpolate between two hex colors
 * @param color1 hex color string
 * @param color2 hex color string
 * @param factor interpolation factor (0-1)
 * @returns interpolated hex color
 */
function interpolateColor(color1: string, color2: string, factor: number): string {
	// Parse hex colors to RGB
	const parseHex = (hex: string) => {
		const cleanHex = hex.replace('#', '');
		return {
			r: Number.parseInt(cleanHex.substring(0, 2), 16),
			g: Number.parseInt(cleanHex.substring(2, 4), 16),
			b: Number.parseInt(cleanHex.substring(4, 6), 16),
		};
	};

	const c1 = parseHex(color1);
	const c2 = parseHex(color2);

	// Interpolate each channel
	const r = Math.round(c1.r + (c2.r - c1.r) * factor);
	const g = Math.round(c1.g + (c2.g - c1.g) * factor);
	const b = Math.round(c1.b + (c2.b - c1.b) * factor);

	// Convert back to hex
	return `#${r.toString(16).padStart(2, '0')}${g.toString(16).padStart(2, '0')}${b.toString(16).padStart(2, '0')}`;
}

/**
 * Get color from a gradient defined by stops
 * @param pattern current pattern value
 * @param stops array of [pattern, color] tuples defining the gradient
 * @returns hex color string
 */
function getGradientColor(pattern: number, stops: Array<[number, string]>): string {
	// Clamp pattern to valid range
	const clampedPattern = Math.max(0, Math.min(100000, pattern));

	// Find the two stops to interpolate between
	for (let i = 0; i < stops.length - 1; i++) {
		const [pattern1, color1] = stops[i];
		const [pattern2, color2] = stops[i + 1];

		if (clampedPattern >= pattern1 && clampedPattern <= pattern2) {
			// Calculate interpolation factor
			const factor = (clampedPattern - pattern1) / (pattern2 - pattern1);
			return interpolateColor(color1, color2, factor);
		}
	}

	// If pattern is beyond all stops, return the last color
	return stops[stops.length - 1][1];
}

/**
 * Get a coloring for a specific charm.
 * Colors from: https://www.figma.com/colors/
 * Uses gradient interpolation for smooth color transitions based on pattern.
 * @param pattern 0-100000
 * @param itemName e.g. Lil' Ava
 * @returns [backgroundColor, foregroundColor]
 */
export function getCharmColoring(pattern: number, itemName: string): [string, string] {
	const colorWhite = '#ffffffb3';

	const gradient = CHARM_GRADIENTS[itemName];
	if (gradient) {
		const backgroundColor = getGradientColor(pattern, gradient);
		return [backgroundColor, colorWhite];
	}

	// Default color for unknown charms
	return ['#c1ceff', colorWhite];
}

/**
 * Returns a number formatter for the user's currency
 * @param currency user currency
 * @param min minimum fraction digits - default: 0
 * @param max maximum fraction digits - default: 2
 * @returns
 */
export function CurrencyFormatter(currency: string, min = 0, max = 2) {
	return new Intl.NumberFormat(undefined, {
		style: 'currency',
		currency: currency,
		currencyDisplay: 'narrowSymbol',
		minimumFractionDigits: min,
		maximumFractionDigits: max,
	});
}

export function convertCurrency(amount: number, currency: string) {
	return CurrencyFormatter(currency).format(amount);
}
