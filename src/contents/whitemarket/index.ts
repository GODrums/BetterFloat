import Decimal from 'decimal.js';
import type { DopplerPhase, ItemStyle } from '~lib/@typings/FloatTypes';
import type { LegacyContentScriptConfig as PlasmoCSConfig } from '~lib/@typings/MigrationTypes';
import type { WhiteMarket } from '~lib/@typings/WhitemarketTypes';
import { getMarketID } from '~lib/handlers/mappinghandler';
import { AskBidMarkets, MarketSource } from '~lib/util/globals';
import { CurrencyFormatter, convertCurrency, getBuffPrice, handleSpecialStickerNames, isUserPro } from '~lib/util/helperfunctions';
import { attachMarketPopover } from '~lib/util/market_popover';
import { getAllSettings, type IStorage } from '~lib/util/storage';
import { generatePriceLine } from '~lib/util/uigeneration';
import { cacheWhiteMarketSSRItems, findWhiteMarketInventoryItem, getWhiteMarketItem, type WhiteMarketInventoryCard } from './cache';
import { activateWhitemarketEventHandler as activateHandler } from './events';

export const config: PlasmoCSConfig = {
	matches: ['https://*.white.market/*'],
	run_at: 'document_end',
	css: ['../../css/common_styles.css', '../../css/whitemarket_styles.css'],
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
	// the first page of listings is server-rendered and not fetched via GraphQL
	cacheWhiteMarketSSRItems();

	extensionSettings = await getAllSettings();

	if (!extensionSettings['wm-enable']) {
		console.log('[BetterFloat] WhiteMarket is disabled, exiting...');
		return;
	}

	// mutation observer is only needed once
	if (!isObserverActive) {
		isObserverActive = true;
		applyMutation();
		changeListener();
		console.log('[BetterFloat] Mutation observer started');
	}
}

function changeListener() {
	setInterval(async () => {
		// Check if the inventory section is still part of the document
		if (location.pathname === '/inventory/my' || location.pathname === '/inventory/instant-sell') {
			// inventory cards are buttons (market cards are links) inside a virtualized grid
			const items = document.querySelectorAll('button.wm-card');
			for (const item of items) {
				await adjustItem(item, PageState.Inventory);
			}
		} else {
			const items = document.querySelectorAll('a[href*="/item/"]:not(:has(.betterfloat-buff-a))');
			for (const item of items) {
				// items without cached API data (yet) are skipped and retried on the next tick
				await adjustItem(item as Element, PageState.Market);
			}
		}
	}, 1000);
}

function applyMutation() {
	const observer = new MutationObserver(async (mutations) => {
		for (const mutation of mutations) {
			for (let i = 0; i < mutation.addedNodes.length; i++) {
				const addedNode = mutation.addedNodes[i];
				// some nodes are not elements, so we need to check
				if (!(addedNode instanceof HTMLElement)) continue;
				// console.debug('[BetterFloat] Mutation detected:', addedNode);

				if (addedNode.className.startsWith('styles_item__')) {
					// item in market
					// await adjustItem(addedNode, PageState.Market);
				} else if (addedNode.className === 'flex flex-1') {
					// const items = addedNode.querySelectorAll('div[class*="styles_item__"]');
					// for (const item of items) {
					// 	await adjustItem(item as Element, PageState.Market);
					// }
				}
			}
		}
	});
	observer.observe(document, { childList: true, subtree: true });
}

async function adjustItem(container: Element, state: PageState) {
	let price: WhiteMarket.Price | null = null;
	const getApiItem = () => {
		if (state === PageState.Inventory) {
			return findWhiteMarketInventoryItem(readInventoryCard(container));
		}
		if (state === PageState.Market) {
			const slug = container.getAttribute('href')?.split('/').at(-1);
			if (!slug) {
				console.error('[BetterFloat] No slug found: ', container, state);
				return null;
			}
			const listing = getWhiteMarketItem(slug);
			price = listing?.price ?? null;
			return listing?.item;
		}
		return null;
	};
	const apiItem = getApiItem();
	if (!apiItem) {
		console.debug('[BetterFloat] No API data found for item: ', container);
		return null;
	}

	if (state === PageState.Inventory) {
		// the virtualized grid recycles card elements while scrolling, so the
		// card may now show a different item than the one we priced before
		const htmlContainer = container as HTMLElement;
		if (htmlContainer.dataset.betterfloatId === apiItem.id) return null;
		for (const element of container.querySelectorAll('.betterfloat-buff-a')) {
			element.remove();
		}
		htmlContainer.dataset.betterfloatId = apiItem.id;
	} else {
		if (container.classList.contains(apiItem.id)) return null;
		container.classList.add(apiItem.id);
	}

	const _priceResult = await addBuffPrice(apiItem, price, container, state);
}

