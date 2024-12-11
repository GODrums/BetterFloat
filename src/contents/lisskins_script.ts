import { html } from 'common-tags';
import Decimal from 'decimal.js';
import type { PlasmoCSConfig } from 'plasmo';

import type { DopplerPhase, ItemStyle } from '~lib/@typings/FloatTypes';
import { activateHandler, initPriceMapping } from '~lib/handlers/eventhandler';
import { BigCurrency, SmallCurrency, getAndFetchCurrencyRate, getMarketID } from '~lib/handlers/mappinghandler';
import { MarketSource } from '~lib/util/globals';
import { BigUSDollar, USDollar, getBuffPrice, handleSpecialStickerNames, isBuffBannedItem } from '~lib/util/helperfunctions';
import type { IStorage } from '~lib/util/storage';
import { getAllSettings } from '~lib/util/storage';
import { generatePriceLine } from '~lib/util/uigeneration';

type PriceResult = {
	price_difference: number;
	currency: string;
	priceFromReference: number;
};

export const config: PlasmoCSConfig = {
	matches: ['https://*.lis-skins.com/*'],
	run_at: 'document_end',
	css: ['../css/lisskins_styles.css'],
};

async function init() {
	console.time('[BetterFloat] Lis-Skins init timer');

	if (location.host !== 'lis-skins.com') {
		return;
	}
	// catch the events thrown by the script
	// this has to be done as first thing to not miss timed events
	activateHandler();

	extensionSettings = await getAllSettings();
	console.log('[BetterFloat] Extension settings:', extensionSettings);

	if (!extensionSettings['lis-enable']) return;

	await initPriceMapping(extensionSettings, 'lis');

	console.timeEnd('[BetterFloat] Lis-Skins init timer');

	//check if url is in supported subpages
	if (location.pathname.includes('/market/cs2/') || location.pathname.includes('/market/csgo/')) {
		await firstLaunch();
	}

	// mutation observer is only needed once
	if (!isObserverActive) {
		isObserverActive = true;
		applyMutation();
		console.log('[BetterFloat] Mutation observer started');
	}
}

// required as mutation does not detect initial DOM
async function firstLaunch() {
	// item page
	const itemPage = document.querySelector('div.skins-market-view');
	if (itemPage) {
		await adjustItem(itemPage, true);
	} else {
		const items = document.querySelectorAll('div.item_csgo');
		for (let i = 0; i < items.length; i++) {
			await adjustItem(items[i]);
		}
	}
}

interface HTMLItem {
	name: string;
	style: ItemStyle;
	price: Decimal;
}

function applyMutation() {
	const observer = new MutationObserver(async (mutations) => {
		for (const mutation of mutations) {
			for (let i = 0; i < mutation.addedNodes.length; i++) {
				const addedNode = mutation.addedNodes[i];
				// some nodes are not elements, so we need to check
				if (!(addedNode instanceof HTMLElement)) continue;
				// console.debug('[BetterFloat] Mutation detected:', addedNode, addedNode.tagName, addedNode.className.toString());

				if (addedNode.id === 'skins-obj') {
					const items = Array.from(addedNode.querySelectorAll('div.item_csgo'));
					for (let i = 0; i < items.length; i++) {
						await adjustItem(items[i]);
					}
				}
			}
		}
	});
	observer.observe(document, { childList: true, subtree: true });
}

