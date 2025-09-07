import { html } from 'common-tags';
import getSymbolFromCurrency from 'currency-symbol-map';
import Decimal from 'decimal.js';
import type { PlasmoCSConfig } from 'plasmo';
import type { DopplerPhase, ItemStyle } from '~lib/@typings/FloatTypes';
import type { Tradeit } from '~lib/@typings/TradeitTypes';
import { getFirstTradeitBotItem, getFirstTradeitOwnItem, getTradeitOwnItemByName } from '~lib/handlers/cache/tradeit_cache';
import { activateHandler, initPriceMapping } from '~lib/handlers/eventhandler';
import { getAndFetchCurrencyRate, getMarketID } from '~lib/handlers/mappinghandler';
import { TRADEIT_SELECTORS } from '~lib/handlers/selectors/tradeit_selectors';
import { MarketSource } from '~lib/util/globals';
import { CurrencyFormatter, getBuffPrice, handleSpecialStickerNames, isUserPro } from '~lib/util/helperfunctions';
import type { IStorage } from '~lib/util/storage';
import { getAllSettings } from '~lib/util/storage';
import { generatePriceLine } from '~lib/util/uigeneration';

type PriceResult = {
	price_difference: number;
};

export const config: PlasmoCSConfig = {
	matches: ['https://*.tradeit.gg/*'],
	run_at: 'document_end',
	css: ['../css/hint.min.css', '../css/common_styles.css', '../css/tradeit_styles.css'],
};

async function init() {
	console.log('[BetterFloat] Initializing BetterFloat...');

	if (location.host !== 'tradeit.gg') {
		return;
	}

	replaceHistory();

	// catch the events thrown by the script
	// this has to be done as first thing to not miss timed events
	activateHandler();

	extensionSettings = await getAllSettings();

	if (!extensionSettings['tradeit-enable']) return;

	await initPriceMapping(extensionSettings, 'tradeit');

	await firstLaunch();

	// mutation observer is only needed once
	if (!isObserverActive) {
		isObserverActive = true;
		applyMutation();
		console.log('[BetterFloat] Mutation observer started');
	}
}

// required as mutation does not detect initial DOM
async function firstLaunch() {
	// store items are detected by mutation observer
	const supportedPaths = ['/csgo/trade', '/csgo/sell'];
	if (!supportedPaths.includes(location.pathname)) {
		return;
	}

	const ownItems = document.querySelectorAll(TRADEIT_SELECTORS.firstLaunch.ownItems);
	for (let i = 1; i < ownItems.length; i++) {
		await adjustItem(ownItems[i], true);
	}

	const botsItems = document.querySelectorAll(TRADEIT_SELECTORS.firstLaunch.botsItems);
	for (let i = 0; i < botsItems.length; i++) {
		await adjustItem(botsItems[i], false);
	}

	if (location.pathname === '/csgo/sell') {
		const sellItems = document.querySelectorAll(TRADEIT_SELECTORS.firstLaunch.sellItems);
		for (let i = 0; i < sellItems.length; i++) {
			await adjustItem(sellItems[i], true);
		}
	}
}

async function replaceHistory() {
	// wait for the page to load
	const loggedOut = await new Promise((resolve) => {
		const interval = setInterval(() => {
			if (document.querySelector('button.login-btn') || document.querySelector('div.user-section')) {
				clearInterval(interval);
				resolve(!!document.querySelector('button.login-btn'));
			}
		}, 100);
	});

	if (loggedOut && !location.search.includes('aff')) {
		location.search += `${location.search ? '&' : ''}aff=betterfloat`;
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

				if (addedNode.className.toString().includes(TRADEIT_SELECTORS.itemContainer.substring(1))) {
					const inventoryContainer = Array.from(document.querySelectorAll(TRADEIT_SELECTORS.inventory.container));
					const isOwn = inventoryContainer[0] === addedNode.closest(TRADEIT_SELECTORS.inventory.container);
					await adjustItem(addedNode, isOwn);
				} else if (addedNode.className.toString().includes('selected-items')) {
					Array.from(addedNode.children).forEach(async (element) => {
						if (element.className.includes('item')) {
							element.className += ' betterfloat-await';
						}
					});
				} else if (addedNode.className.toString().startsWith('item ')) {
					addedNode.className += ' betterfloat-await';
				} else if (addedNode.className.toString().includes('cart-box')) {
					await adjustCartItem(addedNode);
				} else if (addedNode.id === TRADEIT_SELECTORS.inventory.container.substring(1)) {
					const sellItems = addedNode.querySelectorAll(TRADEIT_SELECTORS.itemContainer);
					for (let i = 0; i < sellItems.length; i++) {
						await adjustItem(sellItems[i], true);
					}
				} else if (addedNode.className === 'grid-col' && addedNode.firstElementChild?.className.includes('item-cell')) {
					const inventoryContainer = Array.from(document.querySelectorAll(TRADEIT_SELECTORS.inventory.container));
					const isOwn = location.pathname === '/csgo/sell' || inventoryContainer[0] === addedNode.closest(TRADEIT_SELECTORS.inventory.container);
					await adjustItem(addedNode.firstElementChild!, isOwn);
				}
			}
		}
	});
	observer.observe(document, { childList: true, subtree: true });
}

