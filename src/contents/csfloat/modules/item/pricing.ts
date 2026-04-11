import { html } from 'common-tags';
import Decimal from 'decimal.js';

import type { CSFloat, DopplerPhase, ItemCondition, ItemStyle } from '~lib/@typings/FloatTypes';
import { getMarketID } from '~lib/handlers/mappinghandler';
import { AskBidMarkets, ICON_STEAM, MarketSource } from '~lib/util/globals';
import { CurrencyFormatter, getBuffPrice, handleSpecialStickerNames, isUserPro } from '~lib/util/helperfunctions';
import { attachMarketPopover } from '~lib/util/market_popover';
import { generatePriceLine } from '~lib/util/uigeneration';

import { getCSFCurrencyRate } from '../../cache';
import { getCSFloatUserCurrency } from '../currency';
import { getCSFloatSettings } from '../runtime';
import type { PriceResult } from '../types';
import { INSERT_TYPE } from '../types';

export const parsePrice = (textContent: string) => {
	const regex = /([A-Za-z]+)\s+(\d+)/;
	const priceText = textContent.trim().replace(regex, '$1$2').split(/\s/);
	let price: number;
	let currency = '$';

	if (priceText.includes('Bids')) {
		price = 0;
	} else {
		try {
			let pricingText: string;
			if (location.pathname === '/sell') {
				pricingText = priceText[1].split('Price')[1] ?? '$ 0';
			} else {
				pricingText = priceText[0];
			}
			if (pricingText.split(/\s/).length > 1) {
				const parts = pricingText.replace(',', '').replace('.', '').split(/\s/);
				price = Number(parts.filter((x) => !Number.isNaN(+x)).join('')) / 100;
				currency = parts.filter((x) => Number.isNaN(+x))[0];
			} else {
				const firstDigit = Array.from(pricingText).findIndex((x) => !Number.isNaN(Number(x)));
				currency = pricingText.substring(0, firstDigit);
				price = Number(pricingText.substring(firstDigit).replace(',', '').replace('.', '')) / 100;
			}
		} catch {
			price = 0;
		}
	}

	return { price, currency };
};

export function getFloatItem(container: Element): CSFloat.FloatItem {
	const nameContainer = container.querySelector('app-item-name');
	const priceContainer = container.querySelector('.price');
	const headerDetails = nameContainer?.querySelector('.subtext') as Element | null;

	const name = nameContainer?.querySelector('.item-name')?.textContent?.replace('\n', '').trim();
	const { price } = parsePrice(priceContainer?.textContent ?? '');
	const wearContainer = container.querySelector('item-float-bar .wear');
	const float = wearContainer ? Number(wearContainer.textContent) : undefined;
	let condition: ItemCondition | undefined;
	let quality = '';
	let style: ItemStyle = '';
	let isStatTrak = false;
	let isSouvenir = false;
	let isHighlight = false;

	if (headerDetails) {
		let headerText = headerDetails.textContent?.trim() ?? '';

		if (headerText.startsWith('StatTrak™')) {
			isStatTrak = true;
			headerText = headerText.replace('StatTrak™ ', '');
		} else if (headerText.startsWith('Souvenir')) {
			isSouvenir = true;
			headerText = headerText.replace('Souvenir ', '');
		} else if (headerText.startsWith('Highlight')) {
			isHighlight = true;
			headerText = headerText.replace('Highlight ', '');
		}

		const conditions: ItemCondition[] = ['Factory New', 'Minimal Wear', 'Field-Tested', 'Well-Worn', 'Battle-Scarred'];
		for (const cond of conditions) {
			if (headerText.includes(cond)) {
				condition = cond;
				headerText = headerText.replace(cond, '').trim();
				break;
			}
		}

		if (headerText.includes('(')) {
			style = headerText.substring(headerText.indexOf('(') + 1, headerText.lastIndexOf(')')) as DopplerPhase;
			headerText = headerText.replace(`(${style})`, '').trim();
		}

		const qualityTypes = ['Container', 'Sticker', 'Agent', 'Patch', 'Charm', 'Collectible', 'Music Kit'];
		for (const qualityType of qualityTypes) {
			if (headerText.includes(qualityType)) {
				quality = headerText;
				break;
			}
		}
	}

	if (name?.includes('★') && !name.includes('|')) {
		style = 'Vanilla';
	}

	return {
		name: name ?? '',
		quality,
		style,
		condition,
		float,
		price,
		isStatTrak,
		isSouvenir,
		isHighlight,
	};
}

export async function getCurrencyRate() {
	const userCurrency = getCSFloatUserCurrency();
	let currencyRate = await getCSFCurrencyRate(userCurrency);
	if (!currencyRate) {
		console.warn(`[BetterFloat] Could not get currency rate for ${userCurrency}`);
		currencyRate = 1;
	}

	return { userCurrency, currencyRate };
}

