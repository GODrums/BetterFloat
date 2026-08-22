import { describe, expect, spyOn, test } from 'bun:test';
import { parseCSMoneyAstroItems } from '../src/contents/csmoney/astro';
import type { CSMoney } from '../src/lib/@typings/CsmoneyTypes';
import { CSMONEY_SELECTORS } from '../src/lib/handlers/selectors/csmoney_selectors';

describe('CS.MONEY Astro page data', () => {
	test('parses market and trade inventories', () => {
		const marketItem = { appId: 730, id: 1 } as CSMoney.MarketItem;
		const botItem = { appId: 730, id: 2 } as CSMoney.InventoryItem;
		const userItem = { appId: 730, id: 3 } as CSMoney.InventoryItem;

		const serialized = JSON.stringify({
			inventory: { items: [marketItem] },
			botsInventory: { items: [botItem] },
			userInventory: { items: [userItem] },
		});

		expect(parseCSMoneyAstroItems(serialized)).toEqual({
			market: [marketItem],
			bots: [botItem],
			user: [userItem],
		});
	});

	test('returns empty inventories for invalid page data', () => {
		const debug = spyOn(console, 'debug').mockImplementation(() => {});
		const emptyItems = { market: [], bots: [], user: [] };
		expect(parseCSMoneyAstroItems('{}')).toEqual(emptyItems);
		expect(parseCSMoneyAstroItems('{invalid')).toEqual(emptyItems);
		expect(parseCSMoneyAstroItems(null)).toEqual(emptyItems);
		debug.mockRestore();
	});
});

describe('CS.MONEY trade selectors', () => {
	test('target card attributes and the div-based price area', () => {
		expect(CSMONEY_SELECTORS.trade.itemCard).toContain('data-card-item-id');
		expect(CSMONEY_SELECTORS.trade.itemCard).toContain('data-card-id');
		expect(CSMONEY_SELECTORS.trade.footer).not.toContain('footer ');
		expect(CSMONEY_SELECTORS.trade.footer).toBe('div[class*="BaseCard_price__"] > div');
		expect(CSMONEY_SELECTORS.trade.price).toBe('span[class*="price_currency__"]');
	});
});
