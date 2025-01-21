import Decimal from 'decimal.js';
import type { PlasmoCSConfig } from 'plasmo';

import { html } from 'common-tags';
import type { BuffMarket } from '~lib/@typings/BuffmarketTypes';
import type { DopplerPhase, ItemStyle } from '~lib/@typings/FloatTypes';
import { getBuffCurrencyRate, getBuffGoodsInfo, getBuffMarketItem, getBuffPopoutItem, getFirstBuffBuyOrder, getFirstBuffPageItem } from '~lib/handlers/cache/buffmarket_cache';
import { activateHandler, initPriceMapping } from '~lib/handlers/eventhandler';
import { BigCurrency, SmallCurrency, getMarketID } from '~lib/handlers/mappinghandler';
import { BUFFMARKET_SELECTORS } from '~lib/handlers/selectors/buffmarket_selectors';
import { ICON_CLOCK, MarketSource } from '~lib/util/globals';
import { CurrencyFormatter, calculateTime, checkUserPlanPro, getBuffPrice, handleSpecialStickerNames, isBuffBannedItem } from '~lib/util/helperfunctions';
import { type IStorage, getAllSettings } from '~lib/util/storage';
import { generatePriceLine } from '~lib/util/uigeneration';

export const config: PlasmoCSConfig = {
	matches: ['https://*.buff.market/*'],
	run_at: 'document_end',
	css: ['../css/hint.min.css', '../css/common_styles.css', '../css/buffmarket_styles.css'],
};

type PriceResult = {
	price_difference: number;
};

async function init() {
	console.time('[BetterFloat] BuffMarket init timer');

	if (location.host !== 'buff.market') {
		return;
	}
	// catch the events thrown by the script
	// this has to be done as first thing to not miss timed events
	activateHandler();

	extensionSettings = await getAllSettings();
	console.log('[BetterFloat] Extension settings:', extensionSettings);

	if (!extensionSettings['bm-enable']) return;

	// check if user has the required plan
	if (!(await checkUserPlanPro(extensionSettings['user']))) {
		console.log('[BetterFloat] Pro plan required for BuffMarket features');
		return;
	}

	await initPriceMapping(extensionSettings, 'bm');

	console.timeEnd('[BetterFloat] BuffMarket init timer');

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
				// console.debug('[BetterFloat] Mutation detected:', addedNode, addedNode.tagName, addedNode.className.toString());

				if (addedNode.className.endsWith(BUFFMARKET_SELECTORS.MUTATION.BUY_TAB)) {
					// item in buy-tab
					// skip ads
					if (addedNode.querySelector('.is-topics')) continue;
					const state = location.pathname.includes('inventory') ? PageState.Inventory : PageState.Market;
					await adjustItem(addedNode, state);
				} else if (addedNode.classList.contains(BUFFMARKET_SELECTORS.MUTATION.ITEM_PAGE)) {
					await adjustItem(addedNode, PageState.ItemPage);
				} else if (addedNode.className.startsWith(BUFFMARKET_SELECTORS.MUTATION.MINIMAL_ITEM)) {
					// addedNode.className.startsWith(BUFFMARKET_SELECTORS.MUTATION.BUY_ORDER)
					for (let i = 1; i < addedNode.children.length; i++) {
						// items in item page but without title or recommendations
						if (addedNode.children[i].className.includes('content')) {
							await adjustItem(addedNode.children[i], PageState.ItemPage);
						}
					}
				} else if (addedNode.className.startsWith(BUFFMARKET_SELECTORS.MUTATION.MODAL)) {
					const popup = addedNode.querySelector(BUFFMARKET_SELECTORS.MUTATION.POPUP);
					if (popup) {
						await adjustItem(popup, PageState.Popup);
					}
				}
			}
		}
	});
	observer.observe(document, { childList: true, subtree: true });
}

