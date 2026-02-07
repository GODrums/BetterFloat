import { html } from 'common-tags';
import getSymbolFromCurrency from 'currency-symbol-map';
import Decimal from 'decimal.js';
import type { PlasmoCSConfig } from 'plasmo';
import type { DopplerPhase, ItemStyle } from '~lib/@typings/FloatTypes';
import type { Gamerpay } from '~lib/@typings/GamerpayTypes';
import { initPriceMapping } from '~lib/handlers/eventhandler';
import { getMarketID, initMarketIdMapping } from '~lib/handlers/mappinghandler';
import { GAMERPAY_SELECTORS } from '~lib/handlers/selectors/gamerpay_selectors';
import { dynamicUIHandler } from '~lib/handlers/urlhandler';
import { AskBidMarkets, MarketSource } from '~lib/util/globals';
import { CurrencyFormatter, checkUserPlanPro, getBuffPrice, getSPBackgroundColor, handleSpecialStickerNames, isUserPro } from '~lib/util/helperfunctions';
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

	if (!extensionSettings['gp-enable']) return;

	// check if user has the required plan
	if (!(await checkUserPlanPro(extensionSettings['user']))) {
		console.log('[BetterFloat] Pro plan required for Gamerpay features');
		return;
	}

	await initPriceMapping(extensionSettings, 'gp');

	await initMarketIdMapping();

	// Set up event listener for React data ready events from the injected script
	document.addEventListener('betterfloat-data-ready', async (event) => {
		const target = event.target as HTMLElement;
		const type = (event as CustomEvent).detail.type;
		const props = (event as CustomEvent).detail.props;
		if (type === 'card') {
			await adjustItem(target, props);
		} else if (type === 'page') {
			await adjustItemPage(target, props);
		}
	});

	// may lead to currency rate changes not being loaded in time, but it's fine...
	currencyRates = await getCurrencyRates();

	dynamicUIHandler();

	console.timeEnd('[BetterFloat] Gamerpay init timer');
}

type PriceData = {
	price_difference: Decimal;
};

async function adjustItem(container: HTMLElement, props: string) {
	if (!props || props.length < 1 || props === '{}') {
		console.warn('[BetterFloat] No React data available for item card');
		return;
	}

	if (container.querySelector('.betterfloat-buffprice')) {
		return;
	}

	let itemData: Gamerpay.ReactItem;
	try {
		itemData = JSON.parse(props) as Gamerpay.ReactItem;
	} catch (error) {
		console.error('[BetterFloat] Error parsing item data:', error);
		return;
	}

	const priceData = await addBuffPrice(itemData.item, container, 'page');

	moveTradelock(container);

	if (extensionSettings['gp-stickerprices']) {
		addStickerPrices(itemData, container, priceData);
	}
}

async function adjustItemPage(container: HTMLElement, props: string) {
	if (!props || props.length < 1 || props === '{}') {
		console.warn('[BetterFloat] No React data available for item page');
		return;
	}

	let itemData: Gamerpay.ReactItemPage;
	try {
		itemData = JSON.parse(props) as Gamerpay.ReactItemPage;
	} catch (error) {
		console.error('[BetterFloat] Error parsing item data:', error);
		return;
	}

	// console.log('[BetterFloat] Item page data:', itemData);

	await addBuffPrice(itemData.item, container, 'shop');
}

async function addStickerPrices(itemData: Gamerpay.ReactItem, container: Element, priceData: { price_difference: Decimal }) {
	if (!itemData.item.stickers || itemData.item.stickers.length === 0) {
		return;
	}
	if (container.querySelector('.betterfloat-sticker-price')) {
		return;
	}

	const stickerContainer = container.querySelector<HTMLElement>(GAMERPAY_SELECTORS.card.stickers);
	if (!stickerContainer) {
		return;
	}

	const source = (extensionSettings['gp-pricingsource'] as MarketSource) ?? MarketSource.Buff;

	const stickerPrices = await Promise.all(
		itemData.item.stickers.map(async (sticker) => {
			if (!sticker.name) return new Decimal(0);

			const stickerName = `Sticker | ${sticker.name}`;
			const stickerPrice = await getBuffPrice(stickerName, '', source);
			return stickerPrice.priceListing ?? new Decimal(0);
		})
	);

	const stickerPrice = stickerPrices.reduce((acc, price) => acc.plus(price), new Decimal(0));
	const stickerPercentage = priceData.price_difference.div(stickerPrice).mul(100);

	const spContainer = html`
		<div class="betterfloat-sticker-price" style="background-color: ${getSPBackgroundColor(stickerPercentage.div(100).toNumber())}">
			<span>${stickerPercentage.gt(200) ? '>200' : stickerPercentage.toFixed(2)}% SP</span>
		</div>
	`;

	stickerContainer.style.flexDirection = 'column';
	stickerContainer.style.alignItems = 'flex-start';
	stickerContainer.style.gap = '5px';
	stickerContainer.style.marginBottom = '15px';
	if (!container.querySelector('.betterfloat-sticker-price')) {
		stickerContainer.insertAdjacentHTML('afterbegin', spContainer);
	}
}

function moveTradelock(container: Element) {
	const tradeLockContainer = container.querySelector<HTMLElement>(GAMERPAY_SELECTORS.common.tradeLock);
	if (!tradeLockContainer) {
		return;
	}
	const stickerContainer = container.querySelector<HTMLElement>(GAMERPAY_SELECTORS.card.stickers);
	if (!stickerContainer) {
		return;
	}

	stickerContainer.after(tradeLockContainer);
	tradeLockContainer.style.flex = 'none';
}

