import { html } from 'common-tags';
import getSymbolFromCurrency from 'currency-symbol-map';
import Decimal from 'decimal.js';
import type { PlasmoCSConfig } from 'plasmo';
import type { DopplerPhase, ItemStyle } from '~lib/@typings/FloatTypes';
import type { Skinplace } from '~lib/@typings/SkinplaceTypes';
import { getBitskinsCurrencyRate } from '~lib/handlers/cache/bitskins_cache';
import { getSpecificSkinplaceOffer, getSpecificSkinplaceUserItem, isSkinplaceOffersCacheEmpty } from '~lib/handlers/cache/skinplace_cache';
import { activateHandler, initPriceMapping } from '~lib/handlers/eventhandler';
import { initSkinplaceHistory } from '~lib/handlers/historyhandler';
import { getMarketID } from '~lib/handlers/mappinghandler';
import { SKINPLACE_SELECTORS } from '~lib/handlers/selectors/skinplace_selectors';
import { MarketSource } from '~lib/util/globals';
import { CurrencyFormatter, checkUserPlanPro, getBuffPrice, handleSpecialStickerNames, isUserPro } from '~lib/util/helperfunctions';
import { getAllSettings, type IStorage } from '~lib/util/storage';
import { generatePriceLine } from '~lib/util/uigeneration';

export const config: PlasmoCSConfig = {
	matches: ['*://*.skin.place/*'],
	run_at: 'document_end',
	css: ['../css/hint.min.css', '../css/common_styles.css', '../css/skinplace_styles.css'],
};

type PriceResult = {
	price_difference: Decimal;
};

async function init() {
	console.time('[BetterFloat] Skin.Place init timer');

	if (location.host !== 'skin.place') {
		return;
	}

	console.time('[BetterFloat] Skinplace init timer');
	initSkinplaceHistory();

	// catch the events thrown by the script
	// this has to be done as first thing to not miss timed events
	activateHandler();

	extensionSettings = await getAllSettings();

	if (!extensionSettings['splace-enable']) return;

	// check if user has the required plan
	if (!(await checkUserPlanPro(extensionSettings['user']))) {
		console.log('[BetterFloat] Pro plan required for Skin.Place features');
		return;
	}

	await initPriceMapping(extensionSettings, 'splace');

	console.timeEnd('[BetterFloat] Skinplace init timer');

	// mutation observer is only needed once
	if (!isObserverActive) {
		isObserverActive = true;
		applyMutation();
		console.log('[BetterFloat] Mutation observer started');
	}

	firstLaunch();
}

function firstLaunch() {
	let firstLaunch = true;
	setInterval(async () => {
		if (firstLaunch) {
			firstLaunch = false;
			if (location.pathname === '/buy-cs2-skins' && isSkinplaceOffersCacheEmpty()) {
				console.log('[BetterFloat] Skinplace offers cache is empty, refreshing...');
				document.querySelector<HTMLElement>('button.refresh-button_type_primary')?.click();
			}
		}
		const items = document.querySelectorAll<HTMLElement>('.item-buy-card:not(.betterfloat-buff-a)');
		for (const item of items) {
			await adjustItem(item, PageState.Market);
		}
	}, 2000);
}

function applyMutation() {
	const observer = new MutationObserver(async (mutations) => {
		for (const mutation of mutations) {
			for (let i = 0; i < mutation.addedNodes.length; i++) {
				const addedNode = mutation.addedNodes[i];
				// some nodes are not elements, so we need to check
				if (!(addedNode instanceof HTMLElement)) continue;
				// console.debug('[BetterFloat] Skinplace Mutation detected:', addedNode);

				if (addedNode.className.startsWith('user-inventory')) {
					const items = addedNode.querySelectorAll(SKINPLACE_SELECTORS.inventory.itemCard);
					for (const item of items) {
						await adjustItem(item, PageState.Inventory);
					}
				} else if (addedNode.className === 'item-sell-card') {
					await adjustItem(addedNode, PageState.Inventory);
				} else if (addedNode.className === 'base-tooltip') {
					const item = addedNode.querySelector('.item-buy-card');
					if (item) {
						await adjustItem(item, PageState.Market);
					}
				}
			}
		}
	});
	observer.observe(document, { childList: true, subtree: true });
}

function getAPIItem(container: Element, state: PageState): Skinplace.InventoryItem | Skinplace.Offer | null {
	if (state === PageState.Market) {
		const imgSrc = container.querySelector(SKINPLACE_SELECTORS.market.image)?.getAttribute('src');
		const iconUrl = imgSrc?.includes('steamcommunity') ? imgSrc?.split('image/')[1]?.split('/')[0] : imgSrc;
		return iconUrl ? getSpecificSkinplaceOffer(iconUrl) : null;
	} else if (state === PageState.Inventory) {
		const imgSrc = container.querySelector(SKINPLACE_SELECTORS.inventory.image)?.getAttribute('src')?.split('image/')[1]?.split('/')[0] ?? '';
		return getSpecificSkinplaceUserItem(imgSrc) || null;
	}
	return null;
}

async function adjustItem(container: Element, state: PageState) {
	let item = getAPIItem(container, state);

	let tries = 10;
	while (state !== PageState.Market && !item && tries-- > 0) {
		await new Promise((resolve) => setTimeout(resolve, 200));
		item = getAPIItem(container, state);
	}
	// console.log('[BetterFloat] Skinplace item:', item);
	if (!item) return;

	await addBuffPrice(item, container, state);
}