async function adjustItem(container: Element, state: PageState) {
	let hrefTag = [PageState.ItemPage, PageState.Popup].includes(state) ? location.pathname.split('/')?.[3] : container.firstElementChild?.getAttribute('href')?.split('/').at(-1);
	if (!hrefTag) {
		hrefTag = container.querySelector('a.font16')?.getAttribute('href')?.split('/').at(-1) ?? '0';
	}
	const itemId = parseInt(hrefTag);
	if (!itemId) {
		console.error('[BetterFloat] No item ID found: ', container, state);
		return;
	}
	const getApiItem = () => {
		if (state === PageState.ItemPage) {
			const isBuyOrderPage = container.parentElement?.className.includes(BUFFMARKET_SELECTORS.MUTATION.BUY_ORDER);
			return isBuyOrderPage ? getFirstBuffBuyOrder() : getFirstBuffPageItem();
		} else if (state === PageState.Popup) {
			return getBuffPopoutItem();
		}
		return getBuffMarketItem(itemId);
	};
	let apiItem = getApiItem();
	let attempts = 0;
	while (!apiItem && attempts++ < 5) {
		// wait for 1s and try again
		console.log('[BetterFloat] No item found, waiting 1s and trying again...');
		await new Promise((resolve) => setTimeout(resolve, 1000));
		apiItem = getApiItem();
	}
	if (!apiItem) {
		console.error('[BetterFloat] No item found after 5 attempts');
		return;
	}

	// console.log('[BetterFloat] Adjusting item: ', apiItem, container);
	// eslint-disable-next-line @typescript-eslint/no-unused-vars
	const priceResult = await addBuffPrice(apiItem, container, state);

	if (state === PageState.ItemPage && extensionSettings['bm-listingage']) {
		addListingAge(container, apiItem);
	}
}

function addListingAge(container: Element, item: BuffMarket.Item) {
	const sellerContainer = container.querySelector(BUFFMARKET_SELECTORS.PAGE.SELLER_CONTAINER);
	const sellOrderItem = item as BuffMarket.SellOrderListing;

	if (!sellerContainer || !sellOrderItem.created_at) return;

	const listingAge = html`
		<div 
			class="betterfloat-listing-age hint--bottom hint--rounded hint--no-arrow" 
			aria-label="${new Date(sellOrderItem.created_at * 1000).toUTCString()}"
			style="display: flex; align-items: center;"
		>
			<img src="${ICON_CLOCK}" style="height: 16px; filter: brightness(0) saturate(100%) invert(59%) sepia(55%) saturate(3028%) hue-rotate(340deg) brightness(101%) contrast(101%); translate: 0 1px;" />
			<p style="margin-left: 4px; font-size: 13px; color: #9EA7B1;">${calculateTime(Number(sellOrderItem.created_at))}</p>
		</div>
	`;

	sellerContainer.insertAdjacentHTML('beforeend', listingAge);
}

async function getBuffItem(item: ExtendedBuffItem) {
	let source = (extensionSettings['bm-pricingsource'] as MarketSource) ?? MarketSource.Buff;
	const buff_name = handleSpecialStickerNames(item.name);

	let { priceListing, priceOrder } = await getBuffPrice(buff_name, item.style, source);

	if (source === MarketSource.Buff && isBuffBannedItem(buff_name)) {
		priceListing = new Decimal(0);
		priceOrder = new Decimal(0);
	}

	if (((!priceListing && !priceOrder) || (priceListing?.isZero() && priceOrder?.isZero())) && extensionSettings['bm-altmarket'] && extensionSettings['bm-altmarket'] !== MarketSource.None) {
		source = extensionSettings['bm-altmarket'] as MarketSource;
		const altPrices = await getBuffPrice(buff_name, item.style, source);
		priceListing = altPrices.priceListing;
		priceOrder = altPrices.priceOrder;
	}
	const market_id = getMarketID(buff_name, source);

	const currencyItem = getBuffCurrencyRate();
	if (!currencyItem) {
		console.error('[BetterFloat] No currency rate found. Please report this issue.');
	}
	if (priceListing && currencyItem?.rate) {
		priceListing = priceListing.mul(currencyItem.rate);
	}
	if (priceOrder && currencyItem?.rate) {
		priceOrder = priceOrder.mul(currencyItem.rate);
	}

	const referencePrice = Number(extensionSettings['bm-pricereference']) === 0 && [MarketSource.Buff, MarketSource.Steam].includes(source) ? priceOrder : priceListing;

	const priceDifference = referencePrice ? item.price.minus(referencePrice) : new Decimal(0);
	return {
		buff_name,
		market_id,
		priceListing,
		priceOrder,
		priceFromReference: referencePrice,
		difference: priceDifference,
		currencyRate: currencyItem,
		source,
	};
}

