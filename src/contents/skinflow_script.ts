import { html } from 'common-tags';
import getSymbolFromCurrency from 'currency-symbol-map';
import Decimal from 'decimal.js';
import type { PlasmoCSConfig } from 'plasmo';
import type { DopplerPhase, ItemStyle } from '~lib/@typings/FloatTypes';
import type { Skinflow } from '~lib/@typings/SkinflowTypes';
import { getBitskinsCurrencyRate } from '~lib/handlers/cache/bitskins_cache';
import { cacheSkinflowInventoryItems, getSkinflowBotsItem, getSkinflowInventoryItem, isSkinflowInventoryEmpty } from '~lib/handlers/cache/skinflow_cache';
import { activateHandler, initPriceMapping } from '~lib/handlers/eventhandler';
import { getMarketID } from '~lib/handlers/mappinghandler';
import { MarketSource } from '~lib/util/globals';
import { CurrencyFormatter, checkUserPlanPro, getBuffPrice, getDopplerPhase, handleSpecialStickerNames, isUserPro } from '~lib/util/helperfunctions';
import { getAllSettings, type IStorage } from '~lib/util/storage';
import { generatePriceLine } from '~lib/util/uigeneration';

export const config: PlasmoCSConfig = {
	matches: ['*://*.skinflow.gg/*'],
	run_at: 'document_end',
	css: ['../css/hint.min.css', '../css/common_styles.css', '../css/skinflow_styles.css'],
};

type PriceResult = {
	price_difference: Decimal;
};

async function init() {
	console.time('[BetterFloat] Skinflow init timer');

	if (location.host !== 'skinflow.gg') {
		return;
	}

	checkLocalStorage();

	// catch the events thrown by the script
	// this has to be done as first thing to not miss timed events
	activateHandler();

	extensionSettings = await getAllSettings();

	if (!extensionSettings['sf-enable']) return;

	// check if user has the required plan
	if (!(await checkUserPlanPro(extensionSettings['user']))) {
		console.log('[BetterFloat] Pro plan required for Skinflow features');
		return;
	}

	await initPriceMapping(extensionSettings, 'sf');

	console.timeEnd('[BetterFloat] Skinflow init timer');

	firstLaunch();
}

function firstLaunch() {
	setInterval(async () => {
		if (location.pathname === '/buy') {
			const items = document.querySelectorAll('div.tradeItem');
			for (const item of items) {
				await adjustItem(item, PageState.Market).catch((e) => console.error('[BetterFloat] Error adjusting item:', e));
			}
		} else if (location.pathname === '/sell') {
			const items = document.querySelectorAll('div.itemBox');
			for (const item of items) {
				await adjustItem(item, PageState.Inventory).catch((e) => console.error('[BetterFloat] Error adjusting item:', e));
			}
		}
	}, 1000);
}

function checkLocalStorage() {
	const value = localStorage.getItem('skinflow_referral');
	if (!value) {
		localStorage.setItem('skinflow_referral', 'betterfloat');
	}
}

function getAPIItem(container: Element, state: PageState): Skinflow.Item | null {
	if (state === PageState.Market) {
		const id = container.getAttribute('id');
		return id ? getSkinflowBotsItem(id) : null;
	}
	if (state === PageState.Inventory) {
		const mhn = container.querySelector('img')?.getAttribute('alt')?.replace(' icon', '');
		return mhn ? getSkinflowInventoryItem(mhn) : null;
	}
	return null;
}

let fetchInventoryOnNextRequest = false;

async function adjustItem(container: Element, state: PageState) {
	if (state === PageState.Market && container.classList.contains(container.id)) return;
	if (state === PageState.Inventory && container.classList.contains(container.querySelector('img')?.getAttribute('alt')?.replaceAll(' ', '_') ?? '')) return;

	let item = getAPIItem(container, state);

	let tries = 10;
	while (!item && tries-- > 0) {
		if (state === PageState.Inventory && isSkinflowInventoryEmpty() && !fetchInventoryOnNextRequest) {
			fetchInventoryOnNextRequest = true;
			await fetch('https://api.skinflow.gg/me/inv', { credentials: 'include' })
				.then((res) => res.json())
				.then((data: Skinflow.InventoryResponse) => {
					cacheSkinflowInventoryItems(data.inventory);
				});
		}
		await new Promise((resolve) => setTimeout(resolve, 200));
		item = getAPIItem(container, state);
	}
	// console.log('[BetterFloat] Skinflow item:', item);
	if (!item) return;

	const _priceResult = await addBuffPrice(item, container, state);

	if (state === PageState.Market) {
		container.classList.add(container.id);
	} else if (state === PageState.Inventory) {
		container.classList.add(container.querySelector('img')?.getAttribute('alt')?.replaceAll(' ', '_') ?? '');
	}
}

