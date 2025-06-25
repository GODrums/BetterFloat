import Fuse from 'fuse.js';
import marketIds from '@/assets/marketids.json';
import type { Extension } from '~lib/@typings/ExtensionTypes';
import { MarketSource } from '~lib/util/globals';
import { getMarketURL } from '~lib/util/helperfunctions';

// Keyword mapping => corresponding market source
const KEYWORDS: Record<string, MarketSource> = {
	buff: MarketSource.Buff,
	buff163: MarketSource.Buff,
	steam: MarketSource.Steam,
	uu: MarketSource.YouPin,
	youpin: MarketSource.YouPin,
	c5: MarketSource.C5Game,
	c5game: MarketSource.C5Game,
	csf: MarketSource.CSFloat,
	float: MarketSource.CSFloat,
	csfloat: MarketSource.CSFloat,
	csmoney: MarketSource.CSMoney,
	dmarket: MarketSource.DMarket,
	bitskins: MarketSource.Bitskins,
	buffmarket: MarketSource.BuffMarket,
	lisskins: MarketSource.Lisskins,
	skinbid: MarketSource.Skinbid,
	skinport: MarketSource.Skinport,
	pricempire: MarketSource.Pricempire,
	marketcsgo: MarketSource.Marketcsgo,
};

const SOURCE_TEXT: Record<MarketSource, string> = {
	[MarketSource.Buff]: 'Buff',
	[MarketSource.Steam]: 'Steam',
	[MarketSource.YouPin]: 'YouPin',
	[MarketSource.C5Game]: 'C5Game',
	[MarketSource.CSFloat]: 'CSFloat',
	[MarketSource.CSMoney]: 'CSMoney',
	[MarketSource.DMarket]: 'DMarket',
	[MarketSource.Bitskins]: 'Bitskins',
	[MarketSource.BuffMarket]: 'BuffMarket',
	[MarketSource.Lisskins]: 'Lisskins',
	[MarketSource.Skinbid]: 'Skinbid',
	[MarketSource.Skinport]: 'Skinport',
	[MarketSource.None]: 'None',
	[MarketSource.Pricempire]: 'Pricempire',
	[MarketSource.Marketcsgo]: 'MarketCSGO',
};

// Map MarketSource -> property key in marketIds.json
const MARKET_ID_PROP: Record<MarketSource, string | null> = {
	[MarketSource.None]: null,
	[MarketSource.Buff]: 'buff',
	[MarketSource.Steam]: null, // steam uses query search only
	[MarketSource.YouPin]: 'uu',
	[MarketSource.C5Game]: 'c5',
	[MarketSource.CSFloat]: null,
	[MarketSource.CSMoney]: null,
	[MarketSource.DMarket]: null,
	[MarketSource.Bitskins]: null,
	[MarketSource.BuffMarket]: null,
	[MarketSource.Lisskins]: null,
	[MarketSource.Skinbid]: null,
	[MarketSource.Skinport]: null,
	[MarketSource.Pricempire]: null,
	[MarketSource.Marketcsgo]: null,
};

// Initialize Fuse.js for fuzzy searching
const fuse = new Fuse(Object.keys(marketIds), {
	threshold: 0.5, // Lower = more strict, higher = more fuzzy (0.0 = perfect match, 1.0 = match anything)
	distance: 100, // Maximum distance for a match
	minMatchCharLength: 2, // Minimum character length to match
	ignoreLocation: true, // Don't give preference to matches at the beginning
	includeScore: true, // Include match score for sorting
	findAllMatches: false, // Stop after finding enough matches
});

chrome.omnibox.setDefaultSuggestion({
	description: 'Search CS2 skins on markets — Use: &lt;market&gt; &lt;skin name&gt; (markets: ' + Object.keys(KEYWORDS).join(', ') + ') or just &lt;skin name&gt; for all markets',
});

function getMarketId(buffName: string, source: MarketSource): number | string | undefined {
	if (source === MarketSource.Pricempire) return undefined;
	const entry = marketIds[buffName] as Partial<Extension.MarketIDEntry> | undefined;
	if (!entry) return undefined;
	const prop = MARKET_ID_PROP[source];
	if (!prop) return undefined;
	return entry[prop];
}

chrome.omnibox.onInputChanged.addListener((text, addSuggestions) => {
	const trimmed = text.trim();
	if (!trimmed) {
		addSuggestions([]);
		return;
	}

	const parts = trimmed.split(/\s+/);
	const keywordCandidate = parts[0].toLowerCase();
	const source = KEYWORDS[keywordCandidate];
	const query = source ? parts.slice(1).join(' ') : trimmed;
	if (query.length < 2) {
		addSuggestions([]);
		return;
	}

	// Use Fuse.js for fuzzy searching
	const results = fuse.search(query);

	// Take only the top 6 results and sort by score (lower score = better match)
	const topResults = results.sort((a, b) => (a.score ?? 0) - (b.score ?? 0)).slice(0, 6);

	const suggestions: chrome.omnibox.SuggestResult[] = topResults.map((result) => {
		const name = result.item;
		// default to Buff if no source is provided
		const targetSource = source ?? MarketSource.Buff;
		const marketId = getMarketId(name, targetSource);
		const url = getMarketURL({ source: targetSource, buff_name: name, market_id: marketId ?? 0 });

		// capitalize first letter
		const targetSourceText = SOURCE_TEXT[targetSource];

		// Format the description with match highlighting potential
		const description = `[${targetSourceText}] ${name}`;

		return {
			content: url,
			description: description,
		};
	});

	addSuggestions(suggestions);
});

chrome.omnibox.onInputEntered.addListener((text, disposition) => {
	const url = text;

	const openInTab = (bg: boolean) => chrome.tabs.create({ url, active: !bg });
	switch (disposition) {
		case 'currentTab':
			chrome.tabs.update({ url });
			break;
		case 'newForegroundTab':
			openInTab(false);
			break;
		case 'newBackgroundTab':
			openInTab(true);
			break;
	}
});
