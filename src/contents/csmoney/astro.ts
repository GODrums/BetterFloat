import type { CSMoney } from '~lib/@typings/CsmoneyTypes';

type CSMoneyAstroPageParams = {
	inventory?: {
		items?: CSMoney.MarketItem[];
	};
	botsInventory?: {
		items?: CSMoney.InventoryItem[];
	};
	userInventory?: {
		items?: CSMoney.InventoryItem[];
	};
};

export type CSMoneyAstroItems = {
	market: CSMoney.MarketItem[];
	bots: CSMoney.InventoryItem[];
	user: CSMoney.InventoryItem[];
};

/**
 * CS.MONEY's Astro pages server-render the initial inventory into this JSON
 * payload. Those items never pass through fetch or XMLHttpRequest in the
 * browser, so the content script needs to hydrate its cache from the payload.
 */
export function parseCSMoneyAstroItems(serializedPageParams: string | null | undefined): CSMoneyAstroItems {
	const emptyItems = { market: [], bots: [], user: [] };
	if (!serializedPageParams) return emptyItems;

	try {
		const pageParams = JSON.parse(serializedPageParams) as CSMoneyAstroPageParams;
		console.log('[BetterFloat] Parsed CS.MONEY Astro page params:', pageParams);
		return {
			market: Array.isArray(pageParams.inventory?.items) ? pageParams.inventory.items : [],
			bots: Array.isArray(pageParams.botsInventory?.items) ? pageParams.botsInventory.items : [],
			user: Array.isArray(pageParams.userInventory?.items) ? pageParams.userInventory.items : [],
		};
	} catch (error) {
		console.debug('[BetterFloat] Failed to parse CS.MONEY Astro page params:', error);
		return emptyItems;
	}
}
