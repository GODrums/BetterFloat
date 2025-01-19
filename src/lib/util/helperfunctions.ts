import { sendToBackground } from '@plasmohq/messaging';
import { AcidFadeCalculator, AmberFadeCalculator } from 'csgo-fade-percentage-calculator';
import Decimal from 'decimal.js';
import type { DopplerPhase, ItemStyle } from '../@typings/FloatTypes';
import { getPriceMapping } from '../handlers/mappinghandler';
import { MarketSource } from './globals';
import { synchronizePlanWithStorage } from './jwt';
import { phaseMapping } from './patterns';
import type { SettingsUser } from './storage';

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

export function getFadePercentage(weapon: string, skin: string, paintSeed: number) {
	if (skin.includes('Amber Fade')) {
		return { ...AmberFadeCalculator.getFadePercentage(weapon, paintSeed), background: 'linear-gradient(to right,#627d66,#896944,#3b2814)' };
	}
	if (skin.includes('Acid Fade')) {
		return { ...AcidFadeCalculator.getFadePercentage(weapon, paintSeed), background: 'linear-gradient(to right,#6d5f55,#76c788, #574828)' };
	}
	return null;
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
		console.log('[BetterFloat] Forced history rewrite:', url.href);
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
 * Checks if the user has a pro plan and validate the plan
 * @param user
 * @returns
 */
export async function checkUserPlanPro(user: SettingsUser) {
	if (user.plan.type === 'pro' && lastProCheck + 5 * 60 * 1000 < new Date().getTime()) {
		user = await synchronizePlanWithStorage();
		lastProCheck = new Date().getTime();
	}

	return user.plan.type === 'pro';
}

/**
 * Buff regulated items are not allowed to be sold on Buff. This function checks if an item is banned.
 * @param name
 * @returns
 */
export function isBuffBannedItem(name: string) {
	const bannedItems = ['2020 RMR Legends', '2020 RMR Contenders', '2020 RMR Challengers'];
	return (!name.includes('Case Hardened') && name.includes('Case')) || name.includes('Capsule') || name.includes('Package') || name.includes('Patch Pack') || bannedItems.includes(name);
}

export function getMarketURL({ source, buff_name, market_id = 0, phase }: { source: MarketSource; buff_name: string; market_id?: number | string; phase?: DopplerPhase }) {
	switch (source) {
		case MarketSource.Buff: {
			if (Number(market_id) === 0) {
				return `https://buff.163.com/market/csgo#tab=selling&page_num=1&search=${encodeURIComponent(buff_name)}`;
			}
			return `https://buff.163.com/goods/${market_id}${phase ? `#tag_ids=${phaseMapping[market_id][phase]}` : ''}`;
		}
		case MarketSource.Steam:
			return `https://steamcommunity.com/market/listings/730/${encodeURIComponent(buff_name)}`;
		case MarketSource.YouPin:
			if (Number(market_id) > 0) {
				return `https://youpin898.com/goodInfo?id=${market_id}`;
			}
			return `https://youpin898.com/market/csgo?gameId=730&search=${encodeURIComponent(buff_name)}`;
		case MarketSource.C5Game: {
			if (market_id && market_id !== -1) {
				return `https://www.c5game.com/en/csgo/${market_id}/${encodeURIComponent(buff_name.split(' (')[0])}/sell`;
			} else {
				return `https://www.c5game.com/en/csgo?marketKeyword=${encodeURIComponent(buff_name)}`;
			}
		}
		case MarketSource.CSFloat:
			return `https://csfloat.com/search?sort_by=lowest_price&type=buy_now&market_hash_name=${encodeURIComponent(buff_name)}`;
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

	if (source === MarketSource.Buff && itemStyle !== '' && itemStyle !== 'Vanilla') {
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
		console.debug(`[BetterFloat] No price mapping found for ${buff_name}`);
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
 * Get a coloring for a specific charm.
 * Colors from: https://www.figma.com/colors/
 * @param pattern 0-100000
 * @param itemName e.g. Lil' Ava
 * @returns [backgroundColor, foregroundColor]
 */
export function getCharmColoring(pattern: number, itemName: string) {
	const colorWhite = '#ffffffb3';
	const COLORS = {
		Gold: ['#efbf04', colorWhite],
		GoldenYellow: ['#ffdf00', colorWhite],
		MetallicGold: ['#d4af37', colorWhite],
		Yellow: ['#ffde21', colorWhite],
		DarkYellow: ['#ba8e23', colorWhite],
		YellowGreen: ['#ccff00', colorWhite],
		Orange: ['#ffa500', colorWhite],
		Copper: ['#c68346', colorWhite],
		Green: ['#008000', colorWhite],
		MintGreen: ['#98fbcb', colorWhite],
		Cyan: ['#00ffff', colorWhite],
		BabyBlue: ['#305cde', colorWhite],
		RoyalBlue: ['#305cde', colorWhite],
		PurpleBlue: ['#0047ab', colorWhite],
		Magenta: ['#fd3db5', colorWhite],
		RoyalPurple: ['#6c3baa', colorWhite],
		Violet: ['#7f00ff', colorWhite],
		Fuchisa: ['#ff00ff', colorWhite],
		ChiliRed: ['#cd1c18', colorWhite],
		RedBrown: ['#942222', colorWhite],
		Mocha: ['#6d3b07', colorWhite],
		Grey: ['#c1ceff', colorWhite],
	} as const;
	switch (itemName) {
		case 'Die-cast AK': {
			if (pattern < 1000) {
				return COLORS.GoldenYellow;
			} else if (pattern < 15000) {
				return COLORS.MetallicGold;
			} else if (pattern < 20000) {
				return COLORS.Orange;
			} else if (pattern < 22500) {
				return COLORS.ChiliRed;
			} else if (pattern < 50000) {
				return COLORS.Fuchisa;
			} else if (pattern < 60000) {
				return COLORS.Magenta;
			} else if (pattern < 83000) {
				return COLORS.Violet;
			} else if (pattern < 93000) {
				return COLORS.RoyalBlue;
			} else {
				return COLORS.BabyBlue;
			}
		}
		case 'Baby Karat T':
		case 'Baby Karat CT': {
			if (pattern < 61000) {
				return COLORS.Copper;
			} else {
				return COLORS.Gold;
			}
		}
		case 'Semi-Precious': {
			if (pattern < 38000) {
				return COLORS.MintGreen;
			} else if (pattern < 75000) {
				return COLORS.BabyBlue;
			} else {
				return COLORS.RoyalPurple;
			}
		}
		case "Lil' Squirt": {
			if (pattern < 28000) {
				return COLORS.Green;
			} else if (pattern < 57000) {
				return COLORS.PurpleBlue;
			} else if (pattern < 75000) {
				return COLORS.RoyalPurple;
			} else {
				return COLORS.Fuchisa;
			}
		}
		case 'Titeenium AWP': {
			if (pattern < 18000) {
				return COLORS.YellowGreen;
			} else if (pattern < 70000) {
				return COLORS.Green;
			} else if (pattern < 80000) {
				return COLORS.RoyalBlue;
			} else {
				return COLORS.RoyalPurple;
			}
		}
		case 'Hot Hands': {
			if (pattern < 55000) {
				return COLORS.Magenta;
			} else if (pattern < 77000) {
				return COLORS.ChiliRed;
			} else {
				return COLORS.Orange;
			}
		}
		case 'Disco MAC': {
			if (pattern < 27000) {
				return COLORS.RoyalPurple;
			} else if (pattern < 40000) {
				return COLORS.Fuchisa;
			} else if (pattern < 55000) {
				return COLORS.Yellow;
			} else if (pattern < 85000) {
				return COLORS.MintGreen;
			} else {
				return COLORS.RoyalBlue;
			}
		}
		case 'Glamour Shot': {
			if (pattern < 5000) {
				return COLORS.ChiliRed;
			} else if (pattern < 35000) {
				return COLORS.Fuchisa;
			} else if (pattern < 55000) {
				return COLORS.Yellow;
			} else if (pattern < 75000) {
				return COLORS.PurpleBlue;
			} else {
				return COLORS.RoyalBlue;
			}
		}
		case 'Hot Howl': {
			if (pattern < 31500) {
				return COLORS.ChiliRed;
			} else if (pattern < 67000) {
				return COLORS.Orange;
			} else {
				return COLORS.MetallicGold;
			}
		}
		case "Lil' Monster": {
			if (pattern < 400) {
				return COLORS.ChiliRed;
			} else if (pattern < 42000) {
				return COLORS.Yellow;
			} else if (pattern < 90000) {
				return COLORS.MintGreen;
			} else {
				return COLORS.Cyan;
			}
		}
		case "Lil' Squatch": {
			if (pattern < 5000) {
				return COLORS.Orange;
			} else if (pattern < 25000) {
				return COLORS.Yellow;
			} else if (pattern < 45000) {
				return COLORS.Green;
			} else if (pattern < 72000) {
				return COLORS.RoyalBlue;
			} else {
				return COLORS.RoyalPurple;
			}
		}
		case "Lil' Sandy": {
			if (pattern < 2000) {
				return COLORS.RedBrown;
			} else if (pattern < 20000) {
				return COLORS.Mocha;
			} else if (pattern < 45000) {
				return COLORS.Green;
			} else if (pattern < 80000) {
				return COLORS.RoyalBlue;
			} else {
				return COLORS.RoyalPurple;
			}
		}
		case "Lil' Whiskers": {
			if (pattern < 5000) {
				return COLORS.PurpleBlue;
			} else if (pattern < 27000) {
				return COLORS.RoyalPurple;
			} else if (pattern < 47000) {
				return COLORS.Fuchisa;
			} else if (pattern < 55000) {
				return COLORS.DarkYellow;
			} else if (pattern < 63000) {
				return COLORS.Yellow;
			} else if (pattern < 85000) {
				return COLORS.MintGreen;
			} else {
				return COLORS.Cyan;
			}
		}
		case "That's Bananas": {
			if (pattern < 8000) {
				return COLORS.Mocha;
			} else if (pattern < 92000) {
				return COLORS.Yellow;
			} else {
				return COLORS.Green;
			}
		}
		case "Chicken Lil'": {
			if (pattern < 5000) {
				return COLORS.RoyalBlue;
			} else if (pattern < 40000) {
				return COLORS.RoyalPurple;
			} else if (pattern < 50000) {
				return COLORS.Fuchisa;
			} else if (pattern < 75000) {
				return COLORS.Yellow;
			} else {
				return COLORS.Green;
			}
		}
		case 'Big Kev': {
			if (pattern < 45000) {
				return COLORS.Fuchisa;
			} else if (pattern < 40000) {
				return COLORS.RoyalPurple;
			} else {
				return COLORS.RoyalBlue;
			}
		}
		case "Lil' Crass": {
			if (pattern < 30000) {
				return COLORS.RedBrown;
			} else if (pattern < 55000) {
				return COLORS.Orange;
			} else if (pattern < 75000) {
				return COLORS.Yellow;
			} else if (pattern < 94000) {
				return COLORS.Green;
			} else {
				return COLORS.RoyalBlue;
			}
		}
		case "Lil' SAS": {
			if (pattern < 2000) {
				return COLORS.ChiliRed;
			} else if (pattern < 12000) {
				return COLORS.Orange;
			} else if (pattern < 22000) {
				return COLORS.Yellow;
			} else if (pattern < 60000) {
				return COLORS.Green;
			} else if (pattern < 80000) {
				return COLORS.RoyalBlue;
			} else {
				return COLORS.RoyalPurple;
			}
		}
		case 'Hot Sauce': {
			if (pattern < 10000) {
				return COLORS.ChiliRed;
			} else if (pattern < 15000) {
				return COLORS.Copper;
			} else if (pattern < 38000) {
				return COLORS.RedBrown;
			} else if (pattern < 62000) {
				return COLORS.Orange;
			} else if (pattern < 85000) {
				return COLORS.Mocha;
			} else {
				return COLORS.Yellow;
			}
		}
		case "Pinch O' Salt": {
			if (pattern < 3000) {
				return COLORS.RoyalBlue;
			} else if (pattern < 30000) {
				return COLORS.RoyalPurple;
			} else if (pattern < 39000) {
				return COLORS.Fuchisa;
			} else if (pattern < 42000) {
				return COLORS.RedBrown;
			} else if (pattern < 48000) {
				return COLORS.Mocha;
			} else if (pattern < 61000) {
				return COLORS.Yellow;
			} else if (pattern < 92000) {
				return COLORS.Green;
			} else {
				return COLORS.Cyan;
			}
		}
		case "Lil' Ava": {
			if (pattern < 30000) {
				return COLORS.Green;
			} else if (pattern < 55000) {
				return COLORS.Mocha;
			} else if (pattern < 73000) {
				return COLORS.RedBrown;
			} else {
				return COLORS.RoyalPurple;
			}
		}
		default: {
			return COLORS.Grey;
		}
	}
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
