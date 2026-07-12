import { html } from 'common-tags';
import Decimal from 'decimal.js';
import type { DopplerPhase, ItemStyle } from '~lib/@typings/FloatTypes';
import type { LegacyContentScriptConfig as PlasmoCSConfig } from '~lib/@typings/MigrationTypes';
import { BigCurrency, getItemPrice, getMarketID, SmallCurrency } from '~lib/handlers/mappinghandler';
import { getUSDToCurrencyRate } from '~lib/shared/currency';
import { initPriceMapping } from '~lib/shared/pricing';
import { AskBidMarkets, MarketSource } from '~lib/util/globals';
import { CurrencyFormatter, checkUserPlanPro, getBuffPrice, getSPBackgroundColor, handleSpecialStickerNames, isUserPro } from '~lib/util/helperfunctions';
import { attachMarketPopover } from '~lib/util/market_popover';
import type { IStorage } from '~lib/util/storage';
import { getAllSettings } from '~lib/util/storage';
import { generatePriceLine } from '~lib/util/uigeneration';
import {
	activateLisSkinsEventHandler,
	getActiveLisSkinsCartItems,
	getActiveLisSkinsOfferItems,
	getActiveLisSkinsSkin,
	getLisSkinsItem,
	getLisSkinsItemByIcon,
	getLisSkinsItemBySlug,
	requestLisSkinsQueryData,
	subscribeLisSkinsDataUpdates,
} from './events';
import type { LisSkins } from './types';
import { activateLisskinsUrlHandler as dynamicUIHandler } from './url';

export const config: PlasmoCSConfig = {
	matches: ['https://lis-skins.com/*'],
	run_at: 'document_end',
	css: ['../../css/common_styles.css', '../../css/lisskins_styles.css'],
};

type PriceResult = {
	currency: string;
	priceFromReference: number;
};

type BuffItemResult = Awaited<ReturnType<typeof getBuffItem>>;

type LisItem = {
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
	Cart = 4,
}

async function init() {
	if (location.host !== 'lis-skins.com') {
		return;
	}

	console.log('[BetterFloat] Initializing Lis-Skins');
	console.time('[BetterFloat] Lis-Skins init timer');

	activateLisSkinsEventHandler();
	subscribeLisSkinsDataUpdates(() => {
		offerReconcileRetries = 0;
		if (isLisSkinsReady) scheduleReconcile();
	});
	requestLisSkinsQueryData();

	extensionSettings = await getAllSettings();
	if (!extensionSettings['lis-enable']) return;

	if (!(await checkUserPlanPro(extensionSettings['user']))) {
		console.log('[BetterFloat] Pro plan required for Lisskins features');
		return;
	}

	await initPriceMapping(extensionSettings, 'lis');
	isLisSkinsReady = true;

	console.timeEnd('[BetterFloat] Lis-Skins init timer');

	if (!isObserverActive) {
		isObserverActive = true;
		applyMutation();
		console.log('[BetterFloat] Lis-Skins mutation observer started');
	}

	dynamicUIHandler(() => {
		itemPageReference = undefined;
		offerReconcileRetries = 0;
		requestLisSkinsQueryData();
		scheduleReconcile();
	});
	scheduleReconcile();
}

function applyMutation() {
	const observer = new MutationObserver((mutations) => {
		for (const mutation of mutations) {
			for (const addedNode of Array.from(mutation.addedNodes)) {
				if (!(addedNode instanceof HTMLElement)) continue;
				if (
					addedNode.matches('article.skin-card.market-card__container[id], .offers-table .ui-row, main.skin, div.inventory-card, .skin-item') ||
					addedNode.querySelector('article.skin-card.market-card__container[id], .offers-table .ui-row, main.skin, div.inventory-card, .skin-item')
				) {
					scheduleReconcile();
					return;
				}
			}
		}
	});
	observer.observe(document, { childList: true, subtree: true });
}

function scheduleReconcile() {
	if (reconcileFrame !== undefined) return;
	reconcileFrame = requestAnimationFrame(() => {
		reconcileFrame = undefined;
		void reconcileDom();
	});
}