async function adjustCartItem(container: Element) {
	const itemDetails = container.parentElement!;

	const image = container.querySelector('img.item-image')?.getAttribute('src');
	const targetElement = Array.from(document.querySelectorAll('.betterfloat-await')).find((element) => {
		const elementImage = element.querySelector('img.item-image')?.getAttribute('src');
		return elementImage === image;
	});

	targetElement?.closest('.selected-items')?.setAttribute('style', 'gap: 60px;');
	// console.log('[BetterFloat] Adjusting cart item: ', targetElement, itemDetails);

	if (targetElement) {
		const content = targetElement.querySelector('.price')?.parentElement;
		targetElement.classList.remove('betterfloat-await');
		const buffElement = <HTMLElement>itemDetails.querySelector('.betterfloat-buff-a')?.cloneNode(true);
		buffElement?.setAttribute('style', 'position: absolute; left: 10px;z-index: 100;text-decoration: none;');
		buffElement.querySelector('.suggested-price')?.children[0].remove();
		buffElement.querySelector('.suggested-price')?.children[0].remove();
		content?.appendChild(buffElement!);
		const priceElement = <HTMLElement>itemDetails.querySelector('.sale-tag')?.cloneNode(true);
		priceElement.style.flexDirection = 'column';
		priceElement.style.gap = '0px';
		priceElement.style.fontSize = '14px';
		targetElement.querySelector('.price')?.appendChild(priceElement);
		targetElement.querySelector('.price')?.previousElementSibling?.setAttribute('style', 'bottom: 40px;');
	}
}

async function adjustItem(container: Element, isOwn = false) {
	const getItem = () => {
		if (isOwn) {
			const imgSrc = container.querySelector('img.item-image')?.getAttribute('src') ?? '';
			if (imgSrc.includes('https://cdn.tradeit.gg/')) {
				const decodedName = decodeURIComponent(imgSrc).split('/csgo/')[1]?.split('_')[0]?.replaceAll(' - ', ' | ').replace('StatTrak-', 'StatTrak™').replace('CS-GO', 'CS:GO');
				return getTradeitOwnItemByName(decodedName);
			} else {
				return getFirstTradeitOwnItem(imgSrc)?.[0];
			}
		}
		return getFirstTradeitBotItem();
	};
	const apiItem = getItem();

	// console.log('[BetterFloat] Adjusting item: ', apiItem);
	if (!apiItem) {
		console.log('[BetterFloat] No item found, cancelling...', container);
		return;
	}

	const htmlName = container.querySelector('.item-hover-name');
	if (htmlName && !apiItem?.name.includes(htmlName.textContent!.trim()!)) {
		console.debug('[BetterFloat] Item name does not match: ', htmlName.textContent?.trim(), apiItem.name);
		return;
	}

	// eslint-disable-next-line @typescript-eslint/no-unused-vars
	const _priceResult = await addBuffPrice(apiItem!, container);

	const discountContainer = container.querySelector(TRADEIT_SELECTORS.discount);
	if (discountContainer) {
		discountContainer.remove();
	}

	if (isOwn) {
		const valueTag = container.querySelector(TRADEIT_SELECTORS.deficitFlag);
		if (valueTag) {
			valueTag.setAttribute('style', 'margin-top: 25px;');
		}
	}
}

async function getBuffItem(container: Element, item: Tradeit.Item) {
	const buff_item = createBuffItem(item);
	const buff_name = handleSpecialStickerNames(buff_item.name);
	const source = (extensionSettings['tradeit-pricingsource'] as MarketSource) ?? MarketSource.Buff;

	let { priceListing, priceOrder } = await getBuffPrice(buff_name, buff_item.style, source);

	const market_id = await getMarketID(buff_name, source);

	const currency = getUserCurrency() ?? 'USD';
	const currencySymbol = getSymbolFromCurrency(currency) ?? '$';
	const currencyRate = currency === 'USD' ? 1 : await getAndFetchCurrencyRate(currency);
	if (priceListing && currencyRate && currencyRate !== 1) {
		priceListing = priceListing.mul(currencyRate);
	}
	if (priceOrder && currencyRate && currencyRate !== 1) {
		priceOrder = priceOrder.mul(currencyRate);
	}

	const priceFromReference = extensionSettings['tradeit-pricereference'] === 0 && [MarketSource.Buff, MarketSource.Steam].includes(source) ? priceOrder : priceListing;
	const itemPrice = getItemPrice(container, item);

	const priceDifference = itemPrice.minus(priceFromReference ?? new Decimal(0));
	return {
		buff_name,
		market_id,
		priceListing,
		priceOrder,
		priceFromReference,
		difference: priceDifference,
		itemPrice,
		source,
		currency: {
			symbol: currencySymbol,
			rate: currencyRate,
			currency,
		},
	};
}

