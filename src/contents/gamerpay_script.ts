import { html } from 'common-tags';
import getSymbolFromCurrency from 'currency-symbol-map';
import Decimal from 'decimal.js';
import type { PlasmoCSConfig } from 'plasmo';
import type { DopplerPhase, ItemStyle } from '~lib/@typings/FloatTypes';
import type { Gamerpay } from '~lib/@typings/GamerpayTypes';
import { activateHandler, initPriceMapping } from '~lib/handlers/eventhandler';
import { getMarketID } from '~lib/handlers/mappinghandler';
import { MarketSource } from '~lib/util/globals';
import { CurrencyFormatter, handleSpecialStickerNames, isUserPro } from '~lib/util/helperfunctions';
import { getBuffPrice } from '~lib/util/helperfunctions';
import { isBuffBannedItem } from '~lib/util/helperfunctions';
import { type IStorage, getAllSettings } from '~lib/util/storage';
import { generatePriceLine } from '~lib/util/uigeneration';

export const config: PlasmoCSConfig = {
	matches: ['*://*.gamerpay.gg/*'],
	run_at: 'document_end',
	css: ['../css/hint.min.css', '../css/common_styles.css', '../css/bitskins_styles.css'],
};

async function init() {
	console.time('[BetterFloat] Gamerpay init timer');

	if (location.host !== 'gamerpay.gg') {
		return;
	}

	// catch the events thrown by the script
	// this has to be done as first thing to not miss timed events
	activateHandler();

	extensionSettings = await getAllSettings();
	console.log('[BetterFloat] Extension settings:', extensionSettings);

	// if (!extensionSettings['bs-enable']) return;

	await initPriceMapping(extensionSettings, 'bs');

	console.timeEnd('[BetterFloat] Gamerpay init timer');

	// mutation observer is only needed once
	if (!isObserverActive) {
		isObserverActive = true;
		applyMutation();
		console.log('[BetterFloat] Mutation observer started');
	}

	firstLaunch();
}

async function firstLaunch() {
	const items = document.querySelectorAll<HTMLElement>('div.ItemCard_wrapper__');
	for (const item of items) {
		await adjustItem(item);
	}

	const feeds = document.querySelector<HTMLElement>('div.ItemFeed_feed__');
	if (feeds) {
		for (const item of feeds.children) {
			if (item instanceof HTMLElement && item.className.startsWith('ItemCard_wrapper')) {
				await adjustItem(item);
			}
		}
	}
}
function applyMutation() {
	const observer = new MutationObserver(async (mutations) => {
		for (const mutation of mutations) {
			for (let i = 0; i < mutation.addedNodes.length; i++) {
				const addedNode = mutation.addedNodes[i];
				// some nodes are not elements, so we need to check
				if (!(addedNode instanceof HTMLElement)) continue;
				// console.debug('[Plasmo] Mutation detected:', addedNode);

				if (addedNode.className.startsWith('ItemCard_wrapper')) {
					await adjustItem(addedNode);
				} else if (addedNode.className.startsWith('ItemFeed_feed')) {
					for (const item of addedNode.children) {
						if (item instanceof HTMLElement && item.className.startsWith('ItemCard_wrapper')) {
							await adjustItem(item);
						}
					}
				}
			}
		}
	});
	observer.observe(document, { childList: true, subtree: true });
}

async function adjustItem(container: Element) {
	let item = container.getAttribute('data-betterfloat');

	let tries = 10;
	while ((!item || item.length < 1) && tries-- > 0) {
		await new Promise((resolve) => setTimeout(resolve, 200));
		item = container.getAttribute('data-betterfloat');
	}
	if (!item || item.length < 1) return;

	const itemData = JSON.parse(item) as Gamerpay.ReactItem;

	// eslint-disable-next-line @typescript-eslint/no-unused-vars
	const priceResult = await addBuffPrice(itemData, container);
}

