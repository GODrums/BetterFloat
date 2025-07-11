import { sendToBackground } from '@plasmohq/messaging';
import { html } from 'common-tags';
import getSymbolFromCurrency from 'currency-symbol-map';
import Decimal from 'decimal.js';
import type { PlasmoCSConfig } from 'plasmo';
import type { DopplerPhase, ItemStyle } from '~lib/@typings/FloatTypes';
import type { Skinswap } from '~lib/@typings/SkinswapTypes';
import { getBitskinsCurrencyRate } from '~lib/handlers/cache/bitskins_cache';
import { getFirstSkinswapItem, getFirstSkinswapUserItem } from '~lib/handlers/cache/skinswap_cache';
import { activateHandler, initPriceMapping } from '~lib/handlers/eventhandler';
import { getMarketID } from '~lib/handlers/mappinghandler';
import { SKINOUT_SELECTORS } from '~lib/handlers/selectors/skinout_selectors';
import { MarketSource } from '~lib/util/globals';
import { CurrencyFormatter, checkUserPlanPro, getBuffPrice, handleSpecialStickerNames, isUserPro } from '~lib/util/helperfunctions';
import { getAllSettings, type IStorage } from '~lib/util/storage';
import { generatePriceLine } from '~lib/util/uigeneration';

export const config: PlasmoCSConfig = {
	matches: ['*://*.skinswap.com/*'],
	run_at: 'document_end',
	css: ['../css/hint.min.css', '../css/common_styles.css', '../css/skinswap_styles.css'],
};

type PriceResult = {
	price_difference: Decimal;
};

async function init() {
	console.time('[BetterFloat] Skinswap init timer');

	if (location.host !== 'skinswap.com') {
		return;
	}

	replaceHistory();

	// catch the events thrown by the script
	// this has to be done as first thing to not miss timed events
	activateHandler();

	extensionSettings = await getAllSettings();

	if (!extensionSettings['ss-enable']) return;

	// check if user has the required plan
	if (!(await checkUserPlanPro(extensionSettings['user']))) {
		console.log('[BetterFloat] Pro plan required for Skinswap features');
		return;
	}

	await initPriceMapping(extensionSettings, 'ss');

	console.timeEnd('[BetterFloat] Skinswap init timer');

	// mutation observer is only needed once
	if (!isObserverActive) {
		isObserverActive = true;
		applyMutation();
		console.log('[BetterFloat] Mutation observer started');
	}

	firstLaunch();
}

async function replaceHistory() {
	// wait for the page to load
	const loggedOut = await new Promise((resolve) => {
		const interval = setInterval(() => {
			if (document.querySelector('a[href="https://api.skinswap.com/api/auth/login"]') || document.querySelector('img[alt="User profile image"]')) {
				clearInterval(interval);
				resolve(!!document.querySelector('a[href="https://api.skinswap.com/api/auth/login"]'));
			}
		}, 100);
	});

	if (loggedOut) {
		sendToBackground({
			name: 'openTab',
			body: {
				url: 'https://skinswap.com/r/betterfloat',
			},
		});
	}
}

function firstLaunch() {
	// setTimeout(() => {
	// 	const refreshButton = document.querySelector<HTMLButtonElement>(location.pathname.includes('market') ? SKINOUT_SELECTORS.filters.refreshButton : '#skins_refresh_btn');
	// 	if (refreshButton) {
	// 		refreshButton.click();
	// 	}
	// }, 2000);
}

function applyMutation() {
	const observer = new MutationObserver(async (mutations) => {
		for (const mutation of mutations) {
			for (let i = 0; i < mutation.addedNodes.length; i++) {
				const addedNode = mutation.addedNodes[i];
				// some nodes are not elements, so we need to check
				if (!(addedNode instanceof HTMLElement)) continue;
				// console.debug('[BetterFloat] Skinswap Mutation detected:', addedNode);

				if (addedNode.parentElement?.classList.contains('gridBox')) {
					const items = addedNode.querySelectorAll('.item-card');
					console.log('[BetterFloat] Skinswap Mutation detected:', items);
					const isSiteItem = addedNode.closest('.z-30')?.previousElementSibling?.id === 'middleTradeBar';
					for (const item of items) {
						await adjustItem(item, PageState.Market, isSiteItem);
					}
				}
			}
		}
	});
	observer.observe(document, { childList: true, subtree: true });
}

