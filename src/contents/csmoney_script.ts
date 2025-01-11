import { html } from 'common-tags';
import Decimal from 'decimal.js';
import type { PlasmoCSConfig } from 'plasmo';

import type { CSMoney } from '~lib/@typings/CsmoneyTypes';
import type { DopplerPhase, ItemStyle } from '~lib/@typings/FloatTypes';
import {
	getCSMoneyPopupItem,
	getFirstCSMoneyBotInventoryItem,
	getFirstCSMoneyItem,
	getFirstCSMoneyUserInventoryItem,
	getSpecificCSMoneyItem,
	isCSMoneyBotInventoryEmpty,
	isCSMoneyItemsEmpty,
	isCSMoneyUserInventoryEmpty,
} from '~lib/handlers/cache/csmoney_cache';
import { activateHandler, initPriceMapping } from '~lib/handlers/eventhandler';
import { getAndFetchCurrencyRate, getMarketID } from '~lib/handlers/mappinghandler';
import { type CSMONEY_SELECTOR, CSMONEY_SELECTORS } from '~lib/handlers/selectors/csmoney_selectors';
import { MarketSource } from '~lib/util/globals';
import { CurrencyFormatter, checkUserPlanPro, createHistoryRewrite, getBuffPrice, handleSpecialStickerNames, isBuffBannedItem, parsePrice, waitForElement } from '~lib/util/helperfunctions';
import { type IStorage, getAllSettings } from '~lib/util/storage';
import { generatePriceLine } from '~lib/util/uigeneration';

export const config: PlasmoCSConfig = {
	matches: ['https://*.cs.money/*'],
	run_at: 'document_end',
	css: ['../css/hint.min.css', '../css/common_styles.css', '../css/csmoney_styles.css'],
};

export type PriceResult = {
	price_difference: Decimal;
};

async function init() {
	console.time('[BetterFloat] CSMoney init timer');

	if (location.hostname !== 'cs.money') {
		return;
	}
	// catch the events thrown by the script
	// this has to be done as first thing to not miss timed events
	activateHandler();

	extensionSettings = await getAllSettings();
	console.log('[BetterFloat] Extension settings:', extensionSettings);

	if (!extensionSettings['csm-enable']) return;

	// check if user has the required plan
	if (!checkUserPlanPro(extensionSettings['user'])) {
		console.log('[BetterFloat] Pro plan required for CSMoney features');
		return;
	}

	replaceHistory();

	await initPriceMapping(extensionSettings, 'csm');

	console.timeEnd('[BetterFloat] CSMoney init timer');

	await firstLaunch();

	// mutation observer is only needed once
	if (!isObserverActive) {
		isObserverActive = true;
		applyMutation();
		console.log('[BetterFloat] Mutation observer started');
	}
}

async function firstLaunch() {
	const items = document.querySelectorAll('div[class^="actioncard_wrapper"]');

	for (let i = 0; i < items.length; i++) {
		await adjustItem(items[i]);
	}

	// these reloads are required to get the API data,
	// as the injected script is too slow for the initial load
	if (location.pathname === '/market/buy/') {
		// reload market page
		const reloadButton = document.querySelector<HTMLElement>('div[class^="InventoryReloadButton_container__"]');
		if (reloadButton) {
			reloadButton.click();
		}
	} else if (location.pathname === '/market/instant-sell/' || location.pathname === '/market/sell/') {
		// reload instant sell page
		const reloadButton = document.querySelector<HTMLElement>('div[class^="InventoryReloadButton_wrapper__"]');
		if (reloadButton) {
			reloadButton.click();
		}
	} else if (location.pathname === '/csgo/trade/') {
		// reload bot inventory
		const reloadButton = document.querySelector<HTMLElement>('div[class^="ReloadButton_reload_button__"]');
		if (reloadButton) {
			reloadButton.click();
		}
	} else if (location.pathname === '/profile/offers') {
		//
	}
}

