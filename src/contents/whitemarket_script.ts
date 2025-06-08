import Decimal from 'decimal.js';
import type { PlasmoCSConfig } from 'plasmo';
import type { DopplerPhase, ItemStyle } from '~lib/@typings/FloatTypes';
import type { WhiteMarket } from '~lib/@typings/WhitemarketTypes';
import { getFirstWhiteMarketInventoryItem, getWhiteMarketItem } from '~lib/handlers/cache/whitemarket_cache';
import { activateHandler } from '~lib/handlers/eventhandler';
import { getMarketID } from '~lib/handlers/mappinghandler';
import { MarketSource } from '~lib/util/globals';
import { CurrencyFormatter, convertCurrency, getBuffPrice, handleSpecialStickerNames, isBuffBannedItem, isUserPro } from '~lib/util/helperfunctions';
import { type IStorage, getAllSettings } from '~lib/util/storage';
import { generatePriceLine } from '~lib/util/uigeneration';

export const config: PlasmoCSConfig = {
	matches: ['https://*.white.market/*'],
	run_at: 'document_end',
	css: ['../css/hint.min.css', '../css/common_styles.css', '../css/whitemarket_styles.css'],
};

type PriceResult = {
	price_difference: number;
};

async function init() {
	console.log('[BetterFloat] Initializing WhiteMarket...');

	if (!location.hostname.includes('white.market')) {
		return;
	}
	// catch the events thrown by the script
	// this has to be done as first thing to not miss timed events
	activateHandler();

	extensionSettings = await getAllSettings();

	if (!extensionSettings['wm-enable']) {
		console.log('[BetterFloat] WhiteMarket is disabled, exiting...');
		return;
	}

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
				// console.debug('[BetterFloat] Mutation detected:', addedNode, addedNode.tagName, addedNode.className.toString());

				if (addedNode.className.startsWith('styles_item__')) {
					// item in market
					await adjustItem(addedNode, PageState.Market);
				} else if (addedNode.tagName === 'SECTION' && location.pathname.includes('inventory')) {
					while (addedNode.querySelector('div[class*="styles_skeleton-card__"]')) {
						await new Promise((resolve) => setTimeout(resolve, 200));
					}
					const itemList = addedNode.querySelector<HTMLElement>('div[class*="styles_list__"]');
					if (itemList) {
						const pageState = location.pathname.includes('inventory/') || location.pathname.includes('inventory/') ? PageState.Inventory : PageState.Market;
						for (const item of itemList.children) {
							await adjustItem(item as Element, pageState);
						}
						if (pageState === PageState.Inventory) {
							inventoryListener();
						}
					}
				}
			}
		}
	});
	observer.observe(document, { childList: true, subtree: true });
}

async function inventoryListener() {
	console.log('[BetterFloat] Starting inventory polling for list.');

	// Use setInterval to periodically check items
	const intervalId = setInterval(async () => {
		const itemList = document.querySelector<HTMLElement>('div[class*="styles_list__"]');
		// Check if the inventory section is still part of the document
		if (location.pathname !== '/inventory/my' && location.pathname !== '/inventory/instant-sell') {
			console.log('[BetterFloat] Inventory section removed from DOM, stopping polling.');
			clearInterval(intervalId);
			return;
		}

		if (!itemList) {
			console.error('[BetterFloat] No item list found');
			return;
		}

		// Check each item in the list
		for (const item of itemList.children) {
			if (item instanceof HTMLElement && item.className.startsWith('styles_item__')) {
				// Check if the Buff price container has already been added
				// Using '.skincomparison-buff-a' as the indicator
				const hasBuffContainer = item.querySelector('.skincomparison-buff-a');
				if (hasBuffContainer) {
					break;
				}
				await adjustItem(item, PageState.Inventory);
			}
		}
	}, 1000); // Check every 1 second
}

async function adjustItem(container: Element, state: PageState) {
	let price: WhiteMarket.Price | null = null;
	const getApiItem = () => {
		if (state === PageState.Inventory) {
			return getFirstWhiteMarketInventoryItem();
		}
		if (state === PageState.Market) {
			const slug = container.querySelector('a')?.getAttribute('href')?.split('/').at(-1);
			if (!slug) {
				console.error('[BetterFloat] No slug found: ', container, state);
				return null;
			}
			const listing = getWhiteMarketItem(slug);
			price = listing?.price;
			return listing?.item;
		}
		return null;
	};
	let apiItem = getApiItem();
	let attempts = 0;
	while (!apiItem && attempts++ < 5) {
		// wait for 1s and try again
		console.log('[BetterFloat] No item found, waiting 1s and trying again...');
		await new Promise((resolve) => setTimeout(resolve, 1000));
		apiItem = getApiItem();
	}
	if (!apiItem) {
		console.error('[BetterFloat] No item found after 5 attempts');
		return;
	}

	// console.log('[BetterFloat] Adjusting item: ', apiItem, container);
	// eslint-disable-next-line @typescript-eslint/no-unused-vars
	const priceResult = await addBuffPrice(apiItem, price, container, state);
}