function getAPIItem(container: Element, state: PageState, isSiteItem: boolean): Skinswap.Item | null {
	if (state === PageState.Market) {
		return (isSiteItem ? getFirstSkinswapItem() : getFirstSkinswapUserItem()) || null;
	}
	return null;
}

async function adjustItem(container: Element, state: PageState, isSiteItem: boolean) {
	let item = getAPIItem(container, state, isSiteItem);

	let tries = 10;
	while (!item && tries-- > 0) {
		await new Promise((resolve) => setTimeout(resolve, 200));
		item = getAPIItem(container, state, isSiteItem);
	}
	// console.log('[BetterFloat] Skinout item:', item);
	if (!item) return;

	const _priceResult = await addBuffPrice(item, container);
}

async function addBuffPrice(item: Skinswap.Item, container: Element): Promise<PriceResult> {
	const { source, itemStyle, itemPrice, buff_name, market_id, priceListing, priceOrder, priceFromReference, difference, currency } = await getBuffItem(item);

	const footerContainer = container.querySelector('.hover-translatey-40');

	const isDoppler = !!item.qualities.doppler_phase;
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
	}

	const priceContainer = footerContainer?.querySelector('.font-header');

	if (priceContainer && !container.querySelector('.betterfloat-sale-tag') && (extensionSettings['ss-buffdifference'] || extensionSettings['ss-buffdifferencepercent'])) {
		priceContainer.insertAdjacentHTML('afterend', createSaleTag(difference, itemPrice.div(priceFromReference ?? 1).mul(100), currencyFormatter, itemPrice.lt(100)));
	}

	return {
		price_difference: difference,
	};
}

function createSaleTag(difference: Decimal, percentage: Decimal, currencyFormatter: Intl.NumberFormat, isLowPrice: boolean) {
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
		<div class="betterfloat-sale-tag" style="background-color: ${background}; color: ${color}; ${isLowPrice ? 'flex-direction: row;' : ''}">
			${extensionSettings['ss-buffdifference'] ? html`<span>${difference.isPos() ? '+' : '-'}${currencyFormatter.format(difference.abs().toNumber())} </span>` : ''}
			${extensionSettings['ss-buffdifferencepercent'] ? html`<span>(${percentage.gt(150) ? percentage.toFixed(0) : percentage.toFixed(2)}%)</span>` : ''}
		</div>
	`;
}

async function getBuffItem(item: Skinswap.Item) {
	let source = (extensionSettings['ss-pricingsource'] as MarketSource) ?? MarketSource.Buff;
	const buff_item = createBuffItem(item);
	const buff_name = handleSpecialStickerNames(buff_item.name);
	let { priceListing, priceOrder } = await getBuffPrice(buff_name, buff_item.style, source);

	if (((!priceListing && !priceOrder) || (priceListing?.isZero() && priceOrder?.isZero())) && extensionSettings['ss-altmarket'] && extensionSettings['ss-altmarket'] !== MarketSource.None) {
		source = extensionSettings['ss-altmarket'] as MarketSource;
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
		Number(extensionSettings['ss-pricereference']) === 0 && ([MarketSource.Buff, MarketSource.Steam].includes(source) || (MarketSource.YouPin === source && isUserPro(extensionSettings['user'])))
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

function getItemPrice(item: Skinswap.Item): Decimal {
	return new Decimal(item.price.trade).div(100);
}

function createBuffItem(item: Skinswap.Item): { name: string; style: ItemStyle } {
	const buff_item = {
		name: item.market_hash_name,
		style: '' as ItemStyle,
	};
	if (item.qualities.doppler_phase) {
		const phase = item.qualities.doppler_phase;
		buff_item.style = phase as ItemStyle;
		buff_item.name = item.market_hash_name.replace(` ${phase}`, '');
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
