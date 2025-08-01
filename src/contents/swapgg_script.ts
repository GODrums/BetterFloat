import { html } from 'common-tags';
import getSymbolFromCurrency from 'currency-symbol-map';
import Decimal from 'decimal.js';
import type { PlasmoCSConfig } from 'plasmo';
import type { DopplerPhase, ItemStyle } from '~lib/@typings/FloatTypes';
import type { Swapgg } from '~lib/@typings/SwapggTypes';
import { getSwapggCurrencyRate } from '~lib/handlers/cache/swapgg_cache';
import { activateHandler } from '~lib/handlers/eventhandler';
import { getMarketID } from '~lib/handlers/mappinghandler';
import { SWAPGG_SELECTORS } from '~lib/handlers/selectors/swapgg_selectors';
import { MarketSource } from '~lib/util/globals';
import { CurrencyFormatter, getBuffPrice, handleSpecialStickerNames, isUserPro } from '~lib/util/helperfunctions';
import { getAllSettings, type IStorage } from '~lib/util/storage';
import { generatePriceLine } from '~lib/util/uigeneration';

export const config: PlasmoCSConfig = {
	matches: ['*://*.swap.gg/*'],
	run_at: 'document_end',
	css: ['../css/hint.min.css', '../css/common_styles.css', '../css/swapgg_styles.css'],
};

type PriceResult = {
	price_difference: number;
};

async function init() {
	console.log('[BetterFloat] Initializing Swap.gg...');

	if (!location.hostname.includes('swap.gg')) {
		return;
	}

	replaceHistory();

	// catch the events thrown by the script
	// this has to be done as first thing to not miss timed events
	activateHandler();

	extensionSettings = await getAllSettings();

	if (!extensionSettings['swp-enable']) {
		return;
	}

	// mutation observer is only needed once
	if (!isObserverActive) {
		isObserverActive = true;
		applyMutation();
		console.log('[BetterFloat] Mutation observer started');
	}

	await initInventories();
}
async function initInventories() {
	await fetchBotInventory();
	await fetchUserInventory();
}

async function fetchBotInventory() {
	await fetch('https://api.swap.gg/v2/trade/inventory/bot/730', {
		credentials: 'include',
	})
		.then((response) => response.json())
		.then((data: Swapgg.InventoryResponse) => {
			const result = data.result;
			result.forEach((item) => {
				if (!swapggInventoryBot[item.i]) {
					swapggInventoryBot[item.i] = [];
				}
				swapggInventoryBot[item.i].push(item);
			});
		});
}

async function fetchUserInventory() {
	await fetch('https://api.swap.gg/v2/trade/inventory/user/730', {
		credentials: 'include',
	})
		.then((response) => response.json())
		.then((data: Swapgg.InventoryResponse) => {
			const result = data.result;
			result.forEach((item) => {
				if (!swapggInventoryUser[item.i]) {
					swapggInventoryUser[item.i] = [];
				}
				swapggInventoryUser[item.i].push(item);
			});
		});
}

function replaceHistory() {
	// span with text Sign in via Steam
	const loginButton = Array.from(document.querySelectorAll('span.hidden')).find((element) => element.textContent === 'Sign in via Steam');
	if (loginButton && !location.search.includes('r=')) {
		// fetch('https://api.swap.gg/v2/user/referral', {
		// 	credentials: 'include',
		// 	method: 'POST',
		// 	body: JSON.stringify({
		// 		code: 'X4nFTDBbek',
		// 	}),
		// });
		location.search += `${location.search ? '&' : ''}r=X4nFTDBbek`;
	}
}

