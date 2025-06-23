import { html } from 'common-tags';
import getSymbolFromCurrency from 'currency-symbol-map';
import Decimal from 'decimal.js';
import type { PlasmoCSConfig } from 'plasmo';
import type { DopplerPhase, ItemStyle } from '~lib/@typings/FloatTypes';
import type { Skinsmonkey } from '~lib/@typings/Skinsmonkey';
import { getBitskinsCurrencyRate } from '~lib/handlers/cache/bitskins_cache';
import { getFirstSkinsmonkeyBotItem, getFirstSkinsmonkeyUserItem } from '~lib/handlers/cache/skinsmonkey_cache';
import { activateHandler, initPriceMapping } from '~lib/handlers/eventhandler';
import { getMarketID } from '~lib/handlers/mappinghandler';
import { SKINSMONKEY_SELECTORS } from '~lib/handlers/selectors/skinsmonkey_selectors';
import { MarketSource } from '~lib/util/globals';
import { CurrencyFormatter, checkUserPlanPro, getBuffPrice, handleSpecialStickerNames, isBuffBannedItem, isUserPro } from '~lib/util/helperfunctions';
import { getAllSettings, type IStorage } from '~lib/util/storage';
import { generatePriceLine } from '~lib/util/uigeneration';

export const config: PlasmoCSConfig = {
	matches: ['*://*.skinsmonkey.com/*'],
	run_at: 'document_end',
	css: ['../css/hint.min.css', '../css/common_styles.css', '../css/skinsmonkey_styles.css'],
};

type PriceResult = {
	price_difference: Decimal;
};

async function init() {
	console.time('[BetterFloat] Skinsmonkey init timer');

	if (location.host !== 'skinsmonkey.com') {
		return;
	}

	// catch the events thrown by the script
	// this has to be done as first thing to not miss timed events
	activateHandler();

	extensionSettings = await getAllSettings();

	if (!extensionSettings['sm-enable']) return;

	// check if user has the required plan
	if (!(await checkUserPlanPro(extensionSettings['user']))) {
		console.log('[BetterFloat] Pro plan required for Skinsmonkey features');
		return;
	}

	await initPriceMapping(extensionSettings, 'sm');

	console.timeEnd('[BetterFloat] Skinsmonkey init timer');

	// mutation observer is only needed once
	if (!isObserverActive) {
		isObserverActive = true;
		applyMutation();
		console.log('[BetterFloat] Mutation observer started');
	}

    await firstLaunch();
}

async function firstLaunch() {
    await new Promise((resolve) => setTimeout(resolve, 1000));

    const items = document.querySelectorAll(`.${SKINSMONKEY_SELECTORS.item.card}`);
    for (const item of items) {
        const isUser = item.closest(SKINSMONKEY_SELECTORS.item.tradeInventory)?.getAttribute(SKINSMONKEY_SELECTORS.attributes.dataInventory) === SKINSMONKEY_SELECTORS.attributes.userInventory;
        await adjustItem(item, PageState.Market, isUser);
    }
}

function applyMutation() {
	const observer = new MutationObserver(async (mutations) => {
		for (const mutation of mutations) {
			for (let i = 0; i < mutation.addedNodes.length; i++) {
				const addedNode = mutation.addedNodes[i];
				// some nodes are not elements, so we need to check
				if (!(addedNode instanceof HTMLElement)) continue;
				console.debug('[BetterFloat] Skinsmonkey Mutation detected:', addedNode);

				if (addedNode.className === SKINSMONKEY_SELECTORS.item.card) {
                    // options: USER, SITE
                    const isUser = addedNode.closest(SKINSMONKEY_SELECTORS.item.tradeInventory)?.getAttribute(SKINSMONKEY_SELECTORS.attributes.dataInventory) === SKINSMONKEY_SELECTORS.attributes.userInventory;
					await adjustItem(addedNode, PageState.Market, isUser);
				}
			}
		}
	});
	observer.observe(document, { childList: true, subtree: true });
}

function getAPIItem(isUser: boolean) {
	if (isUser) {
		return getFirstSkinsmonkeyUserItem();
	} else {
		return getFirstSkinsmonkeyBotItem();
	}
}