async function getBuffItem(item: WhiteMarket.Item, price: WhiteMarket.Price | null) {
	let source = (extensionSettings['wm-pricingsource'] as MarketSource) ?? MarketSource.Buff;
	const buff_item = {
		name: item.description.nameHash,
		style: '' as ItemStyle,
	};
	const buff_name = handleSpecialStickerNames(buff_item.name);
	let { priceListing, priceOrder } = await getBuffPrice(buff_name, buff_item.style, source);

	if (source === MarketSource.Buff && isBuffBannedItem(buff_name)) {
		priceListing = new Decimal(0);
		priceOrder = new Decimal(0);
	}

	if (((!priceListing && !priceOrder) || (priceListing?.isZero() && priceOrder?.isZero())) && extensionSettings['wm-altmarket'] && extensionSettings['wm-altmarket'] !== MarketSource.None) {
		source = extensionSettings['wm-altmarket'] as MarketSource;
		const altPrices = await getBuffPrice(buff_name, buff_item.style, source);
		priceListing = altPrices.priceListing;
		priceOrder = altPrices.priceOrder;
	}
	const market_id = getMarketID(buff_name, source);

	let itemPrice = price ? new Decimal(price.value) : new Decimal(0);
	const userCurrency = 'USD';
	const currencySymbol = '$';
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
		Number(extensionSettings['wm-pricereference']) === 0 && ([MarketSource.Buff, MarketSource.Steam].includes(source) || (MarketSource.YouPin === source && isUserPro(extensionSettings['user'])))
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

enum PageState {
	Market = 0,
	ItemPage = 1,
	Inventory = 2,
}

async function addBuffPrice(item: WhiteMarket.Item, price: WhiteMarket.Price | null, container: Element, state: PageState): Promise<PriceResult> {
	const { buff_name, market_id, source, priceListing, priceOrder, priceFromReference, difference, currency } = await getBuffItem(item, price);

	let footerContainer: HTMLElement | null = null;
	if (state === PageState.Market) {
		footerContainer = container.querySelector('div[class*="styles_steam-price__"]')?.parentElement as HTMLElement;
	} else if (state === PageState.Inventory) {
		footerContainer = container.querySelector('div[title]')?.parentElement?.parentElement as HTMLElement;
	}

	const isItemPage = state === PageState.ItemPage;
	const isDoppler = false;
	const currencyFormatter = CurrencyFormatter(currency.text ?? 'USD', 0, 2);

	if (footerContainer) {
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
			isDoppler,
			isPopout: isItemPage,
			addSpaceBetweenPrices: true,
			showPrefix: isItemPage,
			iconHeight: isItemPage ? '24px' : '20px',
			hasPro: isUserPro(extensionSettings['user']),
			tooltipArrow: true,
		});

		if (!container.querySelector('.betterfloat-buffprice')) {
			if (state === PageState.Market) {
				footerContainer.insertAdjacentHTML('afterend', buffContainer);
			} else if (state === PageState.Inventory) {
				footerContainer.insertAdjacentHTML('beforeend', buffContainer);
			}
		}
	}

	let priceContainer: HTMLElement | null = null;
	if (state === PageState.Market) {
		priceContainer = footerContainer?.firstElementChild as HTMLElement;
	}
	if (priceContainer) {
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

		const itemPrice = price ? new Decimal(price.value) : new Decimal(0);
		const percentage = itemPrice.div(priceFromReference ?? 0).mul(100);
		const { color, background: backgroundColor } = percentage.gt(100) ? styling.loss : styling.profit;

		const buffPriceHTML = `<div class="sale-tag betterfloat-sale-tag" style="background-color: ${backgroundColor}; color: ${color}; padding: 1px 5px; border-radius: 4px;" data-skincomparison="${difference}"><span>${difference.gt(0) ? '+' : '-'}${convertCurrency(
			difference.abs().toDP(2).toNumber(),
			'USD'
		)} </span><span>(${percentage.gt(150) ? percentage.toFixed(0) : percentage.toFixed(2)}%)</span></div>`;

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
