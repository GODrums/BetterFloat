import { html } from 'common-tags';
import Decimal from 'decimal.js';
import type { PlasmoCSConfig } from 'plasmo';

import type { CSMoney } from '~lib/@typings/CsmoneyTypes';
import type { DopplerPhase, ItemStyle } from '~lib/@typings/FloatTypes';
import { getCSMoneyPopupItem, getFirstCSMoneyBotInventoryItem, getFirstCSMoneyItem, getFirstCSMoneyUserInventoryItem, getSpecificCSMoneyItem } from '~lib/handlers/cache/csmoney_cache';
import { activateHandler, initPriceMapping } from '~lib/handlers/eventhandler';
import { getAndFetchCurrencyRate, getMarketID } from '~lib/handlers/mappinghandler';
import { type CSMONEY_SELECTOR, CSMONEY_SELECTORS } from '~lib/handlers/selectors/csmoney_selectors';
import { dynamicUIHandler } from '~lib/handlers/urlhandler';
import { MarketSource } from '~lib/util/globals';
import { CurrencyFormatter, getBuffPrice, handleSpecialStickerNames, isBuffBannedItem, isUserPro, parsePrice, waitForElement } from '~lib/util/helperfunctions';
import { getAllSettings, type IStorage } from '~lib/util/storage';
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

	if (!extensionSettings['csm-enable']) return;

	await initPriceMapping(extensionSettings, 'csm');

	console.timeEnd('[BetterFloat] CSMoney init timer');

	// mutation observer is only needed once
	if (!isObserverActive) {
		isObserverActive = true;
		applyMutation();
		console.log('[BetterFloat] Mutation observer started');
	}

	await firstLaunch();

	dynamicUIHandler();
}

async function firstLaunch() {
	const success = await waitForElement(CSMONEY_SELECTORS.other.header);
	if (!success) return;

	await new Promise((resolve) => setTimeout(resolve, 500));
	// call once to refresh local storage
	getUserCurrency(true);

	// these reloads are required to get the API data,
	// as the injected script is too slow for the initial load
	if (location.pathname === '/market/buy/') {
		// reload market page
		let reloadButton = document.querySelector<HTMLElement>(CSMONEY_SELECTORS.market.reloadButton);
		if (reloadButton) {
			reloadButton.click();
		} else {
			await waitForElement(CSMONEY_SELECTORS.market.reloadButton);
			reloadButton = document.querySelector<HTMLElement>(CSMONEY_SELECTORS.market.reloadButton);
			if (reloadButton) {
				reloadButton.click();
			}
		}
	} else if (location.pathname === '/market/instant-sell/' || location.pathname === '/market/sell/') {
		// reload instant sell page
		const reloadButton = document.querySelector<HTMLElement>(CSMONEY_SELECTORS.sell.reloadButton);
		if (reloadButton) {
			reloadButton.click();
		}
	} else if (location.pathname === '/csgo/trade/') {
		// reload bot inventory
		const buttonSelector = CSMONEY_SELECTORS.trade.reloadButton;
		waitForElement(buttonSelector).then(async (success) => {
			if (success) {
				const reloadButtons = document.querySelectorAll<HTMLElement>(buttonSelector);
				Array.from(reloadButtons).pop()?.click();
			}
		});
	} else if (location.pathname === '/profile/offers') {
		//
	}
}

