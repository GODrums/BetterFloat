import { html } from 'common-tags';
import getSymbolFromCurrency from 'currency-symbol-map';
import Decimal from 'decimal.js';
import type { PlasmoCSConfig } from 'plasmo';
import type { DopplerPhase, ItemStyle } from '~lib/@typings/FloatTypes';
import type { Shadowpay } from '~lib/@typings/ShadowpayTypes';
import { getBitskinsCurrencyRate } from '~lib/handlers/cache/bitskins_cache';
import { getShadowpayInventoryItem, getSpecificShadowpayItem } from '~lib/handlers/cache/shadowpay_cache';
import { activateHandler, initPriceMapping } from '~lib/handlers/eventhandler';
import { initShadowpayHistory } from '~lib/handlers/historyhandler';
import { getMarketID } from '~lib/handlers/mappinghandler';
import { SHADOWPAY_SELECTORS } from '~lib/handlers/selectors/shadowpay_selectors';
import { MarketSource } from '~lib/util/globals';
import { CurrencyFormatter, checkUserPlanPro, getBuffPrice, handleSpecialStickerNames, isUserPro } from '~lib/util/helperfunctions';
import { getAllSettings, type IStorage } from '~lib/util/storage';
import { generatePriceLine } from '~lib/util/uigeneration';

export const config: PlasmoCSConfig = {
	matches: ['*://*.shadowpay.com/*'],
	run_at: 'document_end',
	css: ['../css/hint.min.css', '../css/common_styles.css', '../css/bitskins_styles.css'],
};

type PriceResult = {
	price_difference: Decimal;
};

async function init() {
	console.time('[BetterFloat] Shadowpay init timer');

	if (location.host !== 'shadowpay.com') {
		return;
	}

	initShadowpayHistory();

	// catch the events thrown by the script
	// this has to be done as first thing to not miss timed events
	activateHandler();

	extensionSettings = await getAllSettings();

	if (!extensionSettings['shp-enable']) return;

	// check if user has the required plan
	if (!(await checkUserPlanPro(extensionSettings['user']))) {
		console.log('[BetterFloat] Pro plan required for Shadowpay features');
		return;
	}

	await initPriceMapping(extensionSettings, 'shp');

	console.timeEnd('[BetterFloat] Shadowpay init timer');

	// mutation observer is only needed once
	if (!isObserverActive) {
		isObserverActive = true;
		applyMutation();
		console.log('[BetterFloat] Mutation observer started');
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

				if (addedNode.tagName === 'A' && addedNode.getAttribute('href')?.includes('/item/')) {
					// check if it's a cs item
					if (
						addedNode.parentElement?.classList.contains('item-buy-card_project_dota2') ||
						addedNode.parentElement?.classList.contains('item-buy-card_project_rust') ||
						addedNode.parentElement?.classList.contains('item-buy-card_project_fish_idle2')
					) {
						continue;
					}
					await adjustItem(addedNode, PageState.Market);
				} else if (addedNode.tagName === 'DIV' && addedNode.className === SHADOWPAY_SELECTORS.classes.inventoryWrapper) {
					const items = addedNode.querySelectorAll(SHADOWPAY_SELECTORS.inventory.itemCard);
					for (const item of items) {
						await adjustItem(item, PageState.Inventory);
					}
				}
			}
		}
	});
	observer.observe(document, { childList: true, subtree: true });
}

function getItemID(container: Element, state: PageState) {
	if (state === PageState.Market) {
		return container.getAttribute('href')?.split('/')[2]?.split('-')[0];
	} else if (state === PageState.Inventory) {
		return container.querySelector(SHADOWPAY_SELECTORS.inventory.itemImage)?.getAttribute('src')?.split('/')[5];
	}
}

