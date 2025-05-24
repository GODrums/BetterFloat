import { html } from 'common-tags';
import getSymbolFromCurrency from 'currency-symbol-map';
import Decimal from 'decimal.js';
import type { PlasmoCSConfig } from 'plasmo';
import type { DMarket } from '~lib/@typings/DMarketTypes';
import type { BlueGem } from '~lib/@typings/ExtensionTypes';
import type { DopplerPhase, ItemStyle } from '~lib/@typings/FloatTypes';
import { getDMarketCurrency, getDMarketExchangeRate, getDMarketLatestSales, getSpecificDMarketItem } from '~lib/handlers/cache/dmarket_cache';
import { activateHandler, initPriceMapping } from '~lib/handlers/eventhandler';
import { getMarketID } from '~lib/handlers/mappinghandler';
import { DMARKET_SELECTORS } from '~lib/handlers/selectors/dmarket_selectors';
import { dynamicUIHandler, mountDMarketMarketComparison } from '~lib/handlers/urlhandler';
import { MarketSource } from '~lib/util/globals';
import {
	CurrencyFormatter,
	checkUserPlanPro,
	createHistoryRewrite,
	getBlueGemName,
	getBuffPrice,
	handleSpecialStickerNames,
	isBuffBannedItem,
	isUserPro,
	waitForElement,
} from '~lib/util/helperfunctions';
import { fetchBlueGemPatternData } from '~lib/util/messaging';
import { type IStorage, getAllSettings } from '~lib/util/storage';
import { genGemContainer, generatePriceLine } from '~lib/util/uigeneration';

export const config: PlasmoCSConfig = {
	matches: ['*://*.dmarket.com/*'],
	run_at: 'document_end',
	css: ['../css/hint.min.css', '../css/common_styles.css', '../css/dmarket_styles.css'],
};

type PriceResult = {
	price_difference: Decimal;
};

async function init() {
	console.time('[BetterFloat] DMarket init timer');

	if (location.host !== 'dmarket.com') {
		return;
	}

	replaceHistory();

	// catch the events thrown by the script
	// this has to be done as first thing to not miss timed events
	activateHandler();

	extensionSettings = await getAllSettings();
	console.log('[BetterFloat] Extension settings:', extensionSettings);

	if (!extensionSettings['bm-enable']) return;

	// check if user has the required plan
	if (!checkUserPlanPro(extensionSettings['user'])) {
		console.log('[BetterFloat] Pro plan required for DMarket features');
		return;
	}

	await initPriceMapping(extensionSettings, 'dm');

	console.timeEnd('[BetterFloat] DMarket init timer');

	// mutation observer is only needed once
	if (!isObserverActive) {
		isObserverActive = true;
		applyMutation();
		console.log('[BetterFloat] Mutation observer started');
	}

	dynamicUIHandler();

	console.log('[BetterFloat] DMarket script initialized', location.pathname);
}

async function replaceHistory() {
	// wait for the page to load
	await new Promise((resolve) => {
		if (document.readyState === 'complete') {
			resolve(true);
		} else {
			window.addEventListener('load', resolve);
		}
	});

	const isLoggedOut = document.querySelector(DMARKET_SELECTORS.other.authBtn);
	if (isLoggedOut && !location.search.includes('ref=')) {
		createHistoryRewrite({ ref: 'rqKYzZ36Bw' }, true);
	}
}

function applyMutation() {
	const observer = new MutationObserver(async (mutations) => {
		for (const mutation of mutations) {
			for (let i = 0; i < mutation.addedNodes.length; i++) {
				const addedNode = mutation.addedNodes[i];
				// some nodes are not elements, so we need to check
				if (!(addedNode instanceof HTMLElement)) continue;

				// c-asset__figure c-asset__exterior
				if (addedNode.className.startsWith('c-asset__price')) {
					const parent = addedNode.closest('asset-card') ?? addedNode.closest('asset-card-v2');
					if (parent) {
						adjustItem(parent, PageState.Market);
					}
				}
			}
		}
	});
	observer.observe(document, { childList: true, subtree: true });
}

