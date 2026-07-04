import { html } from 'common-tags';
import Decimal from 'decimal.js';
import type { DopplerPhase, ItemStyle } from '~lib/@typings/FloatTypes';
import { BigCurrency, getItemPrice, getMarketID, SmallCurrency } from '~lib/handlers/mappinghandler';
import { getUSDToCurrencyRate } from '~lib/shared/currency';
import { initPriceMapping } from '~lib/shared/pricing';
import { AskBidMarkets, MarketSource } from '~lib/util/globals';
import { CurrencyFormatter, checkUserPlanPro, getBuffPrice, getSPBackgroundColor, handleSpecialStickerNames, isUserPro } from '~lib/util/helperfunctions';
import { attachMarketPopover } from '~lib/util/market_popover';
import type { IStorage } from '~lib/util/storage';
import { getAllSettings } from '~lib/util/storage';
import { generatePriceLine } from '~lib/util/uigeneration';
import { activateLisSkinsEventHandler, getLisSkinsItem, getLisSkinsItemByIcon, type LisSkins } from './events';
import { activateLisskinsUrlHandler as dynamicUIHandler } from './url';

type PriceResult = {
	currency: string;
	priceFromReference: number;
};

type NewLisItem = {
	apiItem: LisSkins.Item;
	name: string;
	style: ItemStyle;
	price: Decimal;
	currency: string;
	stickers?: string[];
};

enum PageType {
	Market = 1,
	ItemPage = 2,
	Inventory = 3,
}

export async function initNewLisskins() {
	if (!location.host.includes('lis-skins.com')) {
		return;
	}

	console.log('[BetterFloat] Initializing new Lisskins');
	console.time('[BetterFloat] New Lis-Skins init timer');

	activateLisSkinsEventHandler();

	extensionSettings = await getAllSettings();
	if (!extensionSettings['lis-enable']) return;

	if (!(await checkUserPlanPro(extensionSettings['user']))) {
		console.log('[BetterFloat] Pro plan required for Lisskins features');
		return;
	}

	await initPriceMapping(extensionSettings, 'lis');

	console.timeEnd('[BetterFloat] New Lis-Skins init timer');

	firstLaunch();

	if (!isObserverActive) {
		isObserverActive = true;
		applyMutation();
		console.log('[BetterFloat] New Lis-Skins mutation observer started');
	}

	dynamicUIHandler();
}

function firstLaunch() {
	const isMarketPage = location.pathname.includes('/market/');
	if (isMarketPage) {
		setTimeout(() => {
			const refreshbutton = document.querySelector<HTMLButtonElement>('.top-filters__refresh > button');
			if (refreshbutton) {
				refreshbutton.click();
			}
		}, 1000);
	} else {
		const cards = document.querySelectorAll('div.inventory-card');
		for (const card of cards) {
			void adjustCard(card as HTMLElement, PageType.Inventory);
		}
	}
}

function applyMutation() {
	const observer = new MutationObserver((mutations) => {
		for (const mutation of mutations) {
			for (const addedNode of Array.from(mutation.addedNodes)) {
				if (!(addedNode instanceof HTMLElement)) continue;

				// console.log('[BetterFloat] Mutation detected:', addedNode);

				if (addedNode.tagName === 'LI' && addedNode.querySelector('.inventory-card')) {
					void adjustCard(addedNode, PageType.Inventory);
				} else if ((addedNode.tagName === 'LI' || addedNode.tagName === 'A') && addedNode.querySelector('article.skin-card')) {
					void adjustCard(addedNode, PageType.Market);
				}

				if (addedNode.classList.contains('meta')) {
					for (const card of Array.from(addedNode.querySelectorAll<HTMLElement>('article.skin-card'))) {
						void adjustCard(card, PageType.Market);
					}
				}

				if (addedNode.matches('main.skin') || addedNode.querySelector('main.skin')) {
					void adjustItemPage();
				}
			}
		}
	});
	observer.observe(document, { childList: true, subtree: true });
}

