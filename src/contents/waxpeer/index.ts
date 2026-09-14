import { html } from 'common-tags';
import getSymbolFromCurrency from 'currency-symbol-map';
import Decimal from 'decimal.js';
import type { DopplerPhase, ItemStyle } from '~lib/@typings/FloatTypes';
import type { LegacyContentScriptConfig as PlasmoCSConfig } from '~lib/@typings/MigrationTypes';
import type { Waxpeer } from '~lib/@typings/WaxpeerTypes';
import { getMarketID } from '~lib/handlers/mappinghandler';
import { WAXPEER_SELECTORS } from '~lib/handlers/selectors/waxpeer_selectors';
import { getCurrencyToUsdRate } from '~lib/shared/currency';
import { initPriceMapping } from '~lib/shared/pricing';
import { AskBidMarkets, MarketSource } from '~lib/util/globals';
import { CurrencyFormatter, checkUserPlanPro, getBuffPrice, handleSpecialStickerNames, isUserPro } from '~lib/util/helperfunctions';
import { attachMarketPopover } from '~lib/util/market_popover';
import { getAllSettings, type IStorage } from '~lib/util/storage';
import { generatePriceLine } from '~lib/util/uigeneration';
import { findWaxpeerItemByName, getSpecificWaxpeerItem } from './cache';
import { activateWaxpeerEventHandler as activateHandler, requestWaxpeerPageItems } from './events';

export const config: PlasmoCSConfig = {
	matches: ['*://*.waxpeer.com/*'],
	run_at: 'document_end',
	css: ['../../css/common_styles.css', '../../css/waxpeer_styles.css'],
};

type PriceResult = {
	price_difference: Decimal;
};

async function init() {
	console.time('[BetterFloat] Waxpeer init timer');

	if (location.hostname !== 'waxpeer.com' && !location.hostname.endsWith('.waxpeer.com')) {
		return;
	}

	// catch the events thrown by the script
	// this has to be done as first thing to not miss timed events
	activateHandler(() => {
		if (isObserverActive) void adjustVisibleMarketItems();
	});

	extensionSettings = await getAllSettings();

	if (!extensionSettings['wp-enable']) return;

	// check if user has the required plan
	if (!(await checkUserPlanPro(extensionSettings['user']))) {
		console.log('[BetterFloat] Pro plan required for Waxpeer features');
		return;
	}

	await initPriceMapping(extensionSettings, 'wp');

	console.timeEnd('[BetterFloat] Waxpeer init timer');

	// mutation observer is only needed once
	if (!isObserverActive) {
		isObserverActive = true;
		applyMutation();
		console.log('[BetterFloat] Mutation observer started');
	}

	requestWaxpeerPageItems();
}

function applyMutation() {
	let stateRefreshTimer: ReturnType<typeof setTimeout> | undefined;
	const observer = new MutationObserver((mutations) => {
		for (const mutation of mutations) {
			for (const addedNode of mutation.addedNodes) {
				// some nodes are not elements, so we need to check
				if (!(addedNode instanceof HTMLElement)) continue;
				void adjustVisibleMarketItems(addedNode);
			}
		}

		clearTimeout(stateRefreshTimer);
		stateRefreshTimer = setTimeout(() => {
			requestWaxpeerPageItems();
			// Nuxt builds cards incrementally. A card can be observed before its
			// price/footer exists, so rescan after the complete mutation batch.
			void adjustVisibleMarketItems();
		}, 100);
	});
	observer.observe(document, { childList: true, subtree: true });
	void adjustVisibleMarketItems();
}

async function adjustVisibleMarketItems(root: ParentNode = document) {
	await adjustItemPage();

	const identityElements = new Set<Element>();
	if (root instanceof Element && (root.matches(WAXPEER_SELECTORS.item.legacy.wrapper) || root.matches(WAXPEER_SELECTORS.item.identity))) identityElements.add(root);
	for (const element of root.querySelectorAll(`${WAXPEER_SELECTORS.item.legacy.wrapper}, ${WAXPEER_SELECTORS.item.identity}`)) identityElements.add(element);

	const containers = new Set<Element>();
	for (const identity of identityElements) {
		const container = findItemContainer(identity);
		if (container) containers.add(container);
	}
	await Promise.all(Array.from(containers, (container) => adjustItem(container, PageState.Market)));
	removeSimilarOrderReferencePrices();
}

