import { html } from 'common-tags';
import getSymbolFromCurrency from 'currency-symbol-map';
import Decimal from 'decimal.js';
import type { PlasmoCSConfig } from 'plasmo';
import type { DopplerPhase, ItemStyle } from '~lib/@typings/FloatTypes';
import type { Waxpeer } from '~lib/@typings/WaxpeerTypes';
import { getSpecificWaxpeerItem } from '~lib/handlers/cache/waxpeer_cache';
import { activateHandler, initPriceMapping } from '~lib/handlers/eventhandler';
import { getMarketID } from '~lib/handlers/mappinghandler';
import { WAXPEER_SELECTORS } from '~lib/handlers/selectors/waxpeer_selectors';
import { MarketSource } from '~lib/util/globals';
import { CurrencyFormatter, checkUserPlanPro, getBuffPrice, handleSpecialStickerNames, isBuffBannedItem, isUserPro } from '~lib/util/helperfunctions';
import { type IStorage, getAllSettings } from '~lib/util/storage';
import { generatePriceLine } from '~lib/util/uigeneration';

export const config: PlasmoCSConfig = {
	matches: ['*://*.waxpeer.com/*'],
	run_at: 'document_end',
	css: ['../css/hint.min.css', '../css/common_styles.css', '../css/waxpeer_styles.css'],
};

type PriceResult = {
	price_difference: Decimal;
};

async function init() {
	console.time('[BetterFloat] Waxpeer init timer');

	if (location.host !== 'waxpeer.com') {
		return;
	}

	replaceHistory();

	// catch the events thrown by the script
	// this has to be done as first thing to not miss timed events
	activateHandler();

	extensionSettings = await getAllSettings();

	if (!extensionSettings['wp-enable']) return;

	// check if user has the required plan
	if (!(await checkUserPlanPro(extensionSettings['user']))) {
		console.log('[BetterFloat] Pro plan required for Waxpeer features');
		return;
	}

	await initPriceMapping(extensionSettings, 'wp');

	console.timeEnd('[BetterFloat] Waxpeer init timer');

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
			if (document.querySelector(WAXPEER_SELECTORS.auth.login) || document.querySelector(WAXPEER_SELECTORS.auth.userAvatar)) {
				clearInterval(interval);
				resolve(!!document.querySelector(WAXPEER_SELECTORS.auth.login));
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
				// console.debug('[BetterFloat] Mutation detected:', addedNode);

				if (addedNode.className === WAXPEER_SELECTORS.item.wrapper) {
					await adjustItem(addedNode, PageState.Market);
				}
			}
		}
	});
	observer.observe(document, { childList: true, subtree: true });
}

function getItemID(container: Element, state: PageState) {
	if (state === PageState.Market) {
		return container.querySelector(WAXPEER_SELECTORS.item.thumb)?.getAttribute('href')?.split('/')[3];
	}
}

async function adjustItem(container: Element, state: PageState) {
	let itemID = getItemID(container, state);
	let tries = 10;
	while (!itemID && tries-- > 0) {
		await new Promise((resolve) => setTimeout(resolve, 100));
		itemID = getItemID(container, state);
	}
	if (!itemID) return;
	console.log('[BetterFloat] Item ID:', itemID);

	let item = getSpecificWaxpeerItem(itemID);

	tries = 10;
	while (!item && tries-- > 0) {
		await new Promise((resolve) => setTimeout(resolve, 200));
		item = getSpecificWaxpeerItem(itemID);
	}
	if (!item) return;

	// const name = item?.name ?? container.querySelector('a.hidden')?.textContent;
	// if (!name) return;

	// eslint-disable-next-line @typescript-eslint/no-unused-vars
	const priceResult = await addBuffPrice(item, container, state);
}