export function createBuffName(item: CSFloat.FloatItem) {
	let full_name = `${item.name}`;
	if (item.quality.includes('Sticker')) {
		full_name = 'Sticker | ' + full_name;
	} else if (item.quality.includes('Patch')) {
		full_name = 'Patch | ' + full_name;
	} else if (item.quality.includes('Charm')) {
		full_name = 'Charm | ' + full_name;
	} else if (item.quality.includes('Music Kit')) {
		full_name = 'Music Kit | ' + full_name;
	} else if (!item.quality.includes('Container') && !item.quality.includes('Agent') && !item.quality.includes('Collectible')) {
		if (item.name.endsWith('| 027')) {
			full_name = full_name.replace('027', '27');
		}
		if (item.style !== 'Vanilla') {
			full_name += ` (${item.condition})`;
		}
	}
	if (item.isSouvenir) {
		full_name = 'Souvenir ' + full_name;
	} else if (item.isStatTrak) {
		full_name = full_name.includes('★') ? full_name.replace('★', '★ StatTrak™') : `StatTrak™ ${full_name}`;
	} else if (item.isHighlight) {
		full_name = full_name.replace('Package', 'Highlight Package');
	}

	return full_name
		.replace(/ +(?= )/g, '')
		.replace(/\//g, '-')
		.trim();
}

export async function getBuffItem(item: CSFloat.FloatItem) {
	const extensionSettings = getCSFloatSettings();
	let source = extensionSettings['csf-pricingsource'] as MarketSource;
	const buff_name = handleSpecialStickerNames(createBuffName(item));
	const market_id: number | string | undefined = await getMarketID(buff_name, source);

	let pricingData = await getBuffPrice(buff_name, item.style, source);

	if (Object.keys(pricingData).length === 0 || (pricingData.priceListing?.isZero() && pricingData.priceOrder?.isZero())) {
		source = extensionSettings['csf-altmarket'] as MarketSource;
		if (source !== MarketSource.None) {
			pricingData = await getBuffPrice(buff_name, item.style, source);
		}
	}

	const { currencyRate } = await getCurrencyRate();
	const useOrderPrice =
		pricingData.priceOrder &&
		extensionSettings['csf-pricereference'] === 0 &&
		(AskBidMarkets.map((market) => market.source).includes(source) || (MarketSource.YouPin === source && isUserPro(extensionSettings['user'])));

	let priceFromReference = useOrderPrice ? pricingData.priceOrder : (pricingData.priceListing ?? new Decimal(0));
	priceFromReference = priceFromReference?.mul(currencyRate);

	return {
		buff_name,
		market_id,
		priceListing: pricingData.priceListing?.mul(currencyRate),
		priceOrder: pricingData.priceOrder?.mul(currencyRate),
		priceFromReference,
		difference: new Decimal(item.price).minus(priceFromReference ?? 0),
		source,
	};
}

export async function showBargainPrice(container: Element, listing: CSFloat.ListingData, insertType: INSERT_TYPE) {
	const buttonLabel = container.querySelector('.bargain-btn > button > span.mdc-button__label');
	if (listing.min_offer_price && buttonLabel && !buttonLabel.querySelector('.betterfloat-minbargain-label')) {
		const { userCurrency, currencyRate } = await getCurrencyRate();
		const minBargainLabel = html`
			<span class="betterfloat-minbargain-label" style="color: var(--subtext-color);">
				(${insertType === INSERT_TYPE.PAGE ? 'min. ' : ''}${Intl.NumberFormat(undefined, {
					style: 'currency',
					currency: userCurrency,
					currencyDisplay: 'narrowSymbol',
					minimumFractionDigits: 0,
					maximumFractionDigits: 2,
				}).format(new Decimal(listing.min_offer_price).mul(currencyRate).div(100).toDP(2).toNumber())})
			</span>
		`;

		buttonLabel.insertAdjacentHTML('beforeend', minBargainLabel);
		if (insertType === INSERT_TYPE.PAGE) {
			buttonLabel.setAttribute('style', 'display: flex; flex-direction: column;');
		}
	}
}

export async function addBuffPrice(item: CSFloat.FloatItem, container: Element, insertType: INSERT_TYPE): Promise<PriceResult> {
	const extensionSettings = getCSFloatSettings();
	const isSellTab = location.pathname === '/sell';
	const isPopout = insertType === INSERT_TYPE.PAGE;

	let priceContainer: HTMLElement | null = null;
	if (isSellTab || insertType === INSERT_TYPE.CART) {
		priceContainer = container.querySelector<HTMLElement>('.price');
	} else {
		priceContainer = container.querySelector<HTMLElement>('.price-row');
	}

	const userCurrency = getCSFloatUserCurrency();
	const currencyFormatter = CurrencyFormatter(userCurrency);
	const isDoppler = item.name.includes('Doppler') && item.name.includes('|');

	const { buff_name, market_id, priceListing, priceOrder, priceFromReference, difference, source } = await getBuffItem(item);
	const itemExists =
		(source === MarketSource.Buff && (Number(market_id) > 0 || priceOrder?.gt(0))) ||
		source === MarketSource.Steam ||
		(source === MarketSource.C5Game && priceListing) ||
		(source === MarketSource.YouPin && priceListing) ||
		(source === MarketSource.CSFloat && priceListing) ||
		(source === MarketSource.CSMoney && priceListing) ||
		(source === MarketSource.Marketcsgo && priceListing);

	if (priceContainer && !container.querySelector('.betterfloat-buffprice') && insertType !== INSERT_TYPE.SIMILAR && itemExists) {
		const buffContainer = generatePriceLine({
			source,
			market_id,
			buff_name,
			priceOrder,
			priceListing,
			priceFromReference,
			userCurrency,
			itemStyle: item.style as DopplerPhase,
			CurrencyFormatter: currencyFormatter,
			isDoppler,
			isPopout,
			iconHeight: '20px',
			hasPro: isUserPro(extensionSettings['user']),
		});

		if (!container.querySelector('.betterfloat-buffprice')) {
			if (isSellTab) {
				if (extensionSettings['csf-floatappraiser']) {
					priceContainer.insertAdjacentHTML('beforebegin', buffContainer);
				} else {
					priceContainer.outerHTML = buffContainer;
				}
			} else if (insertType === INSERT_TYPE.CART) {
				priceContainer.parentElement?.insertAdjacentHTML('afterend', buffContainer);
			} else {
				priceContainer.insertAdjacentHTML('afterend', buffContainer);
			}
		}
		if (isPopout) {
			container.querySelector('.betterfloat-big-price')?.setAttribute('data-betterfloat', JSON.stringify({ priceFromReference: priceFromReference?.toFixed(2) ?? 0, userCurrency }));
		}

		const buffAnchor = container.querySelector<HTMLAnchorElement>('.betterfloat-buff-a');
		if (buffAnchor) {
			const { currencyRate } = await getCurrencyRate();
			attachMarketPopover(buffAnchor, { isPro: isUserPro(extensionSettings['user']), currencyRate });
		}
	}

	if (
		(extensionSettings['csf-steamsupplement'] || extensionSettings['csf-steamlink']) &&
		buff_name &&
		insertType !== INSERT_TYPE.CART &&
		(!container.querySelector('.betterfloat-steamlink') || isPopout)
	) {
		const flexGrow = container.querySelector('div.seller-details > div');
		if (flexGrow) {
			let steamContainer = '';
			if (extensionSettings['csf-steamsupplement'] || isPopout) {
				const { priceListing: steamListingPrice } = await getBuffPrice(buff_name, item.style, MarketSource.Steam);
				if (steamListingPrice?.gt(0)) {
					const { currencyRate } = await getCurrencyRate();
					const percentage = new Decimal(item.price).div(steamListingPrice).div(currencyRate).times(100);

					if (percentage.gt(1)) {
						steamContainer = html`
							<a
								class="betterfloat-steamlink"
								href="https://steamcommunity.com/market/listings/730/${encodeURIComponent(buff_name)}"
								target="_blank"
								style="display: flex; align-items: center; gap: 4px; background: var(--highlight-background); border-radius: 20px; padding: 2px 6px; z-index: 10; translate: 0px 1px;"
							>
								<span style="color: cornflowerblue; margin-left: 2px; ${isPopout ? 'font-size: 15px; font-weight: 500;' : ' font-size: 13px;'}">${percentage.gt(300) ? '>300' : percentage.toFixed(percentage.gt(130) || percentage.lt(80) ? 0 : 1)}%</span>
								<div>
									<img src="${ICON_STEAM}" style="height: ${isPopout ? '18px' : '16px'}; translate: 0px 1px;"></img>
								</div>
							</a>
						`;
					}
				}
			}
			if (steamContainer === '') {
				steamContainer = html`
					<a class="betterfloat-steamlink" href="https://steamcommunity.com/market/listings/730/${encodeURIComponent(buff_name)}" target="_blank">
						<img src="${ICON_STEAM}" style="height: ${isPopout ? '18px' : '16px'}; translate: 0px 2px;" />
					</a>
				`;
			}
			flexGrow.insertAdjacentHTML('afterend', steamContainer);
		}
	}

	const percentage = priceFromReference?.isPositive() ? new Decimal(item.price).div(priceFromReference).times(100) : new Decimal(0);

	if (
		(extensionSettings['csf-buffdifference'] || extensionSettings['csf-buffdifferencepercent']) &&
		!priceContainer?.querySelector('.betterfloat-sale-tag') &&
		item.price !== 0 &&
		(priceFromReference?.isPositive() || item.price < 0.06) &&
		(priceListing?.isPositive() || priceOrder?.isPositive()) &&
		location.pathname !== '/sell' &&
		itemExists
	) {
		let priceIcon: HTMLElement | null = null;
		let floatAppraiser: HTMLElement | null = null;
		if (insertType === INSERT_TYPE.CART) {
			priceIcon = container.querySelector<HTMLElement>('app-price-icon');
			floatAppraiser = container.querySelector<HTMLElement>('app-reference-widget');
		} else if (priceContainer) {
			priceIcon = priceContainer.querySelector<HTMLElement>('app-price-icon');
			floatAppraiser = priceContainer.querySelector<HTMLElement>('.reference-widget-container');
		}

		priceIcon?.remove();
		if (!extensionSettings['csf-floatappraiser'] && !isPopout) {
			floatAppraiser?.remove();
		}

		const saleTag = createSaleTag(difference, percentage, currencyFormatter, isPopout, priceFromReference);

		if (isPopout) {
			priceContainer?.insertBefore(saleTag, floatAppraiser ?? priceContainer.firstChild);
		} else if (insertType === INSERT_TYPE.CART) {
			priceContainer?.after(saleTag);
		} else if (floatAppraiser && extensionSettings['csf-floatappraiser']) {
			priceContainer?.insertBefore(saleTag, floatAppraiser);
		} else {
			priceContainer?.appendChild(saleTag);
		}

		if ((item.price > 999 || (priceContainer?.textContent?.length ?? 0) > 24) && !isPopout) {
			saleTag.style.flexDirection = 'column';
			saleTag.querySelector('.betterfloat-sale-tag-percentage')?.setAttribute('style', 'margin-left: 0;');
		}
	}

	const bargainButton = container.querySelector<HTMLButtonElement>('button.mat-stroked-button');
	if (bargainButton && !bargainButton.disabled) {
		bargainButton.addEventListener('click', () => {
			setTimeout(() => {
				const listing = container.getAttribute('data-betterfloat');
				const bargainPopup = document.querySelector('app-make-offer-dialog');
				if (bargainPopup && listing) {
					bargainPopup.querySelector('item-card')?.setAttribute('data-betterfloat', listing);
				}
			}, 100);
		});
	}

	return {
		price_difference: difference.toNumber(),
		percentage,
	};
}

export function createSaleTag(difference: Decimal, percentage: Decimal, currencyFormatter: Intl.NumberFormat, isPopout: boolean, priceFromReference?: Decimal) {
	const extensionSettings = getCSFloatSettings();
	const differenceSymbol = difference.isPositive() ? '+' : '-';
	let backgroundColor: string;
	const profitPercentage = Number(extensionSettings['csf-profitpercentage']) ?? 100;
	if (percentage.isFinite() && percentage.lt(profitPercentage)) {
		backgroundColor = `light-dark(${extensionSettings['csf-color-profit']}80, ${extensionSettings['csf-color-profit']})`;
	} else if (percentage.isFinite() && percentage.gt(profitPercentage)) {
		backgroundColor = `light-dark(${extensionSettings['csf-color-loss']}80, ${extensionSettings['csf-color-loss']})`;
	} else {
		backgroundColor = `light-dark(${extensionSettings['csf-color-neutral']}80, ${extensionSettings['csf-color-neutral']})`;
	}

	const saleTag = document.createElement('span');
	saleTag.setAttribute('class', 'betterfloat-sale-tag');
	saleTag.style.backgroundColor = backgroundColor;
	saleTag.setAttribute('data-betterfloat', String(difference));

	let saleTagInner = extensionSettings['csf-buffdifference'] || isPopout ? html`<span>${differenceSymbol}${currencyFormatter.format(difference.abs().toNumber())}</span>` : '';
	if ((extensionSettings['csf-buffdifferencepercent'] || isPopout) && priceFromReference && percentage.isFinite()) {
		const percentageDecimalPlaces = percentage.toDP(percentage.greaterThan(200) ? 0 : percentage.greaterThan(150) ? 1 : 2).toNumber();
		saleTagInner += html`
			<span class="betterfloat-sale-tag-percentage" ${extensionSettings['csf-buffdifference'] || isPopout ? 'style="margin-left: 5px;"' : ''}>
				${extensionSettings['csf-buffdifference'] || isPopout ? ` (${percentageDecimalPlaces}%)` : `${percentageDecimalPlaces}%`}
			</span>
		`;
	}
	saleTag.innerHTML = saleTagInner;

	return saleTag;
}