async function addBuffPrice(item: Skinflow.Item, container: Element, state: PageState): Promise<PriceResult> {
	const { source, itemStyle, itemPrice, buff_name, market_id, priceListing, priceOrder, priceFromReference, difference, currency } = await getBuffItem(item);

	const isDoppler = item.market_hash_name.includes('Doppler');
	const maximumFractionDigits = priceListing?.gt(1000) ? 0 : 2;
	const currencyFormatter = CurrencyFormatter(currency.text ?? 'USD', 0, maximumFractionDigits);

	if (container.querySelector('.betterfloat-buff-a')) {
		container.querySelector('.betterfloat-buff-a')?.remove();
	}

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

	container.insertAdjacentHTML('beforeend', buffContainer);

	const buffElement = container.querySelector<HTMLAnchorElement>('.betterfloat-buff-a');
	if (buffElement) {
		if (state === PageState.Inventory) {
			buffElement.setAttribute('style', 'padding: 0;');
		}
		buffElement.addEventListener('click', (e) => {
			e.preventDefault();
			e.stopPropagation();
			window.open(buffElement.href, '_blank');
		});
	}

	if (container.querySelector('.sale-wrapper')) {
		container.querySelector('.sale-wrapper')?.remove();
	}

	const priceContainer = container.querySelector('p.font-normal.text-md');

	if (priceContainer && (extensionSettings['sf-buffdifference'] || extensionSettings['sf-buffdifferencepercent'])) {
		const priceWrapper = html`
			<div class="sale-wrapper absolute right-0" style="bottom: 26px;">
				${createSaleTag(difference, itemPrice.div(priceFromReference ?? 1).mul(100), currencyFormatter)}
			</div>
		`;
		priceContainer.insertAdjacentHTML('afterend', priceWrapper);
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
		<div class="flex flex-col text-xs betterfloat-sale-tag" style="background-color: ${background}; color: ${color};">
			${extensionSettings['sf-buffdifference'] ? html`<span>${difference.isPos() ? '+' : '-'}${currencyFormatter.format(difference.abs().toNumber())} </span>` : ''}
			${extensionSettings['sf-buffdifferencepercent'] ? html`<span>(${percentage.gt(150) ? percentage.toFixed(0) : percentage.toFixed(2)}%)</span>` : ''}
		</div>
	`;
}

async function getBuffItem(item: Skinflow.Item) {
	let source = (extensionSettings['sf-pricingsource'] as MarketSource) ?? MarketSource.Buff;
	const buff_item = createBuffItem(item);
	const buff_name = handleSpecialStickerNames(buff_item.name);
	let { priceListing, priceOrder } = await getBuffPrice(buff_name, buff_item.style, source);

	if (((!priceListing && !priceOrder) || (priceListing?.isZero() && priceOrder?.isZero())) && extensionSettings['sf-altmarket'] && extensionSettings['sf-altmarket'] !== MarketSource.None) {
		source = extensionSettings['sf-altmarket'] as MarketSource;
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
		Number(extensionSettings['sf-pricereference']) === 0 && ([MarketSource.Buff, MarketSource.Steam].includes(source) || (MarketSource.YouPin === source && isUserPro(extensionSettings['user'])))
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

function getItemPrice(item: Skinflow.Item): Decimal {
	return new Decimal(item.offered).div(100);
}

function createBuffItem(item: Skinflow.Item): { name: string; style: ItemStyle } {
	const buff_item = {
		name: item.market_hash_name,
		style: '' as ItemStyle,
	};
	if (item.market_hash_name.includes('Doppler')) {
		buff_item.style = getDopplerPhase(item.phase) ?? '';
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

let extensionSettings: IStorage;

init();