async function addBuffPrice(reactItem: Gamerpay.ReactItem, container: Element) {
	const item = reactItem.item;
	const { source, itemStyle, itemPrice, buff_name, market_id, priceListing, priceOrder, priceFromReference, difference, currency } = await getBuffItem(item);

	const footerContainer = container.querySelector<HTMLElement>('div[class*="ItemCardBody_priceContainer__"]');

	const isItemPage = false;
	const isDoppler = buff_name.includes('Doppler') && buff_name.includes('|');
	const currencyFormatter = CurrencyFormatter(currency.text ?? 'USD');

	if (footerContainer && !container.querySelector('.betterfloat-buffprice')) {
		const buffContainer = generatePriceLine({
			source,
			market_id,
			buff_name,
			priceOrder,
			priceListing,
			priceFromReference,
			userCurrency: currency.symbol ?? '$',
			itemStyle: itemStyle as DopplerPhase,
			CurrencyFormatter: currencyFormatter,
			isDoppler,
			isPopout: isItemPage,
			addSpaceBetweenPrices: true,
			showPrefix: isItemPage,
			hasPro: isUserPro(extensionSettings['user']),
			tooltipArrow: true,
		});
		footerContainer.insertAdjacentHTML('beforeend', buffContainer);
	}

	let discountContainer = container.querySelector('div.price > div.discount');
	if (!discountContainer) {
		const newContainer = document.createElement('div');
		newContainer.classList.add('discount');
		container.querySelector('div.price > div.amount')?.before(newContainer);
		discountContainer = newContainer;
	}

	if (discountContainer && !container.querySelector('.betterfloat-sale-tag') && (extensionSettings['gp-buffdifference'] || extensionSettings['gp-buffdifferencepercent'])) {
		discountContainer.outerHTML = createSaleTag(difference, itemPrice.div(priceFromReference ?? 1).mul(100), currencyFormatter);
	}

	return {
		price_difference: difference,
	};
}

async function getBuffItem(item: Gamerpay.Item) {
	let source = (extensionSettings['gp-pricingsource'] as MarketSource) ?? MarketSource.Buff;
	const buff_item = createBuffItem(item);
	const buff_name = handleSpecialStickerNames(buff_item.name);
	let { priceListing, priceOrder } = await getBuffPrice(buff_name, buff_item.style, source);

	if (source === MarketSource.Buff && isBuffBannedItem(buff_name)) {
		priceListing = new Decimal(0);
		priceOrder = new Decimal(0);
	}

	if (((!priceListing && !priceOrder) || (priceListing?.isZero() && priceOrder?.isZero())) && extensionSettings['gp-altmarket'] && extensionSettings['gp-altmarket'] !== MarketSource.None) {
		source = extensionSettings['gp-altmarket'] as MarketSource;
		const altPrices = await getBuffPrice(buff_name, buff_item.style, source);
		priceListing = altPrices.priceListing;
		priceOrder = altPrices.priceOrder;
	}
	const market_id = getMarketID(buff_name, source);

	let itemPrice = new Decimal(item.price).div(100);
	const userCurrency = getUserCurrency();
	const currencySymbol = getSymbolFromCurrency(userCurrency);
	// const currencyRate = getGamerpayCurrencyRate(userCurrency);
	const currencyRate = 1;

	if (currencyRate && currencyRate !== 1) {
		if (priceListing) {
			priceListing = priceListing.div(currencyRate);
		}
		if (priceOrder) {
			priceOrder = priceOrder.div(currencyRate);
		}
		itemPrice = itemPrice.div(currencyRate);
	}

	const referencePrice =
		Number(extensionSettings['bs-pricereference']) === 0 && ([MarketSource.Buff, MarketSource.Steam].includes(source) || (MarketSource.YouPin === source && isUserPro(extensionSettings['user'])))
			? priceOrder
			: priceListing;
	const priceDifference = itemPrice.minus(referencePrice ?? 0);

	return {
		source,
		buff_name,
		itemPrice,
		itemStyle: buff_item.style,
		market_id,
		priceListing,
		priceOrder,
		priceFromReference: referencePrice,
		difference: priceDifference,
		currency: {
			text: userCurrency,
			rate: currencyRate,
			symbol: currencySymbol,
		},
	};
}

function createSaleTag(difference: Decimal, percentage: Decimal, currencyFormatter: Intl.NumberFormat) {
	const styling = {
		profit: {
			color: '#5bc27a',
			background: '#142a0e',
		},
		loss: {
			color: '#ff8095',
			background: '#3a0e0e',
		},
	};

	const absDifference = difference.abs();
	const { color, background } = percentage.gt(100) ? styling.loss : styling.profit;

	return html`
		<div class="discount flex betterfloat-sale-tag" style="background-color: ${background}; color: ${color};">
			${extensionSettings['gp-buffdifference'] ? html`<span>${difference.isPos() ? '+' : '-'}${currencyFormatter.format(difference.abs().toNumber())} </span>` : ''}
			${extensionSettings['gp-buffdifferencepercent'] ? html`<span>(${percentage.gt(150) ? percentage.toFixed(0) : percentage.toFixed(2)}%)</span>` : ''}
		</div>
	`;
}

function getUserCurrency() {
	return 'USD';
}

function createBuffItem(item: Gamerpay.Item) {
	return {
		name: item.marketHashName ?? item.name,
		style: '' as ItemStyle,
	};
}

let extensionSettings: IStorage;
let isObserverActive = false;

init();