async function addBuffPrice(item: Gamerpay.Item, container: HTMLElement, state: PageState): Promise<PriceData> {
	const { source, itemStyle, itemPrice, buff_name, market_id, priceListing, priceOrder, priceFromReference, difference, currency } = await getBuffItem(item);
	const isItemPage = state === 'shop';

	const footerContainer = container.querySelector<HTMLElement>(isItemPage ? GAMERPAY_SELECTORS.itempage.priceContainer : GAMERPAY_SELECTORS.card.priceContainer);

	const isDoppler = buff_name.includes('Doppler') && buff_name.includes('|');
	const currencyFormatter = CurrencyFormatter(currency.text ?? 'USD');

	// move to the correct position because Gamerpay inits the container multiple times
	if (isItemPage && container.querySelector('.betterfloat-buffprice')) {
		const buffElement = container.querySelector<HTMLAnchorElement>('.betterfloat-buff-a');
		if (buffElement && footerContainer) {
			footerContainer.after(buffElement);
		}
	}

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
			iconHeight: isItemPage ? '24px' : '16px',
			hasPro: isUserPro(extensionSettings['user']),
			tooltipArrow: true,
		});

		footerContainer.insertAdjacentHTML('afterend', buffContainer);
		if (isItemPage) {
			footerContainer.parentElement!.style.flexDirection = 'column';
			footerContainer.style.alignItems = 'center';
		}

		const buffElement = footerContainer.querySelector<HTMLAnchorElement>('.betterfloat-buff-a');
		if (buffElement) {
			buffElement.addEventListener('click', (e) => {
				e.preventDefault();
				e.stopPropagation();
				window.open(buffElement.href, '_blank');
			});
		}

		if (extensionSettings['gp-removereferenceprice'] && !isItemPage) {
			const referencePriceContainer = footerContainer.querySelector<HTMLElement>(GAMERPAY_SELECTORS.card.referencePrice);
			if (referencePriceContainer) {
				referencePriceContainer.remove();
			}
		}

		if (!isItemPage) {
			const cardContainer = container.querySelector<HTMLElement>(GAMERPAY_SELECTORS.card.cardContainer);
			if (cardContainer) {
				cardContainer.style.overflow = 'visible';
			}
		}
	}

	const discountContainer = container.querySelector(isItemPage ? GAMERPAY_SELECTORS.itempage.pricePrimary : GAMERPAY_SELECTORS.card.pricePrimary);

	if (discountContainer && !container.querySelector('.betterfloat-sale-tag') && (extensionSettings['gp-buffdifference'] || extensionSettings['gp-buffdifferencepercent'])) {
		discountContainer.insertAdjacentHTML(isItemPage ? 'beforebegin' : 'afterend', createSaleTag(difference, itemPrice.div(priceFromReference ?? 1).mul(100), currencyFormatter));

		(discountContainer.parentElement as HTMLElement).style.display = 'flex';
		(discountContainer.parentElement as HTMLElement).style.alignItems = 'center';
		(discountContainer.parentElement as HTMLElement).style.gap = '8px';

		const oldDiscountContainer = container.querySelector(GAMERPAY_SELECTORS.card.savings);
		if (oldDiscountContainer && !isItemPage) {
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
	const currencyToSearch = userCurrency === 'EUR' ? 'USD' : userCurrency;
	const currencyRate = currencyRates?.find((rate) => rate.code.toLowerCase() === currencyToSearch.toLowerCase())?.rate ?? 1;

	if (currencyRate && currencyRate !== 1) {
		if (userCurrency !== 'USD') {
			priceListing = priceListing?.div(currencyRate);
			priceOrder = priceOrder?.div(currencyRate);
		} else {
			itemPrice = itemPrice.mul(currencyRate);
		}
	}

	const referencePrice =
		Number(extensionSettings['gp-pricereference']) === 0 &&
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
	const topCurrency = document.querySelector<HTMLSpanElement>(GAMERPAY_SELECTORS.common.balanceAmount)?.textContent?.trim();
	return topCurrency?.includes('$') ? 'USD' : 'EUR';
}

async function getCurrencyRates(): Promise<Gamerpay.CurrencyRates> {
	const date = localStorage.getItem('betterfloat-currency-rates-date');
	// if older than 2 hours, fetch new rates
	if (!date || Date.now() - Number(date) > 2 * 60 * 60 * 1000) {
		const response = await fetch('https://api.gamerpay.gg/currencies');
		const data = await response.json();
		localStorage.setItem('betterfloat-currency-rates-date', Date.now().toString());
		localStorage.setItem('betterfloat-currency-rates', JSON.stringify(data));
		return data;
	} else {
		return JSON.parse(localStorage.getItem('betterfloat-currency-rates') ?? '{}');
	}
}

function createBuffItem(item: Gamerpay.Item) {
	let name = item.marketHashName ?? item.name;
	let itemStyle = '' as ItemStyle;
	if (item.wearName === 'Vanilla') {
		itemStyle = 'Vanilla';
	}

	if (name.indexOf('(') === -1 && item.wearName) {
		name = `${name} (${item.wearName})`;
	}

	return {
		name,
		style: itemStyle,
	};
}

type PageState = 'page' | 'shop';

let extensionSettings: IStorage;
let currencyRates: Gamerpay.CurrencyRates;

init();