function getItemPrice(container: Element, item: Tradeit.Item) {
	let priceText = container.querySelector('.price > div')?.textContent?.trim() ?? '';
	let currency = '';
	// regex also detects &nbsp as whitespace!
	if (priceText.split(/\s/).length > 1) {
		// format: "1 696,00 €" -> Skinport uses &nbsp instead of whitespaces in this format!
		const parts = priceText.replace(',', '').replace('.', '').split(/\s/);
		priceText = String(Number(parts.filter((x) => !Number.isNaN(+x)).join('')) / 100);
		currency = parts.filter((x) => Number.isNaN(+x))[0];
	} else {
		// format: "€1,696.00"
		const firstDigit = Array.from(priceText).findIndex((x) => !Number.isNaN(Number(x)));
		currency = priceText.substring(0, firstDigit);
		priceText = String(Number(priceText.substring(firstDigit).replace(',', '').replace('.', '')) / 100);
	}
	let price = Number(priceText);

	if (Number.isNaN(price) || !Number.isNaN(Number(currency))) {
		price = 0;
		currency = '';
	}
	if (price > 0) {
		return new Decimal(price);
	}

	if (location.pathname === '/csgo/store') {
		return new Decimal(item.storePrice!).div(100);
	} else if (item.price) {
		return new Decimal(item.price).div(100);
	} else {
		console.error('[BetterFloat] Unknown item type: ', item);
		return new Decimal(0);
	}
}

function createBuffItem(item: Tradeit.Item): { name: string; style: ItemStyle } {
	let name = '';
	// check if item is InventoryItem or MarketItem
	if (item.name) {
		name = item.name;
	}
	let style: ItemStyle = '';
	if (name.includes('Doppler')) {
		style = item.phase ?? 'Phase 3';
		name = name.replace(` ${style}`, '');
	} else if (name.includes('★') && !name.includes('(')) {
		// vanilla
		style = 'Vanilla';
	}
	return {
		name: name,
		style: style,
	};
}

async function addBuffPrice(item: Tradeit.Item, container: Element): Promise<PriceResult> {
	const { buff_name, market_id, priceListing, priceOrder, priceFromReference, difference, itemPrice, source, currency } = await getBuffItem(container, item);

	const elementContainer = container.querySelector('.item-details');

	if (elementContainer && !container.querySelector('.betterfloat-buffprice')) {
		const buffContainer = generatePriceLine({
			source,
			market_id,
			buff_name,
			priceOrder,
			priceListing,
			priceFromReference,
			userCurrency: currency.symbol,
			itemStyle: '' as DopplerPhase,
			CurrencyFormatter: CurrencyFormatter(currency.currency),
			isDoppler: false,
			isPopout: false,
			priceClass: 'suggested-price',
			addSpaceBetweenPrices: true,
			showPrefix: false,
			iconHeight: '15px',
			hasPro: isUserPro(extensionSettings['user']),
		});

		elementContainer.insertAdjacentHTML('beforeend', buffContainer);
		elementContainer.querySelector('.count')?.setAttribute('style', 'top: 27px;');

		elementContainer.setAttribute('style', 'overflow: visible !important;');

		const tradeLock = container.querySelector(TRADEIT_SELECTORS.tradeLock);
		if (tradeLock) {
			(<HTMLElement>tradeLock).style.top = '30px';
		}
	}

	const priceContainer = container.querySelector(TRADEIT_SELECTORS.price);
	if (priceListing?.gt(0.06) && priceContainer && (extensionSettings['tradeit-buffdifference'] || extensionSettings['tradeit-buffdifferencepercent'])) {
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
		const percentage = itemPrice.div(priceFromReference ?? new Decimal(0)).mul(100);
		const colorPercentage = 100;
		const { color, background } = percentage.gt(colorPercentage) ? styling.loss : styling.profit;

		const differenceText = html`
			<span>
				${difference.isPos() ? '+' : '-'}
				${absDifference.gt(1000) ? CurrencyFormatter(currency.currency).format(absDifference.toNumber()) : CurrencyFormatter(currency.currency).format(absDifference.toNumber())}
			</span>
		`;
		const percentageText = html`
			<span>(${percentage.gt(150) ? percentage.toFixed(0) : percentage.toFixed(2)}%)</span>
		`;
		const buffPriceHTML = html`
            <div class="sale-tag betterfloat-sale-tag" style="background-color: ${background}; color: ${color};" data-betterfloat="${difference}">
                ${extensionSettings['tradeit-buffdifference'] ? differenceText : ''}
                ${extensionSettings['tradeit-buffdifferencepercent'] ? percentageText : ''}
            </div>
        `;
		priceContainer.setAttribute('style', 'display: flex; gap: 5px; align-items: center;');

		priceContainer.insertAdjacentHTML('beforeend', buffPriceHTML);
	}

	return {
		price_difference: difference.toNumber(),
	};
}

function getUserCurrency() {
	return document.querySelector('.price-language-wrapper .inner-text')?.textContent?.trim();
}

// mutation observer active?
let isObserverActive = false;
let extensionSettings: IStorage;

init();