function replaceHistory() {
	const sessionMedium = sessionStorage.getItem('bf.utm_medium');
	if (sessionMedium) return;

	let utmMedium = new URLSearchParams(location.search).get('utm_medium');
	if (!utmMedium) {
		utmMedium = 'betterfloat';
		sessionStorage.setItem('bf.utm_medium', utmMedium);
	}
	if (utmMedium === 'betterfloat' && Math.random() < 0.5) {
		createHistoryRewrite({ utm_campaign: 'market', utm_source: 'mediabuy', utm_medium: utmMedium, utm_content: 'link' });
	}
}

function applyMutation() {
	const observer = new MutationObserver(async (mutations) => {
		for (const mutation of mutations) {
			for (let i = 0; i < mutation.addedNodes.length; i++) {
				const addedNode = mutation.addedNodes[i];
				// some nodes are not elements, so we need to check
				if (!(addedNode instanceof HTMLElement)) continue;
				// console.debug('[BetterFloat] Mutation detected:', addedNode, addedNode.tagName, addedNode.className.toString());

				if (addedNode.tagName === 'DIV' && addedNode.className.startsWith('InventorySearchResults_item__') && addedNode.firstElementChild?.getAttribute('data-card-id')) {
					// item in buy-tab
					setTimeout(async () => {
						await adjustItem(addedNode);
					}, 1000);
				} else if (addedNode.className === 'portal') {
					// item popups are detected by event listeners
					// const bigCard = addedNode.querySelector('div[class^="DesktopBigCardLayout_content-wrapper__"]');
					// if (bigCard) {
					// 	await adjustItem(bigCard, true);
					// }
				} else if (addedNode.tagName === 'DIV' && addedNode.className.startsWith('UserSkin_user_skin__')) {
					// item in insta sell page
					await adjustItem(addedNode);
				} else if (addedNode.tagName === 'DIV') {
					// item in trade-tab
					const item = addedNode.querySelector('div[class^="actioncard_wrapper"]');
					if (item) {
						await adjustItem(item);
					}
				}
			}
		}
	});
	observer.observe(document, { childList: true, subtree: true });
}

async function adjustItem(container: Element, isPopout = false, eventDataItem: CSMoney.Item | null = null) {
	const itemId = container?.getAttribute('data-card-item-id');
	const getApiItem = () => {
		if (isPopout) {
			return getCSMoneyPopupItem() ?? eventDataItem;
		}
		if (location.pathname === '/csgo/trade/') {
			const isUserItem = !container.closest(CSMONEY_SELECTORS.trade.isUserItem);
			return isUserItem ? getFirstCSMoneyUserInventoryItem() : getFirstCSMoneyBotInventoryItem();
		} else {
			let newItem = getFirstCSMoneyItem();
			if (!newItem) {
				newItem = getSpecificCSMoneyItem(itemId ? Number(itemId) : 0);
			}
			return newItem;
		}
	};
	const isInventoryEmpty = () => {
		if (location.pathname === '/csgo/trade/') {
			const isUserItem = !container.closest(CSMONEY_SELECTORS.trade.isUserItem);
			return isUserItem ? isCSMoneyUserInventoryEmpty() : isCSMoneyBotInventoryEmpty();
		} else {
			return isCSMoneyItemsEmpty();
		}
	};
	let apiItem = getApiItem();

	let attempts = 0;
	while (!apiItem && attempts++ < 5 && isInventoryEmpty()) {
		// wait for 1s and try again
		console.debug('[BetterFloat] No item found, waiting 1s and trying again...', container);
		await new Promise((resolve) => setTimeout(resolve, 1000));
		apiItem = getApiItem();
	}
	// make sure item id matches with queue, otherwise bring the queue up to date
	if (itemId && apiItem && apiItem.id !== Number(itemId)) {
		console.debug('[BetterFloat] Item ID mismatch, bringing queue up to date...');
		let altItem = getFirstCSMoneyItem();
		while (altItem && altItem?.id !== Number(itemId)) {
			altItem = getFirstCSMoneyItem();
		}
		if (altItem) {
			console.debug('[BetterFloat] Item found in queue:', altItem);
			apiItem = altItem;
		} else {
			console.error('[BetterFloat] Item not found in queue:', itemId);
		}
	}
	if (!apiItem) {
		console.error('[BetterFloat] No item found, skipping...');
		return;
	}
	// eslint-disable-next-line @typescript-eslint/no-unused-vars
	const priceResult = await addBuffPrice(apiItem, container, isPopout);

	if (!isPopout) {
		await addPopupListener(container, apiItem);
	}
}

