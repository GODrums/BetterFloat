import { html } from 'common-tags';
import Decimal from 'decimal.js';
import type { PlasmoCSConfig } from 'plasmo';

import type { DopplerPhase, ItemStyle } from '~lib/@typings/FloatTypes';
import { activateHandler, initPriceMapping } from '~lib/handlers/eventhandler';
import { BigCurrency, SmallCurrency, getAndFetchCurrencyRate, getMarketID } from '~lib/handlers/mappinghandler';
import { dynamicUIHandler } from '~lib/handlers/urlhandler';
import { MarketSource } from '~lib/util/globals';
import { CurrencyFormatter, checkUserPlanPro, createHistoryRewrite, getBuffPrice, handleSpecialStickerNames, isBuffBannedItem } from '~lib/util/helperfunctions';
import type { IStorage } from '~lib/util/storage';
import { getAllSettings } from '~lib/util/storage';
import { generatePriceLine } from '~lib/util/uigeneration';

type PriceResult = {
	currency: string;
	priceFromReference: number;
};

export const config: PlasmoCSConfig = {
	matches: ['https://*.lis-skins.com/*'],
	run_at: 'document_end',
	css: ['../css/hint.min.css', '../css/common_styles.css', '../css/lisskins_styles.css'],
};

async function init() {
	console.time('[BetterFloat] Lis-Skins init timer');

	if (location.host !== 'lis-skins.com') {
		return;
	}

	replaceHistory();

	// catch the events thrown by the script
	// this has to be done as first thing to not miss timed events
	activateHandler();

	extensionSettings = await getAllSettings();
	console.log('[BetterFloat] Extension settings:', extensionSettings);

	if (!extensionSettings['lis-enable']) return;

	// check if user has the required plan
	if (!checkUserPlanPro(extensionSettings['user'])) {
		console.log('[BetterFloat] Pro plan required for Lisskins features');
		return;
	}

	await initPriceMapping(extensionSettings, 'lis');

	console.timeEnd('[BetterFloat] Lis-Skins init timer');

	await firstLaunch();

	// mutation observer is only needed once
	if (!isObserverActive) {
		isObserverActive = true;
		applyMutation();
		console.log('[BetterFloat] Mutation observer started');
	}

	dynamicUIHandler();
}

// required as mutation does not detect initial DOM
async function firstLaunch() {
	if (location.pathname.includes('/market/csgo/')) {
		// full item pages
		const itemPage = document.querySelector('div.skins-market-view');
		if (itemPage) {
			await adjustItem(itemPage, PageType.ItemPage);
		} else {
			// market searches
			const items = document.querySelectorAll('div.market_item');
			for (let i = 0; i < items.length; i++) {
				await adjustItem(items[i], PageType.Market);
			}
		}
	} else if (location.pathname.includes('/market/cs2/')) {
		// sell pages
		const items = document.querySelectorAll('div.item_csgo');
		for (let i = 0; i < items.length; i++) {
			await adjustItem(items[i], PageType.Market);
		}
	}
}

function replaceHistory() {
	const isLoggedOut = document.querySelector('div.not-loggined');
	if (isLoggedOut && !location.href.includes('rf=')) {
		location.search += `${location.search ? '&' : ''}rf=130498354`;
	}
}

interface HTMLItem {
	name: string;
	style: ItemStyle;
	price: Decimal;
}

function applyMutation() {
	const observer = new MutationObserver(async (mutations) => {
		for (const mutation of mutations) {
			for (let i = 0; i < mutation.addedNodes.length; i++) {
				const addedNode = mutation.addedNodes[i];
				// some nodes are not elements, so we need to check
				if (!(addedNode instanceof HTMLElement)) continue;
				// console.debug('[BetterFloat] Mutation detected:', addedNode, addedNode.tagName, addedNode.className.toString());

				if (addedNode.className === 'skin ') {
					await adjustItem(addedNode, PageType.Inventory);
				} else if (addedNode.id === 'skins-obj') {
					const isMarketPage = addedNode.firstElementChild?.className.includes('skins-market-skins-list');
					const items = Array.from(addedNode.querySelectorAll('div.market_item'));
					if (isMarketPage) {
						for (let i = 0; i < items.length; i++) {
							await adjustItem(items[i], PageType.Market);
						}
					} else {
						const metaData = generateSaleTagMeta();
						for (let i = 0; i < items.length; i++) {
							addSaleTag(items[i], metaData);
						}
					}
				}
			}
		}
	});
	observer.observe(document, { childList: true, subtree: true });
}

enum PageType {
	Market = 1,
	ItemPage = 2,
	Inventory = 3,
}

