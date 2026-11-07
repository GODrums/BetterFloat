import { describe, expect, test } from 'bun:test';
import { cacheSkinplaceMarketItems, getSpecificSkinplaceMarketItem, type SkinplaceMarketItemLookup } from '~contents/skinplace/cache';
import { SKINPLACE_MARKET_IMAGE_SELECTOR } from '~contents/skinplace/market';
import type { Skinplace } from '~lib/@typings/SkinplaceTypes';

function marketItem(overrides: Partial<Skinplace.GetItem> = {}): Skinplace.GetItem {
	return {
		id: 100,
		cdn_icon_url: '730/redline',
		steam_market_hash_name: 'AK-47 | Redline (Field-Tested)',
		price_market: 25,
		is_stattrak: 0,
		steam_is_souvenir: 0,
		shorten_exterior: 'FT',
		steam_exterior: 'Field-Tested',
		...overrides,
	} as Skinplace.GetItem;
}

function lookup(cdnIconUrl: string, overrides: Partial<SkinplaceMarketItemLookup> = {}) {
	return getSpecificSkinplaceMarketItem({ cdnIconUrl, isStatTrak: false, isSouvenir: false, exterior: 'FT', ...overrides });
}

async function cardImages(markup: string) {
	const sources: string[] = [];
	await new HTMLRewriter()
		.on(SKINPLACE_MARKET_IMAGE_SELECTOR, {
			element(element) {
				const src = element.getAttribute('src');
				if (src) sources.push(src);
			},
		})
		.transform(new Response(markup))
		.text();
	return sources;
}

describe('Skinplace market preview matching', () => {
	test('still matches default Steam previews without screenshot data', async () => {
		const item = marketItem();
		cacheSkinplaceMarketItems({ status: 'success', items: [item] });

		const sources = await cardImages('<div class="base-item-card__item-image"><img src="https://cdn.skin.place/730/redline/d/240x180.webp?width=180"></div>');
		expect(sources).toHaveLength(1);
		expect(lookup(sources[0]!)).toEqual(item);
		expect(lookup('/730/redline')).toEqual(item);
		expect(lookup('https://cdn.skin.place/730/redline/d/320x240.webp')).toEqual(item);
	});

	test('finds nested screenshot previews without selecting stickers or other card icons', async () => {
		const item = marketItem({
			id: 101,
			screenshots: [
				{ side: 'front', icon_url: 'screenshots/101/front/image.webp' },
				{ side: 'back', icon_url: 'screenshots/101/back/image.webp' },
			],
		});
		cacheSkinplaceMarketItems({ status: 'success', items: [item] });

		const sources = await cardImages(`
			<div class="base-item-card">
				<div class="base-item-card__stickers"><img src="https://cdn.skin.place/730/sticker.png"></div>
				<div class="base-item-card__item-image">
					<div class="base-item-card__screenshots">
						<img class="base-item-card__screenshot base-item-card__screenshot_active" src="https://cdn.skin.place/screenshots/101/front/image.webp">
						<img class="base-item-card__screenshot" src="https://cdn.skin.place/screenshots/101/back/image.webp">
					</div>
				</div>
				<img src="/images/icons/cart.svg">
			</div>
		`);
		expect(sources).toHaveLength(2);
		for (const source of sources) expect(lookup(source)).toEqual(item);
		// The Steam image is still usable before the screenshots finish loading.
		expect(lookup(item.cdn_icon_url)).toEqual(item);
	});

	test('keeps listing prices distinct when screenshots belong to skins sharing a Steam image', () => {
		const first = marketItem({
			id: 102,
			price_market: 30,
			screenshots: [{ side: 'front', icon_url: 'screenshots/shared/102/front.webp' }],
		});
		const second = marketItem({
			id: 103,
			price_market: 50,
			screenshots: [{ side: 'front', icon_url: 'https://cdn.skin.place/screenshots/shared/103/front.webp?token=api' }],
		});
		cacheSkinplaceMarketItems({ status: 'success', items: [first, second] });

		expect(lookup('https://cdn.skin.place/screenshots/shared/102/front.webp?width=180')).toEqual(first);
		expect(lookup('/screenshots/shared/103/front.webp?token=card')).toEqual(second);
		expect(lookup('screenshots/shared/104/front.webp')).toBeUndefined();
	});

	test('preserves StatTrak, Souvenir, and exterior distinctions for shared icons', () => {
		const regular = marketItem({ id: 104, cdn_icon_url: '730/variants.png' });
		const stattrak = marketItem({ ...regular, id: 105, is_stattrak: 1 });
		const souvenir = marketItem({ ...regular, id: 106, steam_is_souvenir: 1 });
		const factoryNew = marketItem({ ...regular, id: 107, shorten_exterior: 'FN', steam_exterior: 'Factory New' });
		cacheSkinplaceMarketItems({ status: 'success', items: [regular, stattrak, souvenir, factoryNew] });

		expect(lookup(regular.cdn_icon_url)).toEqual(regular);
		expect(lookup(regular.cdn_icon_url, { isStatTrak: true })).toEqual(stattrak);
		expect(lookup(regular.cdn_icon_url, { isSouvenir: true })).toEqual(souvenir);
		expect(lookup(regular.cdn_icon_url, { exterior: 'FN' })).toEqual(factoryNew);
	});

	test('accepts null or empty screenshot lists and falls back to full exterior names', () => {
		const nullScreenshots = marketItem({ id: 108, cdn_icon_url: '730/null.png', screenshots: null, shorten_exterior: '' });
		const emptyScreenshots = marketItem({ id: 109, cdn_icon_url: '730/empty.png', screenshots: [] });
		cacheSkinplaceMarketItems({ status: 'success', items: [nullScreenshots, emptyScreenshots] });

		expect(lookup(nullScreenshots.cdn_icon_url, { exterior: 'Field-Tested' })).toEqual(nullScreenshots);
		expect(lookup(emptyScreenshots.cdn_icon_url)).toEqual(emptyScreenshots);
	});
});