async function addPopupListener(container: Element, item: CSMoney.Item) {
	container.addEventListener('click', async () => {
		const selector = location.pathname === '/market/sell/' ? CSMONEY_SELECTORS.sell.popup : CSMONEY_SELECTORS.market.popup;
		waitForElement(selector).then(async (success) => {
			if (success) {
				const bigCard = document.querySelector(selector);
				if (bigCard) {
					if (location.pathname === '/market/buy/') {
						await adjustItem(bigCard, true, item);
					}
					addSimilarButton(bigCard, item);
				}
			}
		});
	});
}

/**
 * Adds a button to the item popup to view similar items on the market
 * @param container popup base element
 * @param item item object from the API
 */
function addSimilarButton(container: Element, item: CSMoney.Item) {
	const selector = location.pathname === '/market/sell/' ? CSMONEY_SELECTORS.sell.popup_details : CSMONEY_SELECTORS.market.popup_details;
	const parentElement = container.querySelector(selector);
	if (!parentElement) return;

	const url = new URL('https://cs.money/market/buy/');
	url.searchParams.append('utm_campaign', 'market');
	url.searchParams.append('utm_source', 'mediabuy');
	url.searchParams.append('utm_medium', 'betterfloat');
	url.searchParams.append('utm_content', 'link');
	url.searchParams.append('sort', 'price');
	url.searchParams.append('order', 'asc');
	url.searchParams.append('search', getItemName(item) ?? '');

	const button = document.createElement('a');
	button.className = 'betterfloat-similar-a';
	button.textContent = 'View Similar';
	button.href = url.toString();
	button.target = '_blank';
	parentElement.appendChild(button);
}

export async function getBuffItem(container: Element, item: CSMoney.Item, selector: CSMONEY_SELECTOR) {
	let source = (extensionSettings['csm-pricingsource'] as MarketSource) ?? MarketSource.Buff;
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

	const currencyItem = getUserCurrency();
	if (!currencyItem?.text) {
		throw new Error('[BetterFloat] No currency rate found. Please report this issue.');
	}
	const currencyRate = await getAndFetchCurrencyRate(currencyItem!.text);
	if (priceListing && currencyRate) {
		priceListing = priceListing.mul(currencyRate);
	}
	if (priceOrder && currencyRate) {
		priceOrder = priceOrder.mul(currencyRate);
	}

	const itemPrice = new Decimal(getHTMLPrice(container, selector)!.price);
	const referencePrice = Number(extensionSettings['csm-pricereference']) === 0 ? priceOrder : priceListing;
	const priceDifference = itemPrice.minus(referencePrice ?? 0);
	return {
		buff_name,
		itemStyle: buff_item.style,
		market_id,
		itemPrice,
		priceListing,
		priceOrder,
		priceFromReference: referencePrice,
		difference: priceDifference,
		source,
		currency: {
			symbol: currencyItem?.symbol,
			text: currencyItem?.text,
			rate: currencyRate,
		},
	};
}

function getHTMLPrice(container: Element, selector: CSMONEY_SELECTOR) {
	const priceText = (
		container.querySelector(selector.price)?.querySelector('div[class^="Price_price__"]') ??
		container.querySelector(selector.price)?.querySelector('div[class^="price_price__"]') ??
		container.querySelector('div[class^="Price_price__"]') ??
		container.querySelector('div[class^="price_price__"]')
	)?.textContent;
	if (!priceText) {
		return null;
	}

	return parsePrice(priceText);
}

function getItemName(item: CSMoney.Item) {
	return (<CSMoney.InventoryItem>item).fullName ?? (<CSMoney.MarketItem>item).asset.names.full;
}

function createBuffItem(item: CSMoney.Item): { name: string; style: ItemStyle } {
	let name = getItemName(item);
	if (!name) {
		console.error('[BetterFloat] Unknown item type: ', item);
	}
	let style: ItemStyle = '';
	if (name.includes('Doppler')) {
		const parts = name.split(' Doppler ');
		const secondParts = parts[1].split(' (');
		name = parts[0] + ' Doppler (' + secondParts[1];
		style = secondParts[0] as ItemStyle;
	} else if (name.includes('★') && !name.includes('(')) {
		// vanilla
		style = 'Vanilla';
	}
	return {
		name: name,
		style: style,
	};
}

