import { html } from 'common-tags';
import getSymbolFromCurrency from 'currency-symbol-map';
import Decimal from 'decimal.js';
import type { DMarket } from '~lib/@typings/DMarketTypes';
import type { BlueGem } from '~lib/@typings/ExtensionTypes';
import type { DopplerPhase, ItemStyle } from '~lib/@typings/FloatTypes';
import type { LegacyContentScriptConfig as PlasmoCSConfig } from '~lib/@typings/MigrationTypes';
import { getMarketID } from '~lib/handlers/mappinghandler';
import { DMARKET_SELECTORS } from '~lib/handlers/selectors/dmarket_selectors';
import { initPriceMapping } from '~lib/shared/pricing';
import { AskBidMarkets, MarketSource } from '~lib/util/globals';
import { CurrencyFormatter, checkUserPlanPro, getBuffPrice, getOldBlueGemName, handleSpecialStickerNames, isUserPro } from '~lib/util/helperfunctions';
import { generateAphroditeIcon } from '~lib/util/icon_generation';
import { attachMarketPopover } from '~lib/util/market_popover';
import { fetchBlueGemPatternData } from '~lib/util/messaging';
import { AphroditeMapping } from '~lib/util/patterns';
import { getAllSettings, type IStorage } from '~lib/util/storage';
import { generatePriceLine, genGemContainer } from '~lib/util/uigeneration';
import { getDMarketCurrency, getDMarketExchangeRate, getDMarketItemPrice, getDMarketLatestSales, getDMarketPaintSeed, getDMarketPhase, getSpecificDMarketItem } from './cache';
import { activateDMarketEventHandler as activateHandler } from './events';
import { activateDMarketUrlHandler as dynamicUIHandler, mountDMarketMarketComparison } from './url';

export const config: PlasmoCSConfig = {
	matches: ['*://*.dmarket.com/*'],
	run_at: 'document_end',
	css: ['../../css/common_styles.css', '../../css/dmarket_styles.css'],
};

type PriceResult = {
	price_difference: Decimal;
};