function applyMutation() {
	const observer = new MutationObserver(async (mutations) => {
		if (!supportedSubPages.some((page) => location.href.includes(page))) {
			console.debug('[BetterFloat] Current page is currently NOT supported');
			return;
		}
		const inventoryContainer = Array.from(document.querySelectorAll(SWAPGG_SELECTORS.inventory.container));
		for (const mutation of mutations) {
			for (let i = 0; i < mutation.addedNodes.length; i++) {
				const addedNode = mutation.addedNodes[i];
				// some nodes are not elements, so we need to check
				if (!(addedNode instanceof HTMLElement)) continue;
				// console.debug('[BetterFloat] Mutation detected:', addedNode, addedNode.tagName, addedNode.className.toString());

				if (addedNode.className.toString().includes('vue-recycle-scroller__item-view')) {
					const isOwn = inventoryContainer.findIndex((element) => element === addedNode.closest(SWAPGG_SELECTORS.inventory.container)!) === 0;
					const itemList = addedNode.querySelector(SWAPGG_SELECTORS.inventory.grid)!;
					for (let i = 0; i < itemList.childNodes.length; i++) {
						const child = itemList.childNodes[i];
						if (child instanceof HTMLElement) {
							await adjustItem(child, isOwn);
						}
					}
				} else if (addedNode.className.toString().includes('aspect-square')) {
					if (addedNode.closest(SWAPGG_SELECTORS.cart.panel) !== null) {
						await adjustCartItem(addedNode);
					}
				}
			}
		}
	});
	observer.observe(document, { childList: true, subtree: true });
}

async function adjustCartItem(container: Element) {
	const cartItems = Array.from(document.querySelectorAll(SWAPGG_SELECTORS.cart.removeButton)).filter((element) => element.parentElement?.className.includes('opacity-100'));
	const item = cartItems.find((element) => !element.className.includes('betterfloat-done'))?.parentElement?.parentElement;

	if (!item) return;

	container.querySelector(SWAPGG_SELECTORS.item.leadingNone.mb0)?.replaceWith(item.querySelector(SWAPGG_SELECTORS.item.leadingNone.mb1)!.cloneNode(true));

	item.className += ' betterfloat-done';
}

async function adjustItem(container: Element, isOwn: boolean) {
	const inventory = isOwn ? swapggInventoryUser : swapggInventoryBot;
	while (Object.keys(inventory).length === 0) {
		await new Promise((resolve) => setTimeout(resolve, 200));
	}

	const getItem = async () => {
		const imageElement = container.querySelector(SWAPGG_SELECTORS.item.imageContainer);
		if (imageElement instanceof HTMLElement) {
			const imageLink = imageElement.style.backgroundImage.split('/')[5];
			const cache = inventory[imageLink];
			if (cache?.length > 1) {
				const isStatTrak = container.querySelector(SWAPGG_SELECTORS.item.statTrakIndicator) !== null;
				return cache.find((item) => {
					if (isStatTrak) {
						return item.n.includes('StatTrak™');
					} else {
						return !item.n.includes('StatTrak™');
					}
				});
			} else {
				return cache?.[0];
			}
		}
	};

	const apiItem = await getItem();

	if (!apiItem) {
		return;
	}

	// eslint-disable-next-line @typescript-eslint/no-unused-vars
	const _priceResult = await addBuffPrice(apiItem!, container, isOwn);
}

