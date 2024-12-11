import Decimal from 'decimal.js';
import type { PlasmoCSConfig } from 'plasmo';

import type { CSMoney } from '~lib/@typings/CsmoneyTypes';
import type { DopplerPhase, ItemStyle } from '~lib/@typings/FloatTypes';
import {
	getFirstCSMoneyBotInventoryItem,
	getFirstCSMoneyItem,
	getFirstCSMoneyUserInventoryItem,
	getSpecificCSMoneyItem,
	isCSMoneyBotInventoryEmpty,
	isCSMoneyUserInventoryEmpty,
} from '~lib/handlers/cache/csmoney_cache';
import { activateHandler, initPriceMapping } from '~lib/handlers/eventhandler';
import { getAndFetchCurrencyRate, getMarketID } from '~lib/handlers/mappinghandler';
import { MarketSource } from '~lib/util/globals';
import { BigUSDollar, USDollar, getBuffPrice, handleSpecialStickerNames, isBuffBannedItem, parsePrice } from '~lib/util/helperfunctions';
import { type IStorage, getAllSettings } from '~lib/util/storage';
import { generatePriceLine } from '~lib/util/uigeneration';

export const config: PlasmoCSConfig = {
	matches: ['https://*.cs.money/*'],
	run_at: 'document_end',
	css: ['../css/csmoney_styles.css'],
};

type PriceResult = {
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

	if (!extensionSettings['bm-enable']) return;

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

	if (location.pathname.startsWith('/market/buy')) {
		const reloadButton = document.querySelector<HTMLElement>('div[class^="InventoryReloadButton_container__"]');
		if (reloadButton) {
			reloadButton.click();
		}
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
				// console.debug('[BetterFloat] Mutation detected:', addedNode, addedNode.tagName, addedNode.className.toString());

				if (addedNode.tagName === 'DIV' && addedNode.className.startsWith('InventorySearchResults_item__') && addedNode.firstElementChild?.getAttribute('data-card-id')) {
					// item in buy-tab
					setTimeout(async () => {
						await adjustItem(addedNode);
					}, 1000);
				} else if (addedNode.tagName === 'DIV') {
					// item in sell-tab
					const item = addedNode.querySelector('div[class^="actioncard_wrapper"]');
					if (item) {
						await adjustItem(item);
					}
				} else if (addedNode.className === 'portal') {
					// item popup
					const bigCard = addedNode.querySelector('div[class^="DesktopBigCardLayout_content-wrapper__"]');
					if (bigCard) {
						await adjustItem(bigCard, true);
					}
				}
			}
		}
	});
	observer.observe(document, { childList: true, subtree: true });
}

async function adjustItem(container: Element, isPopout = false) {
	const itemId = container?.firstElementChild?.getAttribute('data-card-id');
	const getApiItem = () => {
		if (location.pathname === '/csgo/trade/') {
			const isUserItem = !container.closest('#botInventory');
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
			const isUserItem = !container.closest('#botInventory');
			return isUserItem ? isCSMoneyUserInventoryEmpty() : isCSMoneyBotInventoryEmpty();
		} else {
			return !getFirstCSMoneyItem();
		}
	};
	let apiItem = getApiItem();

	let attempts = 0;
	while (!apiItem && attempts++ < 5 && isInventoryEmpty()) {
		// wait for 1s and try again
		console.log('[BetterFloat] No item found, waiting 1s and trying again...', container);
		await new Promise((resolve) => setTimeout(resolve, 1000));
		apiItem = getApiItem();
	}
	if (!apiItem) {
		console.error('[BetterFloat] No item found, skipping...');
		return;
	}
	// eslint-disable-next-line @typescript-eslint/no-unused-vars
	const priceResult = await addBuffPrice(apiItem!, container, isPopout);
	// console.log('[BetterFloat] Item: ', apiItem);

	// store api item
	container.setAttribute('data-betterfloat', JSON.stringify(apiItem));
}