async function reconcileDom() {
	if (isReconciling) {
		reconcileAgain = true;
		return;
	}

	isReconciling = true;
	try {
		if (/^\/market\/csgo\/[^/]+/.test(location.pathname)) {
			await adjustItemPage();
			await adjustOfferRows();
		} else if (location.pathname.startsWith('/market/')) {
			const cards = Array.from(document.querySelectorAll<HTMLElement>('article.skin-card.market-card__container[id]'));
			await Promise.all(cards.map(async (card) => await adjustCard(card, PageType.Market)));
		} else {
			const cards = Array.from(document.querySelectorAll<HTMLElement>('div.inventory-card'));
			await Promise.all(cards.map(async (card) => await adjustCard(card, PageType.Inventory)));
		}
		await adjustCartItems();
	} finally {
		isReconciling = false;
		if (reconcileAgain) {
			reconcileAgain = false;
			scheduleReconcile();
		}
	}
}

function clearLisSkinsEnhancements(container: HTMLElement) {
	for (const element of container.querySelectorAll('.betterfloat-buff-a, .betterfloat-sale-tag, .betterfloat-sticker-percentage, .betterfloat-pricempire-link, .betterfloat-cart-item-link'))
		element.remove();
	for (const element of container.querySelectorAll('.betterfloat-offer-price')) element.classList.remove('betterfloat-offer-price');
	for (const element of container.querySelectorAll('.betterfloat-main-price')) element.classList.remove('betterfloat-main-price');
	container.removeAttribute('data-betterfloat');
	if (container.matches('article.skin-card')) container.style.removeProperty('height');
	else container.querySelector<HTMLElement>('article.skin-card')?.style.removeProperty('height');
}

function prepareLisSkinsContainer(container: HTMLElement, itemId: string, itemKey: string) {
	const previousItemId = container.dataset.betterfloatLisId;
	const previousItemKey = container.dataset.betterfloatLisKey;
	if ((previousItemId && previousItemId !== itemId) || (previousItemKey && previousItemKey !== itemKey)) clearLisSkinsEnhancements(container);
	container.dataset.betterfloatLisId = itemId;
	container.dataset.betterfloatLisKey = itemKey;
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

	const itemId = isMarketItem(apiItem) ? String(apiItem.id) : apiItem.asset_id;
	const itemKey = `${itemId}:${item.price.toString()}:${item.currency}`;
	if (container.dataset.betterfloatLisProcessed === itemKey && container.querySelector('.betterfloat-buff-a')) return;

	prepareLisSkinsContainer(container, itemId, itemKey);
	container.setAttribute('data-betterfloat', JSON.stringify({ name: item.name, phase: item.style, price: item.price.toNumber() }));

	const priceResult = await addBuffPrice(item, container, page, undefined, itemId);
	if (container.dataset.betterfloatLisId !== itemId) return;
	await addStickerPercentage(container, item, priceResult.priceFromReference, page, itemId);
	if (container.dataset.betterfloatLisId === itemId) container.dataset.betterfloatLisProcessed = itemKey;
}

async function adjustItemPage() {
	const pageContainer = document.querySelector<HTMLElement>('main.skin');
	if (!pageContainer) {
		return;
	}

	const slug = getCurrentSkinSlug();
	const offers = getActiveLisSkinsOfferItems();
	const apiItem = (slug ? offers.find((offer) => offer.skin?.url === slug) : undefined) ?? (slug ? getLisSkinsItemBySlug(slug) : undefined);
	if (!apiItem) {
		const skin = getActiveLisSkinsSkin();
		if (skin && skin.url === slug) {
			clearLisSkinsEnhancements(pageContainer);
			addQuickLinks(pageContainer, skin.name);
		}
		return;
	}

	const item = createItem(apiItem);
	const itemId = String(apiItem.id);
	prepareLisSkinsContainer(pageContainer, itemId, `${itemId}:${item.price.toString()}:${item.currency}`);
	pageContainer.setAttribute('data-betterfloat', JSON.stringify({ name: item.name, phase: item.style, price: item.price.toNumber() }));
	const reference = await getItemPageReference(item);
	const priceResult = await addBuffPrice(item, pageContainer, PageType.ItemPage, reference, itemId);
	if (pageContainer.dataset.betterfloatLisId !== itemId) return;
	await addStickerPercentage(pageContainer, item, priceResult.priceFromReference, PageType.ItemPage, itemId);
	addQuickLinks(pageContainer, item.name);
}

