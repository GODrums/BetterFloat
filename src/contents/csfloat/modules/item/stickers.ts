import { html } from 'common-tags';
import Decimal from 'decimal.js';

import type { CSFloat } from '~lib/@typings/FloatTypes';
import { getItemPrice } from '~lib/handlers/mappinghandler';
import type { MarketSource } from '~lib/util/globals';
import { getSPBackgroundColor } from '~lib/util/helperfunctions';

import { getCSFloatSettings } from '../runtime';
import { adjustExistingSP } from './metadata';
import { getCurrencyRate } from './pricing';

export async function addStickerInfo(container: Element, apiItem: CSFloat.ListingData, price_difference: number) {
	if (!apiItem.item?.stickers && !apiItem.item?.keychains) return;

	if (apiItem.item.quality === 12) {
		adjustExistingSP(container);
		addStickerLinks(container, apiItem.item);
		return;
	}

	if (apiItem.item.stickers) {
		let csfSP = container.querySelector('.sticker-percentage');
		if (!csfSP) {
			const newContainer = html`
				<div class="mat-mdc-tooltip-trigger sticker-percentage" style="padding: 5px; background-color: #0003; border-radius: 5px; width: -moz-fit-content; width: fit-content; font-size: 12px; margin-left: 8px; margin-bottom: 4px;"></div>
			`;
			container.querySelector('.sticker-container')?.insertAdjacentHTML('afterbegin', newContainer);
			csfSP = container.querySelector('.sticker-percentage');
		}

		if (csfSP) {
			let difference = price_difference;
			if (apiItem.price === apiItem.auction_details?.reserve_price && !apiItem.auction_details?.top_bid) {
				difference = new Decimal(apiItem.auction_details.reserve_price).div(100).plus(price_difference).toDP(2).toNumber();
			}
			const didChange = await changeSpContainer(csfSP, apiItem.item.stickers, difference);
			if (!didChange) {
				csfSP.remove();
			}
		}
	}

	addStickerLinks(container, apiItem.item);
}

export function addStickerLinks(container: Element, item: CSFloat.Item) {
	let data: CSFloat.StickerData[] = [];
	if (item.keychains) {
		data = data.concat(item.keychains);
	}
	if (item.stickers) {
		data = data.concat(item.stickers);
	}

	const stickerContainers = container.querySelectorAll('.sticker');
	for (let i = 0; i < stickerContainers.length; i++) {
		const stickerContainer = stickerContainers[i];
		const stickerData = data[i];
		if (!stickerData) continue;

		stickerContainer.addEventListener('click', () => {
			const isSouvenirCharm = stickerData.name.includes('Souvenir Charm |');
			const isKeychain = stickerData.name.includes('Charm |');
			const isStickerSlab = stickerData.name.includes('Sticker Slab');

			const stickerURL = new URL('https://csfloat.com/search');
			if (isStickerSlab) {
				stickerURL.searchParams.set('sticker_index', String(stickerData.wrapped_sticker));
			} else if (isSouvenirCharm) {
				stickerURL.searchParams.set('keychain_highlight_reel', String(stickerData.highlight_reel));
			} else if (isKeychain) {
				stickerURL.searchParams.set('keychain_index', String(stickerData.stickerId));
			} else {
				stickerURL.searchParams.set('sticker_index', String(stickerData.stickerId));
			}

			window.open(stickerURL.href, '_blank');
		});
	}
}

export async function changeSpContainer(csfSP: Element, stickers: CSFloat.StickerData[], price_difference: number) {
	const extensionSettings = getCSFloatSettings();
	const source = extensionSettings['csf-pricingsource'] as MarketSource;
	const { userCurrency, currencyRate } = await getCurrencyRate();
	const stickerPrices = await Promise.all(
		stickers.map(async (sticker) => {
			if (!sticker.name) return { csf: 0, buff: 0 };

			const buffPrice = await getItemPrice(sticker.name, source);
			return {
				csf: (sticker.reference?.price ?? 0) / 100,
				buff: buffPrice.starting_at * currencyRate,
			};
		})
	);

	const priceSum = stickerPrices.reduce((a, b) => a + Math.min(b.buff, b.csf), 0);
	const spPercentage = new Decimal(price_difference).div(priceSum).toDP(4);
	csfSP.setAttribute('data-betterfloat', JSON.stringify({ priceSum, spPercentage: spPercentage.toNumber() }));

	if (priceSum < 2) {
		return false;
	}

	if (spPercentage.gt(2) || spPercentage.lt(0.005) || location.pathname === '/sell') {
		const currencyFormatter = new Intl.NumberFormat(undefined, {
			style: 'currency',
			currency: userCurrency,
			currencyDisplay: 'narrowSymbol',
			minimumFractionDigits: 0,
			maximumFractionDigits: 2,
		});
		csfSP.textContent = `${currencyFormatter.format(Number(priceSum.toFixed(0)))} SP`;
	} else {
		csfSP.textContent = (spPercentage.isPos() ? spPercentage.mul(100) : 0).toFixed(1) + '% SP';
	}

	if (location.pathname !== '/sell') {
		(csfSP as HTMLElement).style.backgroundColor = getSPBackgroundColor(spPercentage.toNumber());
	}
	(csfSP as HTMLElement).style.marginBottom = '5px';
	return true;
}
