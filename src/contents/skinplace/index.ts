import { html } from 'common-tags';
import getSymbolFromCurrency from 'currency-symbol-map';
import Decimal from 'decimal.js';
import type { PlasmoCSConfig } from 'plasmo';
import type { DopplerPhase, ItemStyle } from '~lib/@typings/FloatTypes';
import type { Skinplace } from '~lib/@typings/SkinplaceTypes';
import { getMarketID } from '~lib/handlers/mappinghandler';
import { SKINPLACE_SELECTORS } from '~lib/handlers/selectors/skinplace_selectors';
import { initPriceMapping } from '~lib/shared/pricing';
import { AskBidMarkets, MarketSource } from '~lib/util/globals';
import { CurrencyFormatter, getBuffPrice, handleSpecialStickerNames, isUserPro, waitForElement } from '~lib/util/helperfunctions';
import { attachMarketPopover } from '~lib/util/market_popover';
import { getAllSettings, type IStorage } from '~lib/util/storage';
import { generatePriceLine } from '~lib/util/uigeneration';
import { getSkinplaceMarketOffer, getSpecificSkinplaceMarketItem, getSpecificSkinplaceUserItem } from './cache';
import { activateSkinplaceEventHandler as activateHandler } from './events';

export const config: PlasmoCSConfig = {
	matches: ['*://*.skin.place/*'],
	run_at: 'document_end',
	css: ['../../css/common_styles.css', '../../css/skinplace_styles.css'],
};

type PriceResult = {
	price_difference: Decimal;
	priceFromReference: Decimal | undefined;
};

