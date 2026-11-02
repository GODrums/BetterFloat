import type { WhiteMarket } from '~lib/@typings/WhitemarketTypes';

const whiteMarketItems: { [slug: string]: WhiteMarket.Listing } = {};
const whiteMarketInventory = new Map<string, WhiteMarket.Item>();

export function cacheWhiteMarketItems(data: WhiteMarket.Listing[]) {
	for (const item of data) {
		whiteMarketItems[item.slug] = item;
	}
}

export function cacheWhiteMarketInventory(data: WhiteMarket.Item[]) {
	for (const item of data) {
		if (item?.id && item.description) {
			whiteMarketInventory.set(item.id, item);
		}
	}
}

export function getWhiteMarketItem(slug: string) {
	return whiteMarketItems[slug];
}

/** What can be read from an inventory card in the DOM */
export type WhiteMarketInventoryCard = {
	icon?: string;
	short?: string;
	skin?: string;
	float?: number;
	isStatTrak: boolean;
};

/** Strips the size suffix (e.g. `/400fx300f`) so icons of different sizes compare equal */
function normalizeIcon(url: string | undefined) {
	return url?.replace(/\/\d+fx\d+f$/, '') ?? '';
}

/**
 * The inventory grid is virtualized, so DOM order says nothing about API order.
 * Cards are matched by icon first and narrowed down by name, StatTrak and float.
 * Remaining ties share the same market hash name, which is all pricing needs.
 */
export function findWhiteMarketInventoryItem(card: WhiteMarketInventoryCard) {
	let candidates = [...whiteMarketInventory.values()];
	if (candidates.length === 0) return undefined;

	const icon = normalizeIcon(card.icon);
	const byIcon = icon ? candidates.filter((item) => normalizeIcon(item.description.iconLarge) === icon || normalizeIcon(item.description.icon) === icon) : [];
	if (byIcon.length > 0) {
		candidates = byIcon;
	} else {
		// without an icon match, require the names to match to avoid pricing the wrong item
		if (!card.skin && !card.short) return undefined;
		candidates = candidates.filter((item) => (!card.skin || item.description.skin === card.skin) && (!card.short || item.description.short === card.short));
	}

	const narrow = (predicate: (item: WhiteMarket.Item) => boolean) => {
		const filtered = candidates.filter(predicate);
		if (filtered.length > 0) candidates = filtered;
	};
	if (card.skin) narrow((item) => item.description.skin === card.skin);
	if (card.short) narrow((item) => item.description.short === card.short);
	// only trust a positive signal: the label may not show StatTrak at all
	if (card.isStatTrak) narrow((item) => !!item.description.isStatTrak);
	if (card.float !== undefined) {
		// the card shows a float rounded/truncated to 4 decimals
		narrow((item) => item.float != null && Math.abs(Number(item.float) - card.float!) < 0.00011);
	}

	return candidates[0];
}

const NEXT_PUSH_PREFIX = 'self.__next_f.push(';

/**
 * The first page of listings is server-rendered by Next.js and never passes through the
 * GraphQL API, so we read it from the inline RSC payload (`initialItems`) instead.
 */
export function cacheWhiteMarketSSRItems() {
	let payload = '';
	for (const script of document.querySelectorAll('script:not([src])')) {
		const text = script.textContent ?? '';
		const start = text.indexOf(NEXT_PUSH_PREFIX);
		if (start === -1) continue;
		try {
			const chunk = JSON.parse(text.slice(start + NEXT_PUSH_PREFIX.length, text.lastIndexOf(')')));
			if (typeof chunk?.[1] === 'string') payload += chunk[1];
		} catch {
			// not a data chunk
		}
	}

	let count = 0;
	let searchFrom = 0;
	while (true) {
		const keyIndex = payload.indexOf('"initialItems":[', searchFrom);
		if (keyIndex === -1) break;
		const arrayStart = keyIndex + '"initialItems":'.length;
		const arrayEnd = findMatchingBracket(payload, arrayStart);
		if (arrayEnd === -1) break;
		searchFrom = arrayEnd;
		try {
			const listings = (JSON.parse(payload.slice(arrayStart, arrayEnd + 1)) as WhiteMarket.Listing[]).filter((listing) => listing?.slug && listing.item?.description);
			cacheWhiteMarketItems(listings);
			count += listings.length;
		} catch (e) {
			console.debug('[BetterFloat] Failed to parse WhiteMarket initialItems:', e);
		}
	}
	console.debug(`[BetterFloat] Cached ${count} server-rendered WhiteMarket listings`);
}

/** Returns the index of the bracket closing the one at `start`, skipping over JSON strings. */
function findMatchingBracket(text: string, start: number) {
	let depth = 0;
	let inString = false;
	for (let i = start; i < text.length; i++) {
		const char = text[i];
		if (inString) {
			if (char === '\\') i++;
			else if (char === '"') inString = false;
			continue;
		}
		if (char === '"') inString = true;
		else if (char === '[' || char === '{') depth++;
		else if (char === ']' || char === '}') {
			depth--;
			if (depth === 0) return i;
		}
	}
	return -1;
}
