import type { CSMoney } from '~lib/@typings/CsmoneyTypes';

type CSMoneyAstroPageParams = {
	inventory?: {
		items?: CSMoney.MarketItem[];
	};
};

/**
 * CS.MONEY's Astro pages server-render the initial inventory into this JSON
 * payload. Those items never pass through fetch or XMLHttpRequest in the
 * browser, so the content script needs to hydrate its cache from the payload.
 */
export function parseCSMoneyAstroItems(serializedPageParams: string | null | undefined): CSMoney.MarketItem[] {
	if (!serializedPageParams) return [];

	try {
		const pageParams = JSON.parse(serializedPageParams) as CSMoneyAstroPageParams;
		return Array.isArray(pageParams.inventory?.items) ? pageParams.inventory.items : [];
	} catch (error) {
		console.debug('[BetterFloat] Failed to parse CS.MONEY Astro page params:', error);
		return [];
	}
}
