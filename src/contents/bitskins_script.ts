import { html } from 'common-tags';
import getSymbolFromCurrency from 'currency-symbol-map';
import Decimal from 'decimal.js';
import type { PlasmoCSConfig } from 'plasmo';
import type { Bitskins } from '~lib/@typings/BitskinsTypes';
import type { DopplerPhase, ItemStyle } from '~lib/@typings/FloatTypes';
import { getBitskinsCurrencyRate, getBitskinsPopoutItem, getSpecificBitskinsItem } from '~lib/handlers/cache/bitskins_cache';
import { activateHandler, initPriceMapping } from '~lib/handlers/eventhandler';
import { getMarketID } from '~lib/handlers/mappinghandler';
import { MarketSource } from '~lib/util/globals';
import { CurrencyFormatter, checkUserPlanPro, createHistoryRewrite, getBuffPrice, handleSpecialStickerNames, isBuffBannedItem } from '~lib/util/helperfunctions';
import { type IStorage, getAllSettings } from '~lib/util/storage';
import { generatePriceLine } from '~lib/util/uigeneration';

export const config: PlasmoCSConfig = {
	matches: ['*://*.bitskins.com/*'],
	run_at: 'document_end',
	css: ['../css/hint.min.css', '../css/common_styles.css', '../css/bitskins_styles.css'],
};

type PriceResult = {
	price_difference: Decimal;
};

async function init() {
	console.time('[BetterFloat] Bitskins init timer');

	if (location.host !== 'bitskins.com') {
		return;
	}

	replaceHistory();

	// catch the events thrown by the script
	// this has to be done as first thing to not miss timed events
	activateHandler();

	extensionSettings = await getAllSettings();
	console.log('[BetterFloat] Extension settings:', extensionSettings);

	if (!extensionSettings['bs-enable']) return;

	// check if user has the required plan
	if (!checkUserPlanPro(extensionSettings['user'])) {
		console.log('[BetterFloat] Pro plan required for BitSkins features');
		return;
	}

	await initPriceMapping(extensionSettings, 'bs');

	console.timeEnd('[BetterFloat] Bitskins init timer');

	// mutation observer is only needed once
	if (!isObserverActive) {
		isObserverActive = true;
		applyMutation();
		console.log('[BetterFloat] Mutation observer started');
	}
}

async function replaceHistory() {
	// wait for the page to load
	const loggedOut = await new Promise((resolve) => {
		const interval = setInterval(() => {
			if (document.querySelector('.login') || document.querySelector('.user-avatar')) {
				clearInterval(interval);
				resolve(!!document.querySelector('.login'));
			}
		}, 100);
	});

	if (loggedOut && !location.search.includes('ref_alias')) {
		location.search += `${location.search ? '&' : ''}ref_alias=betterfloat`;
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

				if (addedNode.className === 'market-items') {
					const items = addedNode.querySelectorAll('.item');
					for (const item of items) {
						adjustItem(item, PageState.Market);
					}
				} else if (addedNode.classList.contains('item')) {
					// adjustItem(addedNode, PageState.Market);
				} else if (addedNode.id === 'item-page') {
					adjustItem(addedNode, PageState.ItemPage);
				} else if (addedNode.className === 'similar-items') {
					addSimilarItemsSaleTags(addedNode);
				}
			}
		}
	});
	observer.observe(document, { childList: true, subtree: true });
}

function addSimilarItemsSaleTags(container: Element) {
	const priceData = JSON.parse(document.querySelector('.betterfloat-big-a')?.getAttribute('data-betterfloat') ?? '{}') as {
		buff_name: string;
		priceFromReference: number;
		userCurrency: string; // $
		source: MarketSource;
	};
	if (Object.keys(priceData).length === 0) return;

	const items = container.querySelectorAll('.similar-item');
	for (const el of items) {
		const itemID = getItemID(el, PageState.Similar);
		if (!itemID) continue;
		const item = getSpecificBitskinsItem(itemID);
		if (!item) continue;

		const discountContainer = document.createElement('div');
		discountContainer.classList.add('discount');
		el.querySelector('div.price')?.before(discountContainer);

		if (discountContainer && !el.querySelector('.betterfloat-sale-tag') && (extensionSettings['bs-buffdifference'] || extensionSettings['bs-buffdifferencepercent'])) {
			const currencyFormatter = CurrencyFormatter(getUserCurrency(), 0, 2);
			let saleTag = createSaleTag(
				getItemPrice(item).minus(priceData.priceFromReference ?? 0),
				getItemPrice(item)
					.div(priceData.priceFromReference ?? 1)
					.mul(100),
				currencyFormatter
			);
			saleTag = saleTag.replace('betterfloat-sale-tag', 'betterfloat-similar-tag');
			discountContainer.outerHTML = saleTag;
		}
		el.querySelector('.item-price')?.setAttribute('style', 'align-items: center;');
	}
}

function getItemID(container: Element, state: PageState) {
	if (state === PageState.Market) {
		return container.querySelector('.item-content')?.getAttribute('href')?.split('/')[3];
	} else if (state === PageState.ItemPage) {
		return location.pathname.split('/')[3];
	} else if (state === PageState.Similar) {
		return container.querySelector('a')?.getAttribute('href')?.split('/')[3];
	}
}

function getAPIItem(state: PageState, itemID: string) {
	if (state === PageState.Market) {
		return getSpecificBitskinsItem(itemID);
	} else if (state === PageState.ItemPage) {
		return getBitskinsPopoutItem();
	}
}

