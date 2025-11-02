import { html } from 'common-tags';
import getSymbolFromCurrency from 'currency-symbol-map';
import Decimal from 'decimal.js';
import type { PlasmoCSConfig } from 'plasmo';
import type { DopplerPhase, ItemStyle } from '~lib/@typings/FloatTypes';
import type { Skinswap } from '~lib/@typings/SkinswapTypes';
import { getBitskinsCurrencyRate } from '~lib/handlers/cache/bitskins_cache';
import { getSkinswapItem, getSkinswapUserItem } from '~lib/handlers/cache/skinswap_cache';
import { activateHandler, initPriceMapping } from '~lib/handlers/eventhandler';
import { initSkinswap } from '~lib/handlers/history/skinswap_history';
import { getMarketID } from '~lib/handlers/mappinghandler';
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

	initSkinswap();

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

function firstLaunch() {
	// if (location.pathname === '/buy') {
	// 	setTimeout(() => {
	// 		const refreshButton = document
	// 			.querySelector(
	// 				'path[d="M4.037 2.56551C4.91406 1.97947 5.94521 1.66668 7.00004 1.66668C8.50073 1.66668 9.9412 2.26152 11.0267 3.30286L11.3906 3.66668H9.66671C9.29852 3.66668 9.00004 3.96515 9.00004 4.33334C9.00004 4.70153 9.29852 5.00001 9.66671 5.00001H13C13.09 5.00001 13.1758 4.98219 13.2541 4.94989C13.3332 4.91735 13.4072 4.86897 13.4714 4.80475C13.5935 4.68271 13.6583 4.52513 13.6659 4.36532C13.6665 4.35467 13.6667 4.34401 13.6667 4.33334V1.00001C13.6667 0.63182 13.3682 0.333344 13 0.333344C12.6319 0.333344 12.3334 0.63182 12.3334 1.00001V2.72386L11.9648 2.35527L11.9554 2.34607C10.6281 1.07015 8.85724 0.333344 7.00004 0.333344C5.6815 0.333344 4.39257 0.724337 3.29624 1.45688C2.19991 2.18942 1.34543 3.23061 0.840847 4.44879C0.336263 5.66696 0.20424 7.00741 0.461475 8.30061C0.71871 9.59382 1.35365 10.7817 2.286 11.7141C3.21835 12.6464 4.40624 13.2813 5.69944 13.5386C6.99265 13.7958 8.33309 13.6638 9.55127 13.1592C10.7694 12.6546 11.8106 11.8001 12.5432 10.7038C13.2757 9.60748 13.6667 8.31855 13.6667 7.00001C13.6667 6.63182 13.3682 6.33334 13 6.33334C12.6319 6.33334 12.3334 6.63182 12.3334 7.00001C12.3334 8.05484 12.0206 9.08599 11.4345 9.96305C10.8485 10.8401 10.0156 11.5237 9.04102 11.9274C8.06648 12.331 6.99413 12.4367 5.95956 12.2309C4.925 12.0251 3.97469 11.5171 3.22881 10.7712C2.48293 10.0254 1.97498 9.07506 1.76919 8.04049C1.5634 7.00593 1.66902 5.93357 2.07269 4.95903C2.47635 3.98449 3.15994 3.15154 4.037 2.56551Z"]'
	// 			)
	// 			?.closest<HTMLElement>('.rounded-4');
	// 		if (refreshButton) {
	// 			refreshButton.click();
	// 		}
	// 	}, 2000);
	// }
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
					const isSiteItem = addedNode.closest('.z-30')?.previousElementSibling?.id === 'middleTradeBar';
					for (const item of items) {
						await adjustItem(item, PageState.Market, isSiteItem);
					}
				} else if (addedNode.classList.contains('item-card')) {
					const isSiteItem = addedNode.closest('.z-30')?.previousElementSibling?.id === 'middleTradeBar';
					await adjustItem(addedNode, PageState.Market, isSiteItem);
				} else if (addedNode.firstElementChild?.classList.contains('item-card')) {
					const isSiteItem = addedNode.closest('.z-30')?.previousElementSibling?.id === 'middleTradeBar';
					await adjustItem(addedNode.firstElementChild, PageState.Market, isSiteItem);
				}
			}
		}
	});
	observer.observe(document, { childList: true, subtree: true });
}

function getAPIItem(container: Element, state: PageState, isSiteItem: boolean): Skinswap.Item | undefined {
	if (state === PageState.Market) {
		const itemName = container.querySelector('div.transform-gpu > img')?.getAttribute('alt');
		if (!itemName) return undefined;
		if (isSiteItem) {
			return getSkinswapItem(itemName);
		} else {
			return getSkinswapUserItem(itemName);
		}
	}
	return undefined;
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