async function adjustItem(container: Element, state: PageState) {
	const itemId = container.getAttribute('id');
	if (!itemId) return;
	const item = getSpecificDMarketItem(itemId);
	if (!item) {
		return;
	}

	// eslint-disable-next-line @typescript-eslint/no-unused-vars
	const priceResult = await addBuffPrice(item, container, state);

	waitForElement(DMARKET_SELECTORS.market.infoButton).then((success) => {
		if (success) {
			addPopupListener(container, item);
		}
	});

	await patternDetections(container, item, false);
}

function addPopupListener(container: Element, item: DMarket.Item) {
	const popupButton = container.querySelector(DMARKET_SELECTORS.market.infoButton);
	if (popupButton) {
		popupButton.addEventListener('click', async () => {
			console.log('Popup button clicked');
			let popup = document.getElementById(DMARKET_SELECTORS.popup.container);
			let tries = 10;
			while (!popup && tries-- > 0) {
				await new Promise((resolve) => setTimeout(resolve, 200));
				popup = document.getElementById(DMARKET_SELECTORS.popup.container);
			}
			if (!popup) return;

			const priceResult = await addBuffPrice(item, popup, PageState.Popup);

			await patternDetections(popup, item, true);

			addQuickLinks(popup, item);

			const popupContainer = popup.closest<HTMLElement>('asset-description-layout');
			if (popupContainer) {
				await addLatestSalesEnhancements(popupContainer);

				popupContainer.setAttribute('data-betterfloat', JSON.stringify(item));

				if (extensionSettings['dm-marketcomparison']) {
					mountDMarketMarketComparison(popupContainer);
				}
			}
		});
	}
}

async function addLatestSalesEnhancements(container: HTMLElement) {
	const latestSalesContainer = container.querySelector('last-sales');
	if (!latestSalesContainer) {
		return;
	}

	const buffData = JSON.parse(container.querySelector('.betterfloat-big-a')?.getAttribute('data-betterfloat') ?? '{}');
	let latestSales = getDMarketLatestSales();

	let tries = 10;
	while (latestSales.length === 0 && tries-- > 0) {
		await new Promise((resolve) => setTimeout(resolve, 200));
		latestSales = getDMarketLatestSales();
	}

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
	const userCurrency = getDMarketCurrency();
	const currencyFormatter = CurrencyFormatter(userCurrency ?? 'USD');

	let rows = latestSalesContainer.querySelectorAll('tr.c-assetPreview__row');
	tries = 10;
	while (rows.length === 0 && tries-- > 0) {
		await new Promise((resolve) => setTimeout(resolve, 200));
		rows = latestSalesContainer.querySelectorAll('tr.c-assetPreview__row');
	}
	for (let i = 0; i < rows.length; i++) {
		const row = rows[i];
		const sale = latestSales[i];

		const innerContainer = row.querySelector('last-sales-details-popup > div.c-assetPreview_icon');
		if (innerContainer) {
			const price = new Decimal(sale.price);
			const difference = price.minus(buffData.priceFromReference);

			const { color, background } = difference.gt(0) ? styling.loss : styling.profit;

			const differenceElement = html`
            	<div class="sale-tag betterfloat-sale-tag" style="background-color: ${background}; color: ${color}; font-size: 12px; margin-left: 8px;">
					${html`<span>${difference.isPos() ? '+' : '-'}${currencyFormatter.format(difference.abs().toNumber())} </span>`}
            	</div>
			`;

			innerContainer.insertAdjacentHTML('beforeend', differenceElement);
		}
	}
}

function addQuickLinks(container: HTMLElement, item: DMarket.Item) {
	const quickLinks = container.querySelector('asset-action-button > .c-assetPreviewButtons');
	if (!quickLinks) {
		return;
	}

	const actionButton = quickLinks.firstElementChild?.cloneNode(true) as HTMLElement;
	actionButton.querySelector('.mdc-button__label')!.textContent = 'Pricempire';
	actionButton.querySelector('a')?.setAttribute('href', `https://pricempire.com/item/${item.title}`);
	quickLinks.appendChild(actionButton);
}