function getItemPrice(item: BuffMarket.Item): number {
	if ((<BuffMarket.MarketListing>item).sell_min_price) {
		return Number((<BuffMarket.MarketListing>item).sell_min_price);
	} else if ((<BuffMarket.SellOrderListing>item).price) {
		const currencyRate = getBuffCurrencyRate();
		return Number((<BuffMarket.SellOrderListing>item).price) * (currencyRate?.rate ?? 1);
	}
	return 0;
}

type ExtendedBuffItem = {
	name: string;
	style: ItemStyle;
	price: Decimal;
};

function createBuffItem(item?: BuffMarket.Item): ExtendedBuffItem {
	const buff_item: ExtendedBuffItem = {
		name: '',
		style: '' as ItemStyle,
		price: new Decimal(0),
	};
	if ((<BuffMarket.MarketListing>item)?.market_hash_name) {
		buff_item.name = (<BuffMarket.MarketListing>item)?.market_hash_name;
	} else if ((<BuffMarket.SellOrderListing>item).price) {
		const goods_info = getBuffGoodsInfo((<BuffMarket.SellOrderListing>item).goods_id);
		buff_item.name = goods_info?.market_hash_name;
	}
	if ((<BuffMarket.InventoryItem>item)?.asset_info?.info?.metaphysic?.data?.name) {
		switch ((<BuffMarket.InventoryItem>item)?.asset_info?.info?.metaphysic?.data?.name) {
			case 'P1':
				buff_item.style = 'Phase 1';
				break;
			case 'P2':
				buff_item.style = 'Phase 2';
				break;
			case 'P3':
				buff_item.style = 'Phase 3';
				break;
			case 'P4':
				buff_item.style = 'Phase 4';
				break;
		}
	}
	if (item) {
		buff_item.price = new Decimal(getItemPrice(item));
	}
	return buff_item;
}

enum PageState {
	Market = 0,
	ItemPage = 1,
	Inventory = 2,
	Popup = 3,
}

function getFooterContainer(state: PageState, container: Element): HTMLElement | null {
	let footerContainer: HTMLElement | null = null;
	if (state === PageState.ItemPage) {
		footerContainer = document.querySelector(BUFFMARKET_SELECTORS.STATE.ITEMPAGE.FOOTER);
	} else if (state === PageState.Market) {
		footerContainer = container.querySelector(BUFFMARKET_SELECTORS.STATE.MARKET.FOOTER);
	} else if (state === PageState.Inventory) {
		footerContainer = container.querySelector(BUFFMARKET_SELECTORS.STATE.INVENTORY.FOOTER);
	} else if (state === PageState.Popup) {
		footerContainer = container.querySelector(BUFFMARKET_SELECTORS.STATE.POPUP.FOOTER);
	}
	if (!footerContainer) {
		footerContainer = container.querySelector(BUFFMARKET_SELECTORS.STATE.INVENTORY.FOOTER);
	}
	return footerContainer;
}