function isInventoryItem(item: Skinplace.InventoryItem | Skinplace.Offer): item is Skinplace.InventoryItem {
	return 'market_hash_name' in item;
}

async function addBuffPrice(item: Skinplace.InventoryItem | Skinplace.Offer, container: Element, state: PageState): Promise<PriceResult> {
	const { source, itemStyle, itemPrice, buff_name, market_id, priceListing, priceOrder, priceFromReference, difference, currency } = await getBuffItem(item);

	let footerContainer: Element | null = null;
	if (state === PageState.Inventory) {
		footerContainer = container.querySelector(SKINPLACE_SELECTORS.inventory.info);
	} else if (state === PageState.Market) {
		footerContainer = container.querySelector(SKINPLACE_SELECTORS.market.priceInfo);
	}

	const isDoppler = isInventoryItem(item) ? item.market_hash_name.includes('Doppler') : !!item.skin.phase;
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
			iconHeight: '16px',
			hasPro: isUserPro(extensionSettings['user']),
			tooltipArrow: true,
		});

		footerContainer.insertAdjacentHTML('beforeend', buffContainer);

		if (state === PageState.Market) {
			footerContainer.querySelector(SKINPLACE_SELECTORS.market.priceValue)?.setAttribute('style', 'display: flex; align-items: center;');
			footerContainer.closest<HTMLDivElement>(SKINPLACE_SELECTORS.market.info)!.style.height = '120px';
		}

		const buffElement = footerContainer.querySelector<HTMLAnchorElement>('.betterfloat-buff-a');
		buffElement?.addEventListener('click', (e) => {
			e.preventDefault();
			e.stopPropagation();
			window.open(buffElement.href, '_blank');
		});
	}

	let priceContainer: Element | null = null;
	if (state === PageState.Inventory) {
		priceContainer = container.querySelector(SKINPLACE_SELECTORS.inventory.price);
	} else if (state === PageState.Market) {
		priceContainer = container.querySelector(SKINPLACE_SELECTORS.market.priceValue);
	}

	if (priceContainer && !container.querySelector('.betterfloat-sale-tag') && (extensionSettings['splace-buffdifference'] || extensionSettings['splace-buffdifferencepercent'])) {
		priceContainer.insertAdjacentHTML('beforeend', createSaleTag(difference, itemPrice.div(priceFromReference ?? 1).mul(100), currencyFormatter));

		if (state === PageState.Market) {
			(priceContainer.lastElementChild as HTMLDivElement).style.marginLeft = '10px';
		}
	}

	return {
		price_difference: difference,
	};
}

function createSaleTag(difference: Decimal, percentage: Decimal, currencyFormatter: Intl.NumberFormat) {
	const styling = {
		profit: {
			color: '#30d158',
			background: '#30d15829',
		},
		loss: {
			color: '#ff8095',
			background: '#3a0e0e',
		},
	};

	const { color, background } = percentage.gt(100) ? styling.loss : styling.profit;

	return html`
		<div class="betterfloat-sale-tag" style="background-color: ${background}; color: ${color};">
			${extensionSettings['splace-buffdifference'] ? html`<span>${difference.isPos() ? '+' : '-'}${currencyFormatter.format(difference.abs().toNumber())} </span>` : ''}
			${extensionSettings['splace-buffdifferencepercent'] ? html`<span>(${percentage.gt(150) ? percentage.toFixed(0) : percentage.toFixed(2)}%)</span>` : ''}
		</div>
	`;
}

async function getBuffItem(item: Skinplace.InventoryItem | Skinplace.Offer) {
	let source = (extensionSettings['splace-pricingsource'] as MarketSource) ?? MarketSource.Buff;
	const buff_item = createBuffItem(item);
	const buff_name = handleSpecialStickerNames(buff_item.name);
	let { priceListing, priceOrder } = await getBuffPrice(buff_name, buff_item.style, source);

	if (((!priceListing && !priceOrder) || (priceListing?.isZero() && priceOrder?.isZero())) && extensionSettings['splace-altmarket'] && extensionSettings['splace-altmarket'] !== MarketSource.None) {
		source = extensionSettings['splace-altmarket'] as MarketSource;
		const altPrices = await getBuffPrice(buff_name, buff_item.style, source);
		priceListing = altPrices.priceListing;
		priceOrder = altPrices.priceOrder;
	}
	const market_id = await getMarketID(buff_name, source);

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
		Number(extensionSettings['splace-pricereference']) === 0 &&
		([MarketSource.Buff, MarketSource.Steam].includes(source) || (MarketSource.YouPin === source && isUserPro(extensionSettings['user'])))
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

function getItemPrice(item: Skinplace.InventoryItem | Skinplace.Offer): Decimal {
	return new Decimal(isInventoryItem(item) ? item.price : item.priceMarket);
}

function createBuffItem(item: Skinplace.InventoryItem | Skinplace.Offer): { name: string; style: ItemStyle } {
	const buff_item = {
		name: isInventoryItem(item) ? item.market_hash_name : item.skin.fullName,
		style: '' as ItemStyle,
	};
	if (isInventoryItem(item) ? item.market_hash_name.includes('Doppler') : !!item.skin.phase) {
		const phase = isInventoryItem(item) ? item.market_hash_name.split(') ')[1] : item.skin.phase;
		buff_item.style = phase as ItemStyle;
		buff_item.name = isInventoryItem(item) ? item.market_hash_name.replace(` ${phase}`, '') : item.skin.name.replace(` ${phase}`, '');
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

// mutation observer active?
let isObserverActive = false;
let extensionSettings: IStorage;

init();