function parseDisplayedPrice(value: string) {
	const normalized = value.replace(/[^\d.,-]/g, '');
	const lastComma = normalized.lastIndexOf(',');
	const lastDot = normalized.lastIndexOf('.');
	const decimalSeparator = Math.max(lastComma, lastDot);
	if (decimalSeparator < 0) return Number(normalized);

	const decimalDigits = normalized.length - decimalSeparator - 1;
	if (decimalDigits !== 2) return Number(normalized.replaceAll(',', '').replaceAll('.', ''));
	return Number(`${normalized.slice(0, decimalSeparator).replaceAll(',', '').replaceAll('.', '')}.${normalized.slice(decimalSeparator + 1)}`);
}

function offerMatchesRow(row: HTMLElement, offer: LisSkins.MarketItem) {
	const priceContainer = row.querySelector<HTMLElement>('.offers-table__price');
	const priceClone = priceContainer?.cloneNode(true) as HTMLElement | undefined;
	for (const element of priceClone?.querySelectorAll('.betterfloat-sale-tag') ?? []) element.remove();
	const displayedPrice = parseDisplayedPrice(priceClone?.textContent ?? '');
	if (!Number.isFinite(displayedPrice) || Math.abs(displayedPrice - offer.final_withdrawal_price) > 0.02) return false;

	const displayedFloat = Number.parseFloat(row.querySelector('.offers-table__float')?.textContent ?? '');
	const offerFloat = Number(offer.item_float);
	return !Number.isFinite(displayedFloat) || !Number.isFinite(offerFloat) || Math.abs(displayedFloat - offerFloat) < 0.000001;
}

async function adjustOfferRows() {
	const offers = getActiveLisSkinsOfferItems();
	const rows = Array.from(document.querySelectorAll<HTMLElement>('.offers-table .ui-row'));
	if (offers.length === 0 || rows.length === 0) return;

	if (offers.length !== rows.length) {
		retryOfferReconciliation();
		return;
	}

	const reference = await getItemPageReference(createItem(offers[0]));
	const priceFromReference = reference.priceFromReference;
	if (!priceFromReference || priceFromReference.lte(0)) return;
	let hasMismatch = false;

	for (let index = 0; index < rows.length; index++) {
		const row = rows[index];
		const offer = offers[index];
		if (!offerMatchesRow(row, offer)) {
			hasMismatch = true;
			continue;
		}

		const item = createItem(offer);
		const itemId = String(offer.id);
		prepareLisSkinsContainer(row, itemId, `${itemId}:${item.price.toString()}:${item.currency}`);
		row.setAttribute('data-betterfloat', JSON.stringify({ name: item.name, phase: item.style, price: item.price.toNumber() }));

		const priceContainer = row.querySelector<HTMLElement>('.offers-table__price');
		if (!priceContainer || !priceFromReference || priceContainer.querySelector('.betterfloat-sale-tag')) continue;
		if (!extensionSettings['lis-buffdifference'] && !extensionSettings['lis-buffdifferencepercent']) continue;
		if (row.dataset.betterfloatLisId !== itemId) continue;

		priceContainer.classList.add('betterfloat-offer-price');
		priceContainer.insertAdjacentHTML('beforeend', generateSaleTag(item, priceFromReference, reference.currency, 'betterfloat-offer-sale-tag'));
	}

	if (hasMismatch) retryOfferReconciliation();
	else offerReconcileRetries = 0;
}

function retryOfferReconciliation() {
	if (offerReconcileRetries >= 3) return;
	offerReconcileRetries++;
	setTimeout(scheduleReconcile, 100);
}

function getCartMarketItem(cartItem: LisSkins.CartItem): LisSkins.MarketItem | undefined {
	if (!cartItem.obtained_skin) return undefined;
	return {
		...cartItem.obtained_skin,
		final_withdrawal_price: cartItem.current_price,
		skin: cartItem.skin,
		tag_manager_data: {
			...cartItem.obtained_skin.tag_manager_data,
			currency: cartItem.obtained_skin.tag_manager_data?.currency ?? getUserCurrency(),
			price: cartItem.current_price,
		},
	};
}

function findCartItemForRow(row: HTMLElement, cartItems: LisSkins.CartItem[], usedItems: Set<number>) {
	const imageName = row.querySelector<HTMLImageElement>('.skin-item__image img')?.alt.trim();
	const displayedPrice = parseDisplayedPrice(row.querySelector('.skin-item__price')?.textContent ?? '');

	let fallbackIndex = -1;
	for (let index = 0; index < cartItems.length; index++) {
		if (usedItems.has(index)) continue;
		const cartItem = cartItems[index];
		const itemName = cartItem.skin.name_short || cartItem.skin.name;
		if (imageName && itemName !== imageName) continue;
		if (fallbackIndex < 0) fallbackIndex = index;
		if (!Number.isFinite(displayedPrice) || Math.abs(displayedPrice - cartItem.current_price) <= 0.02) return { cartItem, index };
	}

	return fallbackIndex >= 0 ? { cartItem: cartItems[fallbackIndex], index: fallbackIndex } : undefined;
}