async function addBuffPrice(item: Waxpeer.Item, container: Element, state: PageState): Promise<PriceResult> {
	const { source, itemStyle, itemPrice, buff_name, market_id, priceListing, priceOrder, priceFromReference, difference, currency } = await getBuffItem(item);

	let footerContainer = container.querySelector<HTMLElement>(WAXPEER_SELECTORS.item.body);
	if (state === PageState.ItemPage) {
		const newContainer = document.createElement('div');
		footerContainer?.before(newContainer);
		footerContainer = newContainer;
	}

	const isItemPage = state === PageState.ItemPage;
	const isDoppler = buff_name.includes('Doppler') && buff_name.includes('|');
	const maximumFractionDigits = state === PageState.List || (priceListing?.gt(1000) && state !== PageState.ItemPage) ? 0 : 2;
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
			iconHeight: isItemPage ? '24px' : state === PageState.List ? '16px' : '20px',
			hasPro: isUserPro(extensionSettings['user']),
			tooltipArrow: true,
		});
		footerContainer.insertAdjacentHTML('beforeend', buffContainer);
	}

	const discountContainer = footerContainer?.querySelector(WAXPEER_SELECTORS.item.price);

	if (discountContainer && !container.querySelector('.betterfloat-sale-tag') && (extensionSettings['wp-buffdifference'] || extensionSettings['wp-buffdifferencepercent'])) {
		container.querySelector('.discount')?.setAttribute('style', 'display: none !important;');

		discountContainer.insertAdjacentHTML('beforeend', createSaleTag(difference, itemPrice.div(priceFromReference ?? 1).mul(100), currencyFormatter));
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

	const { color, background } = percentage.gt(100) ? styling.loss : styling.profit;

	return html`
		<div class="betterfloat-sale-tag" style="background-color: ${background}; color: ${color};">
			${extensionSettings['bs-buffdifference'] ? html`<span>${difference.isPos() ? '+' : '-'}${currencyFormatter.format(difference.abs().toNumber())} </span>` : ''}
			${extensionSettings['bs-buffdifferencepercent'] ? html`<span>(${percentage.gt(150) ? percentage.toFixed(0) : percentage.toFixed(2)}%)</span>` : ''}
		</div>
	`;
}

async function getBuffItem(item: Waxpeer.Item) {
	let source = (extensionSettings['wp-pricingsource'] as MarketSource) ?? MarketSource.Buff;
	const buff_item = createBuffItem(item);
	const buff_name = handleSpecialStickerNames(buff_item.name);
	let { priceListing, priceOrder } = await getBuffPrice(buff_name, buff_item.style, source);

	if (source === MarketSource.Buff && isBuffBannedItem(buff_name)) {
		priceListing = new Decimal(0);
		priceOrder = new Decimal(0);
	}

	if (((!priceListing && !priceOrder) || (priceListing?.isZero() && priceOrder?.isZero())) && extensionSettings['wp-altmarket'] && extensionSettings['wp-altmarket'] !== MarketSource.None) {
		source = extensionSettings['wp-altmarket'] as MarketSource;
		const altPrices = await getBuffPrice(buff_name, buff_item.style, source);
		priceListing = altPrices.priceListing;
		priceOrder = altPrices.priceOrder;
	}
	const market_id = getMarketID(buff_name, source);

	let itemPrice = getItemPrice(item);
	const userCurrency = getUserCurrency();
	const currencySymbol = getSymbolFromCurrency(userCurrency);
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

function getUserCurrency() {
	return localStorage.getItem('currency') || 'USD';
}

function getItemPrice(item: Waxpeer.Item) {
	return new Decimal(item.price).div(1000);
}

function createBuffItem(item: Waxpeer.Item): { name: string; style: ItemStyle } {
	let name = item.name;
	if (name.startsWith('★') && !name.startsWith('★ ')) {
		name = name.replace('★', '★ ');
	}
	const buff_item = {
		name,
		style: '' as ItemStyle,
	};
	if (item.name.includes('Doppler')) {
		// Get and remove the phase from name
		const phase = item.name.split('Doppler')[1].split('(')[0].trim() as DopplerPhase;
		buff_item.name = item.name.replace(` ${phase}`, '').trim();
		buff_item.style = phase;
	}
	return buff_item;
}

enum PageState {
	Market = 0,
	ItemPage = 1,
	Similar = 2,
	List = 3,
}

// mutation observer active?
let isObserverActive = false;
let extensionSettings: IStorage;

init();
