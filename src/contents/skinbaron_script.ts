import Decimal from 'decimal.js';
import type { PlasmoCSConfig } from 'plasmo';

import { html } from 'common-tags';
import type { DopplerPhase, ItemStyle } from '~lib/@typings/FloatTypes';
import type { Skinbaron } from '~lib/@typings/SkinbaronTypes';
import { getFirstSkinbaronItem, rotateSkinbaronItems } from '~lib/handlers/cache/skinbaron_cache';
import { activateHandler, initPriceMapping } from '~lib/handlers/eventhandler';
import { getAndFetchCurrencyRate, getMarketID } from '~lib/handlers/mappinghandler';
import { MarketSource } from '~lib/util/globals';
import { CurrencyFormatter, getBuffPrice, handleSpecialStickerNames, isBuffBannedItem } from '~lib/util/helperfunctions';
import { type IStorage, getAllSettings } from '~lib/util/storage';
import { generatePriceLine } from '~lib/util/uigeneration';

export const config: PlasmoCSConfig = {
	matches: ['*://*.skinbaron.de/*'],
	run_at: 'document_end',
	css: ['../css/hint.min.css', '../css/common_styles.css', '../css/skinbaron_styles.css'],
};

type PriceResult = {
	price_difference: Decimal;
};

async function init() {
	console.time('[BetterFloat] Skinbaron init timer');

	if (!location.hostname.includes('skinbaron.de')) {
		return;
	}
	// catch the events thrown by the script
	// this has to be done as first thing to not miss timed events
	activateHandler();

	extensionSettings = await getAllSettings();
	console.log('[BetterFloat] Extension settings:', extensionSettings);

	if (!extensionSettings['baron-enable']) return;

	await initPriceMapping(extensionSettings, 'baron');

	console.timeEnd('[BetterFloat] Skinbaron init timer');

	await firstLaunch();

	// mutation observer is only needed once
	if (!isObserverActive) {
		isObserverActive = true;
		applyMutation();
		console.log('[BetterFloat] Mutation observer started');
	}
}

async function firstLaunch() {
	if (location.pathname === '/en') {
		const suggestedItems = document.querySelectorAll('.recentlyviewed-container .promo-item');
		for (let i = 0; i < suggestedItems.length; i++) {
			adjustItem(suggestedItems[i], itemSelectors.promo);
		}

		const offerItems = document.querySelectorAll('.topoffers-container .promo-item');
		for (let i = 0; i < offerItems.length; i++) {
			adjustItem(offerItems[i], itemSelectors.promo);
		}
	} else if (location.pathname.startsWith('/en/csgo/')) {
		const items = document.querySelectorAll('.product-box');

		for (let i = 0; i < items.length; i++) {
			adjustItem(items[i], itemSelectors.card);
		}
	}
}

const itemSelectors = {
	promo: {
		priceDiv: '.price-wrapper',
		saleWrapper: '.price-wrapper',
	},
	card: {
		priceDiv: '.price-wrapper',
		saleWrapper: '.price-wrapper',
	},
	modal: {
		priceDiv: '.product-price-heading',
		saleWrapper: '.product-price-heading',
	},
} as const;

type ItemSelectors = (typeof itemSelectors)[keyof typeof itemSelectors];

function applyMutation() {
	const observer = new MutationObserver(async (mutations) => {
		for (const mutation of mutations) {
			for (let i = 0; i < mutation.addedNodes.length; i++) {
				const addedNode = mutation.addedNodes[i];
				// some nodes are not elements, so we need to check
				if (!(addedNode instanceof HTMLElement)) continue;
				// console.debug('[BetterFloat] Mutation detected:', addedNode, addedNode.tagName, addedNode.className.toString());

				if (addedNode.className) {
					const className = addedNode.className.toString();
					if (className.includes('product-box')) {
						// console.log('Found product: ', addedNode);
						await adjustItem(addedNode, itemSelectors.card);
					} else if (className.includes('product-card')) {
						// offer in list on item page
					} else if (className.includes('promo-item')) {
						// item card
						await adjustItem(addedNode, itemSelectors.promo);
					} else if (className.includes('item-category')) {
						// ?
					}
				}
			}
		}
	});
	observer.observe(document, { childList: true, subtree: true });
}

