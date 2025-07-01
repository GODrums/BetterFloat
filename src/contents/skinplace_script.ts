import { html } from 'common-tags';
import getSymbolFromCurrency from 'currency-symbol-map';
import Decimal from 'decimal.js';
import type { PlasmoCSConfig } from 'plasmo';
import type { DopplerPhase, ItemStyle } from '~lib/@typings/FloatTypes';
import type { Skinout } from '~lib/@typings/SkinoutTypes';
import { getBitskinsCurrencyRate } from '~lib/handlers/cache/bitskins_cache';
import { getFirstSkinoutItem, getSpecificSkinoutUserItem } from '~lib/handlers/cache/skinout_cache';
import { activateHandler, initPriceMapping } from '~lib/handlers/eventhandler';
import { getMarketID } from '~lib/handlers/mappinghandler';
import { SKINOUT_SELECTORS } from '~lib/handlers/selectors/skinout_selectors';
import { MarketSource } from '~lib/util/globals';
import { CurrencyFormatter, checkUserPlanPro, getBuffPrice, handleSpecialStickerNames, isUserPro } from '~lib/util/helperfunctions';
import { getAllSettings, type IStorage } from '~lib/util/storage';
import { generatePriceLine } from '~lib/util/uigeneration';

export const config: PlasmoCSConfig = {
	matches: ['*://*.skin.place/*'],
	run_at: 'document_end',
	css: ['../css/hint.min.css', '../css/common_styles.css', '../css/skinplace_styles.css'],
};

type PriceResult = {
	price_difference: Decimal;
};

async function init() {
	console.time('[BetterFloat] Skin.Place init timer');

	if (location.host !== 'skin.place') {
		return;
	}

	await replaceHistory();

	// catch the events thrown by the script
	// this has to be done as first thing to not miss timed events
	activateHandler();

	extensionSettings = await getAllSettings();

	if (!extensionSettings['splace-enable']) return;

	// check if user has the required plan
	if (!(await checkUserPlanPro(extensionSettings['user']))) {
		console.log('[BetterFloat] Pro plan required for Skin.Place features');
		return;
	}

	await initPriceMapping(extensionSettings, 'splace');

	console.timeEnd('[BetterFloat] SkinPlace init timer');

	// mutation observer is only needed once
	if (!isObserverActive) {
		isObserverActive = true;
		applyMutation();
		console.log('[BetterFloat] Mutation observer started');
	}

	firstLaunch();
}

function firstLaunch() {
	setTimeout(() => {
		const refreshButton = document.querySelector<HTMLButtonElement>(location.pathname.includes('market') ? SKINOUT_SELECTORS.filters.refreshButton : '#skins_refresh_btn');
		if (refreshButton) {
			refreshButton.click();
		}
	}, 2000);
}

async function replaceHistory() {
	// wait for the page to load
	const loggedOut = await new Promise((resolve) => {
		const interval = setInterval(() => {
			if (document.querySelector('img[alt="user avatar"]')) {
				clearInterval(interval);
				resolve(false);
			} else if (document.querySelector('img[src="/images/icons/register-via-steam.svg"]')) {
				clearInterval(interval);
				resolve(true);
			}
		}, 100);
	});

	if (loggedOut && !location.search.includes('utm_campaign')) {
		location.search += `${location.search ? '&' : ''}utm_campaign=IiV5cv0kjHjDlFR`;
	}
}

function applyMutation() {
	const observer = new MutationObserver(async (mutations) => {
		for (const mutation of mutations) {
			for (let i = 0; i < mutation.addedNodes.length; i++) {
				const addedNode = mutation.addedNodes[i];
				// some nodes are not elements, so we need to check
				if (!(addedNode instanceof HTMLElement)) continue;
				// console.debug('[BetterFloat] Skinout Mutation detected:', addedNode);

				if (addedNode.className === SKINOUT_SELECTORS.item.listItem) {
					await adjustItem(addedNode, PageState.Market);
				} else if (addedNode.className.includes('item--sell-page')) {
					await adjustItem(addedNode, PageState.Inventory);
				}
			}
		}
	});
	observer.observe(document, { childList: true, subtree: true });
}

function getAPIItem(container: Element, state: PageState): Skinout.Item | Skinout.InventoryItem | null {
	if (state === PageState.Market) {
		return getFirstSkinoutItem() || null;
	} else if (state === PageState.Inventory) {
		const assetId = container.getAttribute('assetid');
		if (!assetId) return null;
		return getSpecificSkinoutUserItem(assetId) || null;
	}
	return null;
}