async function init() {
	console.time('[BetterFloat] DMarket init timer');

	if (location.host !== 'dmarket.com') {
		return;
	}

	// catch the events thrown by the script
	// this has to be done as first thing to not miss timed events
	activateHandler(() => {
		if (isObserverActive) void adjustVisibleMarketItems();
	});

	extensionSettings = await getAllSettings();

	if (!extensionSettings['bm-enable']) return;

	// check if user has the required plan
	if (!(await checkUserPlanPro(extensionSettings['user']))) {
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

function applyMutation() {
	const observer = new MutationObserver(async (mutations) => {
		for (const mutation of mutations) {
			for (let i = 0; i < mutation.addedNodes.length; i++) {
				const addedNode = mutation.addedNodes[i];
				// some nodes are not elements, so we need to check
				if (!(addedNode instanceof HTMLElement)) continue;

				if (addedNode.matches(DMARKET_SELECTORS.cards)) {
					void adjustItem(addedNode, getCardState(addedNode));
				}
				const parentCard = addedNode.closest(DMARKET_SELECTORS.cards);
				if (parentCard && parentCard !== addedNode) {
					void adjustItem(parentCard, getCardState(parentCard));
				}
				for (const card of addedNode.querySelectorAll(DMARKET_SELECTORS.cards)) {
					void adjustItem(card, getCardState(card));
				}
			}
		}
	});
	observer.observe(document, { childList: true, subtree: true });
	void adjustVisibleMarketItems();
}

async function adjustVisibleMarketItems() {
	for (const container of document.querySelectorAll(DMARKET_SELECTORS.cards)) {
		await adjustItem(container, getCardState(container));
	}
}

function getCardState(container: Element) {
	return container.matches(DMARKET_SELECTORS.inventory.container) ? PageState.Inventory : PageState.Market;
}

function getDMarketItemId(container: Element) {
	const itemElement =
		container.querySelector<HTMLElement>(`${DMARKET_SELECTORS.market.item}, ${DMARKET_SELECTORS.inventory.item}`) ?? container.querySelector<HTMLElement>(':scope > [data-test-id][id]');
	if (container.id || itemElement?.id) return container.id || itemElement?.id || null;

	const testId = container.querySelector<HTMLElement>('[data-test-id*="_asset_item_"]')?.dataset.testId;
	return testId?.split('_asset_item_').pop() || null;
}

async function adjustItem(container: Element, state: PageState) {
	const itemId = getDMarketItemId(container);
	if (!itemId) return;
	const item = getSpecificDMarketItem(itemId);
	if (!item || container.getAttribute('data-betterfloat-adjusting') === 'true') return;

	container.setAttribute('data-betterfloat-adjusting', 'true');
	try {
		const _priceResult = await addBuffPrice(item, container, state);
		await addPopupListener(container, item);
		await patternDetections(container, item, false);
	} finally {
		container.removeAttribute('data-betterfloat-adjusting');
	}
}

async function addPopupListener(container: Element, item: DMarket.CachedListing) {
	const popupButtonSelector = container.matches(DMARKET_SELECTORS.inventory.container) ? DMARKET_SELECTORS.inventory.infoButton : DMARKET_SELECTORS.market.infoButton;
	let popupButton = container.querySelector<HTMLElement>(popupButtonSelector);
	let buttonTries = 10;
	while (!popupButton && buttonTries-- > 0) {
		await new Promise((resolve) => setTimeout(resolve, 200));
		popupButton = container.querySelector<HTMLElement>(popupButtonSelector);
	}
	if (!popupButton || popupButton.dataset.betterfloatListener === 'true') return;

	popupButton.dataset.betterfloatListener = 'true';
	popupButton.addEventListener('click', async () => {
		let popup = document.querySelector<HTMLElement>(DMARKET_SELECTORS.popup.container);
		let tries = 10;
		while (!popup?.querySelector(DMARKET_SELECTORS.popup.details) && tries-- > 0) {
			await new Promise((resolve) => setTimeout(resolve, 200));
			popup = document.querySelector<HTMLElement>(DMARKET_SELECTORS.popup.container);
		}
		if (!popup) return;

		const _priceResult = await addBuffPrice(item, popup, PageState.Popup);
		await patternDetections(popup, item, true);
		addQuickLinks(popup, item);

		const popupContainer = popup.querySelector<HTMLElement>(DMARKET_SELECTORS.popup.details);
		if (!popupContainer) return;

		popupContainer.setAttribute('data-betterfloat', JSON.stringify(item));
		if (extensionSettings['dm-marketcomparison'] && !popupContainer.querySelector('betterfloat-dm-market-comparison')) {
			await mountDMarketMarketComparison(popupContainer);
		}

		await addLatestSalesEnhancements(popup);
	});
}

async function addLatestSalesEnhancements(container: HTMLElement) {
	const latestSalesContainer = container.querySelector('dm-exchange-product-card-recent-sales-table');
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

	let rows = container.querySelectorAll(DMARKET_SELECTORS.popup.recentSalesRows);
	tries = 10;
	while (rows.length === 0 && tries-- > 0) {
		await new Promise((resolve) => setTimeout(resolve, 200));
		rows = container.querySelectorAll(DMARKET_SELECTORS.popup.recentSalesRows);
	}
	for (let i = 0; i < rows.length; i++) {
		const row = rows[i];
		const sale = latestSales[i];
		if (!row || !sale) continue;

		const innerContainer = row.querySelector('td:nth-child(2)');
		if (innerContainer) {
			const price = new Decimal(sale.price);
			const difference = price.minus(buffData.priceFromReference);

			const { color, background } = difference.gt(0) ? styling.loss : styling.profit;

			const differenceElement = html`
				<div class="betterfloat-sale-tag" style="background-color: ${background}; color: ${color}; font-size: 12px; margin-left: 8px;">
					${html`<span>${difference.isPos() ? '+' : '-'}${currencyFormatter.format(difference.abs().toNumber())} </span>`}
            	</div>
			`;

			innerContainer.classList.add('betterfloat-sale-cell');
			if (!innerContainer.querySelector('.betterfloat-sale-tag')) innerContainer.insertAdjacentHTML('beforeend', differenceElement);
		}
	}
}

function addQuickLinks(container: HTMLElement, item: DMarket.CachedListing) {
	const quickLinks = container.querySelector<HTMLElement>(DMARKET_SELECTORS.popup.actionButtons);
	if (!quickLinks || quickLinks.querySelector('.betterfloat-pricempire-link')) return;

	const actionButton = quickLinks.firstElementChild?.cloneNode(true) as HTMLAnchorElement | null;
	if (!actionButton) return;

	actionButton.classList.add('betterfloat-pricempire-link');
	actionButton.href = `https://pricempire.com/item/${encodeURIComponent(item.title)}`;
	actionButton.setAttribute('aria-label', 'Pricempire');
	actionButton.setAttribute('title', 'Pricempire');
	const label = actionButton.querySelector('span');
	if (label) label.textContent = 'Pricempire';
	quickLinks.style.gridTemplateColumns = 'repeat(3, minmax(0, 1fr))';
	quickLinks.appendChild(actionButton);
}

async function patternDetections(container: Element, item: DMarket.CachedListing, isPopout: boolean) {
	if (item.title.includes('AK-47 | Aphrodite')) {
		aphroditeDetection(container, item, isPopout);
	} else if (item.title.includes('Case Hardened') || item.title.includes('Heat Treated')) {
		if (extensionSettings['dm-csbluegem'] || isPopout) {
			await caseHardenedDetection(container, item, isPopout);
		}
	}
}

function aphroditeDetection(container: Element, item: DMarket.CachedListing, isPopout: boolean) {
	const paintSeed = getDMarketPaintSeed(item);
	if (paintSeed === undefined || container.querySelector('.betterfloat-aphrodite-badge')) return;

	const gem = AphroditeMapping[paintSeed];
	if (!gem) return;

	const type = gem.type.charAt(0).toUpperCase() + gem.type.slice(1);
	const label = `${type} Gem${gem.tier ? ` · Tier ${gem.tier}` : ''}`;
	const badge = document.createElement('div');
	badge.className = `betterfloat-aphrodite-badge${isPopout ? ' betterfloat-aphrodite-badge--large' : ''}`;
	badge.title = label;
	badge.setAttribute('aria-label', label);
	badge.innerHTML = generateAphroditeIcon(gem.type, gem.tier, isPopout ? 30 : 20);

	const target = isPopout ? container.querySelector(DMARKET_SELECTORS.popup.title) : container.querySelector(DMARKET_SELECTORS.market.pattern)?.parentElement;
	if (!target) return;

	target.classList.add('betterfloat-aphrodite-target');
	if (isPopout) target.appendChild(badge);
	else target.prepend(badge);
}

async function caseHardenedDetection(container: Element, item: DMarket.CachedListing, isPopout: boolean) {
	const paintSeed = getDMarketPaintSeed(item);
	if (item.title.includes('Gloves') || paintSeed === undefined || container.querySelector('.betterfloat-gem-container')) return;

	let patternElement: Partial<BlueGem.PatternData> | null = null;
	const type = getOldBlueGemName(item.title.replace('StatTrak™ ', ''));
	if (!type) return false;

	patternElement = await fetchBlueGemPatternData({ type: type.replaceAll(' ', '_'), pattern: paintSeed });
	container.setAttribute('data-bluegemlab', JSON.stringify(patternElement));
	if (!patternElement) {
		console.warn('[BetterFloat] Could not fetch pattern data for ', item.title);
		return false;
	}

	// add gem icon and blue gem percent badge
	if (!item.title.includes('Gloves')) {
		const patternContainer = isPopout ? container.querySelector(DMARKET_SELECTORS.popup.title) : container.querySelector(DMARKET_SELECTORS.market.pattern)?.parentElement;
		if (!patternContainer) return;

		patternContainer.classList.add('betterfloat-pattern-target');

		const gemContainer = genGemContainer({ patternElement, site: 'DM', large: isPopout });
		if (!gemContainer) return;
		gemContainer.setAttribute('style', 'display: flex; align-items: center; justify-content: flex-end;');
		if (!container.querySelector('.betterfloat-gem-container')) {
			patternContainer.appendChild(gemContainer);
		}
	}
}

async function addBuffPrice(item: DMarket.CachedListing, container: Element, state: PageState): Promise<PriceResult> {
	const { source, itemStyle, itemPrice, buff_name, market_id, priceListing, priceOrder, priceFromReference, difference, currency } = await getBuffItem(item);

	const priceSelector = state === PageState.Market ? DMARKET_SELECTORS.market.price : state === PageState.Inventory ? DMARKET_SELECTORS.inventory.price : DMARKET_SELECTORS.popup.price;
	const priceRow = container.querySelector(priceSelector)?.parentElement;

	const isDoppler = buff_name.includes('Doppler') && buff_name.includes('|');
	const maximumFractionDigits = priceListing?.gt(1000) && priceOrder?.gt(10) ? 0 : 2;
	const currencyFormatter = CurrencyFormatter(currency.text ?? 'USD', 0, maximumFractionDigits);

	if (priceRow && !container.querySelector('.betterfloat-buffprice')) {
		const buffContainer = generatePriceLine({
			source,
			market_id,
			buff_name,
			priceOrder,
			priceListing,
			priceFromReference,
			userCurrency: currency.text ?? 'USD',
			itemStyle: itemStyle as DopplerPhase,
			CurrencyFormatter: currencyFormatter,
			isDoppler,
			isPopout: state === PageState.Popup,
			addSpaceBetweenPrices: true,
			showPrefix: false,
			iconHeight: state === PageState.Popup ? '20px' : '18px',
			hasPro: isUserPro(extensionSettings['user']),
		});
		priceRow.insertAdjacentHTML('afterend', buffContainer);

		const buffElement = container.querySelector<HTMLAnchorElement>('.betterfloat-buff-a');
		if (buffElement) {
			attachMarketPopover(buffElement, { isPro: isUserPro(extensionSettings['user']), currencyRate: currency.rate ?? 1 });
		}
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
			<div class="betterfloat-sale-tag ${state === PageState.Popup ? 'betterfloat-big-sale' : ''}" style="background-color: ${background}; color: ${color};">
				${extensionSettings['dm-buffdifference'] ? html`<span>${difference.isPos() ? '+' : '-'}${currencyFormatter.format(absDifference.toNumber())} </span>` : ''}
				${extensionSettings['dm-buffdifferencepercent'] ? html`<span>(${percentage.gt(150) ? percentage.toFixed(0) : percentage.toFixed(2)}%)</span>` : ''}
            </div>
        `;

		priceContainer.insertAdjacentHTML('afterend', buffPriceHTML);

		container.querySelector('asset-overprice-tag')?.remove();

		setTimeout(() => {
			const discountBadge = container.querySelector('asset-discount-tag');
			if (discountBadge) {
				discountBadge.remove();
			}
		}, 500);
	}

	return {
		price_difference: difference,
	};
}

async function getBuffItem(item: DMarket.CachedListing) {
	let source = (extensionSettings['dm-pricingsource'] as MarketSource) ?? MarketSource.Buff;
	const buff_item = createBuffItem(item);
	const buff_name = handleSpecialStickerNames(buff_item.name);
	let { priceListing, priceOrder } = await getBuffPrice(buff_name, buff_item.style, source);

	if (((!priceListing && !priceOrder) || (priceListing?.isZero() && priceOrder?.isZero())) && extensionSettings['csm-altmarket'] && extensionSettings['csm-altmarket'] !== MarketSource.None) {
		source = extensionSettings['csm-altmarket'] as MarketSource;
		const altPrices = await getBuffPrice(buff_name, buff_item.style, source);
		priceListing = altPrices.priceListing;
		priceOrder = altPrices.priceOrder;
	}
	const market_id = await getMarketID(buff_name, source);

	let itemPrice = getDMarketItemPrice(item);
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
		Number(extensionSettings['dm-pricereference']) === 0 &&
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

function createBuffItem(item: DMarket.CachedListing): { name: string; style: ItemStyle } {
	const buff_item = {
		name: item.title,
		style: '' as ItemStyle,
	};
	const phase = getDMarketPhase(item);
	if (phase) {
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
	Inventory = 1,
	Popup = 2,
}

// mutation observer active?
let isObserverActive = false;
let extensionSettings: IStorage;

init();
