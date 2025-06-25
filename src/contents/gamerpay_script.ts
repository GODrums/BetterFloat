import { html } from 'common-tags';
import getSymbolFromCurrency from 'currency-symbol-map';
import Decimal from 'decimal.js';
import type { PlasmoCSConfig } from 'plasmo';
import type { DopplerPhase, ItemStyle } from '~lib/@typings/FloatTypes';
import type { Gamerpay } from '~lib/@typings/GamerpayTypes';
import { initPriceMapping } from '~lib/handlers/eventhandler';
import { getMarketID } from '~lib/handlers/mappinghandler';
import { MarketSource } from '~lib/util/globals';
import { CurrencyFormatter, getBuffPrice, handleSpecialStickerNames, isBuffBannedItem, isUserPro } from '~lib/util/helperfunctions';
import { getAllSettings, type IStorage } from '~lib/util/storage';
import { generatePriceLine } from '~lib/util/uigeneration';

export const config: PlasmoCSConfig = {
	matches: ['*://*.gamerpay.gg/*'],
	run_at: 'document_end',
	css: ['../css/hint.min.css', '../css/common_styles.css', '../css/gamerpay_styles.css'],
};

async function init() {
	console.time('[BetterFloat] Gamerpay init timer');

	if (location.host !== 'gamerpay.gg') {
		return;
	}

	extensionSettings = await getAllSettings();
	console.log('[BetterFloat] Extension settings:', extensionSettings);

	if (!extensionSettings['gp-enable']) return;

	await initPriceMapping(extensionSettings, 'gp');

	// Set up event listener for React data ready events from the injected script
	document.addEventListener('betterfloat-data-ready', async (event) => {
		const target = event.target as HTMLElement;
		const props = (event as CustomEvent).detail.props;
		if (target?.className?.includes('ItemCard_wrapper')) {
			await adjustItem(target, props);
		}
	});

	console.timeEnd('[BetterFloat] Gamerpay init timer');
}

async function adjustItem(container: Element, props: string) {
	if (!props || props.length < 1 || props === '{}') {
		console.warn('[BetterFloat] No React data available for item card');
		return;
	}

	let itemData: Gamerpay.ReactItem;
	try {
		itemData = JSON.parse(props) as Gamerpay.ReactItem;
	} catch (error) {
		console.error('[BetterFloat] Error parsing item data:', error);
		return;
	}

	await addBuffPrice(itemData, container);
}

async function addBuffPrice(reactItem: Gamerpay.ReactItem, container: Element) {
	const item = reactItem.item;
	const { source, itemStyle, itemPrice, buff_name, market_id, priceListing, priceOrder, priceFromReference, difference, currency } = await getBuffItem(item);

	const footerContainer = container.querySelector<HTMLElement>('div[class*="ItemCardBody_priceContainer__"]');

	const isItemPage = false;
	const isDoppler = buff_name.includes('Doppler') && buff_name.includes('|');
	const currencyFormatter = CurrencyFormatter(currency.text ?? 'USD');

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
			hasPro: isUserPro(extensionSettings['user']),
			tooltipArrow: true,
		});
		footerContainer.firstElementChild?.insertAdjacentHTML('afterend', buffContainer);

		const buffElement = footerContainer?.querySelector<HTMLAnchorElement>('.betterfloat-buff-a');
		if (buffElement) {
			buffElement.addEventListener('click', (e) => {
				e.preventDefault();
				e.stopPropagation();
				window.open(buffElement.href, '_blank');
			});
		}
	}

	const discountContainer = container.querySelector('div[class*="ItemCardBody_pricePrimary__"]');

	if (discountContainer && !container.querySelector('.betterfloat-sale-tag') && (extensionSettings['gp-buffdifference'] || extensionSettings['gp-buffdifferencepercent'])) {
		discountContainer.insertAdjacentHTML('afterend', createSaleTag(difference, itemPrice.div(priceFromReference ?? 1).mul(100), currencyFormatter));

		(discountContainer.parentElement as HTMLElement).style.display = 'flex';
		(discountContainer.parentElement as HTMLElement).style.alignItems = 'center';
		(discountContainer.parentElement as HTMLElement).style.gap = '8px';

		const oldDiscountContainer = container.querySelector('span[class*="ItemCardBody_savings__"]');
		if (oldDiscountContainer) {
			oldDiscountContainer.remove();
		}
	}

	return {
		price_difference: difference,
	};
}

async function getBuffItem(item: Gamerpay.Item) {
	let source = (extensionSettings['gp-pricingsource'] as MarketSource) ?? MarketSource.Buff;
	const buff_item = createBuffItem(item);
	const buff_name = handleSpecialStickerNames(buff_item.name);
	let { priceListing, priceOrder } = await getBuffPrice(buff_name, buff_item.style, source);

	if (source === MarketSource.Buff && isBuffBannedItem(buff_name)) {
		priceListing = new Decimal(0);
		priceOrder = new Decimal(0);
	}

	if (((!priceListing && !priceOrder) || (priceListing?.isZero() && priceOrder?.isZero())) && extensionSettings['gp-altmarket'] && extensionSettings['gp-altmarket'] !== MarketSource.None) {
		source = extensionSettings['gp-altmarket'] as MarketSource;
		const altPrices = await getBuffPrice(buff_name, buff_item.style, source);
		priceListing = altPrices.priceListing;
		priceOrder = altPrices.priceOrder;
	}
	const market_id = await getMarketID(buff_name, source);

	let itemPrice = new Decimal(item.price).div(100);
	const userCurrency = getUserCurrency();
	const currencySymbol = getSymbolFromCurrency(userCurrency);
	// const currencyRate = getGamerpayCurrencyRate(userCurrency);
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
		Number(extensionSettings['gp-pricereference']) === 0 && ([MarketSource.Buff, MarketSource.Steam].includes(source) || (MarketSource.YouPin === source && isUserPro(extensionSettings['user'])))
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

function createSaleTag(difference: Decimal, percentage: Decimal, currencyFormatter: Intl.NumberFormat) {
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
		<div class="betterfloat-sale-tag" style="background-color: ${background}; color: ${color};">
			${extensionSettings['gp-buffdifference'] ? html`<span>${difference.isPos() ? '+' : '-'}${currencyFormatter.format(difference.abs().toNumber())} </span>` : ''}
			${extensionSettings['gp-buffdifferencepercent'] ? html`<span>(${percentage.gt(150) ? percentage.toFixed(0) : percentage.toFixed(2)}%)</span>` : ''}
		</div>
	`;
}

function getUserCurrency() {
	return 'USD';
}

function createBuffItem(item: Gamerpay.Item) {
	const marketHashName = item.marketHashName ?? item.name;
	let itemStyle = '' as ItemStyle;
	if (item.wearName === 'Vanilla') {
		itemStyle = 'Vanilla';
	}
	return {
		name: marketHashName,
		style: itemStyle,
	};
}

let extensionSettings: IStorage;

init();