function removeSimilarOrderReferencePrices() {
	for (const similarList of document.querySelectorAll(WAXPEER_SELECTORS.itemPage.similarList)) {
		for (const referencePrice of similarList.querySelectorAll(WAXPEER_SELECTORS.betterfloat.priceLink)) referencePrice.remove();
	}
}

function findItemContainer(identity: Element) {
	if (identity.matches(WAXPEER_SELECTORS.item.legacy.wrapper)) return identity;
	if (identity.closest(WAXPEER_SELECTORS.itemPage.similarList)) return null;
	if (!getWaxpeerIdentityItem(identity)) return null;

	const modernContainer = identity.closest(WAXPEER_SELECTORS.item.modern.wrapper);
	if (modernContainer && getWaxpeerItem(modernContainer)) return modernContainer;

	let element: Element | null = identity;
	while (element && element !== document.body) {
		const hasPurchaseAction = !!element.querySelector(WAXPEER_SELECTORS.item.purchaseAction);
		if (getWaxpeerItem(element) && (element.querySelector(WAXPEER_SELECTORS.item.legacy.body) || (hasPurchaseAction && findListingPriceElement(element)))) return element;
		element = element.parentElement;
	}
	return null;
}

async function adjustItemPage() {
	const mainPriceContainer = document.querySelector<HTMLElement>(WAXPEER_SELECTORS.itemPage.mainPriceContainer);
	const pageItemID = getItemPageID();
	const pageItem = pageItemID ? getSpecificWaxpeerItem(pageItemID) : undefined;
	const adjustments: Promise<void>[] = [];

	if (mainPriceContainer && pageItem) adjustments.push(adjustItem(mainPriceContainer, PageState.ItemPage, pageItem));

	for (const similarList of document.querySelectorAll(WAXPEER_SELECTORS.itemPage.similarList)) {
		const desktopRows = Array.from(similarList.querySelectorAll<HTMLElement>(WAXPEER_SELECTORS.itemPage.similarDesktopRow));
		const mobileRows = Array.from(similarList.querySelectorAll<HTMLElement>(WAXPEER_SELECTORS.itemPage.similarMobileRow));

		for (const [index, desktopRow] of desktopRows.entries()) {
			const item = getWaxpeerItem(desktopRow);
			if (!item) continue;
			adjustments.push(adjustItem(desktopRow, PageState.Similar, item));
			const mobileRow = mobileRows[index];
			if (mobileRow) adjustments.push(adjustItem(mobileRow, PageState.Similar, item));
		}
	}

	await Promise.all(adjustments);
}