function applyMutation() {
	const observer = new MutationObserver(async (mutations) => {
		for (const mutation of mutations) {
			for (let i = 0; i < mutation.addedNodes.length; i++) {
				const addedNode = mutation.addedNodes[i];
				// some nodes are not elements, so we need to check
				if (!(addedNode instanceof HTMLElement)) continue;
				// console.debug('[|BetterFloat] Mutation detected:', addedNode, addedNode.tagName, addedNode.className.toString());

				if (addedNode.getAttribute('data-card-item-id')) {
					// item in buy-tab
					await adjustItem(addedNode);
				} else if (addedNode.tagName === 'DIV' && addedNode.className.startsWith('UserSkin_user_skin__')) {
					// item in insta sell page
					await adjustItem(addedNode);
				} else if (addedNode.tagName === 'DIV') {
					// item in trade-tab
					const item = addedNode.querySelector(CSMONEY_SELECTORS.other.itemCard);
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
	let apiItem = getApiItem();
	if (!apiItem) {
		console.error('[BetterFloat] No item found, skipping...');
		return;
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
	const _priceResult = await addBuffPrice(apiItem, container, isPopout);

	if (!isPopout) {
		await addPopupListener(container, apiItem);
	}
}

async function addPopupListener(container: Element, item: CSMoney.Item) {
	container.addEventListener('click', async () => {
		const selector = location.pathname === '/market/buy/' ? CSMONEY_SELECTORS.market : CSMONEY_SELECTORS.sell;
		waitForElement(selector.popup, { interval: 200, maxTries: 50 }).then(async (success) => {
			if (success) {
				const bigCard = document.querySelector(selector.popup);
				if (bigCard) {
					await adjustItem(bigCard, true, item);
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
	let parentElement: HTMLElement | null = null;
	if (location.pathname === '/market/buy/') {
		const selector = CSMONEY_SELECTORS.market.popup_similar;
		const allSelectors = Array.from(container.querySelectorAll(selector));
		parentElement =
			allSelectors.length === 3
				? allSelectors[1]?.parentElement
				: allSelectors.length === 2
					? allSelectors[0]?.parentElement
					: (allSelectors[1]?.parentElement?.parentElement?.firstElementChild?.firstElementChild as HTMLElement);
	} else if (location.pathname === '/market/sell/' || location.pathname === '/market/instant-sell/') {
		parentElement = container.querySelector(CSMONEY_SELECTORS.sell.popup_similar) as HTMLElement;
	}
	if (!parentElement) return;

	const url = new URL('https://cs.money/market/buy/');
	url.searchParams.append('utm_campaign', 'regular');
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

export async function getBuffItem(container: Element, item: CSMoney.Item) {
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
	const market_id = await getMarketID(buff_name, source);

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

	let { itemPrice, converted } = getHTMLPrice(container, item);
	if (!converted && currencyRate) {
		itemPrice = itemPrice.mul(currencyRate);
	}
	const referencePrice =
		Number(extensionSettings['csm-pricereference']) === 0 && ([MarketSource.Buff, MarketSource.Steam].includes(source) || (MarketSource.YouPin === source && isUserPro(extensionSettings['user'])))
			? priceOrder
			: priceListing;
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

function getHTMLPrice(container: Element, item: CSMoney.Item): { itemPrice: Decimal; converted: boolean } {
	const cardPrice = container.getAttribute('data-card-price');
	if (cardPrice) {
		return { itemPrice: new Decimal(cardPrice), converted: false };
	}

	if ((item as CSMoney.MarketItem)?.pricing?.computed) {
		return { itemPrice: new Decimal((item as CSMoney.MarketItem).pricing.computed), converted: true };
	}

	const priceText = container.querySelector(CSMONEY_SELECTORS.trade.price)?.textContent;
	if (!priceText) {
		return { itemPrice: new Decimal(0), converted: true };
	}

	return { itemPrice: new Decimal(parsePrice(priceText).price), converted: true };
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

export function getUserCurrency(forceRefresh = false): { symbol: string; text: string } | null {
	if (!forceRefresh) {
		const userCurrency = localStorage.getItem('userCurrency');
		if (userCurrency) {
			return JSON.parse(userCurrency);
		}
	}
	if (location.pathname === '/csgo/trade/') {
		const oldCurrency = (document.querySelector(CSMONEY_SELECTORS.trade.currencyContainer) ?? document.querySelector(CSMONEY_SELECTORS.trade.currencyDropdown))?.textContent?.split(' ');
		if (oldCurrency) {
			const currency = {
				symbol: oldCurrency[0],
				text: oldCurrency[1],
			};
			localStorage.setItem('userCurrency', JSON.stringify(currency));
			return currency;
		}
		return null;
	}

	const dropDownSvg = Array.from(document.querySelectorAll(CSMONEY_SELECTORS.market.userCurrency)).pop();
	if (!dropDownSvg) {
		return {
			symbol: 'USD',
			text: 'USD',
		};
	}
	const selectedCurrency = dropDownSvg.parentElement?.previousElementSibling?.textContent?.split(' ');
	const currency = {
		symbol: selectedCurrency?.[0] ?? 'USD',
		text: selectedCurrency?.[1] ?? 'USD',
	};
	localStorage.setItem('userCurrency', JSON.stringify(currency));
	return currency;
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
		if (isPopout) {
			return CSMONEY_SELECTORS.sell_popout;
		}
		return CSMONEY_SELECTORS.sell;
	} else if (location.pathname === '/csgo/trade/') {
		return CSMONEY_SELECTORS.trade;
	}
	return CSMONEY_SELECTORS.market;
}

async function addBuffPrice(item: CSMoney.Item, container: Element, isPopout = false): Promise<PriceResult> {
	const selector = getSelectors(isPopout);

	const { buff_name, itemStyle, market_id, itemPrice, priceListing, priceOrder, priceFromReference, difference, source, currency } = await getBuffItem(container, item);

	const footerContainer = container.querySelector<HTMLElement>(selector.footer)?.parentElement;

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
			hasPro: isUserPro(extensionSettings['user']),
		});

		if (isPopout) {
			footerContainer.insertAdjacentHTML('beforebegin', buffContainer);
		} else {
			footerContainer.insertAdjacentHTML('afterend', buffContainer);
			(container.firstElementChild as HTMLElement).style.setProperty('overflow', 'visible');
		}
	}

	if (
		(extensionSettings['csm-buffdifference'] || extensionSettings['csm-buffdifferencepercent']) &&
		priceListing?.gt(0.06) &&
		location.pathname !== '/market/sell/' &&
		!isBuffBannedItem(buff_name)
	) {
		let priceContainer: HTMLElement | null | undefined = null;
		if (selector === CSMONEY_SELECTORS.market) {
			priceContainer = container.querySelector<HTMLElement>('a.betterfloat-buff-a')?.previousElementSibling?.previousElementSibling?.firstElementChild?.firstElementChild as HTMLElement;
		} else if (selector === CSMONEY_SELECTORS.market_popout) {
			priceContainer = container.querySelector<HTMLElement>('a.betterfloat-buff-a')?.previousElementSibling?.lastElementChild?.lastElementChild as HTMLElement;
		} else {
			priceContainer = container.querySelector<HTMLElement>(selector.price);
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

		let saleTagInner = '';
		if (extensionSettings['csm-buffdifference']) {
			saleTagInner += html`<span>${difference.isPos() ? '+' : '-'}${Formatter.format(absDifference.toNumber())}</span>`;
		}
		if (extensionSettings['csm-buffdifferencepercent']) {
			const percentageText = percentage.gt(150) ? percentage.toFixed(0) : percentage.toFixed(2);
			saleTagInner += extensionSettings['csm-buffdifference'] ? html`<span>(${percentageText}%)</span>` : html`<span>${percentageText}%</span>`;
		}

		const buffPriceHTML = html`
			<div
				class="sale-tag betterfloat-sale-tag ${isPopout ? 'betterfloat-big-tag' : ''}"
				style="background-color: ${background}; color: ${color};"
			>
				${saleTagInner}
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
