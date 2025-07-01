import { html } from 'common-tags';
import getSymbolFromCurrency from 'currency-symbol-map';
import Decimal from 'decimal.js';
import type { PlasmoCSConfig } from 'plasmo';
import type { DopplerPhase, ItemStyle } from '~lib/@typings/FloatTypes';
import { activateHandler, initPriceMapping } from '~lib/handlers/eventhandler';
import { getMarketID } from '~lib/handlers/mappinghandler';
import { MarketSource } from '~lib/util/globals';
import { CurrencyFormatter, checkUserPlanPro, getBuffPrice, handleSpecialStickerNames, isUserPro } from '~lib/util/helperfunctions';
import { getAllSettings, type IStorage } from '~lib/util/storage';
import { generatePriceLine } from '~lib/util/uigeneration';

export const config: PlasmoCSConfig = {
	matches: ['*://*.market.csgo.com/*'],
	run_at: 'document_end',
	css: ['../css/hint.min.css', '../css/common_styles.css', '../css/marketcsgo_styles.css'],
};

type PriceResult = {
	price_difference: Decimal;
};

async function init() {
	console.time('[BetterFloat] MarketCSGO init timer');

	if (location.host !== 'market.csgo.com') {
		return;
	}

	// catch the events thrown by the script
	// this has to be done as first thing to not miss timed events
	activateHandler();

	extensionSettings = await getAllSettings();

	if (!extensionSettings['mcsgo-enable']) return;

	// check if user has the required plan
	if (!(await checkUserPlanPro(extensionSettings['user']))) {
		console.log('[BetterFloat] Pro plan required for MarketCSGO features');
		return;
	}

	await initPriceMapping(extensionSettings, 'mcsgo');

	console.timeEnd('[BetterFloat] MarketCSGO init timer');

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
				// console.debug('[BetterFloat] Mutation detected:', addedNode);

				if (addedNode.classList.contains('item-container')) {
					await adjustItem(addedNode.closest('a[title]')!, PageState.Market);
				} else if (addedNode.classList.contains('item-base-info')) {
					await adjustItem(addedNode.closest('.item-info')!, PageState.ItemPage);
				}
			}
		}
	});
	observer.observe(document, { childList: true, subtree: true });
}

function getItemName(container: Element, state: PageState) {
	if (state === PageState.Market) {
		return container.getAttribute('title');
	} else if (state === PageState.ItemPage) {
		return container.querySelector('h1.name > span')?.getAttribute('data-hash');
	}
}

async function adjustItem(container: Element, state: PageState) {
	const itemName = getItemName(container, state);
	if (!itemName) return;
	// console.log('[BetterFloat] Item Name:', itemName);

	const _priceResult = await addBuffPrice(itemName, container, state);
}

async function addBuffPrice(itemName: string, container: Element, state: PageState): Promise<PriceResult> {
	const { source, itemStyle, itemPrice, buff_name, market_id, priceListing, priceOrder, priceFromReference, difference, currency } = await getBuffItem(itemName, container, state);

	let footerContainer: HTMLElement | null = null;
	if (state === PageState.ItemPage) {
		footerContainer = container.querySelector<HTMLElement>('app-page-inventory-price .price');
	} else if (state === PageState.Market) {
		footerContainer = container.querySelector<HTMLElement>('.price');
	}

	const isItemPage = state === PageState.ItemPage;
	const isDoppler = buff_name.includes('Doppler') && buff_name.includes('|');
	const maximumFractionDigits = state === PageState.List || (priceListing?.gt(1000) && state !== PageState.ItemPage) ? 0 : 2;
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
			isPopout: isItemPage,
			addSpaceBetweenPrices: true,
			showPrefix: isItemPage,
			iconHeight: isItemPage ? '20px' : '18px',
			hasPro: isUserPro(extensionSettings['user']),
			tooltipArrow: true,
		});
		if (state === PageState.Market) {
			footerContainer.insertAdjacentHTML('afterend', buffContainer);
		} else if (state === PageState.ItemPage) {
			footerContainer.parentElement?.insertAdjacentHTML('afterend', buffContainer);
		}
	}

	if (footerContainer && !container.querySelector('.betterfloat-sale-tag') && (extensionSettings['mcsgo-buffdifference'] || extensionSettings['mcsgo-buffdifferencepercent'])) {
		const spans = Array.from(footerContainer.querySelectorAll('span'));
		if (spans.length === 2) {
			// remove second span
			spans[1].remove();
		}
		footerContainer.insertAdjacentHTML('beforeend', createSaleTag(difference, itemPrice.div(priceFromReference ?? 1).mul(100), currencyFormatter, isItemPage));
	}

	return {
		price_difference: difference,
	};
}

function createSaleTag(difference: Decimal, percentage: Decimal, currencyFormatter: Intl.NumberFormat, isItemPage: boolean) {
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
		<div class="betterfloat-sale-tag ${isItemPage ? 'betterfloat-sale-tag-big' : ''}" style="background-color: ${background}; color: ${color};">
			${extensionSettings['mcsgo-buffdifference'] ? html`<span>${difference.isPos() ? '+' : '-'}${currencyFormatter.format(difference.abs().toNumber())} </span>` : ''}
			${extensionSettings['mcsgo-buffdifferencepercent'] ? html`<span>(${percentage.gt(150) ? percentage.toFixed(0) : percentage.toFixed(2)}%)</span>` : ''}
		</div>
	`;
}

async function getBuffItem(itemName: string, container: Element, state: PageState) {
	let source = (extensionSettings['mcsgo-pricingsource'] as MarketSource) ?? MarketSource.Buff;
	const buff_item = createBuffItem(itemName, container, state);
	const buff_name = handleSpecialStickerNames(buff_item.name);
	let { priceListing, priceOrder } = await getBuffPrice(buff_name, buff_item.style, source);

	if (((!priceListing && !priceOrder) || (priceListing?.isZero() && priceOrder?.isZero())) && extensionSettings['mcsgo-altmarket'] && extensionSettings['mcsgo-altmarket'] !== MarketSource.None) {
		source = extensionSettings['mcsgo-altmarket'] as MarketSource;
		const altPrices = await getBuffPrice(buff_name, buff_item.style, source);
		priceListing = altPrices.priceListing;
		priceOrder = altPrices.priceOrder;
	}
	const market_id = await getMarketID(buff_name, source);

	let itemPrice = getItemPrice(container);
	const userCurrency = getUserCurrency();
	const currencySymbol = getSymbolFromCurrency(userCurrency);
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
		Number(extensionSettings['mcsgo-pricereference']) === 0 &&
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
	return JSON.parse(localStorage.getItem('FiltersFILTERS-en') ?? '{}').currencies.current || 'USD';
}

function getItemPrice(container: Element) {
	return new Decimal(container.querySelector('.price > span')?.textContent?.trim().slice(1)?.replace(',', '') ?? '0');
}

function createBuffItem(itemName: string, container: Element, state: PageState): { name: string; style: ItemStyle } {
	let phase: string | undefined;
	if (state === PageState.Market) {
		phase = container.querySelector('.phase > span')?.textContent?.trim();
	} else if (state === PageState.ItemPage) {
		phase = Array.from(container.querySelectorAll('h4.desc'))
			.find((h4) => h4.textContent?.trim() === 'Phase')
			?.nextElementSibling?.textContent?.trim();
	}

	const buff_item = {
		name: itemName,
		style: phase ? (`Phase ${phase.replace('phase', '')}` as ItemStyle) : '',
	};
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
