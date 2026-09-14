import { describe, expect, test } from 'bun:test';
import { extractWaxpeerItemPageListings } from '~contents/waxpeer/cache';

describe('Waxpeer item-page listings', () => {
	test('extracts the displayed item and similar orders from the item response', () => {
		const listings = extractWaxpeerItemPageListings({
			item: { item_id: 'main', name: 'AK-47 | Wild Lotus (Factory New)', price: 15_825_482 },
			similar: [
				{ item_id: 'similar-1', name: 'AK-47 | Wild Lotus (Factory New)', price: 15_825_641 },
				{ item_id: 'similar-2', name: 'AK-47 | Wild Lotus (Factory New)', price: 15_857_111 },
			],
			variants: [{ item_id: 'variant', name: 'AK-47 | Wild Lotus (Minimal Wear)', price: 10_977_670 }],
		});

		expect(listings.map((item) => item.item_id)).toEqual(['main', 'similar-1', 'similar-2', 'variant']);
	});

	test('ignores unrelated item-response metadata', () => {
		expect(extractWaxpeerItemPageListings({ item: null, similar: [{ name: 'missing id', price: 1000 }], attributes: { name: 'not a listing' } })).toEqual([]);
	});
});
