import { describe, expect, test } from 'bun:test';
import { cacheBuffMarketItems, deleteBuffMarketItems, getBuffMarketItem } from '../src/contents/buffmarket/cache';
import { parseBuffMarketGoodsIdentifier } from '../src/contents/buffmarket/identifiers';
import type { BuffMarket } from '../src/lib/@typings/BuffmarketTypes';

describe('Buff Market goods identifiers', () => {
	test('parses current MarketHashName routes', () => {
		expect(parseBuffMarketGoodsIdentifier('/market/goods/cs2/AK-47%20%7C%20Redline%20%28Field-Tested%29', 'https://buff.market')).toBe('AK-47 | Redline (Field-Tested)');
	});

	test('keeps supporting legacy numeric routes', () => {
		expect(parseBuffMarketGoodsIdentifier('/market/goods/22', 'https://buff.market')).toBe(22);
	});

	test('indexes API goods by both ID and MarketHashName', () => {
		const item = {
			id: 22,
			market_hash_name: 'AK-47 | Redline (Field-Tested)',
		} as unknown as BuffMarket.MarketListing;

		deleteBuffMarketItems();
		cacheBuffMarketItems([item]);

		expect(getBuffMarketItem('AK-47 | Redline (Field-Tested)')).toBe(item);
		expect(getBuffMarketItem(22)).toBe(item);
	});
});