async function getBuffItem(item: Swapgg.Item) {
	let source = (extensionSettings['swp-pricingsource'] as MarketSource) ?? MarketSource.Buff;
	const buff_item = createBuffItem(item);
	const buff_name = handleSpecialStickerNames(buff_item.name);
	let { priceListing, priceOrder } = await getBuffPrice(buff_name, buff_item.style, source);

	if (((!priceListing && !priceOrder) || (priceListing?.isZero() && priceOrder?.isZero())) && extensionSettings['swp-altmarket'] && extensionSettings['swp-altmarket'] !== MarketSource.None) {
		source = extensionSettings['swp-altmarket'] as MarketSource;
		const altPrices = await getBuffPrice(buff_name, buff_item.style, source);
		priceListing = altPrices.priceListing;
		priceOrder = altPrices.priceOrder;
	}
	const market_id = await getMarketID(buff_name, source);

	let itemPrice = getItemPrice(item);
	const userCurrency = getCurrency();
	const currencySymbol = getSymbolFromCurrency(userCurrency);
	const currencyRate = userCurrency === 'USD' ? 1 : getSwapggCurrencyRate(userCurrency);

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
		Number(extensionSettings['swp-pricereference']) === 0 && ([MarketSource.Buff, MarketSource.Steam].includes(source) || (MarketSource.YouPin === source && isUserPro(extensionSettings['user'])))
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

function getItemPrice(item: Swapgg.Item) {
	if (item.p) {
		return new Decimal(item.p).div(100);
	} else {
		console.error('[BetterFloat] Unknown item type: ', item);
		return new Decimal(0);
	}
}

function createBuffItem(item: Swapgg.Item): { name: string; style: ItemStyle } {
	let name = '';
	// check if item is InventoryItem or MarketItem
	if (item.n) {
		name = item.n;
	}

	let style: ItemStyle = '';
	if (name.includes('Doppler')) {
		style = 'Phase 1';
	} else if (name.includes('★') && !name.includes('(')) {
		// vanilla
		style = 'Vanilla';
	}
	return {
		name: name,
		style: style as ItemStyle,
	};
}

async function addBuffPrice(item: Swapgg.Item, container: Element, isOwn: boolean): Promise<PriceResult> {
	const { buff_name, market_id, priceListing, priceOrder, priceFromReference, difference, source, currency } = await getBuffItem(item);

	const tileSize = getTileSize(isOwn);
	const footerContainer = container.querySelector(SWAPGG_SELECTORS.item.footerContainer);
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
			itemStyle: '' as DopplerPhase,
			CurrencyFormatter: currencyFormatter,
			isDoppler: false,
			isPopout: false,
			addSpaceBetweenPrices: tileSize !== 'Small',
			showPrefix: false,
			iconHeight: tileSize === 'Small' ? '15px' : tileSize === 'Medium' ? '18px' : '20px',
			hasPro: isUserPro(extensionSettings['user']),
			tooltipArrow: true,
			priceClass: tileSize ? `betterfloat-${tileSize?.toLowerCase() ?? ''}-price` : undefined,
		});

		if (!footerContainer.querySelector('.betterfloat-buffprice')) {
			if (tileSize === 'Small') {
				(footerContainer.parentElement as HTMLElement).style.translate = '0px -15px';
			}
			footerContainer.insertAdjacentHTML('beforeend', buffContainer);
		}
	}

	const priceContainer = footerContainer?.querySelector(SWAPGG_SELECTORS.item.priceContainer)?.parentElement;
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

		const absDifference = difference.abs();
		const percentage = getItemPrice(item)
			.div(priceFromReference ?? 0)
			.mul(100);
		const { color, background } = percentage.gt(100) ? styling.loss : styling.profit;

		const buffPriceHTML = html`
            <div 
                class="sale-tag betterfloat-sale-tag betterfloat-${tileSize?.toLowerCase() ?? ''}-sale-tag" 
                style="background-color: ${background}; color: ${color}; ${tileSize === 'Large' ? 'flex-direction: row;' : 'flex-direction: column;'}" 
                data-betterfloat="${difference}"
            >
                <span>${difference.gt(0) ? '+' : '-'}${currencyFormatter.format(absDifference.toDP(2).toNumber())}</span>
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

function getCurrency() {
	const currencySelectorText = document.querySelector(SWAPGG_SELECTORS.currency.flag)?.nextElementSibling?.textContent?.split(' / ')[1];
	return currencySelectorText?.trim() ?? 'USD';
}

function getTileSize(isOwn = false): 'Small' | 'Medium' | 'Large' | undefined {
	const isSellPage = location.pathname === '/sell';
	const radioGroup = document.querySelector(isSellPage ? SWAPGG_SELECTORS.tileSize.radioGroupSell : isOwn ? SWAPGG_SELECTORS.tileSize.radioGroupOwn : SWAPGG_SELECTORS.tileSize.radioGroup);
	const selectedRadio = radioGroup?.querySelector(SWAPGG_SELECTORS.tileSize.checkedRadio);
	const tileSize = selectedRadio?.firstElementChild?.getAttribute('title')?.split(' ')[0];
	return tileSize as 'Small' | 'Medium' | 'Large' | undefined;
}

const supportedSubPages = ['/trade', '/sell'];

// mutation observer active?
let isObserverActive = false;
let extensionSettings: IStorage;
const swapggInventoryBot: { [image: string]: Swapgg.Item[] } = {};
const swapggInventoryUser: { [image: string]: Swapgg.Item[] } = {};

init();