export function getUserCurrency() {
	const selectedCurrency = (document.querySelector('span[class^="CurrencySelect_selected__"]') ?? document.querySelector('div[class^="CurrencyDropdown_label__"]'))?.textContent?.split(' ');
	if (selectedCurrency) {
		return {
			symbol: selectedCurrency[0],
			text: selectedCurrency[1],
		};
	} else {
		return null;
	}
}

function getSelectors(isPopout: boolean): CSMONEY_SELECTOR {
	if (location.pathname === '/market/buy/') {
		if (isPopout) {
			return CSMONEY_SELECTORS.market_popout;
		}
		return CSMONEY_SELECTORS.market;
	} else if (location.pathname === '/market/instant-sell/') {
		return CSMONEY_SELECTORS.instant_sell;
	} else if (location.pathname === '/market/sell/') {
		return CSMONEY_SELECTORS.sell;
	} else if (location.pathname === '/csgo/trade/') {
		return CSMONEY_SELECTORS.trade;
	}
	return CSMONEY_SELECTORS.market;
}

async function addBuffPrice(item: CSMoney.Item, container: Element, isPopout = false): Promise<PriceResult> {
	const selector = getSelectors(isPopout);

	const { buff_name, itemStyle, market_id, itemPrice, priceListing, priceOrder, priceFromReference, difference, source, currency } = await getBuffItem(container, item, selector);

	const footerContainer = container.querySelector<HTMLElement>(selector.footer);

	const maximumFractionDigits = priceListing?.gt(1000) && priceOrder?.gt(10) ? 0 : 2;
	const Formatter = CurrencyFormatter(currency.text ?? 'USD', 0, maximumFractionDigits);

	if (footerContainer && !container.querySelector('.betterfloat-buffprice')) {
		const isDoppler = buff_name.includes('Doppler') && buff_name.includes('|');
		const buffContainer = generatePriceLine({
			source,
			market_id,
			buff_name,
			priceOrder,
			priceListing,
			priceFromReference,
			userCurrency: currency.symbol ?? '$',
			itemStyle: itemStyle as DopplerPhase,
			CurrencyFormatter: Formatter,
			isDoppler,
			isPopout,
			addSpaceBetweenPrices: isPopout,
			showPrefix: false,
			iconHeight: isPopout ? '20px' : '15px',
		});

		footerContainer.insertAdjacentHTML('afterend', buffContainer);

		if (!isPopout) {
			footerContainer.parentElement?.parentElement?.style.setProperty('overflow', 'visible');
			footerContainer.closest('div[class^="actioncard_card__"]')?.setAttribute('style', 'overflow: visible;');
		}
	}

	if (priceListing?.gt(0.06) && location.pathname !== '/market/sell/') {
		// remove csmoney's sale tag
		// container.querySelector('span[class*="Tag-module_green__"]')?.remove();

		const priceContainer = container.querySelector<HTMLElement>(selector.price);

		if (isPopout) {
			container.querySelector('span[class^="Tag-module_container__"]')?.remove();
		}

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

		const absDifference = difference.abs();
		const percentage = itemPrice.div(priceFromReference ?? 0).mul(100);
		const { color, background } = percentage.gt(100) ? styling.loss : styling.profit;

		const buffPriceHTML = html`
			<div
				class="sale-tag betterfloat-sale-tag ${isPopout ? 'betterfloat-big-tag' : ''}"
				style="background-color: ${background}; color: ${color};"
			>
				<span>${difference.isPos() ? '+' : '-'}${Formatter.format(absDifference.toNumber())}</span>
				<span>(${percentage.gt(150) ? percentage.toFixed(0) : percentage.toFixed(2)}%)</span>
			</div>
		`;

		priceContainer?.setAttribute('style', 'display: flex; gap: 5px; align-items: center;');

		priceContainer?.insertAdjacentHTML('beforeend', buffPriceHTML);
	}

	return {
		price_difference: difference,
	};
}

// mutation observer active?
let isObserverActive = false;
let extensionSettings: IStorage;

init();
