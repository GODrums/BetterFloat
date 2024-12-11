import Decimal from 'decimal.js';
import type { PlasmoCSConfig } from 'plasmo';

import { html } from 'common-tags';
import type { BuffMarket } from '~lib/@typings/BuffmarketTypes';
import type { DopplerPhase, ItemStyle } from '~lib/@typings/FloatTypes';
import { activateHandler, initPriceMapping } from '~lib/handlers/eventhandler';
import { BigCurrency, SmallCurrency, getBuffCurrencyRate, getBuffGoodsInfo, getBuffMarketItem, getFirstBuffPageItem, getMarketID } from '~lib/handlers/mappinghandler';
import { MarketSource } from '~lib/util/globals';
import { getBuffPrice, handleSpecialStickerNames, isBuffBannedItem } from '~lib/util/helperfunctions';
import { getAllSettings, type IStorage } from '~lib/util/storage';
import { generatePriceLine } from '~lib/util/uigeneration';

export const config: PlasmoCSConfig = {
	matches: ['https://*.buff.market/*'],
	run_at: 'document_end',
	css: ['../css/buffmarket_styles.css'],
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

				if (addedNode.className.endsWith('goods-item')) {
					// item in buy-tab
					// if (!addedNode?.children[0].children[0].className.includes('goods-card')) continue;
					const state = location.pathname.includes('inventory') ? PageState.Inventory : PageState.Market;
					await adjustItem(addedNode, state);
				} else if (addedNode.className.startsWith('market-goods-sell')) {
					for (let i = 1; i < addedNode.children.length; i++) {
						// items in item page but without title or recommendations
						if (addedNode.children[i].className.includes('content')) {
							await adjustItem(addedNode.children[i], PageState.ItemPage);
						}
					}
				}
			}
		}
	});
	observer.observe(document, { childList: true, subtree: true });
}

async function adjustItem(container: Element, state: PageState) {
	let hrefTag = state === PageState.ItemPage ? location.pathname.split('/').at(-1) : container.firstElementChild?.getAttribute('href')?.split('/').at(-1);
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
			return getFirstBuffPageItem();
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
	const priceResult = await addBuffPrice(apiItem!, container, state);
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

	const referencePrice = parseInt(extensionSettings['bm-referenceprice']) === 0 ? priceOrder : priceListing;

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
	// if (buff_item.name === '') {
	// 	buff_item.name = cached_item_name;
	// }
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
}

function getFooterContainer(state: PageState, container: Element): HTMLElement | null {
	let footerContainer: HTMLElement | null = null;
	if (state === PageState.ItemPage) {
		footerContainer = document.querySelector('.goods-message');
	} else if (state === PageState.Market) {
		footerContainer = container.querySelector('.goods-info-sell');
	} else if (state === PageState.Inventory) {
		footerContainer = container.querySelector('.goods-item-info');
	}
	if (!footerContainer) {
		footerContainer = container.querySelector('.goods-item-info');
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

	const footerContainer = getFooterContainer(state, container);
	const currencyItem = getBuffCurrencyRate();
	const isDoppler = buff_name.includes('Doppler') && buff_name.includes('|');
	const CurrencyFormatter = new Intl.NumberFormat(undefined, {
		style: 'currency',
		currency: currencyRate.value,
		currencyDisplay: 'narrowSymbol',
		minimumFractionDigits: 0,
		maximumFractionDigits: 2,
	});
	const buffContainer = generatePriceLine({
		source,
		market_id,
		buff_name,
		priceOrder,
		priceListing,
		priceFromReference,
		userCurrency: currencyItem?.symbol ?? '$',
		itemStyle: buff_item.style as DopplerPhase,
		CurrencyFormatter,
		isDoppler,
		isPopout: false,
		priceClass: 'suggested-price',
		addSpaceBetweenPrices: false,
		showPrefix: false,
	});
	if (footerContainer) {
		if (state === PageState.ItemPage) {
			if (!document.querySelector('.betterfloat-buffprice')) {
				footerContainer.innerHTML = `<div style="display: flex; flex-direction: column;">${footerContainer.innerHTML}</div>`;
				footerContainer.firstElementChild?.insertAdjacentHTML('beforeend', buffContainer);
			}
		} else if (!container.querySelector('.betterfloat-buffprice')) {
			footerContainer.insertAdjacentHTML('beforeend', buffContainer);
		}
	}

	let priceContainer: HTMLElement | null = null;
	let newline = false;
	let itemPrice = 0.0;
	if (state === PageState.ItemPage) {
		priceContainer = container.querySelector('.market-goods-sell-col-price');
	} else if (location.pathname.includes('best_deals')) {
		priceContainer = container.querySelector('.user-price');
		newline = true;
	} else {
		priceContainer = container.querySelector('.user-price')?.parentElement as HTMLElement;
		itemPrice = parseFloat(container.querySelector('.user-price')?.textContent?.trim().substring(1) ?? '0');
		difference = new Decimal(itemPrice).minus(priceFromReference ?? 0);
	}
	if (priceContainer) {
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
		const percentage = new Decimal(location.pathname.includes('market/all') ? itemPrice : getItemPrice(item)).div(priceFromReference ?? 0).mul(100);
		const { color, background: backgroundColor } = percentage.gt(100) ? styling.loss : styling.profit;

		const saleTagStyle = `background-color: ${backgroundColor}; color: ${color}; padding: 1px 5px; border-radius: 4px; ${state === PageState.ItemPage ? 'font-size: 14px;' : 'margin-left: 10px;'}`;
		const formattedPrice =
			absDifference.gt(1000) && state !== PageState.ItemPage
				? BigCurrency(currencyRate.value).format(absDifference.toNumber())
				: SmallCurrency(currencyRate.value).format(absDifference.toNumber());

		const buffPriceHTML = html`
			<div class="sale-tag betterfloat-sale-tag" style="${saleTagStyle}" data-betterfloat="${difference}">
				<span>${difference.isPositive() ? '+' : '-'}${formattedPrice}</span>
			${!percentage.isNaN() ? html`<span>(${percentage.gt(150) ? percentage.toFixed(0) : percentage.toFixed(2)}%)</span></div>` : ''}
		`;

		priceContainer.insertAdjacentHTML(newline ? 'afterend' : 'beforeend', buffPriceHTML);

		container.querySelector('.goods-item-info-discount')?.remove();
	}
	const infoIcon = container.querySelector('.goods-item-info-icon');
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