function getItemPageID() {
	const queryID = new URLSearchParams(location.search).get('id');
	if (queryID) return queryID;
	const pathID = location.pathname.match(/\/item\/([^/?#]+)/i)?.[1];
	return pathID ? decodeURIComponent(pathID) : undefined;
}

function getWaxpeerIdentityItem(identity: Element) {
	const itemID = getDirectItemID(identity);
	if (itemID) {
		const item = getSpecificWaxpeerItem(itemID);
		if (item) return item;
	}
	const identityText = `${identity.getAttribute('alt') ?? ''} ${identity.getAttribute('aria-label') ?? ''} ${identity.getAttribute('title') ?? ''}`;
	return findWaxpeerItemByName(identityText);
}

function getDirectItemID(element: Element) {
	const dataId = element.getAttribute('data-item-id') ?? element.getAttribute('data-itemid') ?? element.getAttribute('data-listing-id');
	if (dataId) return dataId;
	if (element instanceof HTMLAnchorElement) {
		const queryId = new URL(element.href).searchParams.get('id');
		if (queryId) return queryId;
		const match = element.href.match(/\/(?:item|listing)\/([^/?#]+)/i);
		if (match?.[1]) return decodeURIComponent(match[1]);
	}
	return undefined;
}

function getItemID(container: Element) {
	const elementWithId = container.matches(WAXPEER_SELECTORS.item.dataIdentity) ? container : container.querySelector<HTMLElement>(WAXPEER_SELECTORS.item.dataIdentity);
	const dataId = elementWithId?.getAttribute('data-item-id') ?? elementWithId?.getAttribute('data-itemid') ?? elementWithId?.getAttribute('data-listing-id');
	if (dataId) return dataId;

	for (const link of container.querySelectorAll<HTMLAnchorElement>(WAXPEER_SELECTORS.item.links)) {
		const queryId = new URL(link.href).searchParams.get('id');
		if (queryId) return queryId;
		const match = link.href.match(/\/(?:item|listing)\/([^/?#]+)/i);
		if (match?.[1]) return decodeURIComponent(match[1]);
	}
	return undefined;
}

function getWaxpeerItem(container: Element) {
	const itemID = getItemID(container);
	if (itemID) {
		const item = getSpecificWaxpeerItem(itemID);
		if (item) return item;
	}

	const identityText = Array.from(container.querySelectorAll<HTMLElement>(WAXPEER_SELECTORS.item.metadata))
		.map((element) => `${element.getAttribute('alt') ?? ''} ${element.getAttribute('aria-label') ?? ''} ${element.getAttribute('title') ?? ''}`)
		.join(' ');
	return findWaxpeerItemByName(`${identityText} ${container.textContent ?? ''}`);
}

async function adjustItem(container: Element, state: PageState, knownItem?: Waxpeer.Listing) {
	const resolvedState = container.closest(WAXPEER_SELECTORS.itemPage.similarList) ? PageState.Similar : state;
	const item = knownItem ?? getWaxpeerItem(container);
	const enhancementSelector = resolvedState === PageState.Similar ? WAXPEER_SELECTORS.betterfloat.saleTag : WAXPEER_SELECTORS.betterfloat.price;
	if (!item || container.querySelector(enhancementSelector) || container.getAttribute('data-betterfloat-adjusting') === 'true') return;

	container.setAttribute('data-betterfloat-adjusting', 'true');
	try {
		await addBuffPrice(item, container, resolvedState);
	} finally {
		container.removeAttribute('data-betterfloat-adjusting');
	}
}

async function addBuffPrice(item: Waxpeer.Listing, container: Element, state: PageState): Promise<PriceResult> {
	const { source, itemStyle, itemPrice, buff_name, market_id, priceListing, priceOrder, priceFromReference, difference, currency } = await getBuffItem(item);

	const isItemPage = state === PageState.ItemPage;
	const isSimilar = state === PageState.Similar;
	const footerContainer = container.querySelector<HTMLElement>(WAXPEER_SELECTORS.item.legacy.body);
	const listingPriceElement = findListingPriceElement(container, state);
	const isDoppler = buff_name.includes('Doppler') && buff_name.includes('|');
	const maximumFractionDigits = state === PageState.List || (priceListing?.gt(1000) && state !== PageState.ItemPage) ? 0 : 2;
	const currencyFormatter = CurrencyFormatter(currency.text ?? 'USD', 0, maximumFractionDigits);

	if (!isSimilar && (footerContainer || listingPriceElement) && !container.querySelector(WAXPEER_SELECTORS.betterfloat.price)) {
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
			isDoppler,
			isPopout: isItemPage,
			addSpaceBetweenPrices: true,
			showPrefix: isItemPage,
			iconHeight: isItemPage ? '24px' : state === PageState.List ? '16px' : '20px',
			hasPro: isUserPro(extensionSettings['user']),
		});
		if (isItemPage) {
			container.insertAdjacentHTML('beforeend', html`<div class="${WAXPEER_SELECTORS.betterfloat.itemPageReference.slice(1)}">${buffContainer}</div>`);
		} else if (container.matches(WAXPEER_SELECTORS.item.modern.wrapper) && listingPriceElement) {
			const nativePriceRow = listingPriceElement.closest<HTMLElement>(WAXPEER_SELECTORS.item.modern.priceRow) ?? listingPriceElement;
			nativePriceRow.insertAdjacentHTML('afterend', html`<div class="${WAXPEER_SELECTORS.betterfloat.priceRow.slice(1)}">${buffContainer}</div>`);
		} else if (footerContainer) footerContainer.insertAdjacentHTML('beforeend', buffContainer);
		else listingPriceElement?.insertAdjacentHTML('afterend', buffContainer);

		const buffElement = container.querySelector<HTMLAnchorElement>(WAXPEER_SELECTORS.betterfloat.priceLink);
		if (buffElement) {
			attachMarketPopover(buffElement, { isPro: isUserPro(extensionSettings['user']), currencyRate: currency.rate ?? 1 });
		}
	}

	const discountContainer = footerContainer?.querySelector(WAXPEER_SELECTORS.item.legacy.price) ?? listingPriceElement;

	if (
		discountContainer &&
		priceFromReference?.gt(0) &&
		!container.querySelector(WAXPEER_SELECTORS.betterfloat.saleTag) &&
		(extensionSettings['wp-buffdifference'] || extensionSettings['wp-buffdifferencepercent'])
	) {
		const nativeDiscount = findDiscountElement(container);
		nativeDiscount?.setAttribute('style', 'display: none !important;');

		const saleTag = createSaleTag(difference, itemPrice.div(priceFromReference).mul(100), currencyFormatter, isSimilar ? WAXPEER_SELECTORS.betterfloat.similarTag : undefined);
		if (isItemPage && listingPriceElement?.parentElement) {
			const nativePriceGroup = listingPriceElement.parentElement;
			nativePriceGroup.classList.add(WAXPEER_SELECTORS.betterfloat.itemPagePriceGroup.slice(1));
			nativePriceGroup.insertAdjacentHTML('beforeend', saleTag);
		} else if (container.matches(WAXPEER_SELECTORS.item.modern.wrapper) && listingPriceElement?.parentElement) {
			const nativePriceGroup = listingPriceElement.parentElement;
			nativePriceGroup.classList.add(WAXPEER_SELECTORS.betterfloat.listingPriceGroup.slice(1));
			nativePriceGroup.querySelector<HTMLElement>(WAXPEER_SELECTORS.item.modern.bestPriceBadge)?.setAttribute('style', 'display: none !important;');
			nativePriceGroup.insertAdjacentHTML('beforeend', saleTag);
		} else {
			(nativeDiscount ?? discountContainer).insertAdjacentHTML('afterend', saleTag);
		}
	}

	return {
		price_difference: difference,
	};
}

function findListingPriceElement(container: Element, state: PageState = PageState.Market) {
	if (state === PageState.ItemPage) return container.querySelector<HTMLElement>(WAXPEER_SELECTORS.itemPage.mainPrice);
	if (state === PageState.Similar) {
		const desktopPrice = container.querySelector<HTMLElement>(WAXPEER_SELECTORS.itemPage.similarPrice);
		if (desktopPrice) return desktopPrice;
		const addToCartButton = container.querySelector(WAXPEER_SELECTORS.itemPage.addToCart);
		const mobilePrice = addToCartButton?.previousElementSibling;
		return mobilePrice instanceof HTMLElement ? mobilePrice : null;
	}

	const legacyPrice = container.querySelector<HTMLElement>(WAXPEER_SELECTORS.item.legacy.price);
	if (legacyPrice) return legacyPrice;

	const pricePattern =
		/(?:[$€£¥₽₺₴₹₩₫₦₱฿₡₲₵]|\b(?:USD|EUR|GBP|CNY|RUB|TRY|UAH|INR|JPY|KRW|CAD|AUD)\b)\s*[\d.,\s]+|[\d.,\s]+\s*(?:[$€£¥₽₺₴₹₩₫₦₱฿₡₲₵]|\b(?:USD|EUR|GBP|CNY|RUB|TRY|UAH|INR|JPY|KRW|CAD|AUD)\b)/i;
	const modernPrice = Array.from(container.querySelectorAll<HTMLElement>(WAXPEER_SELECTORS.item.modern.price)).find((element) => {
		const text = element.textContent?.trim() ?? '';
		return text.length > 0 && text.length < 40 && pricePattern.test(text);
	});
	if (modernPrice) return modernPrice;

	const candidates = Array.from(container.querySelectorAll<HTMLElement>(WAXPEER_SELECTORS.item.textCandidates)).filter((element) => {
		if (element.closest(WAXPEER_SELECTORS.betterfloat.priceLink) || element.children.length > 0) return false;
		const text = element.textContent?.trim() ?? '';
		return text.length > 0 && text.length < 40 && pricePattern.test(text);
	});
	return candidates.at(-1) ?? null;
}

function findDiscountElement(container: Element) {
	const legacyDiscount = container.querySelector<HTMLElement>(WAXPEER_SELECTORS.item.legacy.discount);
	if (legacyDiscount) return legacyDiscount;
	return Array.from(container.querySelectorAll<HTMLElement>(WAXPEER_SELECTORS.item.textCandidates)).find((element) => {
		if (element.closest(WAXPEER_SELECTORS.betterfloat.saleTag) || element.children.length > 0) return false;
		return /^-?\d+(?:[.,]\d+)?%$/.test(element.textContent?.trim() ?? '');
	});
}

function createSaleTag(difference: Decimal, percentage: Decimal, currencyFormatter: Intl.NumberFormat, extraClass?: string) {
	const styling = {
		profit: {
			color: '#5bc27a',
			background: '#142a0e',
		},
		loss: {
			color: '#ff8095',
			background: '#3a0e0e',
		},
	};

	const { color, background } = percentage.gt(100) ? styling.loss : styling.profit;

	return html`
		<div class="${WAXPEER_SELECTORS.betterfloat.saleTag.slice(1)} ${extraClass?.slice(1) ?? ''}" style="background-color: ${background}; color: ${color};">
			${extensionSettings['wp-buffdifference'] ? html`<span>${difference.isPos() ? '+' : '-'}${currencyFormatter.format(difference.abs().toNumber())} </span>` : ''}
			${extensionSettings['wp-buffdifferencepercent'] ? html`<span>(${percentage.gt(150) ? percentage.toFixed(0) : percentage.toFixed(2)}%)</span>` : ''}
		</div>
	`;
}

async function getBuffItem(item: Waxpeer.Listing) {
	let source = (extensionSettings['wp-pricingsource'] as MarketSource) ?? MarketSource.Buff;
	const buff_item = createBuffItem(item);
	const buff_name = handleSpecialStickerNames(buff_item.name);
	let { priceListing, priceOrder } = await getBuffPrice(buff_name, buff_item.style, source);

	if (((!priceListing && !priceOrder) || (priceListing?.isZero() && priceOrder?.isZero())) && extensionSettings['wp-altmarket'] && extensionSettings['wp-altmarket'] !== MarketSource.None) {
		source = extensionSettings['wp-altmarket'] as MarketSource;
		const altPrices = await getBuffPrice(buff_name, buff_item.style, source);
		priceListing = altPrices.priceListing;
		priceOrder = altPrices.priceOrder;
	}
	const market_id = await getMarketID(buff_name, source);

	let itemPrice = getItemPrice(item);
	const userCurrency = getUserCurrency();
	const currencySymbol = getSymbolFromCurrency(userCurrency);
	const currencyRate = await getCurrencyToUsdRate(userCurrency);

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
		Number(extensionSettings['wp-pricereference']) === 0 &&
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

function getUserCurrency() {
	const storedCurrency = localStorage.getItem('currency');
	if (!storedCurrency) return 'USD';
	try {
		const parsedCurrency = JSON.parse(storedCurrency) as unknown;
		if (typeof parsedCurrency === 'string' && /^[A-Z]{3}$/i.test(parsedCurrency)) return parsedCurrency.toUpperCase();
	} catch (_) {
		// Waxpeer's legacy setting is an unquoted currency code.
	}
	return /^[A-Z]{3}$/i.test(storedCurrency) ? storedCurrency.toUpperCase() : 'USD';
}

function getItemPrice(item: Waxpeer.Listing) {
	return new Decimal(item.price).div(1000);
}

function createBuffItem(item: Waxpeer.Listing): { name: string; style: ItemStyle } {
	let name = item.name;
	if (name.startsWith('★') && !name.startsWith('★ ')) {
		name = name.replace('★', '★ ');
	}
	const buff_item = {
		name,
		style: '' as ItemStyle,
	};
	if (item.name.includes('Doppler')) {
		// Get and remove the phase from name
		const phase = (item.phase || item.name.split('Doppler')[1]?.split('(')[0]?.trim()) as DopplerPhase | undefined;
		if (!phase) return buff_item;
		buff_item.name = item.name.replace(` ${phase}`, '').trim();
		buff_item.style = phase;
	}
	return buff_item;
}

enum PageState {
	Market = 0,
	ItemPage = 1,
	Similar = 2,
	List = 3,
}

// mutation observer active?
let isObserverActive = false;
let extensionSettings: IStorage;

init();