function getAPIItem(state: PageState, itemID: string) {
	if (state === PageState.Market) {
		return getSpecificShadowpayItem(itemID);
	} else if (state === PageState.Inventory) {
		return getShadowpayInventoryItem(itemID);
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
	console.log('[BetterFloat] Item found:', item);

	// eslint-disable-next-line @typescript-eslint/no-unused-vars
	const _priceResult = await addBuffPrice(item, container, state);

	// store item in html
	// container.setAttribute('data-betterfloat', JSON.stringify(item));
}

async function addBuffPrice(item: Shadowpay.Item, container: Element, state: PageState): Promise<PriceResult> {
	const { source, itemStyle, itemPrice, buff_name, market_id, priceListing, priceOrder, priceFromReference, difference, currency } = await getBuffItem(item);

	let footerContainer: HTMLElement | null = null;
	if (state === PageState.Market) {
		footerContainer = container.querySelector<HTMLElement>(SHADOWPAY_SELECTORS.market.footer);
	} else if (state === PageState.Inventory) {
		footerContainer = container.querySelector<HTMLElement>(SHADOWPAY_SELECTORS.inventory.container);
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
			hasPro: isUserPro(extensionSettings['user']),
			tooltipArrow: true,
		});
		footerContainer.insertAdjacentHTML('beforeend', buffContainer);

		if (state === PageState.Market) {
			footerContainer.querySelector(SHADOWPAY_SELECTORS.market.steamPrice)?.remove();
		} else if (state === PageState.Inventory) {
			container.querySelector(SHADOWPAY_SELECTORS.inventory.container)?.setAttribute('style', 'gap: 0px;');
		}
	}

	const priceContainer = container.querySelector(SHADOWPAY_SELECTORS.market.priceContainer);
	container.querySelector(SHADOWPAY_SELECTORS.market.discount)?.remove();

	if (
		priceContainer &&
		!container.querySelector('.betterfloat-sale-tag') &&
		state !== PageState.Inventory &&
		(extensionSettings['shp-buffdifference'] || extensionSettings['shp-buffdifferencepercent'])
	) {
		priceContainer.insertAdjacentHTML('beforeend', createSaleTag(difference, itemPrice.div(priceFromReference ?? 1).mul(100), currencyFormatter));
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
		<div class="discount flex betterfloat-sale-tag" style="background-color: ${background}; color: ${color};">
			${extensionSettings['shp-buffdifference'] ? html`<span>${difference.isPos() ? '+' : '-'}${currencyFormatter.format(difference.abs().toNumber())} </span>` : ''}
			${extensionSettings['shp-buffdifferencepercent'] ? html`<span>(${percentage.gt(150) ? percentage.toFixed(0) : percentage.toFixed(2)}%)</span>` : ''}
		</div>
	`;
}

async function getBuffItem(item: Shadowpay.Item) {
	let source = (extensionSettings['shp-pricingsource'] as MarketSource) ?? MarketSource.Buff;
	const buff_item = createBuffItem(item);
	const buff_name = handleSpecialStickerNames(buff_item.name);
	let { priceListing, priceOrder } = await getBuffPrice(buff_name, buff_item.style, source);

	if (((!priceListing && !priceOrder) || (priceListing?.isZero() && priceOrder?.isZero())) && extensionSettings['shp-altmarket'] && extensionSettings['shp-altmarket'] !== MarketSource.None) {
		source = extensionSettings['shp-altmarket'] as MarketSource;
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
		Number(extensionSettings['shp-pricereference']) === 0 && ([MarketSource.Buff, MarketSource.Steam].includes(source) || (MarketSource.YouPin === source && isUserPro(extensionSettings['user'])))
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

function getItemPrice(item: Shadowpay.Item) {
	return new Decimal(item.price);
}

function createBuffItem(item: Shadowpay.Item): { name: string; style: ItemStyle } {
	const buff_item = {
		name: item.steam_market_hash_name,
		style: '' as ItemStyle,
	};
	if (item.phase && item.steam_market_hash_name.includes('Doppler')) {
		buff_item.style = item.phase as ItemStyle;
	}
	return {
		name: buff_item.name,
		style: buff_item.style,
	};
}

enum PageState {
	Market = 0,
	ItemPage = 1,
	Inventory = 2,
}

// mutation observer active?
let isObserverActive = false;
let extensionSettings: IStorage;

init();
