import { describe, expect, spyOn, test } from 'bun:test';
import { parseCSMoneyAstroItems } from '../src/contents/csmoney/astro';
import { cacheCSMoneyItems, getCSMoneyItem } from '../src/contents/csmoney/cache';
import type { CSMoney } from '../src/lib/@typings/CsmoneyTypes';

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

	test('indexes cached items by card item ID', () => {
		const marketItem = { appId: 730, id: 11 } as CSMoney.MarketItem;
		const inventoryItem = { appId: 730, id: 12, assetId: 13 } as CSMoney.InventoryItem;

		cacheCSMoneyItems([marketItem, inventoryItem]);

		expect(getCSMoneyItem(11)).toBe(marketItem);
		expect(getCSMoneyItem(12)).toBe(inventoryItem);
		expect(getCSMoneyItem(13)).toBe(inventoryItem);
	});
});
