import Decimal from 'decimal.js';
import type { PlasmoCSConfig } from 'plasmo';

import { html } from 'common-tags';
import type { DopplerPhase, ItemStyle } from '~lib/@typings/FloatTypes';
import type { Tradeit } from '~lib/@typings/TradeitTypes';
import { getFirstTradeitBotItem } from '~lib/handlers/cache/tradeit_cache';
import { getFirstTradeitOwnItem } from '~lib/handlers/cache/tradeit_cache';
import { activateHandler, initPriceMapping } from '~lib/handlers/eventhandler';
import { getMarketID } from '~lib/handlers/mappinghandler';
import { TRADEIT_SELECTORS } from '~lib/handlers/selectors/tradeit_selectors';
import { MarketSource } from '~lib/util/globals';
import { CurrencyFormatter, checkUserPlanPro, getBuffPrice, isBuffBannedItem, isUserPro } from '~lib/util/helperfunctions';
import { handleSpecialStickerNames } from '~lib/util/helperfunctions';
import { getAllSettings } from '~lib/util/storage';
import type { IStorage } from '~lib/util/storage';
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
	console.log('[BetterFloat] Extension settings:', extensionSettings);

	if (!extensionSettings['tradeit-enable']) return;

	// check if user has the required plan
	if (!checkUserPlanPro(extensionSettings['user'])) {
		console.log('[BetterFloat] Pro plan required for TradeIt features');
		return;
	}

	await initPriceMapping(extensionSettings, 'tradeit');

	//check if url is in supported subpages
	if (location.pathname === '/csgo/trade') {
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
	const supportedPaths = ['/csgo/trade', '/csgo/store', '/csgo/sell'];
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
			await adjustItem(sellItems[i], false);
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

				if (addedNode.className.toString().includes(TRADEIT_SELECTORS.itemContainer)) {
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
				} else if (addedNode.id === TRADEIT_SELECTORS.inventory.container) {
					const sellItems = addedNode.querySelectorAll(TRADEIT_SELECTORS.itemContainer);
					for (let i = 0; i < sellItems.length; i++) {
						await adjustItem(sellItems[i], true);
					}
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
			const steamImg = container.querySelector('img.item-image')?.getAttribute('src') ?? '';
			return getFirstTradeitOwnItem(steamImg)?.[0];
		}
		return getFirstTradeitBotItem();
	};
	let apiItem = getItem();
	let attempts = 0;
	while (!apiItem && attempts++ < 5) {
		// wait for 1s and try again
		console.log(`[BetterFloat] No ${isOwn} item found, waiting 1s and trying again...`);
		await new Promise((resolve) => setTimeout(resolve, 1000));
		apiItem = getItem();
	}
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
	const priceResult = await addBuffPrice(apiItem!, container);

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

async function getBuffItem(item: Tradeit.Item) {
	const buff_item = createBuffItem(item);
	const buff_name = handleSpecialStickerNames(buff_item.name);
	const source = MarketSource.Buff;

	let { priceListing, priceOrder } = await getBuffPrice(buff_name, buff_item.style, source);

	if (source === MarketSource.Buff && isBuffBannedItem(buff_name)) {
		priceListing = new Decimal(0);
		priceOrder = new Decimal(0);
	}

	const market_id = getMarketID(buff_name, source);

	// const priceFromReference = extensionSettings.priceReference == 1 ? priceListing : priceOrder;
	const priceFromReference = priceListing ?? new Decimal(0);
	const itemPrice = getItemPrice(item);

	const priceDifference = itemPrice.minus(priceFromReference);
	return {
		buff_name,
		market_id,
		priceListing,
		priceOrder,
		priceFromReference,
		difference: priceDifference,
		itemPrice,
		source,
	};
}

function getItemPrice(item: Tradeit.Item) {
	if (item.price) {
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
	const { buff_name, market_id, priceListing, priceOrder, priceFromReference, difference, itemPrice, source } = await getBuffItem(item);

	const referencePrice = location.pathname !== '/csgo/store' ? difference : itemPrice.minus((Number(extensionSettings['tradeit-altmarket']) === 0 ? priceOrder : priceListing) ?? new Decimal(0));

	const elementContainer = container.querySelector('.item-details');

	if (elementContainer && !container.querySelector('.betterfloat-buffprice')) {
		const buffContainer = generatePriceLine({
			source,
			market_id,
			buff_name,
			priceOrder,
			priceListing,
			priceFromReference,
			userCurrency: '$',
			itemStyle: '' as DopplerPhase,
			CurrencyFormatter: CurrencyFormatter('USD'),
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
	if (priceListing?.gt(0.06) && priceContainer) {
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

		const absDifference = referencePrice.abs();
		const percentage = itemPrice.div(priceFromReference).mul(100);
		const colorPercentage = 100;
		const { color, background } = percentage.gt(colorPercentage) ? styling.loss : styling.profit;

		const buffPriceHTML = html`
            <div class="sale-tag betterfloat-sale-tag" style="background-color: ${background}; color: ${color};" data-betterfloat="${difference}">
                <span>
                    ${difference.isPos() ? '+' : '-'}
                    ${absDifference.gt(1000) ? CurrencyFormatter('USD').format(absDifference.toNumber()) : CurrencyFormatter('USD').format(absDifference.toNumber())}
                </span>
                <span>(${percentage.gt(150) ? percentage.toFixed(0) : percentage.toFixed(2)}%)</span>
            </div>
        `;
		priceContainer.setAttribute('style', 'display: flex; gap: 5px; align-items: center;');

		priceContainer.insertAdjacentHTML('beforeend', buffPriceHTML);
	}

	return {
		price_difference: difference.toNumber(),
	};
}

// mutation observer active?
let isObserverActive = false;
let extensionSettings: IStorage;

init();