async function adjustItem(container: Element, isItemPage = false) {
	const getItem: () => HTMLItem = () => {
		const imgAlt = container.querySelector('img.image')?.getAttribute('alt') ?? '';
		let itemName = '';
		let itemStyle: ItemStyle = '';
		if (imgAlt.includes('Doppler')) {
			itemStyle = imgAlt.split('Doppler ')[1].split(' (')[0] as DopplerPhase;
			itemName = imgAlt.replace(` ${itemStyle}`, '');
		} else {
			itemName = imgAlt;
			if (imgAlt.includes('★') && !imgAlt.includes('|')) {
				itemStyle = 'Vanilla';
			}
		}
		// cut last digit
		const itemPrice = container.querySelector('div.price')?.textContent;
		const price = new Decimal(
			itemPrice
				?.substring(0, itemPrice.length - 1)
				.replace(',', '')
				.replace('.', '')
				.replaceAll(' ', '') ?? '0'
		).div(100);
		// console.log('[BetterFloat] Adjusting item: ', itemName, itemStyle, price.toNumber());
		return {
			name: itemName,
			style: itemStyle,
			price,
		};
	};
	const item = getItem();
	if (!item) {
		console.log('[BetterFloat] No item found, cancelling...', container);
		return;
	}

	// eslint-disable-next-line @typescript-eslint/no-unused-vars
	const priceResult = await addBuffPrice(item, container, isItemPage);

	if (isItemPage) {
		const rows = document.querySelectorAll('div.row.market_item');
		for (let i = 0; i < rows.length; i++) {
			addSaleTag(rows[i], priceResult);
		}
	}
}

function addSaleTag(container: Element, priceResult: PriceResult) {
	const priceContainer = container.querySelector('.price');
	if (!priceContainer?.textContent) return;
	const priceHTML = priceContainer.textContent;
	const itemPrice = new Decimal(
		priceHTML
			.substring(0, priceHTML.length - 1)
			.replace(',', '')
			.replace('.', '')
			.trim()
			.replaceAll(' ', '')
	).div(100);
	const difference = itemPrice.minus(priceResult.priceFromReference);

	const styling = {
		profit: {
			color: '#5bc27a',
			background: 'rgb(123 195 119 / 10%)',
		},
		loss: {
			color: '#ff8095',
			background: 'rgb(255 128 149 / 10%)',
		},
	};
	const { color, background } = difference.gt(0) ? styling.loss : styling.profit;
	const CurrencyFormatter = Intl.NumberFormat(undefined, { style: 'currency', currency: priceResult.currency, currencyDisplay: 'narrowSymbol', minimumFractionDigits: 0, maximumFractionDigits: 2 });
	const buffPriceHTML = `<div class="sale-tag betterfloat-sale-tag" style="display: inline-flex;flex-direction: column; font-size: 11px; font-style: normal; font-weight: 525; line-height: 17px; letter-spacing: -0.005em; text-wrap: nowrap; background-color: ${background}; color: ${color}; padding: 1px 3px; border-radius: 4px;"><span>${difference.gt(0) ? '+' : '-'}${CurrencyFormatter.format(difference.toNumber())}</span><span>(${itemPrice.div(priceResult.priceFromReference).mul(100).toFixed(2)}%)</span></div>`;

	priceContainer.insertAdjacentHTML('beforebegin', buffPriceHTML);
	priceContainer.parentElement?.setAttribute('style', 'display: flex; align-items: center; gap: 4px; height: 64px;');
}

async function getBuffItem(item: HTMLItem) {
	let source = (extensionSettings['lis-pricingsource'] as MarketSource) ?? MarketSource.Buff;
	const buff_name = handleSpecialStickerNames(item.name);

	let { priceListing, priceOrder } = await getBuffPrice(buff_name, item.style);

	if (source === MarketSource.Buff && isBuffBannedItem(buff_name)) {
		priceListing = new Decimal(0);
		priceOrder = new Decimal(0);
	}

	if (((!priceListing && !priceOrder) || (priceListing?.isZero() && priceOrder?.isZero())) && extensionSettings['lis-altmarket'] && extensionSettings['lis-altmarket'] !== MarketSource.None) {
		source = extensionSettings['lis-altmarket'] as MarketSource;
		const altPrices = await getBuffPrice(buff_name, item.style, source);
		priceListing = altPrices.priceListing;
		priceOrder = altPrices.priceOrder;
	}
	const market_id = getMarketID(buff_name, source);

	const currency = getUserCurrency();
	const currencyRate = await getAndFetchCurrencyRate(currency);
	if (currencyRate) {
		priceListing = priceListing?.mul(currencyRate);
		priceOrder = priceOrder?.mul(currencyRate);
	}
	const priceFromReference = Number.parseInt(String(extensionSettings['lis-pricereference'])) === 0 ? priceOrder : priceListing;

	const priceDifference = priceFromReference ? item.price.minus(priceFromReference) : new Decimal(0);
	return {
		buff_name,
		market_id,
		priceListing,
		priceOrder,
		priceFromReference,
		difference: priceDifference,
		currency,
	};
}

