import { describe, expect, test } from 'bun:test';
import { cacheWaxpeerItems, findWaxpeerItemByName, getSpecificWaxpeerItem } from '~contents/waxpeer/cache';
import type { Waxpeer } from '~lib/@typings/WaxpeerTypes';

describe('Waxpeer Nuxt listings', () => {
	test('indexes the minimal listing data exposed by the page-state bridge', () => {
		const item = {
			item_id: 'listing-123',
			name: '★ Butterfly Knife | Gamma Doppler (Factory New)',
			price: 9_000_000,
		} satisfies Waxpeer.Listing;

		cacheWaxpeerItems([item]);

		expect(getSpecificWaxpeerItem('listing-123')).toMatchObject(item);
		expect(findWaxpeerItemByName(`FN 0.0185370 ${item.name} Emerald`)).toMatchObject(item);
	});

	test('prefers the first card name over later sticker tooltip names', () => {
		const skin = { item_id: 'skin', name: 'AK-47 | Redline (Field-Tested)', price: 123_000 } satisfies Waxpeer.Listing;
		const sticker = { item_id: 'sticker', name: 'Sticker | Very Long Tournament Name (Holo)', price: 10_000 } satisfies Waxpeer.Listing;
		cacheWaxpeerItems([skin, sticker]);

		expect(findWaxpeerItemByName(`${skin.name} ${sticker.name}`)).toMatchObject(skin);
	});

	test('ignores malformed state objects instead of poisoning the cache', () => {
		cacheWaxpeerItems([{ item_id: 'invalid', name: '', price: Number.NaN }]);
		expect(getSpecificWaxpeerItem('invalid')).toBeUndefined();
	});
});