function readInventoryCard(container: Element): WhiteMarketInventoryCard {
	const description = container.querySelector('.wm-card-desc-detailed');
	const short = description?.querySelector('.wm-label--13')?.textContent?.trim() || undefined;
	const skin = description?.querySelector('.wm-label--14')?.textContent?.trim() || undefined;
	// float row: "<span>MW</span><span>0.0721</span>" right below the float bar
	const floatText = container.querySelector('.wm-float')?.nextElementSibling?.querySelector('.wm-label--13 > span:last-child')?.textContent?.trim();
	const float = floatText && /^\d*\.\d+$/.test(floatText) ? Number(floatText) : undefined;
	return {
		icon: container.querySelector<HTMLImageElement>('img.wm-card-img')?.src,
		short,
		skin,
		float,
		isStatTrak: (short ?? '').includes('StatTrak'),
	};
}

async function getBuffItem(item: WhiteMarket.Item, price: WhiteMarket.Price | null) {
	let source = (extensionSettings['wm-pricingsource'] as MarketSource) ?? MarketSource.Buff;
	const buff_item = {
		name: item.description.nameHash,
		style: '' as ItemStyle,
	};
	const buff_name = handleSpecialStickerNames(buff_item.name);
	let { priceListing, priceOrder } = await getBuffPrice(buff_name, buff_item.style, source);

	if (((!priceListing && !priceOrder) || (priceListing?.isZero() && priceOrder?.isZero())) && extensionSettings['wm-altmarket'] && extensionSettings['wm-altmarket'] !== MarketSource.None) {
		source = extensionSettings['wm-altmarket'] as MarketSource;
		const altPrices = await getBuffPrice(buff_name, buff_item.style, source);
		priceListing = altPrices.priceListing;
		priceOrder = altPrices.priceOrder;
	}
	const market_id = await getMarketID(buff_name, source);

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
		Number(extensionSettings['wm-pricereference']) === 0 &&
		(AskBidMarkets.map((market) => market.source).includes(source) || (MarketSource.YouPin === source && isUserPro(extensionSettings['user'])))
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

	// legacy layout used `div.price`, the current card layout renders the price as an 18px label
	const legacyPrice = container.querySelector('div.price');
	let footerContainer = (legacyPrice ?? container.querySelector('.wm-label--18'))?.parentElement ?? null;
	if (legacyPrice && state === PageState.Inventory) {
		footerContainer = footerContainer?.parentElement ?? null;
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
			userCurrency: currency.text ?? 'USD',
			itemStyle: '' as DopplerPhase,
			CurrencyFormatter: currencyFormatter,
			isDoppler,
			isPopout: isItemPage,
			addSpaceBetweenPrices: true,
			showPrefix: isItemPage,
			iconHeight: isItemPage ? '24px' : '20px',
			hasPro: isUserPro(extensionSettings['user']),
		});

		if (!container.querySelector('.betterfloat-buffprice')) {
			// the legacy inventory layout had room inside the footer, the current layout puts it below the price row
			footerContainer.insertAdjacentHTML(legacyPrice && state === PageState.Inventory ? 'beforeend' : 'afterend', buffContainer);
		}

		container.querySelector('.betterfloat-buff-a')?.addEventListener('click', (e) => {
			e.preventDefault();
			e.stopPropagation();
			window.open((e.currentTarget as HTMLAnchorElement).href, '_blank');
		});

		const buffElement = container.querySelector<HTMLAnchorElement>('.betterfloat-buff-a');
		if (buffElement) {
			attachMarketPopover(buffElement, { isPro: isUserPro(extensionSettings['user']), currencyRate: currency.rate ?? 1 });
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

		const buffPriceHTML = `<div class="sale-tag betterfloat-sale-tag" style="background-color: ${backgroundColor}; color: ${color}; padding: 1px 5px; border-radius: 4px; display: inline-block; margin-left: 6px; vertical-align: middle;" data-betterfloat="${difference}"><span>${difference.gt(0) ? '+' : '-'}${convertCurrency(
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