async function adjustItem(container: Element, selector: ItemSelectors) {
	// const item = getSkinbaronItem(container);
	const nameDivClass = location.pathname === '/en' ? '.lName' : '.product-name';
	const item_name = getHTMLItemName(container, nameDivClass);

	const cachedItem = await getFirstSkinbaronItem();
	if (!cachedItem) return;

	const item = isMassItem(cachedItem) ? (cachedItem as Skinbaron.MassItem) : (cachedItem as Skinbaron.SingleItem);
	// includes instead of equality as localizedName does not contain StatTrak
	if (!item_name.includes(item.extendedProductInformation.localizedName) && !item.extendedProductInformation.localizedName.includes(item_name)) {
		console.warn('Item name does not match. ', item_name, item.extendedProductInformation.localizedName);
		return;
	}
	await addBuffPrice(item, container, selector);

	// store for popouts
	container.setAttribute('data-betterfloat', JSON.stringify(item));

	// add eventlistener for modal popout
	container.querySelector('.click-wrapper')?.addEventListener('click', () => {
		setTimeout(async () => {
			const popout = document.querySelector('sb-extended-offer-info');
			console.log('Popout: ', popout);
			if (popout) {
				await addBuffPrice(item, popout, itemSelectors.modal);
			}
		}, 1000);
	});
}
function isMassItem(item: Skinbaron.Item) {
	return Object.keys(item).includes('variant');
}

function createBuffItem(item: Skinbaron.Item) {
	const buffItem = {
		name: '',
		style: '' as ItemStyle,
	};
	const singleItem = item as Skinbaron.SingleItem;
	buffItem.name = singleItem.singleOffer
		? singleItem.singleOffer.localizedName +
			(!singleItem.singleOffer.localizedExteriorName || singleItem.singleOffer.localizedExteriorName === 'Not Painted' ? '' : ` (${singleItem.singleOffer.localizedExteriorName})`)
		: singleItem.extendedProductInformation.localizedName;
	if (singleItem.singleOffer?.statTrakString) {
		buffItem.name = `${singleItem.singleOffer.statTrakString} ${buffItem.name.replace('★ ', '')}`;
	} else if (singleItem.singleOffer?.souvenirString) {
		buffItem.name = `${singleItem.singleOffer.souvenirString} ${buffItem.name}`;
	}
	if (
		(singleItem.singleOffer?.localizedVariantTypeName === 'Knife' ||
			singleItem.singleOffer?.localizedName?.includes('Gloves') ||
			singleItem.offerLink?.includes('typeName=Knife') ||
			singleItem.singleOffer?.localizedName?.includes('Hand Wraps')) &&
		!buffItem.name.startsWith('★')
	) {
		buffItem.name = `★ ${buffItem.name}`;
	}
	if (singleItem.offerLink?.includes('typeName=Sticker') && !buffItem.name.startsWith('Sticker | ')) {
		buffItem.name = `Sticker | ${buffItem.name}`;
	}
	if (buffItem.name.includes('Holo/Foil')) {
		buffItem.name = buffItem.name.replace('Holo/Foil', 'Holo-Foil');
	}
	if (singleItem.singleOffer?.dopplerClassName) {
		if (singleItem.singleOffer.dopplerClassName.includes('phase')) {
			buffItem.style = `Phase ${singleItem.singleOffer.dopplerClassName.at(-1)}` as DopplerPhase;
		} else if (singleItem.singleOffer.dopplerClassName.includes('saphhire')) {
			buffItem.style = 'Sapphire' as DopplerPhase;
		} else if (singleItem.singleOffer.dopplerClassName.includes('ruby')) {
			buffItem.style = 'Ruby' as DopplerPhase;
		} else if (singleItem.singleOffer.dopplerClassName.includes('blackpearl')) {
			buffItem.style = 'Black Pearl' as DopplerPhase;
		} else if (singleItem.singleOffer.dopplerClassName.includes('emerald')) {
			buffItem.style = 'Emerald' as DopplerPhase;
		}
	}

	// console.log('Buff name: ', buff_name);
	return buffItem;
}

function getHTMLItemName(container: Element, name_class: string): string {
	return container.querySelector(name_class)?.textContent?.trim() ?? '';
}

/**
 * HTML parsing for Skinbaron items
 * @deprecated get item from API instead
 * @param container
 * @returns
 */