async function adjustItem(container: Element, state: PageState) {
	let item = getAPIItem(container, state);

	let tries = 10;
	while (!item && tries-- > 0) {
		await new Promise((resolve) => setTimeout(resolve, 200));
		item = getAPIItem(container, state);
	}
	// console.log('[BetterFloat] Skinout item:', item);
	if (!item) return;

	const _priceResult = await addBuffPrice(item, container);
}

async function addBuffPrice(item: Skinout.Item | Skinout.InventoryItem, container: Element): Promise<PriceResult> {
	const { source, itemStyle, itemPrice, buff_name, market_id, priceListing, priceOrder, priceFromReference, difference, currency } = await getBuffItem(item);

	const footerContainer = container.querySelector(SKINOUT_SELECTORS.item.bottom);

	const isDoppler = item.market_hash_name.includes('Doppler');
	const maximumFractionDigits = priceListing?.gt(1000) ? 0 : 2;
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
			isPopout: false,
			addSpaceBetweenPrices: true,
			showPrefix: false,
			iconHeight: '16px',
			hasPro: isUserPro(extensionSettings['user']),
			tooltipArrow: true,
		});

		footerContainer.insertAdjacentHTML('beforeend', buffContainer);
	}

	const priceContainer = container.querySelector(SKINOUT_SELECTORS.item.counters);

	if (priceContainer && !container.querySelector('.betterfloat-sale-tag') && (extensionSettings['splace-buffdifference'] || extensionSettings['splace-buffdifferencepercent'])) {
		priceContainer.insertAdjacentHTML('beforeend', createSaleTag(difference, itemPrice.div(priceFromReference ?? 1).mul(100), currencyFormatter));
	}

	return {
		price_difference: difference,
	};
}

function createSaleTag(difference: Decimal, percentage: Decimal, currencyFormatter: Intl.NumberFormat) {
	const styling = {
		profit: {
			color: '#30d158',
			background: '#30d15829',
		},
		loss: {
			color: '#ff8095',
			background: '#3a0e0e',
		},
	};

	const { color, background } = percentage.gt(100) ? styling.loss : styling.profit;

	return html`
		<div class="discount flex betterfloat-sale-tag" style="background-color: ${background}; color: ${color};">
			${extensionSettings['splace-buffdifference'] ? html`<span>${difference.isPos() ? '+' : '-'}${currencyFormatter.format(difference.abs().toNumber())} </span>` : ''}
			${extensionSettings['splace-buffdifferencepercent'] ? html`<span>(${percentage.gt(150) ? percentage.toFixed(0) : percentage.toFixed(2)}%)</span>` : ''}
		</div>
	`;
}

async function getBuffItem(item: Skinout.Item | Skinout.InventoryItem) {
	let source = (extensionSettings['splace-pricingsource'] as MarketSource) ?? MarketSource.Buff;
	const buff_item = createBuffItem(item);
	const buff_name = handleSpecialStickerNames(buff_item.name);
	let { priceListing, priceOrder } = await getBuffPrice(buff_name, buff_item.style, source);

	if (((!priceListing && !priceOrder) || (priceListing?.isZero() && priceOrder?.isZero())) && extensionSettings['splace-altmarket'] && extensionSettings['splace-altmarket'] !== MarketSource.None) {
		source = extensionSettings['splace-altmarket'] as MarketSource;
		const altPrices = await getBuffPrice(buff_name, buff_item.style, source);
		priceListing = altPrices.priceListing;
		priceOrder = altPrices.priceOrder;
	}
	const market_id = await getMarketID(buff_name, source);

	let itemPrice = getItemPrice(item);
	const userCurrency = getUserCurrency();
	const currencySymbol = getSymbolFromCurrency(userCurrency);
	const currencyRate = getBitskinsCurrencyRate(userCurrency);

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
		Number(extensionSettings['splace-pricereference']) === 0 &&
		([MarketSource.Buff, MarketSource.Steam].includes(source) || (MarketSource.YouPin === source && isUserPro(extensionSettings['user'])))
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

function getItemPrice(item: Skinout.Item | Skinout.InventoryItem): Decimal {
	return new Decimal(item.price);
}

function createBuffItem(item: Skinout.Item | Skinout.InventoryItem): { name: string; style: ItemStyle } {
	const buff_item = {
		name: item.market_hash_name,
		style: '' as ItemStyle,
	};
	if (item.market_hash_name.includes('Doppler')) {
		const phase = item.market_hash_name.split(') ')[1];
		buff_item.style = phase as ItemStyle;
		buff_item.name = item.market_hash_name.replace(` ${phase}`, '');
	}
	return {
		name: buff_item.name,
		style: buff_item.style,
	};
}

enum PageState {
	Market = 0,
	Inventory = 1,
}

// mutation observer active?
let isObserverActive = false;
let extensionSettings: IStorage;

init();
