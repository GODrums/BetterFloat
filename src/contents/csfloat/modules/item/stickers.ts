import Decimal from 'decimal.js';

import type { CSFloat } from '~lib/@typings/FloatTypes';
import { getItemPrice } from '~lib/handlers/mappinghandler';
import type { MarketSource } from '~lib/util/globals';
import { getSPBackgroundColor } from '~lib/util/helperfunctions';

import { getCSFloatSettings } from '../runtime';
import { getCurrencyRate } from './pricing';

/**
 * Restyles CSFloat's native sticker badge (`app-sticker-overpay .sticker-badge`) with our own background.
 * Only the inner badge is touched, so CSFloat's tooltip / details overlay on the host keeps working.
 */
export function styleNativeSPBadge(badge: HTMLElement, background: string) {
	badge.style.background = background;
	badge.style.borderLeft = 'none';
}

function adjustExistingSP(container: Element) {
	const badge = container.querySelector<HTMLElement>('.sticker-percentage .sticker-badge');
	let spValue = badge?.textContent?.trim().split('%')[0];
	if (!spValue || !badge) return;
	if (spValue.startsWith('>')) {
		spValue = spValue.substring(1);
	}

	styleNativeSPBadge(badge, getSPBackgroundColor(Number(spValue) / 100));
}

export async function addStickerInfo(container: Element, apiItem: CSFloat.ListingData, price_difference: number) {
	if (!apiItem.item?.stickers) return;

	// users can choose between our sticker percentage and CSFloat's native one
	if (!getCSFloatSettings()['csf-stickerprices']) {
		addStickerLinks(container, apiItem.item);
		return;
	}

	if (apiItem.item.quality === 12) {
		adjustExistingSP(container);
		addStickerLinks(container, apiItem.item);
		return;
	}

	const csfSP = container.querySelector<HTMLElement>('.sticker-percentage .sticker-badge');
	if (!csfSP) return;

	let difference = price_difference;
	if (apiItem.price === apiItem.auction_details?.reserve_price && !apiItem.auction_details?.top_bid) {
		difference = new Decimal(apiItem.auction_details.reserve_price).div(100).plus(price_difference).toDP(2).toNumber();
	}
	const didChange = await changeSpContainer(csfSP, apiItem.item.stickers, difference);
	if (didChange) {
		csfSP.style.borderLeft = 'none';
	} else {
		// hide instead of remove, as the badge is managed by Angular
		csfSP.style.display = 'none';
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
		if (!stickerContainer || !stickerData) continue;

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

export function formatSPText(spPercentage: Decimal, priceSum: number, currency: string, showSum = false) {
	if (showSum || spPercentage.gt(2) || spPercentage.lt(0.005)) {
		const currencyFormatter = new Intl.NumberFormat(undefined, {
			style: 'currency',
			currency,
			currencyDisplay: 'narrowSymbol',
			minimumFractionDigits: 0,
			maximumFractionDigits: 2,
		});
		return `${currencyFormatter.format(Number(priceSum.toFixed(0)))} SP`;
	}
	return (spPercentage.isPos() ? spPercentage.mul(100) : 0).toFixed(1) + '% SP';
}

export async function changeSpContainer(csfSP: HTMLElement, stickers: CSFloat.StickerData[], price_difference: number) {
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
	if (priceSum < 2) {
		return false;
	}
	csfSP.setAttribute('data-betterfloat', JSON.stringify({ priceSum, spPercentage: spPercentage.toNumber() }));

	csfSP.textContent = formatSPText(spPercentage, priceSum, userCurrency, location.pathname === '/sell');

	// `background` instead of `backgroundColor` to also override the gradient of CSFloat's native badge
	csfSP.style.background = location.pathname === '/sell' ? getSPBackgroundColor(0) : getSPBackgroundColor(spPercentage.toNumber());
	return true;
}
