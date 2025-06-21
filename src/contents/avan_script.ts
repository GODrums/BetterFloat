import { html } from 'common-tags';
import getSymbolFromCurrency from 'currency-symbol-map';
import Decimal from 'decimal.js';
import type { PlasmoCSConfig } from 'plasmo';
import type { Avanmarket } from '~lib/@typings/AvanTypes';
import type { DopplerPhase, ItemStyle } from '~lib/@typings/FloatTypes';
import { getAvanmarketInventoryItem, getFirstAvanmarketItem } from '~lib/handlers/cache/avan_cache';
import { getBitskinsCurrencyRate } from '~lib/handlers/cache/bitskins_cache';
import { activateHandler, initPriceMapping } from '~lib/handlers/eventhandler';
import { getMarketID } from '~lib/handlers/mappinghandler';
import { AVAN_SELECTORS } from '~lib/handlers/selectors/avan_selectors';
import { MarketSource } from '~lib/util/globals';
import { CurrencyFormatter, checkUserPlanPro, getBuffPrice, handleSpecialStickerNames, isBuffBannedItem, isUserPro } from '~lib/util/helperfunctions';
import { getAllSettings, type IStorage } from '~lib/util/storage';
import { generatePriceLine } from '~lib/util/uigeneration';

export const config: PlasmoCSConfig = {
	matches: ['*://*.avan.market/*'],
	run_at: 'document_end',
	css: ['../css/hint.min.css', '../css/common_styles.css', '../css/avan_styles.css'],
};

type PriceResult = {
	price_difference: Decimal;
};

async function init() {
	console.time('[BetterFloat] Avanmarket init timer');

	if (location.host !== 'avan.market') {
		return;
	}

	replaceHistory();

	// catch the events thrown by the script
	// this has to be done as first thing to not miss timed events
	activateHandler();

	extensionSettings = await getAllSettings();

	if (!extensionSettings['av-enable']) return;

	// check if user has the required plan
	if (!(await checkUserPlanPro(extensionSettings['user']))) {
		console.log('[BetterFloat] Pro plan required for Avanmarket features');
		return;
	}

	await initPriceMapping(extensionSettings, 'av');

	console.timeEnd('[BetterFloat] Avanmarket init timer');

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
			if (document.querySelector(AVAN_SELECTORS.AUTH.LOGGED_IN)) {
				clearInterval(interval);
				resolve(false);
			} else if (document.querySelector(AVAN_SELECTORS.AUTH.LOGGED_OUT)) {
				clearInterval(interval);
				resolve(true);
			}
		}, 100);
	});

	if (loggedOut && !location.search.includes('r=')) {
		location.search += `${location.search ? '&' : ''}r=a0NNFQvBTf4s`;
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

				if (addedNode.className.startsWith(AVAN_SELECTORS.MUTATION.MARKET_CARD)) {
					await adjustItem(addedNode, PageState.Market);
				} else if (addedNode.className.startsWith(AVAN_SELECTORS.MUTATION.INVENTORY_CARD)) {
					await adjustItem(addedNode, PageState.Inventory);
				}
			}
		}
	});
	observer.observe(document, { childList: true, subtree: true });
}

function getAPIItem(container: Element, state: PageState) {
	if (state === PageState.Market) {
		return getFirstAvanmarketItem();
	} else if (state === PageState.Inventory) {
		const itemName = container.querySelector<HTMLElement>(AVAN_SELECTORS.STATE.INVENTORY.ITEM_NAME)?.textContent?.trim();
		if (itemName) {
			return getAvanmarketInventoryItem(itemName);
		}
		return null;
	}
}

async function adjustItem(container: Element, state: PageState) {
	let item = getAPIItem(container, state);

	let tries = 10;
	while (!item && tries-- > 0) {
		await new Promise((resolve) => setTimeout(resolve, 200));
		item = getAPIItem(container, state);
	}
	console.log('[BetterFloat] Avanmarket item:', item);
	if (!item) return;

	// eslint-disable-next-line @typescript-eslint/no-unused-vars
	const _priceResult = await addBuffPrice(item, container, state);

	// store item in html
	// container.setAttribute('data-betterfloat', JSON.stringify(item));
}