async function adjustItem(container: Element, page = PageType.Market) {
	const getItem: () => HTMLItem = () => {
		if (page === PageType.Inventory) {
			const itemName = container.getAttribute('data-name') ?? '';
			const itemStyle = itemName.includes('Doppler') ? (itemName.split('Doppler ')[1].split(' (')[0] as DopplerPhase) : '';
			const itemPrice = container.getAttribute('data-price') ?? '0';
			return {
				name: itemName,
				style: itemStyle,
				price: new Decimal(itemPrice),
			};
		}
		const imgAlt = container.querySelector('img.image')?.getAttribute('alt') ?? '';
		let itemName = '';
		let itemStyle: ItemStyle = '';
		if (imgAlt.includes('Doppler')) {
			itemStyle = imgAlt.split('Doppler ')[1].split(' (')[0] as DopplerPhase;
			itemName = imgAlt.replace(` ${itemStyle}`, '');
		} else {
			itemName = imgAlt;
			if (imgAlt.includes('★') && !imgAlt.includes('|')) {
				itemStyle = 'Vanilla';
			}
		}
		// cut last digit
		const itemPrice = container.querySelector('div.price')?.textContent;
		const price = new Decimal(
			itemPrice
				?.substring(0, itemPrice.length - 1)
				.replace(',', '')
				.replace('.', '')
				.replaceAll(' ', '') ?? '0'
		).div(100);
		// console.log('[BetterFloat] Adjusting item: ', itemName, itemStyle, price.toNumber());
		return {
			name: itemName,
			style: itemStyle,
			price,
		};
	};

	const item = getItem();

	const priceResult = await addBuffPrice(item, container, page);

	if (page === PageType.ItemPage) {
		const rows = document.querySelectorAll('div.row.market_item');
		for (let i = 0; i < rows.length; i++) {
			addSaleTag(rows[i], priceResult);
		}
	}
}

function generateSaleTagMeta(): PriceResult {
	const el = document.querySelector<HTMLElement>('a.betterfloat-big-a');
	if (!el) return { priceFromReference: 0, currency: 'USD' };

	const data = JSON.parse(el.dataset.betterfloat || '{}');
	return {
		priceFromReference: data.priceFromReference || 0,
		currency: data.userCurrency || 'USD',
	};
}

function addSaleTag(container: Element, priceResult: PriceResult) {
	const priceContainer = container.querySelector('.price');
	if (!priceContainer?.textContent) return;
	const priceHTML = priceContainer.textContent;
	const itemPrice = new Decimal(
		priceHTML
			.substring(0, priceHTML.length - 1)
			.replace(',', '')
			.replace('.', '')
			.trim()
			.replaceAll(' ', '')
	).div(100);
	const difference = itemPrice.minus(priceResult.priceFromReference);

	const styling = {
		profit: {
			color: '#5bc27a',
			background: 'rgb(123 195 119 / 10%)',
		},
		loss: {
			color: '#ff8095',
			background: 'rgb(255 128 149 / 10%)',
		},
	};
	const { color, background } = difference.gt(0) ? styling.loss : styling.profit;
	const buffPriceHTML = `<div class="sale-tag betterfloat-sale-tag" style="background-color: ${background}; color: ${color}; position: relative; translate: 0;"><span>${difference.gt(0) ? '+' : '-'}${CurrencyFormatter(priceResult.currency).format(difference.toNumber())}</span><span>(${itemPrice.div(priceResult.priceFromReference).mul(100).toFixed(2)}%)</span></div>`;

	priceContainer.insertAdjacentHTML('beforebegin', buffPriceHTML);
	priceContainer.parentElement?.setAttribute('style', 'display: flex; align-items: center; gap: 4px; height: 64px;');
}

async function getBuffItem(item: HTMLItem) {
	let source = (extensionSettings['lis-pricingsource'] as MarketSource) ?? MarketSource.Buff;
	const buff_name = handleSpecialStickerNames(item.name);

	let { priceListing, priceOrder } = await getBuffPrice(buff_name, item.style);

	if (source === MarketSource.Buff && isBuffBannedItem(buff_name)) {
		priceListing = new Decimal(0);
		priceOrder = new Decimal(0);
	}

	if (((!priceListing && !priceOrder) || (priceListing?.isZero() && priceOrder?.isZero())) && extensionSettings['lis-altmarket'] && extensionSettings['lis-altmarket'] !== MarketSource.None) {
		source = extensionSettings['lis-altmarket'] as MarketSource;
		const altPrices = await getBuffPrice(buff_name, item.style, source);
		priceListing = altPrices.priceListing;
		priceOrder = altPrices.priceOrder;
	}
	const market_id = getMarketID(buff_name, source);

	const currency = getUserCurrency();
	const currencyRate = await getAndFetchCurrencyRate(currency);
	if (currencyRate) {
		priceListing = priceListing?.mul(currencyRate);
		priceOrder = priceOrder?.mul(currencyRate);
	}
	const priceFromReference = Number.parseInt(String(extensionSettings['lis-pricereference'])) === 0 && [MarketSource.Buff, MarketSource.Steam].includes(source) ? priceOrder : priceListing;

	const priceDifference = priceFromReference ? item.price.minus(priceFromReference) : new Decimal(0);
	return {
		buff_name,
		market_id,
		priceListing,
		priceOrder,
		priceFromReference,
		difference: priceDifference,
		currency,
	};
}

