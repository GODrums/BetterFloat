import { html } from 'common-tags';
import Decimal from 'decimal.js';
import type { PlasmoCSConfig } from 'plasmo';

import type { DopplerPhase, ItemStyle } from '~lib/@typings/FloatTypes';
import { activateHandler, initPriceMapping } from '~lib/handlers/eventhandler';
import { initLisskins } from '~lib/handlers/history/lisskins_history';
import { BigCurrency, getAndFetchCurrencyRate, getItemPrice, getMarketID, SmallCurrency } from '~lib/handlers/mappinghandler';
import { dynamicUIHandler } from '~lib/handlers/urlhandler';
import { MarketSource } from '~lib/util/globals';
import { CurrencyFormatter, checkUserPlanPro, getBuffPrice, getMarketURL, getSPBackgroundColor, handleSpecialStickerNames, isUserPro } from '~lib/util/helperfunctions';
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

	initLisskins();

	// catch the events thrown by the script
	// this has to be done as first thing to not miss timed events
	activateHandler();

	extensionSettings = await getAllSettings();

	if (!extensionSettings['lis-enable']) return;

	// check if user has the required plan
	if (!(await checkUserPlanPro(extensionSettings['user']))) {
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

interface HTMLItem {
	name: string;
	style: ItemStyle;
	price: Decimal;
	stickers?: string[];
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
				} else if (addedNode.className.startsWith('small-item')) {
					await adjustItem(addedNode, PageType.Cart);
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
	Cart = 4,
}

async function adjustItem(container: Element, page = PageType.Market) {
	const item = getItemFromHTML(container, page);

	const priceResult = await addBuffPrice(item, container, page);

	if (page === PageType.ItemPage) {
		const rows = document.querySelectorAll('div.row.market_item');
		for (let i = 0; i < rows.length; i++) {
			const saleData = addSaleTag(rows[i], priceResult);
			if (!saleData) continue;

			const stickers = getStickersFromHTML(rows[i], page);
			addStickerPercentage(rows[i], saleData.price, stickers, priceResult.priceFromReference, page);
		}

		// Add data-betterfloat attribute to the main container for the market comparison component
		container.setAttribute('data-betterfloat', JSON.stringify({ name: item.name, phase: item.style, price: item.price.toNumber() }));

		addQuickLinks(container, item);
	} else if (page === PageType.Market) {
		addStickerPercentage(container, item.price, item.stickers, priceResult.priceFromReference, page);
	} else if (page === PageType.Cart) {
		addItemPageLink(container, item);
	}
}

async function addItemPageLink(container: Element, item: HTMLItem) {
	if (container.querySelector('a.betterfloat-item-page-link')) return;

	const { buff_name } = await getBuffItem(item);

	const href = getMarketURL({ source: MarketSource.Lisskins, buff_name, market_id: 0, phase: item.style as DopplerPhase });

	const itemPageLink = html`
		<a class="betterfloat-item-page-link" target="_blank" href="${href}"></a>
	`;
	container.lastElementChild?.insertAdjacentHTML('beforebegin', itemPageLink);

	container.setAttribute('style', 'grid-template-columns: 100px 1fr auto 35px 35px;');
}

function getItemFromHTML(container: Element, page: PageType): HTMLItem {
	const item: HTMLItem = {
		name: '',
		style: '',
		price: new Decimal(0),
	};
	let elementText = '';
	if (page === PageType.Inventory) {
		elementText = container.getAttribute('data-name') ?? '';
	} else if (page === PageType.Cart) {
		elementText = container.querySelector('div.item-image')?.getAttribute('alt') ?? '';
	} else {
		elementText = container.querySelector('img.image')?.getAttribute('alt') ?? '';
	}
	if (elementText.includes('Doppler')) {
		item.style = elementText.split('Doppler ')[1].split(' (')[0] as DopplerPhase;
		item.name = elementText.replace(` ${item.style}`, '');
	} else {
		item.name = elementText;
		if (elementText.includes('★') && !elementText.includes('|')) {
			item.style = 'Vanilla';
		}
	}
	// cut last digit
	if (page === PageType.Inventory) {
		item.price = new Decimal(container.getAttribute('data-price') ?? '0');
	} else if (page === PageType.Cart) {
		const itemPrice = container.querySelector('span.item-price-value')?.textContent?.trim() ?? '0';
		item.price = new Decimal(
			itemPrice
				?.substring(0, itemPrice.length - 1)
				.replace(',', '')
				.replace('.', '')
				.replaceAll(' ', '') ?? '0'
		).div(100);
	} else {
		const itemPrice = container.querySelector('div.price')?.textContent ?? '0';
		item.price = new Decimal(
			itemPrice
				?.substring(0, itemPrice.length - 1)
				.replace(',', '')
				.replace('.', '')
				.replaceAll(' ', '') ?? '0'
		).div(100);
	}

	item.stickers = getStickersFromHTML(container, page);
	return item;
}

function getStickersFromHTML(container: Element, page: PageType): string[] | undefined {
	const stickers: string[] = [];
	const stickerElements = page === PageType.ItemPage ? container.querySelectorAll('div.sticker') : container.querySelectorAll('img.sticker');
	if (stickerElements.length === 0) return undefined;

	for (const stickerElement of stickerElements) {
		const stickerName = stickerElement.getAttribute('data-href')?.split('/730/').pop();
		if (stickerName) {
			stickers.push(decodeURIComponent(stickerName));
		}
	}
	return stickers;
}

async function addStickerPercentage(container: Element, itemPrice: Decimal, stickers: string[] | undefined, referencePrice: number, page: PageType) {
	if (!stickers || stickers.length === 0) return;
	if (!extensionSettings['lis-stickerprices']) return;

	const stickerPrices = await Promise.all(stickers.map(async (sticker) => await getItemPrice(sticker, extensionSettings['lis-pricingsource'] as MarketSource)));
	const stickerSum = stickerPrices.reduce((acc, price) => acc.plus(price.starting_at), new Decimal(0));
	const priceDifference = itemPrice.minus(referencePrice);
	const stickerPercentage = priceDifference.gt(0) ? priceDifference.div(stickerSum) : new Decimal(0);

	const stickerPercentageHTML = html`
		<div class="betterfloat-sticker-percentage ${page === PageType.ItemPage ? 'page' : 'market'}" style="background-color: ${getSPBackgroundColor(stickerPercentage.toNumber())}">
			<span>${stickerPercentage.gt(1.5) ? '>150' : stickerPercentage.mul(100).toFixed(1)}% SP</span>
		</div>
	`;
	if (page === PageType.Market) {
		container.insertAdjacentHTML('beforeend', stickerPercentageHTML);
	} else if (page === PageType.ItemPage) {
		container.querySelector('div.sticker-list')?.insertAdjacentHTML('beforeend', stickerPercentageHTML);
	}
}

function addQuickLinks(container: Element, item: HTMLItem) {
	const quickLinks = container.querySelector('div.links');
	if (!quickLinks) return;

	const actionButton = html`
		<a href="https://pricempire.com/item/${item.name}" target="_blank">
			View on Pricempire
		</a>
	`;
	quickLinks.insertAdjacentHTML('beforeend', actionButton);
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

	return {
		price: itemPrice,
		difference: difference,
		percentage: itemPrice.div(priceResult.priceFromReference).mul(100),
	};
}

async function getBuffItem(item: HTMLItem) {
	let source = (extensionSettings['lis-pricingsource'] as MarketSource) ?? MarketSource.Buff;
	const buff_name = handleSpecialStickerNames(item.name);

	let { priceListing, priceOrder } = await getBuffPrice(buff_name, item.style, source);

	if (((!priceListing && !priceOrder) || (priceListing?.isZero() && priceOrder?.isZero())) && extensionSettings['lis-altmarket'] && extensionSettings['lis-altmarket'] !== MarketSource.None) {
		source = extensionSettings['lis-altmarket'] as MarketSource;
		const altPrices = await getBuffPrice(buff_name, item.style, source);
		priceListing = altPrices.priceListing;
		priceOrder = altPrices.priceOrder;
	}
	const market_id = await getMarketID(buff_name, source);

	const currency = getUserCurrency();
	const currencyRate = await getAndFetchCurrencyRate(currency);
	if (currencyRate) {
		priceListing = priceListing?.mul(currencyRate);
		priceOrder = priceOrder?.mul(currencyRate);
	}
	const priceFromReference =
		Number.parseInt(String(extensionSettings['lis-pricereference'])) === 0 &&
		([MarketSource.Buff, MarketSource.Steam, MarketSource.CSFloat].includes(source) || (MarketSource.YouPin === source && isUserPro(extensionSettings['user'])))
			? priceOrder
			: priceListing;

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
	} else if (page === PageType.Cart) {
		return container.querySelector('div.item-price_mobile');
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
			source: extensionSettings['lis-pricingsource'] as MarketSource,
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
			hasPro: isUserPro(extensionSettings['user']),
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
		} else if (page === PageType.Cart) {
			container.querySelector('.betterfloat-buff-a')?.setAttribute('style', 'position: relative; margin-top: 5px; margin-left: -8px;');
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