async function adjustItem(container: Element, state: PageState) {
	const itemID = getItemID(container, state);
	if (!itemID) return;
	let item = getAPIItem(state, itemID);

	let tries = 10;
	while (!item && tries-- > 0) {
		await new Promise((resolve) => setTimeout(resolve, 200));
		item = getAPIItem(state, itemID);
	}
	if (!item) return;

	// eslint-disable-next-line @typescript-eslint/no-unused-vars
	const priceResult = await addBuffPrice(item, container, state);

	// store item in html
	container.setAttribute('data-betterfloat', JSON.stringify(item));
}

async function addBuffPrice(item: Bitskins.Item, container: Element, state: PageState): Promise<PriceResult> {
	const { source, itemStyle, itemPrice, buff_name, market_id, priceListing, priceOrder, priceFromReference, difference, currency } = await getBuffItem(item);

	let footerContainer = container.querySelector('.ref-price');
	if (state === PageState.ItemPage) {
		const newContainer = document.createElement('div');
		footerContainer?.before(newContainer);
		footerContainer = newContainer;
	}

	const isItemPage = state === PageState.ItemPage;
	const isDoppler = buff_name.includes('Doppler') && buff_name.includes('|');
	const maximumFractionDigits = priceListing?.gt(1000) && state !== PageState.ItemPage ? 0 : 2;
	const currencyFormatter = CurrencyFormatter(currency.text ?? 'USD', 0, maximumFractionDigits);

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
			iconHeight: isItemPage ? '24px' : '20px',
		});
		footerContainer.outerHTML = buffContainer;
	}

	let discountContainer = container.querySelector('div.price > div.discount');
	if (!discountContainer) {
		const newContainer = document.createElement('div');
		newContainer.classList.add('discount');
		container.querySelector('div.price > div.amount')?.before(newContainer);
		discountContainer = newContainer;
	}

	if (discountContainer && !container.querySelector('.betterfloat-sale-tag') && (extensionSettings['bs-buffdifference'] || extensionSettings['bs-buffdifferencepercent'])) {
		discountContainer.outerHTML = createSaleTag(difference, itemPrice.div(priceFromReference ?? 1).mul(100), currencyFormatter);
	}

	return {
		price_difference: difference,
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
			${extensionSettings['bs-buffdifference'] ? html`<span>${difference.isPos() ? '+' : '-'}${currencyFormatter.format(difference.abs().toNumber())} </span>` : ''}
			${extensionSettings['bs-buffdifferencepercent'] ? html`<span>(${percentage.gt(150) ? percentage.toFixed(0) : percentage.toFixed(2)}%)</span>` : ''}
		</div>
	`;
}

async function getBuffItem(item: Bitskins.Item) {
	let source = (extensionSettings['bs-pricingsource'] as MarketSource) ?? MarketSource.Buff;
	const buff_item = createBuffItem(item);
	const buff_name = handleSpecialStickerNames(buff_item.name);
	let { priceListing, priceOrder } = await getBuffPrice(buff_name, buff_item.style, source);

	if (source === MarketSource.Buff && isBuffBannedItem(buff_name)) {
		priceListing = new Decimal(0);
		priceOrder = new Decimal(0);
	}

	if (((!priceListing && !priceOrder) || (priceListing?.isZero() && priceOrder?.isZero())) && extensionSettings['csm-altmarket'] && extensionSettings['csm-altmarket'] !== MarketSource.None) {
		source = extensionSettings['csm-altmarket'] as MarketSource;
		const altPrices = await getBuffPrice(buff_name, buff_item.style, source);
		priceListing = altPrices.priceListing;
		priceOrder = altPrices.priceOrder;
	}
	const market_id = getMarketID(buff_name, source);

	let itemPrice = getItemPrice(item);
	const userCurrency = getUserCurrency();
	const currencySymbol = getSymbolFromCurrency(userCurrency);
	const currencyRate = getBitskinsCurrencyRate(userCurrency);

	if (currencyRate && currencyRate !== 1) {
		if (priceListing) {
			priceListing = priceListing.mul(currencyRate);
		}
		if (priceOrder) {
			priceOrder = priceOrder.mul(currencyRate);
		}
		itemPrice = itemPrice.mul(currencyRate);
	}

	const referencePrice = parseInt(extensionSettings['bs-referenceprice']) === 0 ? priceOrder : priceListing;
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

function getUserCurrency() {
	return localStorage.getItem('currency') || 'USD';
}

function getItemPrice(item: Bitskins.Item) {
	return new Decimal(item.price).div(1000);
}

function createBuffItem(item: Bitskins.Item): { name: string; style: ItemStyle } {
	const buff_item = {
		name: item.name,
		style: '' as ItemStyle,
	};
	if (item.phase_id && item.name.includes('Doppler')) {
		// Get and remove the phase from name
		const phase = item.name.split('Doppler')[1].split('(')[0].trim() as DopplerPhase;
		buff_item.name = item.name.replace(` ${phase}`, '').trim();
		buff_item.style = phase;
	}
	return {
		name: buff_item.name,
		style: buff_item.style,
	};
}

enum PageState {
	Market = 0,
	ItemPage = 1,
	Similar = 2,
}

// mutation observer active?
let isObserverActive = false;
export let extensionSettings: IStorage;

init();