async function addBuffPrice(item: Avanmarket.Item | Avanmarket.InventoryItem, container: Element, state: PageState): Promise<PriceResult> {
	const { source, itemStyle, itemPrice, buff_name, market_id, priceListing, priceOrder, priceFromReference, difference, currency } = await getBuffItem(item);

	let footerContainer: HTMLElement | null = null;
	if (state === PageState.Market) {
		footerContainer = container.querySelector<HTMLElement>(AVAN_SELECTORS.STATE.MARKET.FOOTER);
	} else if (state === PageState.Inventory) {
		footerContainer = container.querySelector<HTMLElement>(AVAN_SELECTORS.STATE.INVENTORY.FOOTER);
		container.classList.add('inventory-item');
	}

	const isInventoryItem = state === PageState.Inventory;
	const isDoppler = isAvanmarketItem(item) && !!item.phase;
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
			iconHeight: isInventoryItem ? '16px' : '20px',
			hasPro: isUserPro(extensionSettings['user']),
			tooltipArrow: true,
		});
		if (state === PageState.Market) {
			footerContainer.insertAdjacentHTML('afterend', buffContainer);

			(footerContainer.firstElementChild as HTMLElement).style.whiteSpace = 'nowrap';

			(container as HTMLElement).style.height = '350px';
		} else if (state === PageState.Inventory) {
			footerContainer.insertAdjacentHTML('beforeend', buffContainer);
		}
	}

	let discountContainer = container.querySelector(AVAN_SELECTORS.STATE.MARKET.DISCOUNT);
	if (!discountContainer) {
		const newContainer = document.createElement('div');
		newContainer.classList.add('discount');
		footerContainer?.appendChild(newContainer);
		discountContainer = newContainer;
	}

	if (
		discountContainer &&
		!container.querySelector('.betterfloat-sale-tag') &&
		(extensionSettings['av-buffdifference'] || extensionSettings['av-buffdifferencepercent']) &&
		state === PageState.Market
	) {
		discountContainer.outerHTML = createSaleTag(difference, itemPrice.div(priceFromReference ?? 1).mul(100), currencyFormatter);
	}

	return {
		price_difference: difference,
	};
}

function createSaleTag(difference: Decimal, percentage: Decimal, currencyFormatter: Intl.NumberFormat) {
	const styling = {
		profit: {
			color: 'var(--main-green)',
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
			${extensionSettings['av-buffdifference'] ? html`<span>${difference.isPos() ? '+' : '-'}${currencyFormatter.format(difference.abs().toNumber())} </span>` : ''}
			${extensionSettings['av-buffdifferencepercent'] ? html`<span>(${percentage.gt(150) ? percentage.toFixed(0) : percentage.toFixed(2)}%)</span>` : ''}
		</div>
	`;
}

async function getBuffItem(item: Avanmarket.Item | Avanmarket.InventoryItem) {
	let source = (extensionSettings['av-pricingsource'] as MarketSource) ?? MarketSource.Buff;
	const buff_item = createBuffItem(item);
	const buff_name = handleSpecialStickerNames(buff_item.name);
	let { priceListing, priceOrder } = await getBuffPrice(buff_name, buff_item.style, source);

	if (source === MarketSource.Buff && isBuffBannedItem(buff_name)) {
		priceListing = new Decimal(0);
		priceOrder = new Decimal(0);
	}

	if (((!priceListing && !priceOrder) || (priceListing?.isZero() && priceOrder?.isZero())) && extensionSettings['av-altmarket'] && extensionSettings['av-altmarket'] !== MarketSource.None) {
		source = extensionSettings['av-altmarket'] as MarketSource;
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
			priceListing = priceListing.div(currencyRate);
		}
		if (priceOrder) {
			priceOrder = priceOrder.div(currencyRate);
		}
		itemPrice = itemPrice.div(currencyRate);
	}

	const referencePrice =
		Number(extensionSettings['av-pricereference']) === 0 && ([MarketSource.Buff, MarketSource.Steam].includes(source) || (MarketSource.YouPin === source && isUserPro(extensionSettings['user'])))
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

function getItemPrice(item: Avanmarket.Item | Avanmarket.InventoryItem) {
	if (isAvanmarketItem(item)) {
		return new Decimal(item.sell_items[0].sell_price);
	} else {
		return new Decimal(item.price);
	}
}

function createBuffItem(item: Avanmarket.Item | Avanmarket.InventoryItem): { name: string; style: ItemStyle } {
	const buff_item = {
		name: '',
		style: '' as ItemStyle,
	};
	if (isAvanmarketItem(item)) {
		buff_item.name = item.full_name;
	} else {
		buff_item.name = item.name;
		if (item.quality) {
			buff_item.name += ` (${item.quality})`;
		}
	}
	if (isAvanmarketItem(item) && item.phase) {
		buff_item.style = item.phase as ItemStyle;
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

// Type guard functions
function isAvanmarketItem(item: Avanmarket.Item | Avanmarket.InventoryItem): item is Avanmarket.Item {
	return 'full_name' in item && 'sell_items' in item;
}

function isAvanmarketInventoryItem(item: Avanmarket.Item | Avanmarket.InventoryItem): item is Avanmarket.InventoryItem {
	return 'price' in item && 'iconUrl' in item && 'assetId' in item;
}

// mutation observer active?
let isObserverActive = false;
let extensionSettings: IStorage;

init();
