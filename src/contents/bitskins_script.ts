import { html } from 'common-tags';
import getSymbolFromCurrency from 'currency-symbol-map';
import Decimal from 'decimal.js';
import type { PlasmoCSConfig } from 'plasmo';
import type { Bitskins } from '~lib/@typings/BitskinsTypes';
import type { DopplerPhase, ItemStyle } from '~lib/@typings/FloatTypes';
import { getBitskinsCurrencyRate, getSpecificBitskinsItem } from '~lib/handlers/cache/bitskins_cache';
import { activateHandler, initPriceMapping } from '~lib/handlers/eventhandler';
import { getMarketID } from '~lib/handlers/mappinghandler';
import { MarketSource } from '~lib/util/globals';
import { CurrencyFormatter, getBuffPrice, handleSpecialStickerNames, isBuffBannedItem } from '~lib/util/helperfunctions';
import { type IStorage, getAllSettings } from '~lib/util/storage';
import { generatePriceLine } from '~lib/util/uigeneration';

export const config: PlasmoCSConfig = {
	matches: ['*://*.bitskins.com/*'],
	run_at: 'document_end',
	css: ['../css/hint.min.css', '../css/common_styles.css', '../css/bitskins_styles.css'],
};

type PriceResult = {
	price_difference: Decimal;
};

async function init() {
	console.time('[BetterFloat] Bitskins init timer');

	if (location.host !== 'bitskins.com') {
		return;
	}

	useAffiliate();

	// catch the events thrown by the script
	// this has to be done as first thing to not miss timed events
	activateHandler();

	extensionSettings = await getAllSettings();
	console.log('[BetterFloat] Extension settings:', extensionSettings);

	if (!extensionSettings['bs-enable']) return;

	await initPriceMapping(extensionSettings, 'bs');

	console.timeEnd('[BetterFloat] Bitskins init timer');

	// mutation observer is only needed once
	if (!isObserverActive) {
		isObserverActive = true;
		applyMutation();
		console.log('[BetterFloat] Mutation observer started');
	}
}

async function useAffiliate() {
    const logInDiv = document.querySelector('div.login');
    if (!logInDiv) return;

	const localAff = localStorage.getItem('affiliate');
	if (!localAff) {
		localStorage.setItem('affiliate', JSON.stringify('betterfloat'));
	}
}

function applyMutation() {
	const observer = new MutationObserver(async (mutations) => {
		for (const mutation of mutations) {
			for (let i = 0; i < mutation.addedNodes.length; i++) {
				const addedNode = mutation.addedNodes[i];
				// some nodes are not elements, so we need to check
				if (!(addedNode instanceof HTMLElement)) continue;
				// console.debug('[Plasmo] Mutation detected:', addedNode);

				if (addedNode.className === 'market-items') {
					const items = addedNode.querySelectorAll('.item');
                    for (const item of items) {
                        adjustItem(item, PageState.Market);
                    }
				} else if (addedNode.classList.contains('item')) {
                    // adjustItem(addedNode, PageState.Market);
                }
			}
		}
	});
	observer.observe(document, { childList: true, subtree: true });
}

async function adjustItem(container: Element, state: PageState) {
    const itemID = container.querySelector('a.item-content')?.getAttribute('href')?.split('/')[3];
    if (!itemID) return;
	let item = getSpecificBitskinsItem(itemID);

    let tries = 10;
	while (!item && tries-- > 0) {
        await new Promise((resolve) => setTimeout(resolve, 200));
        item = getSpecificBitskinsItem(itemID);
	}
    if (!item) return;

	// eslint-disable-next-line @typescript-eslint/no-unused-vars
	const priceResult = await addBuffPrice(item, container, state);
}

async function addBuffPrice(item: Bitskins.Item, container: Element, state: PageState): Promise<PriceResult> {
	const { source, itemStyle, itemPrice, buff_name, market_id, priceListing, priceOrder, priceFromReference, difference, currency } = await getBuffItem(item);

	let footerContainer: Element | null = null;
	if (state === PageState.Market) {
		footerContainer = container.querySelector('.ref-price');
	} else if (state === PageState.Inventory) {
		footerContainer = container.querySelector('.goods-item-info');
	}

	const isDoppler = buff_name.includes('Doppler') && buff_name.includes('|');
	const maximumFractionDigits = priceListing?.gt(1000) && state !== PageState.ItemPage ? 0 : 2;
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
			iconHeight: '20px',
		});
		footerContainer.outerHTML = buffContainer;
	}

	let discountContainer: Element | null = null;
	if (state === PageState.Market) {
		discountContainer = container.querySelector('div.price > div.discount');
        if (!discountContainer) {
            const newContainer = document.createElement('div');
            newContainer.classList.add('discount');
            container.querySelector('div.price > div.amount')?.before(newContainer);
            discountContainer = newContainer;
        }
	}

	if (discountContainer && !container.querySelector('.betterfloat-sale-tag') && (extensionSettings['bs-buffdifference'] || extensionSettings['bs-buffdifferencepercent'])) {
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

		const absDifference = difference.abs();
		const percentage = itemPrice.div(priceFromReference ?? 1).mul(100);
		const { color, background } = percentage.gt(100) ? styling.loss : styling.profit;

		const buffPriceHTML = html`
            <div class="discount flex betterfloat-sale-tag" style="background-color: ${background}; color: ${color};">
				${extensionSettings['bs-buffdifference'] ? html`<span>${difference.isPos() ? '+' : '-'}${currencyFormatter.format(absDifference.toNumber())} </span>` : ''}
				${extensionSettings['bs-buffdifferencepercent'] ? html`<span>(${percentage.gt(150) ? percentage.toFixed(0) : percentage.toFixed(2)}%)</span>` : ''}
            </div>
        `;

		discountContainer.outerHTML = buffPriceHTML;
	}

	return {
		price_difference: difference,
	};
}

async function getBuffItem(item: Bitskins.Item) {
	let source = (extensionSettings['bs-pricingsource'] as MarketSource) ?? MarketSource.Buff;
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

	let itemPrice = getItemPrice(item);
	const userCurrency = getUserCurrency();
	const currencySymbol = getSymbolFromCurrency(userCurrency);
	const currencyRate = getBitskinsCurrencyRate(userCurrency);

	if (currencyRate && currencyRate !== 1) {
		if (priceListing) {
			priceListing = priceListing.mul(currencyRate);
		}
		if (priceOrder) {
			priceOrder = priceOrder.mul(currencyRate);
		}
		itemPrice = itemPrice.mul(currencyRate);
	}

	const referencePrice = parseInt(extensionSettings['bs-referenceprice']) === 0 ? priceOrder : priceListing;
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

function getItemPrice(item: Bitskins.Item) {
	return new Decimal(item.price).div(1000);
}

function createBuffItem(item: Bitskins.Item): { name: string; style: ItemStyle } {
	const buff_item = {
		name: item.name,
		style: '' as ItemStyle,
	};
	if (item.phase_id && item.name.includes('Doppler')) {
        // Get and remove the phase from name
        const phase = item.name.split('Doppler')[1].split('(')[0].trim() as DopplerPhase;
        buff_item.name = item.name.replace(` ${phase}`, '').trim();
        buff_item.style = phase;
	}
	return {
		name: buff_item.name,
		style: buff_item.style,
	};
}

enum PageState {
	Market = 0,
	ItemPage = 1,
	Inventory = 2,
}

// mutation observer active?
let isObserverActive = false;
let extensionSettings: IStorage;

init();
