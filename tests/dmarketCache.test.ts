import { describe, expect, test } from 'bun:test';
import { cacheDMarketItems, getDMarketItemPrice, getDMarketPaintSeed, getDMarketPhase, getSpecificDMarketItem } from '~contents/dmarket/cache';
import type { DMarket } from '~lib/@typings/DMarketTypes';

describe('DMarket redesign listings', () => {
	test('uses v2 offer data for IDs, Doppler phases, patterns, and prices', () => {
		const offer = {
			offerId: 'Offer-ID',
			assetId: 'Asset-ID',
			priceCents: 12345,
			title: '★ Bayonet | Doppler (Factory New)',
			cs2: {
				exterior: 'factory new',
				category: 'knife',
				quality: 'covert',
				floatValue: '0.01',
				phase: 'phase-4',
				paintSeed: 321,
			},
		} as DMarket.MarketOfferV2;

		cacheDMarketItems([offer]);

		expect(getSpecificDMarketItem('asset-id')).toBe(offer);
		expect(getSpecificDMarketItem('OFFER-ID')).toBe(offer);
		expect(getDMarketPhase(offer)).toBe('phase-4');
		expect(getDMarketPaintSeed(offer)).toBe(321);
		expect(getDMarketItemPrice(offer, '')?.toNumber()).toBe(123.45);
	});

	test('uses the displayed inventory and trade prices for redesign user assets', () => {
		const asset = {
			itemId: 'Inventory-Asset-ID',
			title: 'AK-47 | Aphrodite (Factory New)',
			price: { DMC: '', USD: '30000' },
			instantPrice: { DMC: '', USD: '10000' },
			exchangePrice: { DMC: '', USD: '20000' },
			cs2: {
				phase: '',
				paintSeed: 777,
			},
		} as DMarket.Asset;

		cacheDMarketItems([asset]);

		expect(getSpecificDMarketItem('inventory-asset-id')).toBe(asset);
		expect(getDMarketPaintSeed(asset)).toBe(777);
		expect(getDMarketItemPrice(asset, '?exchangeTab=myItems').toNumber()).toBe(100);
		expect(getDMarketItemPrice(asset, '?exchangeTab=exchange').toNumber()).toBe(200);
	});
});
