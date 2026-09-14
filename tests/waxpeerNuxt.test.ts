import { describe, expect, spyOn, test } from 'bun:test';
import { parseWaxpeerNuxtItems } from '~contents/waxpeer/nuxt';

describe('Waxpeer Nuxt SSR payload', () => {
	test('extracts listings from Nuxt devalue references', () => {
		const payload = JSON.stringify([
			{ data: 1 },
			{ items: 2 },
			[3],
			{ item_id: 4, name: 5, price: 6, phase: 7 },
			'listing-123',
			'★ Butterfly Knife | Gamma Doppler (Factory New)',
			9_000_000,
			'Emerald',
		]);

		expect(parseWaxpeerNuxtItems(payload)).toEqual([
			{
				item_id: 'listing-123',
				name: '★ Butterfly Knife | Gamma Doppler (Factory New)',
				price: 9_000_000,
				phase: 'Emerald',
			},
		]);
	});

	test('supports direct JSON payloads and safely rejects invalid data', () => {
		const debug = spyOn(console, 'debug').mockImplementation(() => {});
		const payload = JSON.stringify({ data: { items: [{ listingId: 42, marketHashName: 'AK-47 | Redline (Field-Tested)', price: '123450' }] } });

		expect(parseWaxpeerNuxtItems(payload)).toEqual([{ item_id: '42', name: 'AK-47 | Redline (Field-Tested)', price: 123450, phase: undefined }]);
		expect(parseWaxpeerNuxtItems('{invalid')).toEqual([]);
		expect(parseWaxpeerNuxtItems(null)).toEqual([]);
		debug.mockRestore();
	});
});