async function addBuffPrice(item: BuffMarket.Item, container: Element, state: PageState): Promise<PriceResult> {
	const buff_item = createBuffItem(item);
	let { buff_name, market_id, priceListing, priceOrder, priceFromReference, difference, currencyRate, source } = await getBuffItem(buff_item);

	if (!currencyRate) {
		console.error('[BetterFloat] No currency rate found. Please report this issue.');
		return {
			price_difference: 0,
		};
	}

	container.querySelector<HTMLElement>(BUFFMARKET_SELECTORS.PAGE.CARD)?.setAttribute('style', 'overflow: visible;');

	const footerContainer = getFooterContainer(state, container);
	const currencyItem = getBuffCurrencyRate();
	const isDoppler = buff_name.includes('Doppler') && buff_name.includes('|');
	const buffContainer = generatePriceLine({
		source,
		market_id,
		buff_name,
		priceOrder,
		priceListing,
		priceFromReference,
		userCurrency: currencyItem?.symbol ?? '$',
		itemStyle: buff_item.style as DopplerPhase,
		CurrencyFormatter: CurrencyFormatter(currencyRate.value),
		isDoppler,
		isPopout: state === PageState.Popup,
		addSpaceBetweenPrices: false,
		showPrefix: false,
	});
	if (footerContainer) {
		if (state === PageState.ItemPage) {
			if (!document.querySelector('.betterfloat-buffprice')) {
				footerContainer.innerHTML = `<div style="display: flex; flex-direction: column; align-items: flex-start;">${footerContainer.innerHTML}</div>`;
				footerContainer.firstElementChild?.insertAdjacentHTML('beforeend', buffContainer);
			}
		} else if (!container.querySelector('.betterfloat-buffprice')) {
			footerContainer.insertAdjacentHTML('beforeend', buffContainer);
		}
	}

	let priceContainer: HTMLElement | null = null;
	let newline = false;
	if (state === PageState.ItemPage) {
		priceContainer = container.querySelector(BUFFMARKET_SELECTORS.STATE.ITEMPAGE.PRICE);
	} else if (location.pathname.includes('best_deals')) {
		priceContainer = container.querySelector(BUFFMARKET_SELECTORS.STATE.ITEMPAGE.PRICE_ALT);
		newline = true;
	} else if (state === PageState.Popup) {
		priceContainer = container.querySelector(BUFFMARKET_SELECTORS.STATE.POPUP.PRICE);
	} else {
		priceContainer = container.querySelector(BUFFMARKET_SELECTORS.STATE.ITEMPAGE.PRICE_ALT)?.parentElement as HTMLElement;
		difference = new Decimal(getItemPrice(item)).minus(priceFromReference ?? 0);
	}
	if (priceContainer && !container.querySelector('.betterfloat-sale-tag') && (extensionSettings['bm-buffdifference'] || extensionSettings['bm-buffdifferencepercent'])) {
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

		const absDifference = difference.abs();
		const percentage = new Decimal(getItemPrice(item)).div(priceFromReference ?? 0).mul(100);
		const { color, background: backgroundColor } = percentage.gt(100) ? styling.loss : styling.profit;

		const saleTagStyle = `background-color: ${backgroundColor}; color: ${color}; ${state === PageState.ItemPage ? 'display: inline; font-size: 14px;' : 'margin-left: 10px;'} ${state === PageState.Popup ? 'line-height: 22px; translate: 0 -5px;' : ''}`;
		const formattedPrice =
			absDifference.gt(1000) && state !== PageState.ItemPage
				? BigCurrency(currencyRate.value).format(absDifference.toNumber())
				: SmallCurrency(currencyRate.value).format(absDifference.toNumber());

		const buffPriceHTML = html`
			<div class="sale-tag betterfloat-sale-tag" style="${saleTagStyle}" data-betterfloat="${difference}">
				${extensionSettings['bm-buffdifference'] ? html`<span>${difference.isPositive() ? '+' : '-'}${formattedPrice}</span>` : ''}
				${!percentage.isNaN() && extensionSettings['bm-buffdifferencepercent'] ? html`<span>(${percentage.gt(150) ? percentage.toFixed(0) : percentage.toFixed(2)}%)</span>` : ''}
			</div>
		`;

		container.querySelector(BUFFMARKET_SELECTORS.PAGE.DISCOUNT)?.remove();

		if (state === PageState.Popup) {
			const priceElements = Array.from(priceContainer.children).slice(0, 2);
			const newPriceContainer = document.createElement('div');
			newPriceContainer.setAttribute('style', 'display: flex; align-items: baseline;');
			for (const element of priceElements) {
				newPriceContainer.appendChild(element);
			}
			newPriceContainer.insertAdjacentHTML('beforeend', buffPriceHTML);
			priceContainer.firstChild?.before(newPriceContainer);
		} else {
			priceContainer.insertAdjacentHTML(newline ? 'afterend' : 'beforeend', buffPriceHTML);
		}
	}
	const infoIcon = container.querySelector(BUFFMARKET_SELECTORS.PAGE.INFO_ICON);
	if (infoIcon) {
		infoIcon.remove();
	}

	return {
		price_difference: difference.toNumber(),
	};
}

// mutation observer active?
let isObserverActive = false;
// let cached_item_name = '';
let extensionSettings: IStorage;

init();