async function adjustItem(container: Element, state: PageState, isUser: boolean) {
	let item = getAPIItem(isUser);

	let tries = 10;
	while (!item && tries-- > 0) {
		await new Promise((resolve) => setTimeout(resolve, 200));
		item = getAPIItem(isUser);
	}
	// console.log('[BetterFloat] Skinsmonkey item:', item);
	if (!item) return;

	// eslint-disable-next-line @typescript-eslint/no-unused-vars
	const _priceResult = await addBuffPrice(item, container, state);

	// store item in html
	// container.setAttribute('data-betterfloat', JSON.stringify(item));
}

async function addBuffPrice(item: Skinsmonkey.Item, container: Element, state: PageState): Promise<PriceResult> {
	const { source, itemStyle, itemPrice, buff_name, market_id, priceListing, priceOrder, priceFromReference, difference, currency } = await getBuffItem(item);

	let footerContainer = container.querySelector(SKINSMONKEY_SELECTORS.item.cardBottom);

	const isDoppler = item.item.details.skin.includes('Doppler');
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

	let priceContainer = container.querySelector(SKINSMONKEY_SELECTORS.item.price);

	if (
		priceContainer &&
		!container.querySelector('.betterfloat-sale-tag') &&
		(extensionSettings['sm-buffdifference'] || extensionSettings['sm-buffdifferencepercent'])
	) {
		priceContainer.insertAdjacentHTML('afterend', createSaleTag(difference, itemPrice.div(priceFromReference ?? 1).mul(100), currencyFormatter));

        (priceContainer.parentElement as HTMLElement).style.justifyContent = 'flex-start';
	}

	return {
		price_difference: difference,
	};
}

function createSaleTag(difference: Decimal, percentage: Decimal, currencyFormatter: Intl.NumberFormat) {
	const styling = {
		profit: {
			color: 'var(--main-green)',
			background: '#30d15829',
		},
		loss: {
			color: '#ff8095',
			background: '#3a0e0e',
		},
	};

	const { color, background } = percentage.gt(100) ? styling.loss : styling.profit;

	return html`
		<div class="discount flex betterfloat-sale-tag" style="background-color: ${background}; color: ${color};">
			${extensionSettings['av-buffdifference'] ? html`<span>${difference.isPos() ? '+' : '-'}${currencyFormatter.format(difference.abs().toNumber())} </span>` : ''}
			${extensionSettings['av-buffdifferencepercent'] ? html`<span>(${percentage.gt(150) ? percentage.toFixed(0) : percentage.toFixed(2)}%)</span>` : ''}
		</div>
	`;
}

async function getBuffItem(item: Skinsmonkey.Item) {
	let source = (extensionSettings['av-pricingsource'] as MarketSource) ?? MarketSource.Buff;
	const buff_item = createBuffItem(item);
	const buff_name = handleSpecialStickerNames(buff_item.name);
	let { priceListing, priceOrder } = await getBuffPrice(buff_name, buff_item.style, source);

	if (source === MarketSource.Buff && isBuffBannedItem(buff_name)) {
		priceListing = new Decimal(0);
		priceOrder = new Decimal(0);
	}

	if (((!priceListing && !priceOrder) || (priceListing?.isZero() && priceOrder?.isZero())) && extensionSettings['av-altmarket'] && extensionSettings['av-altmarket'] !== MarketSource.None) {
		source = extensionSettings['av-altmarket'] as MarketSource;
		const altPrices = await getBuffPrice(buff_name, buff_item.style, source);
		priceListing = altPrices.priceListing;
		priceOrder = altPrices.priceOrder;
	}
	const market_id = getMarketID(buff_name, source);

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
		Number(extensionSettings['av-pricereference']) === 0 && ([MarketSource.Buff, MarketSource.Steam].includes(source) || (MarketSource.YouPin === source && isUserPro(extensionSettings['user'])))
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

function getItemPrice(item: Skinsmonkey.Item) {
	return new Decimal(item.item.price).div(100);
}

function createBuffItem(item: Skinsmonkey.Item): { name: string; style: ItemStyle } {
	const buff_item = {
		name: item.item.marketName,
		style: '' as ItemStyle,
	};
	if (item.item.details.skin.includes('Doppler')) {
		const phase = item.item.details.skin.split('Doppler ')[1];
		buff_item.style = phase as ItemStyle;
        buff_item.name = item.item.marketName.replace(` ${phase}`, '');
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