async function init() {
	console.time('[BetterFloat] Skin.Place init timer');

	if (location.host !== 'skin.place') {
		return;
	}

	console.time('[BetterFloat] Skinplace init timer');

	// catch the events thrown by the script
	// this has to be done as first thing to not miss timed events
	activateHandler();

	extensionSettings = await getAllSettings();

	if (!extensionSettings['splace-enable']) return;

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
	setInterval(async () => {
		if (location.pathname === '/buy-cs2-skins') {
			// search pages
			const items = document.querySelectorAll<HTMLElement>(SKINPLACE_SELECTORS.market.itemNotBuffed);
			for (const item of items) {
				await adjustItem(item, PageState.Market);
			}
		} else if (location.pathname.startsWith('/buy-cs2-skins/')) {
			adjustItemPage();
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

async function adjustItemPage() {
	const data = getSkinplaceMarketOffer();
	if (!data?.data.length) return;

	await waitForElement(SKINPLACE_SELECTORS.itempage.pageNotBuffed);

	const itemPage = document.querySelector(SKINPLACE_SELECTORS.itempage.pageNotBuffed);
	if (!itemPage) return;

	const { priceFromReference } = await addBuffPrice(data.data[0], itemPage, PageState.ItemPage);

	if (!priceFromReference) return;

	const items = document.querySelectorAll<HTMLElement>(SKINPLACE_SELECTORS.itempage.offerItemNotBuffed);
	for (let i = 0; i < items.length; i++) {
		// add sale tag
		const item = items[i];
		const itemData = data.data[i];
		const itemPrice = new Decimal(itemData.price_market);
		const priceContainer = item.querySelector<HTMLElement>(SKINPLACE_SELECTORS.itempage.offerPrice);
		if (priceContainer && !item.querySelector('.betterfloat-sale-tag')) {
			priceContainer.querySelector(SKINPLACE_SELECTORS.common.discountLabel)?.remove();
			priceContainer.insertAdjacentHTML(
				'beforeend',
				createSaleTag(itemPrice.minus(priceFromReference), itemPrice.div(priceFromReference ?? 1).mul(100), CurrencyFormatter(await getUserCurrency(), 0, 2))
			);
			priceContainer.style.paddingRight = '0';
		}
	}
}

function getImageID(imgSrc: string) {
	const parts = imgSrc.split('/');
	return [parts[3], parts[4]].join('/');
}

function getAPIItem(container: Element, state: PageState): Skinplace.InventoryItem | Skinplace.GetItem | null {
	if (state === PageState.Market) {
		const imgSrc = container.querySelector(SKINPLACE_SELECTORS.market.image)?.getAttribute('src');
		if (!imgSrc) return null;
		return getSpecificSkinplaceMarketItem(getImageID(imgSrc));
	} else if (state === PageState.Inventory) {
		const imgSrc = container.querySelector(SKINPLACE_SELECTORS.inventory.image)?.getAttribute('src');
		if (!imgSrc) return null;
		return getSpecificSkinplaceUserItem(getImageID(imgSrc));
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

function isInventoryItem(item: Skinplace.InventoryItem | Skinplace.GetItem | Skinplace.MarketOffer): item is Skinplace.InventoryItem {
	return 'market_hash_name' in item;
}

async function addBuffPrice(item: Skinplace.InventoryItem | Skinplace.GetItem | Skinplace.MarketOffer, container: Element, state: PageState): Promise<PriceResult> {
	const { source, itemStyle, itemPrice, buff_name, market_id, priceListing, priceOrder, priceFromReference, difference, currency } = await getBuffItem(item);

	let footerContainer: Element | null = null;
	if (state === PageState.Inventory) {
		footerContainer = container.querySelector(SKINPLACE_SELECTORS.inventory.info);
	} else if (state === PageState.Market) {
		footerContainer = container.querySelector(SKINPLACE_SELECTORS.market.priceInfo);
	} else if (state === PageState.ItemPage) {
		footerContainer = container.querySelector(SKINPLACE_SELECTORS.itempage.footer);
	}

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
			userCurrency: currency.text ?? 'USD',
			itemStyle: itemStyle as DopplerPhase,
			CurrencyFormatter: currencyFormatter,
			isDoppler: !!item.phase,
			isPopout: state === PageState.ItemPage,
			addSpaceBetweenPrices: true,
			showPrefix: false,
			iconHeight: '16px',
			hasPro: isUserPro(extensionSettings['user']),
		});

		if (state === PageState.ItemPage || state === PageState.Market) {
			footerContainer.insertAdjacentHTML('afterend', buffContainer);
		} else {
			footerContainer.insertAdjacentHTML('beforeend', buffContainer);
		}

		if (state === PageState.Market) {
			footerContainer.querySelector(SKINPLACE_SELECTORS.common.discountLabel)?.remove();
			footerContainer.querySelector(SKINPLACE_SELECTORS.market.priceValue)?.setAttribute('style', 'display: flex; align-items: center;');
			footerContainer.closest<HTMLDivElement>(SKINPLACE_SELECTORS.market.info)!.style.height = '120px';
		}

		const buffElement = footerContainer.parentElement?.querySelector<HTMLAnchorElement>('.betterfloat-buff-a');
		if (buffElement) {
			buffElement.addEventListener('click', (e) => {
				e.preventDefault();
				e.stopPropagation();
				window.open(buffElement.href, '_blank');
			});
			attachMarketPopover(buffElement, { isPro: isUserPro(extensionSettings['user']), currencyRate: currency.rate ?? 1 });
		}
	}

	let priceContainer: Element | null = null;
	if (state === PageState.Inventory) {
		priceContainer = container.querySelector(SKINPLACE_SELECTORS.inventory.price);
	} else if (state === PageState.Market) {
		priceContainer = container.querySelector(SKINPLACE_SELECTORS.market.priceValue);
	} else if (state === PageState.ItemPage) {
		priceContainer = container.querySelector(SKINPLACE_SELECTORS.itempage.priceValue);
	}

	if (priceContainer && !container.querySelector('.betterfloat-sale-tag') && (extensionSettings['splace-buffdifference'] || extensionSettings['splace-buffdifferencepercent'])) {
		priceContainer.insertAdjacentHTML('beforeend', createSaleTag(difference, itemPrice.div(priceFromReference ?? 1).mul(100), currencyFormatter));

		if (state === PageState.Market) {
			(priceContainer.lastElementChild as HTMLDivElement).style.marginLeft = '10px';
		} else if (state === PageState.ItemPage) {
			priceContainer.querySelector(SKINPLACE_SELECTORS.common.discountLabel)?.remove();
		}
	}

	return {
		price_difference: difference,
		priceFromReference,
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

async function getBuffItem(item: Skinplace.InventoryItem | Skinplace.GetItem | Skinplace.MarketOffer) {
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
	const userCurrency = await getUserCurrency();
	const currencySymbol = getSymbolFromCurrency(userCurrency);
	const currencyRate = await getUserCurrencyRate();

	if (currencyRate && userCurrency !== 'USD') {
		if (priceListing) {
			priceListing = priceListing.mul(currencyRate);
		}
		if (priceOrder) {
			priceOrder = priceOrder.mul(currencyRate);
		}
		itemPrice = itemPrice.mul(currencyRate);
	}

	const referencePrice =
		Number(extensionSettings['splace-pricereference']) === 0 &&
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

async function getUserCurrency() {
	return (await window.cookieStore.get('currency_type_storage'))?.value || 'USD';
}

async function getUserCurrencyRate() {
	const currencyRate = (await window.cookieStore.get('currency_rate_storage'))?.value;
	if (!currencyRate) return 1;
	return parseFloat(currencyRate);
}

function getItemPrice(item: Skinplace.InventoryItem | Skinplace.GetItem | Skinplace.MarketOffer): Decimal {
	return new Decimal(isInventoryItem(item) ? item.price : item.price_market);
}

function createBuffItem(item: Skinplace.InventoryItem | Skinplace.GetItem | Skinplace.MarketOffer): { name: string; style: ItemStyle } {
	return {
		name: item.steam_market_hash_name,
		style: (item.phase ?? '') as ItemStyle,
	};
}

enum PageState {
	Market = 0,
	Inventory = 1,
	ItemPage = 2,
	ItemList = 3,
}

// mutation observer active?
let isObserverActive = false;
let extensionSettings: IStorage;

init();