function getSkinbaronItem(container: Element): Skinbaron.HTMLItem {
	const isStatTrak = container.querySelector('.badge-danger')?.textContent?.includes('StatTrak') ?? false;
	const type = container.querySelector('.badge-purple')?.textContent?.trim() ?? '';
	const name = container.querySelector('.lName')?.textContent?.trim() ?? '';

	const condition = container.querySelector('.exteriorName')?.textContent?.trim() ?? '';
	const wear = Number(container.querySelector('.wearPercent')?.textContent?.split('%')[0] ?? 0 / 100);

	const getWear = (wear: number) => {
		let wearName = '';
		if (wear < 0.07) {
			wearName = 'Factory New';
		} else if (wear >= 0.07 && wear < 0.15) {
			wearName = 'Minimal Wear';
		} else if (wear >= 0.15 && wear < 0.38) {
			wearName = 'Field-Tested';
		} else if (wear >= 0.38 && wear < 0.45) {
			wearName = 'Well-Worn';
		} else if (wear >= 0.45) {
			wearName = 'Battle-Scarred';
		}
		return wearName;
	};

	const wear_name = getWear(wear);

	const price = Number(container.querySelector('.price')?.textContent?.replace('€', '')?.trim() ?? 0);

	return {
		name: name,
		type: type,
		condition: condition,
		price: price,
		wear: wear,
		wear_name: wear_name,
		isStatTrak: isStatTrak,
	};
}