async function adjustCard(container: HTMLElement, page: PageType) {
	const apiItem = getApiItemForCard(container);
	if (!apiItem) {
		return;
	}

	const item = createItem(apiItem);
	if (!item.name || item.price.isZero()) {
		return;
	}

	container.setAttribute('data-betterfloat', JSON.stringify({ name: item.name, phase: item.style, price: item.price.toNumber() }));

	const priceResult = await addBuffPrice(item, container, page);
	await addStickerPercentage(container, item, priceResult.priceFromReference, page);
}

async function adjustItemPage() {
	const pageContainer = document.querySelector<HTMLElement>('main.skin');
	if (!pageContainer) {
		return;
	}

	const slug = getCurrentSkinSlug();
	const apiItem = slug ? getLisSkinsItemByIcon(slug) : undefined;
	if (!apiItem) {
		return;
	}

	const item = createItem(apiItem);
	const priceResult = await addBuffPrice(item, pageContainer, PageType.ItemPage);
	await addStickerPercentage(pageContainer, item, priceResult.priceFromReference, PageType.ItemPage);
	addQuickLinks(pageContainer, item);
	addMarketComparisonAnchor(pageContainer, item);
}

function getApiItemForCard(container: HTMLElement) {
	const rawItemId = container.querySelector<HTMLImageElement>('img[id]')?.getAttribute('id');
	if (rawItemId) {
		return getLisSkinsItem(Number(rawItemId));
	}

	const slug = container.querySelector<HTMLImageElement>('.skin-card__image > img')?.src;
	if (slug?.includes('/image/')) {
		const iconUrl = decodeURIComponent(new URL(slug).pathname.split('/image/').pop()?.split('/')[0] ?? '');
		return getLisSkinsItemByIcon(iconUrl);
	}

	return undefined;
}

function createItem(apiItem: LisSkins.Item): NewLisItem {
	const rawName = isMarketItem(apiItem) ? (apiItem.skin?.name ?? '') : apiItem.name;
	const style = getItemStyle(rawName);
	const name = style && style !== 'Vanilla' ? rawName.replace(` ${style}`, '') : rawName;
	const price = new Decimal(isMarketItem(apiItem) ? (apiItem.final_withdrawal_price ?? apiItem.tag_manager_data?.price ?? 0) : apiItem.price);
	const currency = isMarketItem(apiItem) ? (apiItem.tag_manager_data?.currency ?? getUserCurrency()) : getUserCurrency();
	const stickers = apiItem.stickers
		?.filter((sticker) => !isMarketSticker(sticker) || !sticker.skin_sticker?.is_charm)
		.map((sticker) => getStickerName(sticker))
		.filter(Boolean);

	return {
		apiItem,
		name,
		style,
		price,
		currency,
		stickers: stickers && stickers.length > 0 ? stickers : undefined,
	};
}

function isMarketItem(item: LisSkins.Item): item is LisSkins.MarketItem {
	return 'id' in item;
}

function isMarketSticker(sticker: LisSkins.MarketSticker | LisSkins.InventorySticker): sticker is LisSkins.MarketSticker {
	return 'skin_sticker' in sticker;
}

function getStickerName(sticker: LisSkins.MarketSticker | LisSkins.InventorySticker) {
	const stickerName = isMarketSticker(sticker) ? (sticker.skin_sticker?.skin?.name ?? sticker.skin_sticker?.title ?? '') : sticker.name;
	if (!stickerName || stickerName.startsWith('Sticker |') || stickerName.startsWith('Charm |')) {
		return stickerName;
	}
	return `Sticker | ${stickerName}`;
}

function getItemStyle(name: string): ItemStyle {
	const dopplerStyle = name.match(/Doppler (Sapphire|Ruby|Black Pearl|Emerald|Phase [1-4])/);
	if (dopplerStyle?.[1]) {
		return dopplerStyle[1] as DopplerPhase;
	}
	if (name.includes('★') && !name.includes('|')) {
		return 'Vanilla';
	}
	return '';
}