function addCartItemLink(container: HTMLElement, cartItem: LisSkins.CartItem) {
	if (container.querySelector('.betterfloat-cart-item-link')) return;
	const actions = container.querySelector('.skin-item__actions');
	if (!actions) return;

	const href = `/market/csgo/${encodeURIComponent(cartItem.skin.url)}/`;
	actions.insertAdjacentHTML('beforebegin', html`<a class="betterfloat-cart-item-link" href="${href}" target="_blank" aria-label="Open item page" title="Open item page"></a>`);
	container.querySelector('.betterfloat-cart-item-link')?.addEventListener('click', (event) => event.stopPropagation());
}

async function adjustCartItems() {
	const cartItems = getActiveLisSkinsCartItems();
	const rows = Array.from(document.querySelectorAll<HTMLElement>('.skin-item'));
	if (cartItems.length === 0 || rows.length === 0) return;

	const usedItems = new Set<number>();
	await Promise.all(
		rows.map(async (row) => {
			const match = findCartItemForRow(row, cartItems, usedItems);
			if (!match) return;
			usedItems.add(match.index);
			const apiItem = getCartMarketItem(match.cartItem);
			if (!apiItem) return;

			const item = createItem(apiItem);
			const itemId = String(apiItem.id);
			prepareLisSkinsContainer(row, itemId, `${itemId}:${item.price.toString()}:${item.currency}`);
			row.setAttribute('data-betterfloat', JSON.stringify({ name: item.name, phase: item.style, price: item.price.toNumber() }));
			addCartItemLink(row, match.cartItem);
			await addBuffPrice(item, row, PageType.Cart, undefined, itemId);
		})
	);
}