async function getBuffItem(container: Element, item: CSMoney.Item) {
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

	const itemPrice = new Decimal(getHTMLPrice(container)!.price);
	const referencePrice = parseInt(extensionSettings['csm-referenceprice']) === 0 ? priceOrder : priceListing;
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

// 		container.querySelector('div[class^="styles_price__"]')?.textContent?.trim() ??
// 		container.querySelector('div[class^="PriceZone_price__"]')?.textContent?.trim()?.replace(/\s/g, '') ??
// 		container.querySelector('div[class^="Price_container___"]')?.textContent?.trim()?.replace(/\s/g, '');
function getItemPrice(item: CSMoney.Item): number {
	const invItem = item as CSMoney.InventoryItem;
	const marketItem = item as CSMoney.MarketItem;

	return invItem.sellPrice ?? invItem.recommendedPrice?.decreased ?? marketItem.pricing?.computed ?? invItem.botPrice ?? invItem.price ?? 0;
}

function getHTMLPrice(container: Element) {
	const priceText = (container.querySelector('div[class^="Price_price__"]') ?? container.querySelector('div[class^="price_price__"]'))?.textContent;
	if (!priceText) {
		return null;
	}

	return parsePrice(priceText);
}

function createBuffItem(item: CSMoney.Item): { name: string; style: ItemStyle } {
	let name = '';
	// check if item is InventoryItem or MarketItem
	if ((<CSMoney.InventoryItem>item).fullName) {
		name = (<CSMoney.InventoryItem>item).fullName;
	} else if ((<CSMoney.MarketItem>item).asset?.names?.full) {
		name = (<CSMoney.MarketItem>item).asset.names.full;
	} else {
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

function getUserCurrency() {
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

async function addBuffPrice(item: CSMoney.Item, container: Element, isPopout = false): Promise<PriceResult> {
	const { buff_name, itemStyle, market_id, itemPrice, priceListing, priceOrder, priceFromReference, difference, source, currency } = await getBuffItem(container, item);

	let footerContainer: HTMLElement | null;
	if (isPopout) {
		footerContainer = container.querySelector('div[class^="PriceInformation_price_market_wrap"]');
		if (!footerContainer) {
			footerContainer = container.querySelector('span[class^="ActionButtonZone_current-price-container__"]');
		}
	} else {
		footerContainer = container.querySelector('footer');
	}
	if (!footerContainer) {
		footerContainer = container.querySelector('div[class^="InventorySmallCard_bottom__"]');
	}
	const isDoppler = buff_name.includes('Doppler') && buff_name.includes('|');
	const maximumFractionDigits = priceListing?.gt(1000) ? 0 : 2;
	const CurrencyFormatter = new Intl.NumberFormat(undefined, {
		style: 'currency',
		currency: currency.text ?? 'USD',
		currencyDisplay: 'narrowSymbol',
		minimumFractionDigits: 0,
		maximumFractionDigits: maximumFractionDigits,
	});
	const buffContainer = generatePriceLine({
		source,
		market_id,
		buff_name,
		priceOrder,
		priceListing,
		priceFromReference,
		userCurrency: currency.symbol ?? '$',
		itemStyle: itemStyle as DopplerPhase,
		CurrencyFormatter,
		isDoppler,
		isPopout,
		priceClass: 'suggested-price',
		addSpaceBetweenPrices: false,
		showPrefix: false,
		iconHeight: '15px',
	});

	if (footerContainer) {
		const oldContainer = footerContainer.querySelector('.betterfloat-buffprice');
		if (oldContainer) {
			console.debug('[BetterFloat] Buff price already added, removing old container...');
			oldContainer.remove();
		}
		if (!container.querySelector('.betterfloat-buffprice')) {
			if (isPopout) {
				footerContainer.parentElement?.parentElement?.insertAdjacentHTML('afterbegin', buffContainer);
			} else {
				footerContainer.querySelector('div[class^="BaseCard_price"]')?.insertAdjacentHTML('afterend', buffContainer);
				footerContainer.querySelector('div[class^="InventorySmallCard_price-zone__"]')?.insertAdjacentHTML('afterend', buffContainer);
			}
		}
	}

	if (priceListing?.gt(0.06) && location.pathname !== '/market/sell/') {
		let priceContainer: Element | null;
		if (isPopout) {
			const containers = container.querySelectorAll('span[class^="styles_price__"]');
			priceContainer = containers[containers.length - 1];
		} else {
			priceContainer = container.querySelector<HTMLElement>('span[class^="styles_price__"]');
		}
		if (!priceContainer) {
			priceContainer = container.querySelector<HTMLElement>('div[class*="PriceZone_price__"]');
		}

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

		const buffPriceHTML = `<div class="sale-tag betterfloat-sale-tag" style="background-color: ${background}; color: ${color}; padding: 1px 3px; border-radius: 4px;${
			isPopout ? ' margin-left: 10px;' : ''
		}" data-betterfloat="${difference}"><span>${difference.isPos() ? '+' : '-'}${CurrencyFormatter.format(
			absDifference.toNumber()
		)}</span><span>(${percentage.gt(150) ? percentage.toFixed(0) : percentage.toFixed(2)}%)</span></div>`;
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