function getBuffParent(container: Element, page: PageType) {
	if (page === PageType.ItemPage) {
		return container.querySelector('div.min-price-block');
	} else {
		return container.querySelector('div.skin-info');
	}
}

async function addBuffPrice(item: HTMLItem, container: Element, page: PageType): Promise<PriceResult> {
	const { buff_name, market_id, priceListing, priceOrder, priceFromReference, difference, currency } = await getBuffItem(item);

	const isItemPage = page === PageType.ItemPage;
	const elementContainer = getBuffParent(container, page);
	if (elementContainer && !container.querySelector('.betterfloat-buff-a')) {
		const isDoppler = buff_name.includes('Doppler') && buff_name.includes('|');
		const buffContainer = generatePriceLine({
			source: extensionSettings['csf-pricingsource'] as MarketSource,
			market_id,
			buff_name,
			priceOrder,
			priceListing,
			priceFromReference,
			userCurrency: currency,
			itemStyle: item.style as DopplerPhase,
			CurrencyFormatter: CurrencyFormatter(currency, 0, priceListing?.gt(1000) ? 0 : 2),
			isDoppler: isDoppler,
			isPopout: isItemPage,
			priceClass: 'suggested-price',
			addSpaceBetweenPrices: false,
			showPrefix: false,
			iconHeight: '15px',
		});

		elementContainer.insertAdjacentHTML(isItemPage ? 'beforeend' : 'afterend', buffContainer);
		// open window according to href attribute of current element
		elementContainer.parentElement?.querySelector('.betterfloat-buffprice')?.addEventListener('click', (e) => {
			e.stopPropagation();
			window.open((e.currentTarget as HTMLElement).parentElement?.getAttribute('href') ?? '', '_blank');
		});

		if (page === PageType.Inventory) {
			container.querySelector('.betterfloat-buff-a')?.setAttribute('style', 'top: 22px;');
			container.querySelector('.skin-info-exterior')?.setAttribute('style', 'display: block;');
		}
	}

	const priceContainer = container.querySelector('.price');
	if (
		priceContainer &&
		priceFromReference &&
		!isItemPage &&
		!container.querySelector('.betterfloat-sale-tag') &&
		(extensionSettings['lis-buffdifference'] || extensionSettings['lis-buffdifferencepercent'])
	) {
		const styling = {
			profit: {
				color: '#5bc27a',
				background: 'rgb(123 195 119 / 10%)',
			},
			loss: {
				color: '#ff8095',
				background: 'rgb(255 128 149 / 10%)',
			},
		};

		const absDifference = item.price.minus(priceFromReference).abs();
		const percentage = item.price.div(priceFromReference).times(100);
		const colorPercentage = 100;
		const { color, background } = percentage.gt(colorPercentage) ? styling.loss : styling.profit;
		const formattedPrice = absDifference.gt(1000) ? BigCurrency(currency).format(absDifference.toNumber()) : SmallCurrency(currency).format(absDifference.toNumber());

		const buffPriceHTML = html`
			<div class="sale-tag betterfloat-sale-tag" style="background-color: ${background}; color: ${color}; ${page === PageType.Inventory ? 'bottom: 20px;' : ''}">
				${extensionSettings['lis-buffdifference'] ? html`<span>${difference.isPos() ? '+' : '-'}${formattedPrice} </span>` : ''}
				${extensionSettings['lis-buffdifferencepercent'] ? html`<span>(${percentage.gt(150) ? percentage.toFixed(0) : percentage.toFixed(2)}%)</span>` : ''}
			</div>
		`;

		if (page === PageType.Inventory) {
			priceContainer.insertAdjacentHTML('afterend', buffPriceHTML);
		} else {
			priceContainer.parentElement?.insertAdjacentHTML('afterend', buffPriceHTML);
		}
	}

	return {
		priceFromReference: priceFromReference?.toNumber() ?? 0,
		currency,
	};
}

function getUserCurrency() {
	const currency = document.querySelector('p.currency-switcher__selected-currency')?.textContent;
	return currency?.toUpperCase() ?? 'USD';
}

// mutation observer active?
let isObserverActive = false;
let extensionSettings: IStorage;

init();