async function addBuffPrice(item: Skinbaron.Item, container: Element, selector: ItemSelectors): Promise<PriceResult> {
	const { buff_name, market_id, priceListing, priceOrder, priceFromReference, difference, source, currency, itemStyle } = await getBuffItem(item);

	const isDoppler = buff_name.includes('Doppler') && buff_name.includes('|');

	const priceDiv = container.querySelector<HTMLElement>(selector.priceDiv);
	if (priceDiv && !container.querySelector('.betterfloat-buffprice')) {
		const buffContainer = generatePriceLine({
			source,
			market_id,
			buff_name,
			priceOrder,
			priceListing,
			priceFromReference,
			userCurrency: currency.symbol ?? '$',
			itemStyle: itemStyle as DopplerPhase,
			CurrencyFormatter: CurrencyFormatter(currency.text ?? 'USD'),
			isDoppler,
			isPopout: selector === itemSelectors.modal,
			priceClass: 'suggested-price',
			addSpaceBetweenPrices: true,
			showPrefix: false,
			iconHeight: '15px',
		});
		if (selector === itemSelectors.card) {
			container.querySelector('.offer-card')?.setAttribute('style', 'height: 290px');
			priceDiv.parentElement?.setAttribute('style', 'display: flex; flex-direction: column; align-items: center; justify-content: center;');
		}
		priceDiv.insertAdjacentHTML('afterend', buffContainer);

		priceDiv.parentElement
			?.querySelector('.betterfloat-buffprice')
			?.querySelector('.betterfloat-buffprice')
			?.addEventListener('click', (e) => {
				e.stopPropagation();
				window.open((e.currentTarget as HTMLElement).parentElement?.getAttribute('href') ?? '', '_blank');
			});
	}

	const saleWrapper = container.querySelector<HTMLElement>(selector.saleWrapper);

	if (!saleWrapper) return { price_difference: difference };
	saleWrapper.style.display = 'flex';
	let discountContainer = document.createElement('span');
	discountContainer.className += ' betterfloat-sale-tag';
	if (selector === itemSelectors.promo) {
		saleWrapper.style.justifyContent = 'flex-end';
		saleWrapper.style.alignItems = 'flex-end';
		discountContainer.style.marginRight = '5px';
		discountContainer.style.padding = '1px 3px';
		discountContainer.style.fontSize = '13px';
		discountContainer.style.borderRadius = '5px';
	} else if (selector === itemSelectors.card) {
		saleWrapper.style.justifyContent = 'center';
		saleWrapper.style.paddingBottom = '0px';
		const buffContainer = container.querySelector<HTMLElement>('.betterfloat-buff-container');
		if (buffContainer) {
			buffContainer.style.marginBottom = '20px';
		}
		discountContainer.style.marginLeft = '10px';
		discountContainer.style.marginRight = '-10px';
	} else if (selector === itemSelectors.modal) {
		saleWrapper.style.gap = '10px';
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

	if (isMassItem(item)) {
		const discountWrapper = document.createElement('div');
		discountWrapper.setAttribute('style', 'display: flex; align-items: center; justify-content: flex-end; align-items: flex-end; margin-left: 10px');
		discountWrapper.appendChild(discountContainer);
		discountContainer = discountWrapper;
	}
	discountContainer.style.backgroundColor = difference.isNeg() ? styling.profit.background : styling.loss.background;
	discountContainer.style.borderRadius = '5px';

	const percentage = getItemPrice(item)
		.div(priceFromReference ?? 0)
		.mul(100);
	const buffPriceHTML = html`
		<div style="display: flex; flex-direction: column; align-items: center; font-size: 13px; font-style: normal; font-weight: 400; line-height: 17px; letter-spacing: -.005em; text-wrap: nowrap; padding: 1px 3px; color: ${difference.isNeg() ? styling.profit.color : styling.loss.color}">
			<span>${difference.isPos() ? '+' : '-'}${CurrencyFormatter(currency.text ?? 'USD').format(difference.abs().toNumber())} </span>
			<span>(${percentage.gt(150) ? percentage.toFixed(0) : percentage.toFixed(2)}%)</span>
		</div>
	`;

	discountContainer.style.backgroundColor = `background-color: ${difference.isNeg() ? styling.profit.background : styling.loss.background}`;
	discountContainer.innerHTML = buffPriceHTML;

	if (selector === itemSelectors.promo) {
		saleWrapper?.insertBefore(discountContainer, saleWrapper.firstChild);
	} else {
		saleWrapper.querySelector('.pricereduction')?.remove();
		saleWrapper.querySelector('.suggested-price')?.remove();
		saleWrapper.querySelector('i')?.remove();
		saleWrapper.querySelector('br')?.remove();
		saleWrapper.style.width = '100%';
		saleWrapper.style.alignItems = 'center';
		saleWrapper?.appendChild(discountContainer);
	}

	return {
		price_difference: difference,
	};
}

async function getBuffItem(item: Skinbaron.Item) {
	let source = (extensionSettings['baron-pricingsource'] as MarketSource) ?? MarketSource.Buff;
	const buff_item = createBuffItem(item);
	const buff_name = handleSpecialStickerNames(buff_item.name);

	let { priceListing, priceOrder } = await getBuffPrice(buff_name, buff_item.style, source);

	if (source === MarketSource.Buff && isBuffBannedItem(buff_name)) {
		priceListing = new Decimal(0);
		priceOrder = new Decimal(0);
	}

	if (((!priceListing && !priceOrder) || (priceListing?.isZero() && priceOrder?.isZero())) && extensionSettings['csm-altmarket'] && extensionSettings['csm-altmarket'] !== MarketSource.None) {
		source = extensionSettings['baron-altmarket'] as MarketSource;
		const altPrices = await getBuffPrice(buff_name, buff_item.style, source);
		priceListing = altPrices.priceListing;
		priceOrder = altPrices.priceOrder;
	}
	const market_id = getMarketID(buff_name, source);

	const currencyItem = getUserCurrency();
	if (!currencyItem?.text) {
		throw new Error('[BetterFloat] No currency rate found. Please report this issue.');
	}
	const currencyRate = await getAndFetchCurrencyRate(currencyItem!.text);
	if (priceListing && currencyRate) {
		priceListing = priceListing.mul(currencyRate);
	}
	if (priceOrder && currencyRate) {
		priceOrder = priceOrder.mul(currencyRate);
	}

	const priceFromReference = parseInt(extensionSettings['skinbaron-referenceprice']) === 0 ? priceOrder : priceListing;
	const priceDifference = getItemPrice(item).minus(priceFromReference ?? 0);
	return {
		source,
		buff_name,
		market_id,
		priceListing: priceListing,
		priceOrder: priceOrder,
		priceFromReference,
		difference: priceDifference,
		currency: currencyItem,
		itemStyle: buff_item.style,
	};
}

function getItemPrice(item: Skinbaron.Item) {
	return new Decimal((<Skinbaron.SingleItem>item).singleOffer?.itemPrice ?? (<Skinbaron.MassItem>item).lowestPrice ?? (<Skinbaron.MassItem>item).lowestPriceTradeLocked);
}

function getUserCurrency() {
	const currencySelect = document.getElementById('currency-select')?.firstElementChild?.textContent?.trim().split(' - ');
	return {
		text: currencySelect?.[0] ?? 'EUR',
		symbol: currencySelect?.[1] ?? '€',
	};
}

// mutation observer active?
let isObserverActive = false;
let extensionSettings: IStorage;

init();
