import { html } from 'common-tags';
import getSymbolFromCurrency from 'currency-symbol-map';
import Decimal from 'decimal.js';
import type { PlasmoCSConfig } from 'plasmo';
import type { DopplerPhase, ItemStyle } from '~lib/@typings/FloatTypes';
import type { Swapgg } from '~lib/@typings/SwapggTypes';
import { getSwapggInventorySite, getSwapggInventoryUser } from '~lib/handlers/cache/swapgg_cache';
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

	initItemListener();
}

function initItemListener() {
	setInterval(async () => {
		const vueList = document.querySelectorAll('div.vue-recycle-scroller__item-view')!;
		for (const vueItem of vueList) {
			const isOwn = location.pathname === '/sell' || !!vueItem.closest('div.absolute.inset-0')?.nextElementSibling;
			const items = vueItem.querySelectorAll('div > div.group.aspect-square')!;

			for (let i = 0; i < items.length; i++) {
				const item = items[i];
				if (item instanceof HTMLElement) {
					await adjustItem(item, isOwn);
				}
			}
		}
	}, 1000);
}

function applyMutation() {
	const observer = new MutationObserver(async (mutations) => {
		if (!supportedSubPages.some((page) => location.href.includes(page))) {
			console.debug('[BetterFloat] Current page is currently NOT supported');
			return;
		}
		for (const mutation of mutations) {
			for (let i = 0; i < mutation.addedNodes.length; i++) {
				const addedNode = mutation.addedNodes[i];
				// some nodes are not elements, so we need to check
				if (!(addedNode instanceof HTMLElement)) continue;
				// console.debug('[BetterFloat] Mutation detected:', addedNode, addedNode.tagName, addedNode.className.toString());

				if (addedNode.className.toString().includes('aspect-square')) {
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
	if (container.querySelector('.betterfloat-buff-a')) return;

	const getItem = () => {
		const imageElement = container.querySelector<HTMLElement>(SWAPGG_SELECTORS.item.imageContainer);
		if (!imageElement) {
			return;
		}

		const imageLink = imageElement.style.backgroundImage?.substring(5, imageElement.style.backgroundImage.length - 2);
		if (isOwn) {
			return getSwapggInventoryUser(imageLink);
		} else {
			return getSwapggInventorySite(imageLink);
		}
	};

	const apiItem = getItem();

	console.debug('[BetterFloat] API item detected:', apiItem);

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
	const { currency: userCurrency, rates } = getCurrency();
	const currencySymbol = getSymbolFromCurrency(userCurrency);
	const currencyRate = rates[userCurrency];

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
	if (item.price !== undefined) {
		return new Decimal(item.price).div(100);
	} else {
		console.error('[BetterFloat] Unknown item type: ', item);
		return new Decimal(0);
	}
}

function createBuffItem(item: Swapgg.Item): { name: string; style: ItemStyle } {
	let name = '';
	// check if item is InventoryItem or MarketItem
	if (item.product.name) {
		name = item.product.name;
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
	console.debug('[BetterFloat] Tile size detected:', tileSize);
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

function getCurrency(): { currency: string; rates: { [currency: string]: number } } {
	return JSON.parse(localStorage.getItem('localization') ?? '{}');
}

function getTileSize(isOwn = false): 'Small' | 'Medium' | 'Large' | undefined {
	const isSellPage = location.pathname === '/sell';
	let radioGroup: HTMLElement | null = null;
	if (isSellPage || isOwn) {
		radioGroup = document.querySelector(SWAPGG_SELECTORS.tileSize.radioGroup);
	} else {
		radioGroup = document.querySelectorAll(SWAPGG_SELECTORS.tileSize.radioGroup)[1] as HTMLElement;
	}
	const selectedRadio = radioGroup?.querySelector(SWAPGG_SELECTORS.tileSize.checkedRadio);
	const tileSize = selectedRadio?.firstElementChild?.getAttribute('title')?.split(' ')[0]?.trim();
	return tileSize as 'Small' | 'Medium' | 'Large' | undefined;
}

const supportedSubPages = ['/trade', '/sell'];

// mutation observer active?
let isObserverActive = false;
let extensionSettings: IStorage;

init();