async function patternDetections(container: Element, item: DMarket.Item, isPopout: boolean) {
	if (item.title.includes('Case Hardened') || item.title.includes('Heat Treated')) {
		if (extensionSettings['dm-csbluegem'] || isPopout) {
			await caseHardenedDetection(container, item, isPopout);
		}
	}
}

async function caseHardenedDetection(container: Element, item: DMarket.Item, isPopout: boolean) {
	if (item.title.includes('Gloves') || !item.extra.paintSeed || container.querySelector('.betterfloat-gem-container')) return;

	let patternElement: Partial<BlueGem.PatternData> | null = null;
	const type = getBlueGemName(item.title.replace('StatTrak™ ', ''));

	// retrieve the stored data instead of fetching newly
	if (isPopout) {
		const itemPreview = document.getElementsByClassName('item-' + location.pathname.split('/').pop())[0];
		const csbluegem = itemPreview?.getAttribute('data-csbluegem');
		if (csbluegem && csbluegem.length > 0) {
			patternElement = JSON.parse(csbluegem);
		}
	}
	if (!patternElement) {
		patternElement = await fetchBlueGemPatternData({ type: type.replaceAll(' ', '_'), pattern: item.extra.paintSeed });
		container.setAttribute('data-csbluegem', JSON.stringify(patternElement));
	}
	if (!patternElement) {
		console.warn('[BetterFloat] Could not fetch pattern data for ', item.title);
		return false;
	}

	// add gem icon and blue gem percent badge
	if (!item.title.includes('Gloves')) {
		const exteriorContainer = isPopout ? container.querySelector('share-link')?.parentElement : container.querySelector('asset-exterior-quality');
		if (!exteriorContainer) return;

		if (!isPopout) {
			exteriorContainer.setAttribute('style', 'display: flex; align-items: center; gap: 8px;');
			exteriorContainer.closest('.c-asset__footerLeft')?.setAttribute('style', 'max-width: 100%');
		}

		const gemContainer = genGemContainer({ patternElement, site: 'DM', large: isPopout });
		if (!gemContainer) return;
		gemContainer.setAttribute('style', 'display: flex; align-items: center; justify-content: flex-end;');
		if (!container.querySelector('.betterfloat-gem-container')) {
			exteriorContainer.appendChild(gemContainer);
		}
	}

	if (!isPopout) {
		return;
	}
}