async function addStickerPercentage(container: Element, { price, stickers }: NewLisItem, referencePrice: number, page: PageType) {
	if (!stickers || stickers.length === 0) return;
	if (!extensionSettings['lis-stickerprices']) return;

	const stickerPrices = await Promise.all(stickers.map(async (sticker) => await getItemPrice(sticker, extensionSettings['lis-pricingsource'] as MarketSource)));
	const stickerSum = stickerPrices.reduce((acc, price) => acc.plus(price.starting_at), new Decimal(0));
	if (stickerSum.lte(0)) return;

	const priceDifference = price.minus(referencePrice);
	const stickerPercentage = priceDifference.gt(0) ? priceDifference.div(stickerSum) : new Decimal(0);

	const stickerPercentageHTML = html`
		<div
			class="betterfloat-sticker-percentage ${page === PageType.ItemPage ? 'page' : 'market'}"
			style="background-color: ${getSPBackgroundColor(stickerPercentage.toNumber())}; ${page === PageType.ItemPage ? '' : 'position: static;'}"
		>
			<span>${stickerPercentage.gt(1.5) ? '>150' : stickerPercentage.mul(100).toFixed(1)}% SP</span>
		</div>
	`;

	if (page === PageType.ItemPage) {
		container.querySelector('main.skin-description__body')?.insertAdjacentHTML('beforeend', stickerPercentageHTML);
	} else if (!container.querySelector('.betterfloat-sticker-percentage')) {
		const stickersContainer = container.querySelector<HTMLElement>('.inventory-card__stickers');
		if (stickersContainer) {
			stickersContainer.style.alignItems = 'flex-end';
			stickersContainer.insertAdjacentHTML('beforeend', stickerPercentageHTML);
		}
	}
}

function addQuickLinks(container: Element, item: NewLisItem) {
	const quickLinks = container.querySelector('footer.skin__image-footer');
	if (!quickLinks || quickLinks.querySelector('.betterfloat-pricempire-link')) return;

	const actionButton = html`
		<a class="ui-button ui-button--s ui-button--secondary ui-button--full-width ui-button--uppercase betterfloat-pricempire-link" href="https://pricempire.com/item/${item.name}" target="_blank">
			<span class="ui-button__content">Pricempire</span>
		</a>
	`;
	quickLinks.insertAdjacentHTML('beforeend', actionButton);
}

function addMarketComparisonAnchor(container: Element, item: NewLisItem) {
	if (document.querySelector('div.skins-market-view[data-betterfloat]')) return;

	const parent = document.createElement('div');
	parent.className = 'market-skin-preview betterfloat-lis-market-comparison-anchor';
	parent.style.marginTop = '16px';

	const dataAnchor = document.createElement('div');
	dataAnchor.className = 'skins-market-view';
	dataAnchor.style.display = 'none';
	dataAnchor.setAttribute('data-betterfloat', JSON.stringify({ name: item.name, phase: item.style, price: item.price.toNumber() }));

	parent.appendChild(dataAnchor);
	container.querySelector('.skin__data')?.appendChild(parent);
}

async function getBuffItem(item: NewLisItem) {
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

	const currency = item.currency || getUserCurrency();
	const currencyRate = await getUSDToCurrencyRate(currency);
	if (currencyRate) {
		priceListing = priceListing?.mul(currencyRate);
		priceOrder = priceOrder?.mul(currencyRate);
	}

	const priceFromReference =
		Number.parseInt(String(extensionSettings['lis-pricereference']), 10) === 0 &&
		(AskBidMarkets.map((market) => market.source).includes(source) || (MarketSource.YouPin === source && isUserPro(extensionSettings['user'])))
			? priceOrder
			: priceListing;

	const priceDifference = priceFromReference ? item.price.minus(priceFromReference) : new Decimal(0);
	return {
		source,
		buff_name,
		market_id,
		priceListing,
		priceOrder,
		priceFromReference,
		difference: priceDifference,
		currency,
		currencyRate,
	};
}

function getBuffParent(container: Element, page: PageType) {
	if (page === PageType.ItemPage) {
		return container.querySelector('main.skin-description__body') ?? container.querySelector('.skin__data');
	}
	return getCardFooter(container) ?? getCardPriceWrapper(container);
}