async function addBuffPrice(item: HTMLItem, container: Element, isItemPage = false): Promise<PriceResult> {
	const { buff_name, market_id, priceListing, priceOrder, priceFromReference, difference, currency } = await getBuffItem(item);

	const CurrencyFormatter = Intl.NumberFormat(undefined, { style: 'currency', currency: currency, currencyDisplay: 'narrowSymbol', minimumFractionDigits: 0, maximumFractionDigits: 2 });
	const elementContainer = isItemPage ? container.querySelector('div.min-price-block') : container.querySelector('div.skin-info');

	if (elementContainer) {
		const isDoppler = buff_name.includes('Doppler') && buff_name.includes('|');
		const buffContainer = generatePriceLine({
			source: extensionSettings['csf-pricingsource'] as MarketSource,
			market_id,
			buff_name,
			priceOrder,
			priceListing,
			priceFromReference,
			userCurrency: currency,
			itemStyle: item.style as DopplerPhase,
			CurrencyFormatter,
			isDoppler: isDoppler,
			isPopout: isItemPage,
			priceClass: 'suggested-price',
			addSpaceBetweenPrices: false,
			showPrefix: false,
			iconHeight: '15px',
		});

		elementContainer.insertAdjacentHTML(isItemPage ? 'beforeend' : 'afterend', buffContainer);
		// open window according to href attribute of current element
		elementContainer.parentElement?.querySelector('.betterfloat-buffprice')?.addEventListener('click', (e) => {
			e.stopPropagation();
			window.open((e.currentTarget as HTMLElement).parentElement?.getAttribute('href') ?? '', '_blank');
		});
	}

	const priceContainer = container.querySelector('.price');
	if (priceContainer && priceFromReference && !isItemPage) {
		const styling = {
			profit: {
				color: '#5bc27a',
				background: 'rgb(123 195 119 / 10%)',
			},
			loss: {
				color: '#ff8095',
				background: 'rgb(255 128 149 / 10%)',
			},
		};

		const absDifference = item.price.minus(priceFromReference).abs();
		const percentage = item.price.div(priceFromReference).times(100);
		const colorPercentage = 100;
		const { color, background } = percentage.gt(colorPercentage) ? styling.loss : styling.profit;
		const formattedPrice = absDifference.gt(1000) ? BigCurrency(currency).format(absDifference.toNumber()) : SmallCurrency(currency).format(absDifference.toNumber());

		const buffPriceHTML = html`
			<div class="sale-tag betterfloat-sale-tag" style="display: inline-flex;flex-direction: column;position: absolute; right: 5px; z-index: 20; translate: 0 15px;font-size: 11px; font-style: normal; font-weight: 525; line-height: 17px; letter-spacing: -0.005em; text-wrap: nowrap; background-color: ${background}; color: ${color}; padding: 1px 3px; border-radius: 4px;">
				<span>
					${difference.isPos() ? '+' : '-'}${formattedPrice}
				</span>
				<span>(${percentage.gt(150) ? percentage.toFixed(0) : percentage.toFixed(2)}%)</span>
			</div>
		`;

		priceContainer.parentElement?.insertAdjacentHTML('afterend', buffPriceHTML);
	}

	return {
		priceFromReference: priceFromReference?.toNumber() ?? 0,
		price_difference: difference.toNumber(),
		currency,
	};
}

function getUserCurrency() {
	const currency = document.querySelector('p.currency-switcher__selected-currency')?.textContent;
	return currency?.toUpperCase() ?? 'USD';
}

// mutation observer active?
let isObserverActive = false;
let extensionSettings: IStorage;

init();