async function addBuffPrice(item: DMarket.Item, container: Element, state: PageState): Promise<PriceResult> {
	const { source, itemStyle, itemPrice, buff_name, market_id, priceListing, priceOrder, priceFromReference, difference, currency } = await getBuffItem(item);

	let footerContainer: Element | null = null;
	if (state === PageState.ItemPage) {
		footerContainer = document.querySelector(DMARKET_SELECTORS.itempage.footer);
	} else if (state === PageState.Market) {
		footerContainer = container.querySelector(DMARKET_SELECTORS.market.footer);
	} else if (state === PageState.Inventory) {
		footerContainer = container.querySelector(DMARKET_SELECTORS.inventory.footer);
	} else if (state === PageState.Popup) {
		footerContainer = container.querySelector(DMARKET_SELECTORS.popup.footer);
	}

	const isDoppler = buff_name.includes('Doppler') && buff_name.includes('|');
	const maximumFractionDigits = priceListing?.gt(1000) && state !== PageState.ItemPage && priceOrder?.gt(10) ? 0 : 2;
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
			isPopout: state === PageState.Popup,
			priceClass: 'suggested-price',
			addSpaceBetweenPrices: true,
			showPrefix: false,
			iconHeight: state === PageState.Popup ? '20px' : '15px',
			hasPro: isUserPro(extensionSettings['user']),
		});
		footerContainer.insertAdjacentHTML('beforeend', buffContainer);
	}

	let priceContainer: Element | null = null;
	if (state === PageState.Market) {
		priceContainer = container.querySelector(DMARKET_SELECTORS.market.price);
	} else if (state === PageState.Popup) {
		priceContainer = container.querySelector(DMARKET_SELECTORS.popup.price);
	}

	if (priceContainer && !container.querySelector('.betterfloat-sale-tag') && (extensionSettings['dm-buffdifference'] || extensionSettings['dm-buffdifferencepercent'])) {
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
            <div class="sale-tag betterfloat-sale-tag ${state === PageState.Popup ? 'betterfloat-big-sale' : ''}" style="background-color: ${background}; color: ${color};">
				${extensionSettings['dm-buffdifference'] ? html`<span>${difference.isPos() ? '+' : '-'}${currencyFormatter.format(absDifference.toNumber())} </span>` : ''}
				${extensionSettings['dm-buffdifferencepercent'] ? html`<span>(${percentage.gt(150) ? percentage.toFixed(0) : percentage.toFixed(2)}%)</span>` : ''}
            </div>
        `;

		priceContainer.insertAdjacentHTML('afterend', buffPriceHTML);

		container.querySelector('asset-advanced-badge')?.remove();

		setTimeout(() => {
			const oldBadge = container.querySelector('asset-discount-badge');
			if (oldBadge) {
				oldBadge.remove();
			}
		}, 500);
	}

	return {
		price_difference: difference,
	};
}

async function getBuffItem(item: DMarket.Item) {
	let source = (extensionSettings['dm-pricingsource'] as MarketSource) ?? MarketSource.Buff;
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
	const userCurrency = getDMarketCurrency();
	const currencySymbol = getSymbolFromCurrency(userCurrency);
	const currencyRate = getDMarketExchangeRate(userCurrency);

	if (currencyRate) {
		if (priceListing) {
			priceListing = priceListing.mul(currencyRate);
		}
		if (priceOrder) {
			priceOrder = priceOrder.mul(currencyRate);
		}
		itemPrice = itemPrice.mul(currencyRate);
	}

	const referencePrice =
		Number(extensionSettings['dm-pricereference']) === 0 && ([MarketSource.Buff, MarketSource.Steam].includes(source) || (MarketSource.YouPin === source && isUserPro(extensionSettings['user'])))
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

function getItemPrice(item: DMarket.Item) {
	if (location.search.includes('exchangeTab=myItems')) {
		return new Decimal(item.instantPrice.USD).div(100);
	} else if (location.search.includes('exchangeTab=exchange')) {
		return item.type === 'offer' ? new Decimal(item.price.USD).div(100) : new Decimal(item.exchangePrice.USD).div(100);
	}
	return new Decimal(item.price.USD).div(100);
}

function createBuffItem(item: DMarket.Item): { name: string; style: ItemStyle } {
	const buff_item = {
		name: item.title,
		style: '' as ItemStyle,
	};
	if (item.extra.phase) {
		const phase = item.extra.phase;
		switch (phase) {
			case 'phase-1':
				buff_item.style = 'Phase 1';
				break;
			case 'phase-2':
				buff_item.style = 'Phase 2';
				break;
			case 'phase-3':
				buff_item.style = 'Phase 3';
				break;
			case 'phase-4':
				buff_item.style = 'Phase 4';
				break;
			case 'ruby':
				buff_item.style = 'Ruby';
				break;
			case 'sapphire':
				buff_item.style = 'Sapphire';
				break;
			case 'emerald':
				buff_item.style = 'Emerald';
				break;
			case 'black-pearl':
				buff_item.style = 'Black Pearl';
				break;
		}
	}
	return buff_item;
}

enum PageState {
	Market = 0,
	ItemPage = 1,
	Inventory = 2,
	Popup = 3,
}

// mutation observer active?
let isObserverActive = false;
let extensionSettings: IStorage;

init();