async function addBuffPrice(item: NewLisItem, container: HTMLElement, page: PageType): Promise<PriceResult> {
	const { source, buff_name, market_id, priceListing, priceOrder, priceFromReference, difference, currency, currencyRate } = await getBuffItem(item);

	const elementContainer = getBuffParent(container, page);
	if (elementContainer && !container.querySelector('.betterfloat-buff-a')) {
		const isDoppler = buff_name.includes('Doppler') && buff_name.includes('|');
		const buffContainer = generatePriceLine({
			source,
			market_id,
			buff_name,
			priceOrder,
			priceListing,
			priceFromReference,
			userCurrency: currency ?? 'USD',
			itemStyle: item.style as DopplerPhase,
			CurrencyFormatter: CurrencyFormatter(currency, 0, priceListing?.gt(1000) ? 0 : 2),
			isDoppler,
			isPopout: page === PageType.ItemPage,
			priceClass: 'suggested-price',
			addSpaceBetweenPrices: false,
			showPrefix: false,
			iconHeight: page === PageType.ItemPage ? '18px' : '15px',
			hasPro: isUserPro(extensionSettings['user']),
		});

		elementContainer.insertAdjacentHTML(page === PageType.ItemPage ? 'beforeend' : 'afterend', buffContainer);
		const buffElement = container.querySelector<HTMLAnchorElement>('.betterfloat-buff-a');
		if (buffElement) {
			buffElement.setAttribute('style', 'position: static; margin-top: -4px;');
			buffElement.addEventListener('click', (e) => {
				e.stopPropagation();
			});
			attachMarketPopover(buffElement, { isPro: isUserPro(extensionSettings['user']), currencyRate: currencyRate ?? 1 });
		}

		if (page === PageType.Market) {
			const marketCard = container.querySelector<HTMLElement>('article.skin-card');
			if (marketCard) {
				marketCard.style.height = '305px';
			}
		}
	}

	const priceContainer = page === PageType.ItemPage ? container.querySelector('.skin-description__header') : getCardPriceWrapper(container);
	if (priceContainer && priceFromReference && !container.querySelector('.betterfloat-sale-tag') && (extensionSettings['lis-buffdifference'] || extensionSettings['lis-buffdifferencepercent'])) {
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
		const percentage = item.price.div(priceFromReference).times(100);
		const { color, background } = percentage.gt(100) ? styling.loss : styling.profit;
		const formattedPrice = absDifference.gt(1000) ? BigCurrency(currency).format(absDifference.toNumber()) : SmallCurrency(currency).format(absDifference.toNumber());

		const buffPriceHTML = html`
			<div class="sale-tag betterfloat-sale-tag" style="position: static; translate: 0; background-color: ${background}; color: ${color}; width: fit-content; margin-top: 4px;">
				${extensionSettings['lis-buffdifference'] ? html`<span>${difference.isPos() ? '+' : '-'}${formattedPrice} </span>` : ''}
				${extensionSettings['lis-buffdifferencepercent'] ? html`<span>(${percentage.gt(150) ? percentage.toFixed(0) : percentage.toFixed(2)}%)</span>` : ''}
			</div>
		`;

		priceContainer.insertAdjacentHTML(page === PageType.ItemPage ? 'beforeend' : 'afterend', buffPriceHTML);
	}

	return {
		priceFromReference: priceFromReference?.toNumber() ?? 0,
		currency,
	};
}

function getCurrentSkinSlug() {
	const slug = location.pathname.split('/market/csgo/')[1]?.split('/')[0];
	return slug ? decodeURIComponent(slug) : undefined;
}

function getCardFooter(container: Element) {
	return (
		container.querySelector('.skin-card__footer') ??
		container.querySelector('.inventory-card__footer') ??
		container.querySelector('.inventory-card__bottom') ??
		container.querySelector('.inventory-card__actions')
	);
}

function getCardPriceWrapper(container: Element) {
	return (
		container.querySelector('.skin-card__price-wrapper') ??
		container.querySelector('.inventory-card__price-wrapper') ??
		container.querySelector('.inventory-card__price') ??
		container.querySelector('[class*="price-wrapper"]') ??
		container.querySelector('[class*="price"]')
	);
}

function getUserCurrency() {
	const currency =
		document.querySelector('[aria-selected="true"]')?.textContent?.match(/[A-Z]{3}/)?.[0] ??
		document.querySelector('.currency-switcher__selected-currency')?.textContent?.match(/[A-Z]{3}/)?.[0] ??
		'USD';
	return currency.toUpperCase();
}

let isObserverActive = false;
let extensionSettings: IStorage;