function getApiItemForCard(container: HTMLElement) {
	if (container.matches('article.skin-card.market-card__container[id]')) {
		return getLisSkinsItem(Number(container.id));
	}

	const rawItemId = container.querySelector<HTMLElement>('article.skin-card.market-card__container[id]')?.id;
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

function createItem(apiItem: LisSkins.Item): LisItem {
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

async function addStickerPercentage(container: Element, { price, stickers }: LisItem, referencePrice: number, page: PageType, expectedItemId?: string) {
	if (!stickers || stickers.length === 0) return;
	if (!extensionSettings['lis-stickerprices']) return;

	const stickerPrices = await Promise.all(stickers.map(async (sticker) => await getItemPrice(sticker, extensionSettings['lis-pricingsource'] as MarketSource)));
	if (expectedItemId && container instanceof HTMLElement && container.dataset.betterfloatLisId !== expectedItemId) return;
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
		container.querySelector('.skin-description__stickers')?.insertAdjacentHTML('beforeend', stickerPercentageHTML);
	} else if (!container.querySelector('.betterfloat-sticker-percentage')) {
		const stickersContainer = container.querySelector<HTMLElement>('.inventory-card__stickers');
		if (stickersContainer) {
			stickersContainer.style.alignItems = 'flex-end';
			stickersContainer.insertAdjacentHTML('beforeend', stickerPercentageHTML);
		}
	}
}

function addQuickLinks(container: Element, itemName: string) {
	const quickLinks = container.querySelector('footer.skin__image-footer');
	if (!quickLinks || quickLinks.querySelector('.betterfloat-pricempire-link')) return;

	const actionButton = html`
		<a class="betterfloat-pricempire-link" href="https://pricempire.com/item/${itemName}" target="_blank">
			<span>Pricempire</span>
		</a>
	`;
	quickLinks.insertAdjacentHTML('beforeend', actionButton);
}

async function getBuffItem(item: LisItem) {
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

function getItemPageReference(item: LisItem) {
	const key = `${location.pathname}:${item.name}:${item.style}:${item.currency}:${extensionSettings['lis-pricingsource']}:${extensionSettings['lis-altmarket']}:${extensionSettings['lis-pricereference']}`;
	if (!itemPageReference || itemPageReference.key !== key) itemPageReference = { key, value: getBuffItem(item) };
	return itemPageReference.value;
}

function generateSaleTag(item: LisItem, priceFromReference: Decimal, currency: string, extraClass = '') {
	const difference = item.price.minus(priceFromReference);
	const percentage = item.price.div(priceFromReference).times(100);
	const isLoss = percentage.gt(100);
	const color = isLoss ? '#ff8095' : '#5bc27a';
	const background = isLoss ? 'rgb(255 128 149 / 10%)' : 'rgb(123 195 119 / 10%)';
	const absDifference = difference.abs();
	const formattedPrice = absDifference.gt(1000) ? BigCurrency(currency).format(absDifference.toNumber()) : SmallCurrency(currency).format(absDifference.toNumber());

	return html`
		<div class="sale-tag betterfloat-sale-tag ${extraClass}" style="position: static; translate: 0; background-color: ${background}; color: ${color}; width: fit-content; margin-top: 4px;">
			${extensionSettings['lis-buffdifference'] ? html`<span>${difference.isPos() ? '+' : '-'}${formattedPrice} </span>` : ''}
			${extensionSettings['lis-buffdifferencepercent'] ? html`<span>(${percentage.gt(150) ? percentage.toFixed(0) : percentage.toFixed(2)}%)</span>` : ''}
		</div>
	`;
}

function getBuffParent(container: Element, page: PageType) {
	if (page === PageType.ItemPage) {
		return container.querySelector('.skin-description__steam-price') ?? container.querySelector('.skin-description__actions');
	}
	if (page === PageType.Cart) return container.querySelector('.skin-item__cost');
	return getCardFooter(container) ?? getCardPriceWrapper(container);
}

async function addBuffPrice(item: LisItem, container: HTMLElement, page: PageType, reference?: BuffItemResult, expectedItemId?: string): Promise<PriceResult> {
	const { source, buff_name, market_id, priceListing, priceOrder, priceFromReference, currency, currencyRate } = reference ?? (await getBuffItem(item));
	if (expectedItemId && container.dataset.betterfloatLisId !== expectedItemId) return { priceFromReference: 0, currency };

	const elementContainer = getBuffParent(container, page);
	const hasBuffPrice = page === PageType.ItemPage ? elementContainer?.querySelector('.betterfloat-buff-a') : container.querySelector('.betterfloat-buff-a');
	if (elementContainer && !hasBuffPrice) {
		if (page === PageType.ItemPage) elementContainer.classList.add('betterfloat-main-price');
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

		elementContainer.insertAdjacentHTML(page === PageType.ItemPage || page === PageType.Cart ? 'beforeend' : 'afterend', buffContainer);
		const buffElement = container.querySelector<HTMLAnchorElement>('.betterfloat-buff-a');
		if (buffElement) {
			if (page === PageType.Cart) {
				buffElement.setAttribute('style', 'position: static; margin: 4px 0 0 auto;');
			} else if (page !== PageType.ItemPage) {
				buffElement.setAttribute('style', 'position: static; margin-top: -4px;');
			}
			buffElement.addEventListener('click', (e) => {
				e.stopPropagation();
			});
			attachMarketPopover(buffElement, { isPro: isUserPro(extensionSettings['user']), currencyRate: currencyRate ?? 1 });
		}

		if (page === PageType.Market) {
			const marketCard = container.matches('article.skin-card') ? container : container.querySelector<HTMLElement>('article.skin-card');
			if (marketCard) {
				marketCard.style.height = '305px';
			}
		}
	}

	const priceContainer = page === PageType.ItemPage ? getBuffParent(container, page) : page === PageType.Cart ? container.querySelector('.skin-item__cost') : getCardPriceWrapper(container);
	const hasSaleTag = page === PageType.ItemPage ? priceContainer?.querySelector('.betterfloat-sale-tag') : container.querySelector('.betterfloat-sale-tag');
	if (priceContainer && priceFromReference && !hasSaleTag && (extensionSettings['lis-buffdifference'] || extensionSettings['lis-buffdifferencepercent'])) {
		priceContainer.insertAdjacentHTML(
			page === PageType.ItemPage || page === PageType.Cart ? 'beforeend' : 'afterend',
			generateSaleTag(item, priceFromReference, currency, page === PageType.Cart ? 'betterfloat-cart-sale-tag' : '')
		);
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
let reconcileFrame: number | undefined;
let isReconciling = false;
let reconcileAgain = false;
let offerReconcileRetries = 0;
let itemPageReference: { key: string; value: Promise<BuffItemResult> } | undefined;
let isLisSkinsReady = false;

void init();
