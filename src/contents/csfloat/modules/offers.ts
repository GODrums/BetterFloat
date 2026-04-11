import { html } from 'common-tags';
import Decimal from 'decimal.js';

import type { CSFloat, DopplerPhase, ItemStyle } from '~lib/@typings/FloatTypes';
import { getMarketID } from '~lib/handlers/mappinghandler';
import { AskBidMarkets, ICON_STEAM, MarketSource } from '~lib/util/globals';
import { CurrencyFormatter, getBuffPrice, isUserPro } from '~lib/util/helperfunctions';
import { attachMarketPopover } from '~lib/util/market_popover';
import { getSetting } from '~lib/util/storage';
import { generatePriceLine } from '~lib/util/uigeneration';

import { getCSFCurrencyRate, getSpecificCSFOffer } from '../cache';
import { getCSFloatUserCurrency } from './currency';
import { getCSFloatSettings } from './runtime';

async function getCurrencyRate() {
	const userCurrency = getCSFloatUserCurrency();
	let currencyRate = await getCSFCurrencyRate(userCurrency);
	if (!currencyRate) {
		console.warn(`[BetterFloat] Could not get currency rate for ${userCurrency}`);
		currencyRate = 1;
	}

	return { userCurrency, currencyRate };
}

export async function adjustOfferContainer(container: Element) {
	const extensionSettings = getCSFloatSettings();
	const offers = Array.from(document.querySelectorAll('.offers .offer'));
	const offerIndex = offers.findIndex((el) => el.className.includes('is-selected'));
	const offer = getSpecificCSFOffer(offerIndex);

	if (!offer) return;

	const header = container.querySelector('.header');

	const itemName = offer.contract.item.market_hash_name;
	let itemStyle: ItemStyle = '';
	if (offer.contract.item.phase) {
		itemStyle = offer.contract.item.phase;
	} else if (offer.contract.item.paint_index === 0) {
		itemStyle = 'Vanilla';
	}

	const source = extensionSettings['csf-pricingsource'] as MarketSource;
	const buff_id = await getMarketID(itemName, source);
	const { priceListing, priceOrder } = await getBuffPrice(itemName, itemStyle, source);
	const useOrderPrice =
		priceOrder &&
		extensionSettings['csf-pricereference'] === 0 &&
		(AskBidMarkets.map((market) => market.source).includes(source) || (MarketSource.YouPin === source && isUserPro(extensionSettings['user'])));
	const priceFromReference = useOrderPrice ? priceOrder : (priceListing ?? new Decimal(0));

	const userCurrency = getCSFloatUserCurrency();

	const buffContainer = generatePriceLine({
		source: extensionSettings['csf-pricingsource'] as MarketSource,
		market_id: buff_id,
		buff_name: itemName,
		priceOrder,
		priceListing,
		priceFromReference,
		userCurrency,
		itemStyle: '' as DopplerPhase,
		CurrencyFormatter: CurrencyFormatter(getCSFloatUserCurrency()),
		isDoppler: false,
		isPopout: false,
		iconHeight: '20px',
		hasPro: isUserPro(extensionSettings['user']),
	});
	header?.insertAdjacentHTML('beforeend', buffContainer);

	const buffA = container.querySelector('.betterfloat-buff-a');
	buffA?.setAttribute('data-betterfloat', JSON.stringify({ buff_name: itemName, phase: itemStyle, priceOrder, priceListing, userCurrency, itemName, priceFromReference, source }));

	if (buffA instanceof HTMLElement) {
		const { currencyRate } = await getCurrencyRate();
		attachMarketPopover(buffA, { isPro: isUserPro(extensionSettings['user']), currencyRate });
	}
}

export async function adjustOfferBubbles(offers: CSFloat.Offer[]) {
	await new Promise((resolve) => setTimeout(resolve, 200));
	const bubbles = document.querySelectorAll('.history .offer-bubble');
	let buffA = document.querySelector('.betterfloat-buff-a');
	let buffData = JSON.parse(buffA?.getAttribute('data-betterfloat') ?? '{}');

	if (
		!buffData.itemName?.includes(document.querySelector('div.prefix')?.firstChild?.textContent?.trim()) ||
		!buffData.itemName?.includes(document.querySelector('div.suffix')?.firstChild?.textContent?.trim())
	) {
		buffA?.remove();
		await adjustOfferContainer(document.querySelector('app-view-offers .container')!);
		buffA = document.querySelector('.betterfloat-buff-a');
		buffData = JSON.parse(buffA?.getAttribute('data-betterfloat') ?? '{}');
	}

	if (bubbles.length > offers.length) {
		console.warn('[BetterFloat] Bubbles and offers length mismatch');
		return;
	}

	const marketIcon = buffA?.querySelector('img')?.src;

	for (let i = 0; i < bubbles.length; i++) {
		const bubble = bubbles[i];
		if (bubble.querySelector('.betterfloat-bubble-buff')) {
			continue;
		}

		const offer = offers[offers.length - 1 - i];
		const difference = new Decimal(offer.price).div(100).minus(buffData.priceFromReference);
		const subText = bubble.querySelector<HTMLElement>('.sub-text');
		if (!subText) {
			continue;
		}

		const isSeller = bubble.className.includes('from-other-party');
		subText.setAttribute('style', 'display: flex; align-items: center; width: 100%; justify-content: space-between;');
		subText.innerHTML = `<div style="display: inline-flex; align-items: center;">${subText.textContent}</div>`;

		if (await getSetting('csf-steamlink')) {
			const steamHTML = html`
				<a target="_blank" href="https://steamcommunity.com/profiles/${offer.buyer_id}" style="display: flex; align-items: center;">
					<img src="${ICON_STEAM}" style="height: 20px; margin-right: 5px;" />
				</a>
			`;
			if (isSeller) {
				subText.firstElementChild?.insertAdjacentHTML('afterbegin', steamHTML);
			}
		}

		const buffHTML = html`
			<div class="betterfloat-bubble-buff" style="display: inline-flex; align-items: center; justify-content: ${isSeller ? 'flex-end' : 'flex-start'};">
				<img src="${marketIcon}" style="height: 20px; margin-right: 5px; border: 1px solid dimgray; border-radius: 4px;" />
				<span style="color: var(--primary-color); font-weight: 500;">
					${difference.isPositive() ? '+' : ''}${Intl.NumberFormat('en-US', { style: 'currency', currency: getCSFloatUserCurrency() }).format(difference.toNumber())}
				</span>
			</div>
		`;
		subText.insertAdjacentHTML(isSeller ? 'beforeend' : 'afterbegin', buffHTML);
	}
}
