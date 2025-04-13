import getSymbolFromCurrency from 'currency-symbol-map';
import Decimal from 'decimal.js';

import { dynamicUIHandler } from '~lib/handlers/urlhandler';
import { addPattern, createLiveLink, filterDisplay } from '~lib/helpers/skinport_helpers';
import {
	ICON_ARROWUP_SMALL,
	ICON_BUFF,
	ICON_CAMERA,
	ICON_CAMERA_FLIPPED,
	ICON_CSFLOAT,
	ICON_CSGOSKINS,
	ICON_EXCLAMATION,
	ICON_PRICEMPIRE,
	ICON_SKINPORT,
	ICON_STEAMANALYST,
	MarketSource,
	isProduction,
} from '~lib/util/globals';
import { CurrencyFormatter, checkUserPlanPro, delay, getBuffPrice, getFloatColoring, getMarketURL, isBuffBannedItem, isUserPro, toTitleCase, waitForElement } from '~lib/util/helperfunctions';
import { DEFAULT_FILTER, getAllSettings } from '~lib/util/storage';
import { genGemContainer, generatePriceLine, generateSpStickerContainer } from '~lib/util/uigeneration';
import { activateHandler, initPriceMapping } from '../lib/handlers/eventhandler';

import { html } from 'common-tags';
import type { PlasmoCSConfig } from 'plasmo';
import type { DopplerPhase, ItemStyle } from '~lib/@typings/FloatTypes';
import type { Skinport } from '~lib/@typings/SkinportTypes';
import { getSpItem, getSpPopupInventoryItem, getSpPopupItem, getSpUserCurrency, getSpUserCurrencyRate } from '~lib/handlers/cache/skinport_cache';
import { getItemPrice, getMarketID } from '~lib/handlers/mappinghandler';
import { createNotificationMessage, fetchBlueGemPastSales, fetchBlueGemPatternData } from '~lib/util/messaging';
import type { IStorage, SPFilter } from '~lib/util/storage';

export const config: PlasmoCSConfig = {
	matches: ['https://*.skinport.com/*'],
	run_at: 'document_idle',
	css: ['../css/hint.min.css', '../css/common_styles.css', '../css/skinport_styles.css'],
};

init();

async function init() {
	if (location.host !== 'skinport.com') {
		return;
	}

	console.log('[BetterFloat] Starting BetterFloat');
	console.time('[BetterFloat] Skinport init timer');

	extensionSettings = await getAllSettings();
	console.debug('[BetterFloat] Settings: ', extensionSettings);

	if (!extensionSettings['sp-enable']) {
		return;
	}

	// catch the events thrown by the script
	// this has to be done as first thing to not miss timed events
	await activateHandler();

	if (isProduction && (location.pathname.startsWith('/item/') || location.pathname.startsWith('/i/') || location.pathname.startsWith('/myitems/i/'))) {
		const interval = setInterval(() => {
			const iconPath = document.querySelector('path[d="M6.26953 12.8371H10.5998V14.9125H6.26953V17.3723H12.8674V10.736H8.48589V8.78871H12.8674V6.48267H6.26953V12.8371Z"]');
			if (iconPath) {
				iconPath.closest('div')?.remove();
				clearInterval(interval);
			}
		}, 100);
	}

	await initPriceMapping(extensionSettings, 'sp');

	await waitForElement('.Language', { interval: 100, maxTries: 20 }).then(() => {
		if (document.getElementsByClassName('Language').length > 0 && document.getElementsByClassName('CountryFlag--GB').length === 0) {
			console.warn('[BetterFloat] Skinport has to be set to the English language for this extension to work. Aborting ...');
			createLanguagePopup();
			return;
		}
	});

	console.timeEnd('[BetterFloat] Skinport init timer');

	await firstLaunch();

	// mutation observer is only needed once
	if (!isObserverActive) {
		isObserverActive = true;
		await applyMutation();
		console.log('[BetterFloat] Observer started');
	}

	dynamicUIHandler();
}

async function firstLaunch() {
	if (!extensionSettings['sp-enable']) return;

	const gameTitle = document.querySelector('.GameSwitcherButton-title')?.textContent;
	if (!gameTitle || !gameTitle.includes('CS2')) return;

	const path = location.pathname;

	await delay(2000);
	console.log('[BetterFloat] First launch, url:', path);

	createLiveLink();
	filterDisplay();

	if (path === '/') {
		const popularLists = Array.from(document.querySelectorAll('.PopularList'));
		for (const list of popularLists) {
			await handlePopularList(list);
		}
	} else if (path === '/market' || path.startsWith('/shop/')) {
		const catalogItems = Array.from(document.querySelectorAll('.CatalogPage-item'));
		for (let i = 0; i < catalogItems.length; i++) {
			await adjustItem(catalogItems[i]);
		}
		if (location.search.includes('sort=date')) {
			await waitForElement('.CatalogHeader-tooltipLive');
			// addLiveFilterMenu(document.querySelector('.CatalogHeader-tooltipLive') as Element);
		}
		if (location.search.includes('bf=live')) {
			(<HTMLButtonElement>document.querySelector('.LiveBtn'))?.click();
		}
	} else if (path.startsWith('/cart')) {
		const cartContainer = document.querySelector('.Cart-container');
		if (cartContainer) {
			await adjustCart(cartContainer);
		}
	} else if (path.startsWith('/item/') || path.startsWith('/i/') || path.startsWith('/myitems/i/')) {
		const itemPage = document.querySelector('.ItemPage');
		if (itemPage) {
			await adjustItem(itemPage, itemSelectors.page);
		}
	} else if (path.startsWith('/myitems/')) {
		const inventoryItems = Array.from(document.querySelectorAll('.InventoryPage-item'));
		for (const item of inventoryItems) {
			await adjustItem(item);
		}
	} else if (path.startsWith('/checkout/')) {
		const cartItems = Array.from(document.querySelectorAll('.CheckoutConfirmation-item'));
		for (const item of cartItems) {
			await adjustItem(item);
		}
	} else if (path.startsWith('/sell')) {
		const sellItems = Array.from(document.querySelectorAll('.SellPage-item'));
		for (const item of sellItems) {
			await adjustItem(item);
		}
	}

	// refresh prices every hour
	setInterval(
		async () => {
			console.log('[BetterFloat] Refreshing prices (hourly) ...');
			await initPriceMapping(extensionSettings, 'sp');
		},
		1000 * 60 * 61
	);
}

function createLanguagePopup() {
	const newPopup = html`
		<div class="betterfloat-popup-outer" style="backdrop-filter: blur(2px); font-size: 16px;">
			<div class="betterfloat-popup-language">
				<div style="display: flex; align-items: center; justify-content: space-between; margin: 0 10px;">
					<img
						src="${ICON_EXCLAMATION}"
						style="width: 32px; height: 32px; filter: brightness(0) saturate(100%) invert(42%) sepia(99%) saturate(1934%) hue-rotate(339deg) brightness(101%) contrast(105%);"
					/>
					<h2 style="font-weight: 700;">Warning: Language not supported</h2>
					<a class="close" style="margin-bottom: 10px; cursor: pointer;">x</a>
				</div>
				<p style="margin-top: 30px;">
					BetterFloat currently only supports the English language on Skinport. Please use the button below to change the language to English. If it doesn't work, scroll to the bottom of the
					page and change the language manually.
				</p>
				<div style="display: flex; justify-content: center;">
					<button type="button" class="betterfloat-language-button">Change language</button>
				</div>
			</div>
		</div>
	`;
	document.body.insertAdjacentHTML('beforeend', newPopup);

	const closeButton = document.querySelector<HTMLButtonElement>('.betterfloat-popup-language .close');
	if (closeButton) {
		closeButton.onclick = () => {
			document.querySelector('.betterfloat-popup-outer')?.remove();
		};
	}
	const changeLanguageButton = document.querySelector<HTMLButtonElement>('.betterfloat-language-button');
	if (changeLanguageButton) {
		changeLanguageButton.onclick = () => {
			(<HTMLButtonElement>document.querySelector('.Dropdown-button')).click();
			(<HTMLButtonElement>document.querySelector('.Dropdown-dropDownItem')).click();
		};
	}
}

async function applyMutation() {
	const observer = new MutationObserver(async (mutations) => {
		if (extensionSettings['sp-enable']) {
			const gameTitle = document.querySelector('.GameSwitcherButton-title')?.textContent;
			if (!gameTitle || !gameTitle.includes('CS2')) return;
			for (const mutation of mutations) {
				for (let i = 0; i < mutation.addedNodes.length; i++) {
					const addedNode = mutation.addedNodes[i];
					// some nodes are not elements, so we need to check
					if (!(addedNode instanceof HTMLElement)) continue;
					// console.debug('[BetterFloat] Mutation detected:', addedNode);

					const className = addedNode.className.toString();
					if (
						className.includes('CatalogPage-item') ||
						className.includes('InventoryPage-item') ||
						className.includes('CheckoutConfirmation-item') ||
						className.includes('ItemList-item') ||
						className.includes('SellPage-item')
					) {
						await adjustItem(addedNode);
					} else if (className.includes('Cart-container')) {
						await adjustCart(addedNode);
					} else if (className.includes('ItemPage')) {
						// await adjustItemPage(addedNode);
						await adjustItem(addedNode, itemSelectors.page);
					} else if (className.includes('PopularList')) {
						await handlePopularList(addedNode);
					} else if (className.includes('CatalogHeader-tooltipLive')) {
						// contains live button
						// addLiveFilterMenu(addedNode);
					} else if (className.includes('CartButton-tooltip')) {
						autoCloseTooltip(addedNode);
					} else if (className.includes('Message')) {
						// contains 'item has been sold' message
					} else if (location.pathname.includes('/item/') && addedNode.id?.length > 0) {
						if (addedNode.querySelector('path[d="M6.26953 12.8371H10.5998V14.9125H6.26953V17.3723H12.8674V10.736H8.48589V8.78871H12.8674V6.48267H6.26953V12.8371Z"]') && isProduction) {
							addedNode.remove();
						}
					}
				}
			}
		}
	});
	observer.observe(document, { childList: true, subtree: true });
}

function autoCloseTooltip(container: Element) {
	if (!extensionSettings['sp-autoclosepopup']) return;
	let counterValue = 5;

	// add counter to tooltip container
	const links = container.querySelector('.CartButton-tooltipLinks');
	if (!links) return;
	const counter = document.createElement('div');
	counter.style.marginLeft = '40px';
	const counterText = document.createElement('span');
	counterText.textContent = 'Auto-close in ';
	counter.appendChild(counterText);
	const counterNumber = document.createElement('span');
	counterNumber.className = 'betterfloat-tooltip-counter';
	counterNumber.textContent = String(counterValue) + 's';
	counter.appendChild(counterText);
	counter.appendChild(counterNumber);
	links.appendChild(counter);

	// start counter
	const interval = setInterval(() => {
		counterNumber.textContent = String(--counterValue) + 's';
		if (counterValue === 0) {
			clearInterval(interval);
			(<HTMLButtonElement>links.querySelector('button.ButtonSimple')).click();
		}
	}, 1000);
}

async function handlePopularList(list: Element) {
	if (list.querySelector('h3')?.textContent?.includes('Counter-Strike')) {
		const popularItems = Array.from(list.querySelectorAll('.PopularList-item'));
		for (const item of popularItems) {
			await adjustItem(item);
		}
	}
}

async function adjustCart(container: Element) {
	// adjust the cart with Buff prices?
}

async function addSoldPrice(container: Element, item: Skinport.Item) {
	const currency = await getSpUserCurrency();

	const CurrencyFormatter = new Intl.NumberFormat(undefined, { style: 'currency', currency: currency, currencyDisplay: 'narrowSymbol', minimumFractionDigits: 2, maximumFractionDigits: 2 });
	const priceContainer = html`
		<div class="ItemPage-price">
			<div class="ItemPage-value">
				<div class="Tooltip-link">${CurrencyFormatter.format(new Decimal(item.salePrice).div(100).toNumber())}</div>
			</div>
		</div>
		<div class="ItemPage-suggested">Suggested price ${CurrencyFormatter.format(new Decimal(item.suggestedPrice).div(100).toNumber())}</div>
	`;

	container.querySelector('.ItemPage-notListed')?.insertAdjacentHTML('beforebegin', priceContainer);
}

async function adjustItem(container: Element, selector: ItemSelectors = itemSelectors.preview) {
	const isItemPage = selector === itemSelectors.page;
	if (isItemPage) {
		const itemRating = container.querySelector('.ItemPage-rating');
		if (itemRating) {
			itemRating.remove();
		}

		// wait until document title has loaded, which we use to get the item name
		while (document.title.startsWith('Skinport')) {
			await delay(100);
		}
	}

	const item = getSkinportItem(container, selector);
	if (!item) return;

	const isLiveActive = document.querySelector('.LiveBtn')?.className.includes('--isActive');
	const filterItem = isLiveActive ? applyFilter(item, container) : false;
	if (filterItem) {
		// console.log('[BetterFloat] Filtered item: ', item.name);
		(<HTMLElement>container).style.display = 'none';
		return;
	}

	if (item.type === 'Key') {
		return;
	}

	let popupItem: Skinport.ItemData | Skinport.InventoryItem | null = null;
	if (isItemPage && container.querySelector('.ItemPage-notListed')) {
		while (!popupItem) {
			await delay(100);
			popupItem = getSpPopupItem();
		}
		await addSoldPrice(container, popupItem.data.item);
		item.price = new Decimal(popupItem.data.item.salePrice).div(100).toDP(2).toNumber();
	}

	storeItem(container, item);
	const priceResult = await addBuffPrice(item, container, selector);

	if (isLiveActive && extensionSettings['user'].plan.type === 'pro') {
		if (liveBuffFilter(priceResult)) {
			(<HTMLElement>container).style.display = 'none';
			return;
		}
	}

	if (extensionSettings['sp-stickerprices'] && !location.pathname.startsWith('/sell/')) {
		await addStickerInfo(container, item, selector, priceResult.price_difference, isItemPage);
	}
	if (extensionSettings['sp-floatcoloring']) {
		addFloatColoring(container, item);
	}

	if (isLiveActive && priceResult.percentage && (await checkUserPlanPro(extensionSettings['user']))) {
		await liveNotifications(item, priceResult.percentage);
	}

	const getAPIItem = () => {
		if (isItemPage) {
			popupItem = location.pathname.includes('myitems/i/') ? getSpPopupInventoryItem() : getSpPopupItem();
			return popupItem?.data.item as Skinport.Item;
		} else {
			return getSpItem(String(item.saleId));
		}
	};

	let cachedItem = getAPIItem();
	if (isItemPage) {
		let tries = 0;
		while (!cachedItem && tries++ < 10) {
			await delay(100);
			cachedItem = getAPIItem();
		}
		if (tries >= 10) {
			console.error('[BetterFloat] Could not get item from API');
		}
	}
	if (cachedItem) {
		if (cachedItem.name !== item.name) {
			console.log('[BetterFloat] Item name mismatch:', item.name, cachedItem.name);
			return;
		}

		if (isItemPage && popupItem) {
			const suggestedText = container.querySelector('.ItemPage-suggested');
			if (suggestedText && (<Skinport.ItemData>popupItem).data.offers) {
				let formattedPrice = '-';
				if ((<Skinport.ItemData>popupItem).data.offers?.lowPrice) {
					const lowPrice = new Decimal((<Skinport.ItemData>popupItem).data.offers.lowPrice ?? 0).div(100).toDP(2).toNumber();
					formattedPrice = CurrencyFormatter(popupItem.data.item.currency).format(lowPrice);
				}
				suggestedText.innerHTML += `<br>Lowest on Skinport: ${formattedPrice} (${(<Skinport.ItemData>popupItem).data.offers?.offerCount} offers)`;
			}

			addQuickLinks(container, popupItem);

			await patternDetections(container, cachedItem);
		}

		addPattern(container, cachedItem);

		addAdditionalStickerInfo(container, cachedItem);

		if (extensionSettings['sp-csbluegem'] && ['Case Hardened', 'Heat Treated'].some((name) => cachedItem.name.includes(name)) && cachedItem.category !== 'Gloves') {
			await addBlueBadge(container, cachedItem);
		}

		if (extensionSettings['sp-displayconvertedprice']) {
			await displayAlternativePrice(container, cachedItem);
		}
	}

	if (isItemPage) {
		const embeddedItems = Array.from(document.querySelectorAll('.ItemList-item'));
		for (const item of embeddedItems) {
			await adjustItem(item);
		}
	}
}

async function displayAlternativePrice(container: Element, item: Skinport.Item) {
	const priceContainer = container.querySelector('.ItemPreview-priceValue');
	if (!priceContainer) return;

	const userData = JSON.parse(localStorage.getItem('userData') ?? '{}') as Skinport.UserData;
	if (userData.currency === 'EUR') return;
	const currencyRate = userData.rate;

	const newPrice = html`
		<div class="ItemPreview-oldPrice" style="font-size: 15px; color: lightgray; font-weight: 600; margin-top: 0; margin-bottom: -5px;">
			Converted: ${CurrencyFormatter('EUR', 2, 2).format(new Decimal(item.salePrice).div(currencyRate).div(100).toNumber())}
		</div>
	`;

	priceContainer.insertAdjacentHTML('afterend', newPrice);
}

function getAlternativeItemLink(item: Skinport.Item) {
	const typePart = `${(item.subCategory ?? item.title).toLowerCase().replaceAll(' ', '-')}-${item.family.toLowerCase().replaceAll(' ', '-')}`;
	const exteriorPart = item.exterior ? `/${item.exterior.toLowerCase().replaceAll(' ', '-')}` : '';
	return typePart + exteriorPart;
}

function addQuickLinks(container: Element, popupItem: Skinport.InventoryItem | Skinport.ItemData) {
	const buttonGroup = container.querySelector('.ItemPage-btnGroup');
	if (!buttonGroup) {
		return;
	}

	const item = popupItem.data.item;
	const adjustedURL = item.url.replace('+', '-');
	const altURL = getAlternativeItemLink(item);
	const quickLinks = [
		{
			icon: ICON_CSGOSKINS,
			text: 'CSGOSkins',
			link: `https://csgoskins.gg/items/${altURL}`,
		},
		{
			icon: ICON_STEAMANALYST,
			text: 'SteamAnalyst',
			link: `https://csgo.steamanalyst.com/skin/${adjustedURL}`,
		},
		{
			icon: ICON_PRICEMPIRE,
			text: 'Pricempire',
			// Old site: `https://app.pricempire.com/item/cs2/${adjustedURL}`,
			link: `https://pricempire.com/item/${adjustedURL}`,
		},
	];

	const quickLinksContainer = html`
		<div class="ButtonGroup ItemPage-btnGroup betterfloat-quicklinks" style="margin-top: 10px;">
			${quickLinks
				.map(
					(link) => html`
						<button type="button" onclick="window.open('${link.link}?utm_source=betterfloat', '_blank')" style="flex-direction: column; gap: 4px;">
							<img src="${link.icon}" style="height: 24px; border-radius: 5px; vertical-align: middle;" />
							<span>${link.text}</span>
						</button>
					`
				)
				.join('')}
		</div>
	`;

	if (!buttonGroup.querySelector('.betterfloat-quicklinks')) {
		buttonGroup.insertAdjacentHTML('afterend', quickLinksContainer);
	}
}

async function liveNotifications(item: Skinport.Listing, percentage: Decimal) {
	const notificationSettings: Skinport.BFNotification = localStorage.getItem('spNotification')
		? JSON.parse(localStorage.getItem('spNotification') ?? '')
		: { active: false, name: '', priceBelow: 0 };

	if (notificationSettings.isActive) {
		if (notificationSettings.name && !item.full_name.includes(notificationSettings.name)) {
			return;
		}

		if (notificationSettings.excludeStatTrak && item.full_name.includes('StatTrak')) {
			return;
		}

		if (percentage.gte(notificationSettings.priceBelow) || percentage.lt(1)) {
			return;
		}

		if (
			notificationSettings.floatRanges &&
			notificationSettings.floatRanges.length === 2 &&
			notificationSettings.floatRanges[0] > 0 &&
			notificationSettings.floatRanges[1] < 1 &&
			(!item.wear || item.wear < notificationSettings.floatRanges[0] || item.wear > notificationSettings.floatRanges[1])
		) {
			return;
		}

		let priceText = String(item.price);
		if (item.currency === '€') {
			priceText += item.currency;
		} else {
			priceText = item.currency + priceText;
		}

		const title = 'Item Found | BetterFloat Pro';
		const body = `${percentage.toFixed(2)}% Buff (${priceText}): ${item.full_name}`;
		if (notificationSettings.browser) {
			// show notification
			const notification = new Notification(title, {
				body,
				icon: ICON_SKINPORT,
				silent: false,
			});
			notification.onclick = () => {
				window.open(`https://skinport.com${item.url}`, '_blank');
			};
			notification.onerror = () => {
				console.error('[BetterFloat] Error creating notification:', notification);
			};
		} else {
			await createNotificationMessage({
				id: item.url,
				site: 'skinport',
				title,
				message: body,
			});
		}
	}
}

function liveBuffFilter({ percentage }: { price_difference: Decimal; percentage?: Decimal }): boolean {
	const spFilter: SPFilter = localStorage.getItem('spFilter') ? JSON.parse(localStorage.getItem('spFilter') ?? '') : DEFAULT_FILTER;

	const filterPercentage = new Decimal(spFilter.percentage ?? 0);
	if (filterPercentage.gt(10) && percentage) {
		return percentage.gt(filterPercentage);
	}
	return false;
}

function storeItem(container: Element, item: Skinport.Listing) {
	container.className += ' sale-' + item.saleId;
	container.setAttribute('data-betterfloat', JSON.stringify(item));
}

export async function patternDetections(container: Element, item: Skinport.Item) {
	if (item.name.includes('Case Hardened') || item.name.includes('Heat Treated')) {
		await caseHardenedDetection(container, item);
	}
}

export async function addBlueBadge(container: Element, item: Skinport.Item) {
	const itemHeader = container.querySelector('.TradeLock-lock')?.firstChild;
	if (!itemHeader || container.querySelector('.betterfloat-gem-container')) return;

	const blueType = item.name === 'Heat Treated' && item.subCategory === 'Five-SeveN' ? 'Five-SeveN Heat Treated' : item.subCategory!;
	const patternElement = await fetchBlueGemPatternData({
		type: blueType.replaceAll(' ', '_'),
		pattern: item.pattern,
	});
	if (!patternElement) {
		console.warn('[BetterFloat] Could not fetch pattern data for ', item.name);
		return;
	}
	const gemContainer = genGemContainer({ patternElement, site: 'SP' });
	if (!gemContainer) return;
	gemContainer.style.fontSize = '11px';
	(<HTMLElement>itemHeader.parentElement).style.justifyContent = 'space-between';
	itemHeader.after(gemContainer);
}

async function caseHardenedDetection(container: Element, item: Skinport.Item) {
	if (!['Case Hardened', 'Heat Treated'].some((name) => item.name.includes(name)) || item.category === 'Gloves') return;

	// sanitized for CSBlueGem's supported currencies, otherwise use USD
	const sanitizedCurrency = (currency: string) => {
		return ['CNY', 'USD', 'EUR', 'JPY', 'GBP', 'AUD', 'CAD'].includes(currency) ? currency : 'CNY';
	};
	const usedCurrency = sanitizedCurrency(item.currency);
	const currencySymbol = getSymbolFromCurrency(usedCurrency);
	const blueType = item.name === 'Heat Treated' && item.subCategory === 'Five-SeveN' ? 'Five-SeveN Heat Treated' : item.subCategory!;
	const patternElement = await fetchBlueGemPatternData({ type: blueType.replaceAll(' ', '_'), pattern: item.pattern });
	const pastSales = await fetchBlueGemPastSales({ type: blueType, paint_seed: item.pattern, currency: usedCurrency });

	const itemHeader = container.querySelector('.ItemPage-itemHeader');
	if (!itemHeader || !patternElement) return;
	const gemContainer = genGemContainer({ patternElement, site: 'SP', large: true });
	if (gemContainer) {
		itemHeader.appendChild(gemContainer);
	}

	const linksContainer = container.querySelector('.ItemHistory-links');
	if (!linksContainer || !linksContainer.lastElementChild) return;
	const patternLink = <HTMLElement>linksContainer.lastElementChild.cloneNode(true);
	patternLink.id = 'react-tabs-6';
	patternLink.setAttribute('aria-controls', 'react-tabs-7');
	patternLink.textContent = `Buff Pattern Sales (${pastSales?.length ?? 0})`;
	patternLink.style.color = 'deepskyblue';

	const itemHistory = container.querySelector('.ItemHistory');
	if (!itemHistory || !itemHistory.lastElementChild) return;
	const tableTab = <HTMLElement>itemHistory.lastElementChild.cloneNode(false);
	tableTab.id = 'react-tabs-7';
	tableTab.setAttribute('aria-labelledby', 'react-tabs-6');
	const tableHeader = html`
		<div class="ItemHistoryList-header">
			<div>Source</div>
			<div>Date</div>
			<div>Float Value</div>
			<div>Price</div>
			<div>
				<a href="https://csbluegem.com/search?skin=${blueType}&pattern=${item.pattern}" target="_blank" style="margin-right: 15px;"
					>${ICON_ARROWUP_SMALL}</a
				>
			</div>
		</div>
	`;
	let tableBody = '';
	for (const sale of pastSales ?? []) {
		tableBody += html`
			<div class="ItemHistoryList-row"${Math.abs(item.wear! - sale.wear) < 0.00001 ? ' style="background-color: darkslategray;"' : ''}>
				<div class="ItemHistoryList-col" style="width: 25%;">
					<img style="height: 24px; margin-left: 5px;" src="${sale.origin === 'CSFloat' ? ICON_CSFLOAT : ICON_BUFF}"></img>
				</div>
				<div class="ItemHistoryList-col" style="width: 24%;">${sale.date}</div>
				<div class="ItemHistoryList-col" style="width: 27%;">
					${sale.type === 'stattrak' ? '<span class="ItemPage-title" style="color: rgb(134, 80, 172);">★ StatTrak™</span>' : ''}
					${sale.wear}
				</div>
				<div class="ItemHistoryList-col" style="width: 24%;">${currencySymbol} ${sale.price}</div>
				<div style="width: 60px; display: flex; justify-content: flex-end; align-items: center; gap: 8px;">
					${
						sale.screenshots.inspect
							? html`
								<a href="${sale.screenshots.inspect}" target="_blank" title="Show Buff screenshot">
									<img src="${ICON_CAMERA}" style="filter: brightness(0) saturate(100%) invert(73%) sepia(57%) saturate(1739%) hue-rotate(164deg) brightness(92%) contrast(84%); margin-right: 5px; height: 20px;"></img>
								</a>
							  `
							: ''
					}
					${
						sale.screenshots.inspect_playside
							? html`
						<a href="${sale.screenshots.inspect_playside}" target="_blank" title="Show CSFloat font screenshot">
							<img src="${ICON_CAMERA}" style="filter: brightness(0) saturate(100%) invert(73%) sepia(57%) saturate(1739%) hue-rotate(164deg) brightness(92%) contrast(84%); margin-right: 5px; height: 20px;"></img>
						</a>
						<a href="${sale.screenshots.inspect_backside}" target="_blank" title="Show CSFloat back screenshot">
							<img src="${ICON_CAMERA_FLIPPED}" style="filter: brightness(0) saturate(100%) invert(39%) sepia(52%) saturate(4169%) hue-rotate(201deg) brightness(113%) contrast(101%); margin-right: 5px; height: 20px;"></img>
						</a>
					`
							: ''
					}
				</div>
			</div>
		`;
	}
	const tableHTML = `<div class="ItemHistoryList">${tableHeader}${tableBody}</div>`;
	tableTab.innerHTML = tableHTML;
	itemHistory?.appendChild(tableTab);

	patternLink.onclick = () => {
		const currActive = document.querySelector('.ItemHistory-link.active');
		if (currActive) {
			currActive.classList.remove('active');
			currActive.setAttribute('aria-selected', 'false');
		}
		patternLink.classList.add('active');
		patternLink.setAttribute('aria-selected', 'true');

		document.querySelector('.ItemHistory-tab.active')?.classList.remove('active');
		tableTab.classList.add('active');
	};
	for (const child of Array.from(linksContainer.children)) {
		(<HTMLElement>child).onclick = () => {
			patternLink.classList.remove('active');
			patternLink.setAttribute('aria-selected', 'false');
			tableTab.classList.remove('active');

			document.querySelector('.ItemHistory-link.active')?.classList.remove('active');
			document.querySelector('.ItemHistory-tab.active')?.classList.remove('active');
			child.classList.add('active');
			document.querySelector(`#${child.getAttribute('aria-controls')}`)?.classList.add('active');
		};
	}
	linksContainer.appendChild(patternLink);
}

// true: remove item, false: display item
function applyFilter(item: Skinport.Listing, container: Element) {
	const spFilter: SPFilter = localStorage.getItem('spFilter') ? JSON.parse(localStorage.getItem('spFilter') ?? '') : DEFAULT_FILTER;
	// since it's a new setting, we need to check if it exists
	if (spFilter.types.charm === undefined) {
		spFilter.types.charm = true;
		// and store it back
		localStorage.setItem('spFilter', JSON.stringify(spFilter));
	}
	const targetName = spFilter.name.toLowerCase();
	// if true, item should be filtered
	const nameCheck = targetName !== '' && !item.full_name.toLowerCase().includes(targetName);
	const priceCheck = item.price < spFilter.priceLow || item.price > spFilter.priceHigh;
	const typeCheck = !spFilter.types[item.category.toLowerCase()];

	const tradeLockText = container.querySelector('div.TradeLock-lock')?.textContent?.split(' ');
	const tradeLock = tradeLockText?.length === 3 ? parseInt(tradeLockText[1]) : undefined;
	const newCheck = spFilter.new && (!tradeLock || tradeLock < 7);

	return nameCheck || priceCheck || typeCheck || newCheck;
}

async function addStickerInfo(container: Element, item: Skinport.Listing, selector: ItemSelectors, price_difference: Decimal, isItemPage = false) {
	const stickers = item.stickers;
	if (item.stickers.length === 0 || item.text.includes('Agent') || item.text.includes('Souvenir')) {
		return;
	}
	const stickerPrices = await Promise.all(stickers.map(async (s) => await getItemPrice(s.name, extensionSettings['sp-pricingsource'] as MarketSource)));

	const settingRate = Number(extensionSettings['sp-currencyrates']) === 0 ? 'real' : 'skinport';
	const currencyRate = await getSpUserCurrencyRate(settingRate);

	const priceSum = convertCurrency(new Decimal(stickerPrices.reduce((a, b) => a + b.starting_at, 0)), currencyRate, settingRate);
	const spPercentage = new Decimal(price_difference).div(priceSum);

	const itemInfoDiv = container.querySelector(selector.info);
	// don't display SP if total price is below $1
	if (itemInfoDiv && priceSum.gt(2)) {
		if (isItemPage) {
			const wrapperDiv = document.createElement('div');
			wrapperDiv.style.display = 'flex';
			const h3 = itemInfoDiv.querySelector('.ItemPage-h3')?.cloneNode(true);
			if (h3 && itemInfoDiv.firstChild) {
				itemInfoDiv.removeChild(itemInfoDiv.firstChild);
				wrapperDiv.appendChild(h3);
			}
			wrapperDiv.appendChild(generateSpStickerContainer(priceSum.toDP(2).toNumber(), spPercentage.toNumber(), item.currency, true));
			itemInfoDiv.firstChild?.before(wrapperDiv);
		} else {
			itemInfoDiv.before(generateSpStickerContainer(priceSum.toDP(2).toNumber(), spPercentage.toNumber(), item.currency));
		}
	}
}

/**
 * Adds a visual sticker wear effect if its stickers are scraped
 */
function addAdditionalStickerInfo(container: Element, item: Skinport.Item) {
	const stickers = item.stickers;
	if (stickers.length === 0 || item.text.includes('Agent')) {
		return;
	}

	const stickersDiv = Array.from(container.querySelectorAll<HTMLImageElement>('.ItemPreview-stickers img'));

	for (const sticker of stickers) {
		if (sticker.wear && sticker.wear > 0) {
			const stickerDiv = stickersDiv.at(stickers.indexOf(sticker))!;
			stickerDiv.style.filter = `brightness(${0.8 - sticker.wear * 0.6}) contrast(${0.8 - sticker.wear * 0.6})`;
		}
	}
}

function addFloatColoring(container: Element, item: Skinport.Listing | Skinport.Item) {
	const floatContainer = container.querySelector('.WearBar-value');
	if (!floatContainer || item.wear === null) return;

	// Could be improved with l, h values
	const floatColor = getFloatColoring(item.wear, 0, 1, item.name.includes('Vanilla'));
	if (floatColor !== '') {
		(<HTMLElement>floatContainer).style.color = floatColor;
	}
}

const itemSelectors = {
	preview: {
		name: '.ItemPreview-itemName',
		title: '.ItemPreview-itemTitle',
		text: '.ItemPreview-itemText',
		stickers: '.ItemPreview-stickers',
		price: '.ItemPreview-price',
		info: '.ItemPreview-itemInfo',
		alt: '.ItemPreview-itemImage > img',
		priceParent: '.ItemPreview-priceValue',
		oldPrice: '.ItemPreview-oldPrice',
	},
	page: {
		name: '.ItemPage-name',
		title: '.ItemPage-title',
		text: '.ItemPage-text',
		stickers: '.ItemPage-include',
		price: '.ItemPage-price',
		info: '.ItemPage-include',
		alt: '.ItemImage-img',
		priceParent: '.ItemPage-price',
		oldPrice: '.ItemPage-suggested',
	},
} as const;

type ItemSelectors = (typeof itemSelectors)[keyof typeof itemSelectors];

function getSkinportItem(container: Element, selector: ItemSelectors): Skinport.Listing | null {
	const name = container.querySelector(selector.name)?.textContent?.trim() ?? '';
	if (name === '') {
		return null;
	}

	let priceText = container.querySelector(selector.price + ' .Tooltip-link')?.textContent?.trim() ?? '';
	let currency = '';
	// regex also detects &nbsp as whitespace!
	if (priceText.split(/\s/).length > 1) {
		// format: "1 696,00 €" -> Skinport uses &nbsp instead of whitespaces in this format!
		const parts = priceText.replace(',', '').replace('.', '').split(/\s/);
		priceText = String(Number(parts.filter((x) => !Number.isNaN(+x)).join('')) / 100);
		currency = parts.filter((x) => Number.isNaN(+x))[0];
	} else {
		// format: "€1,696.00"
		const firstDigit = Array.from(priceText).findIndex((x) => !Number.isNaN(Number(x)));
		currency = priceText.substring(0, firstDigit);
		priceText = String(Number(priceText.substring(firstDigit).replace(',', '').replace('.', '')) / 100);
	}
	let price = Number(priceText);

	if (Number.isNaN(price) || !Number.isNaN(Number(currency))) {
		price = 0;
		currency = '';
	}

	const type = container.querySelector(selector.title)?.textContent ?? '';
	const text = container.querySelector(selector.text)?.innerHTML ?? '';
	// Skinport uses more detailed item types than Buff163, they are called categories here
	const lastWord = text.split(' ').pop() ?? '';
	let category = '';
	if (lastWord === 'Knife' || lastWord === 'Gloves' || lastWord === 'Agent') {
		category = lastWord;
	} else if (lastWord === 'Rifle' || lastWord === 'Pistol' || lastWord === 'SMG' || lastWord === 'Sniper' || lastWord === 'Shotgun' || lastWord === 'Machinegun') {
		category = 'Weapon';
	} else {
		category = type;
	}

	let style: ItemStyle = '';
	if (name.includes('Doppler') && (category === 'Knife' || category === 'Weapon')) {
		style = name.split('(')[1].split(')')[0] as ItemStyle;
	} else if (name.includes('Vanilla')) {
		style = 'Vanilla';
	}

	const stickers: { name: string }[] = [];
	const stickersDiv = container.querySelector(selector.stickers);
	if (stickersDiv) {
		for (const sticker of Array.from(stickersDiv.children)) {
			const stickerName = sticker.children[0]?.getAttribute('alt');
			if (stickerName) {
				stickers.push({
					name: 'Sticker | ' + stickerName,
				});
			}
		}
	}
	const getWear = (wearDiv: HTMLElement) => {
		let wear = '';

		if (wearDiv) {
			const w = Number(wearDiv.innerHTML);
			if (w < 0.07) {
				wear = 'Factory New';
			} else if (w < 0.15) {
				wear = 'Minimal Wear';
			} else if (w < 0.38) {
				wear = 'Field-Tested';
			} else if (w < 0.45) {
				wear = 'Well-Worn';
			} else {
				wear = 'Battle-Scarred';
			}
		}
		return wear;
	};
	const wearDiv = container.querySelector('.WearBar-value');
	const wear = wearDiv ? getWear(wearDiv as HTMLElement) : '';

	const full_name = selector === itemSelectors.page ? document.title.split(' - ').slice(0, -2).join(' - ') : (container.querySelector(selector.alt)?.getAttribute('alt') ?? '');

	const url = selector === itemSelectors.page ? location.pathname : (container.querySelector('.ItemPreview-link')?.getAttribute('href') ?? '');
	const saleId = Number(url?.split('/').pop() ?? 0);
	return {
		name: name,
		price: Number.isNaN(price) ? 0 : price,
		type: type,
		category: category,
		text: text,
		stickers: stickers,
		style: style,
		wear: Number(wearDiv?.innerHTML),
		wear_name: wear,
		currency: currency,
		saleId: saleId,
		full_name: full_name,
		url,
	};
}

export async function getBuffItem(buff_name: string, itemStyle: ItemStyle) {
	let source = extensionSettings['sp-pricingsource'] as MarketSource;
	let { priceListing, priceOrder, priceAvg30, liquidity } = await getBuffPrice(buff_name, itemStyle, source);

	if (source === MarketSource.Buff && isBuffBannedItem(buff_name)) {
		priceListing = new Decimal(0);
		priceOrder = new Decimal(0);
	}

	if ((!priceListing && !priceOrder) || (priceListing?.isZero() && priceOrder?.isZero())) {
		source = extensionSettings['sp-altmarket'] as MarketSource;
		if (source !== MarketSource.None) {
			const altPrices = await getBuffPrice(buff_name, itemStyle, source);
			priceListing = altPrices.priceListing;
			priceOrder = altPrices.priceOrder;
			priceAvg30 = altPrices.priceAvg30;
			liquidity = altPrices.liquidity;
		}
	}

	//convert prices to user's currency
	const settingRate = extensionSettings['sp-currencyrates'] === 0 ? 'real' : 'skinport';
	const currencyRate = await getSpUserCurrencyRate(settingRate);
	if (priceListing) {
		priceListing = convertCurrency(priceListing, currencyRate, settingRate);
	}
	if (priceOrder) {
		priceOrder = convertCurrency(priceOrder, currencyRate, settingRate);
	}
	if (priceAvg30) {
		priceAvg30 = convertCurrency(priceAvg30, currencyRate, settingRate);
	}

	return { buff_name, priceListing, priceOrder, priceAvg30, liquidity, source };
}

function convertCurrency(price: Decimal, currencyRate: number, settingRate: 'real' | 'skinport') {
	return settingRate === 'skinport' ? price.div(currencyRate) : price.mul(currencyRate);
}

async function addBuffPrice(item: Skinport.Listing, container: Element, selector: ItemSelectors) {
	const { buff_name, priceListing, priceOrder, source } = await getBuffItem(item.full_name, item.style);
	const market_id = getMarketID(buff_name, source);

	const priceParent = container.querySelector<HTMLElement>(selector.priceParent)!;
	const priceDiv = container.querySelector<HTMLElement>(selector.oldPrice);
	const currencyRate = await getSpUserCurrency();
	const isDoppler = item.name.includes('Doppler') && item.category === 'Knife';
	if (!container.querySelector('.betterfloat-buffprice')) {
		const buffContainer = generatePriceLine({
			source,
			market_id,
			buff_name,
			priceOrder,
			priceListing,
			priceFromReference: priceListing,
			userCurrency: currencyRate,
			itemStyle: item.style as DopplerPhase,
			CurrencyFormatter: new Intl.NumberFormat(undefined, {
				style: 'currency',
				currency: currencyRate,
				currencyDisplay: 'narrowSymbol',
				minimumFractionDigits: 0,
				maximumFractionDigits: 2,
			}),
			isDoppler,
			isPopout: selector === itemSelectors.page,
			hasPro: isUserPro(extensionSettings['user']),
		});

		const parentContainer = priceDiv ?? priceParent;
		if (selector === itemSelectors.page) {
			parentContainer.insertAdjacentHTML('afterend', buffContainer);
		} else if (!priceDiv) {
			const divider = document.createElement('div');
			parentContainer.appendChild(divider);
			parentContainer.insertAdjacentHTML('beforeend', buffContainer);
		} else if (extensionSettings['sp-steamprices']) {
			const divider = document.createElement('div');
			parentContainer.insertAdjacentHTML('beforeend', buffContainer);
			parentContainer.after(divider);
		} else {
			parentContainer.outerHTML = buffContainer;
		}

		if (!priceDiv) {
			priceParent?.setAttribute('style', 'flex-direction: column; align-items: flex-start;');
		}
	}

	const href = getMarketURL({ source, market_id, buff_name, phase: isDoppler ? (item.style as DopplerPhase) : undefined });

	if (Number(extensionSettings['sp-bufflink']) === 0) {
		const presentationDiv = container.querySelector('.ItemPreview-mainAction');
		if (presentationDiv) {
			const buffLink = html`<a class="ItemPreview-sideAction betterfloat-bufflink" style="border-radius: 0; width: 60px;" target="_blank" href="${href}">${toTitleCase(source)}</a>`;
			if (!container.querySelector('.betterfloat-bufflink')) {
				presentationDiv.insertAdjacentHTML('afterend', buffLink);
			}
		}
	} else {
		const buffContainer = container.querySelector('.betterfloat-buff-container');
		if (buffContainer) {
			buffContainer.addEventListener('click', (e) => {
				e.stopPropagation();
				e.preventDefault();
				window.open(href, '_blank');
			});
		}
	}

	const priceFromReference =
		extensionSettings['sp-pricereference'] === 0 && ([MarketSource.Buff, MarketSource.Steam].includes(source) || (MarketSource.YouPin === source && isUserPro(extensionSettings['user'])))
			? priceOrder
			: priceListing;
	const difference = new Decimal(item.price).minus(priceFromReference ?? 0);
	const percentage = new Decimal(item.price).div(priceFromReference ?? item.price).mul(100);
	if ((!extensionSettings['sp-buffdifference'] && !extensionSettings['sp-buffdifferencepercent']) || location.pathname === '/myitems/inventory' || location.pathname.startsWith('/sell/')) {
		return {
			price_difference: difference,
		};
	}
	let discountContainer = container.querySelector<HTMLElement>('.ItemPreview-discount');
	if (!discountContainer || !discountContainer.firstChild) {
		discountContainer = document.createElement('div');
		discountContainer.className = 'GradientLabel ItemPreview-discount';
		const newSaleTag = document.createElement('span');
		discountContainer.appendChild(newSaleTag);
		priceParent?.appendChild(discountContainer);
	}
	const saleTag = discountContainer.firstChild as HTMLElement;
	if (item.price !== 0 && !Number.isNaN(item.price) && saleTag && !discountContainer.querySelector('.betterfloat-sale-tag') && (priceListing?.gt(0) || priceOrder?.gt(0))) {
		saleTag.className = 'sale-tag betterfloat-sale-tag';
		discountContainer.style.background = `linear-gradient(135deg,#0073d5,${
			difference.isZero() ? extensionSettings['sp-color-neutral'] : difference.isNeg() ? extensionSettings['sp-color-profit'] : extensionSettings['sp-color-loss']
		})`;

		const saleTagStyle = 'display: flex; flex-direction: column; align-items: center; line-height: 16px;' + (selector === itemSelectors.page ? 'font-weight: 700;' : '');

		const percentageText = `${percentage.toFixed(percentage.gt(150) ? 0 : 2)}%`;
		const buffPriceHTML = html`
			<div style="${saleTagStyle}">
				${extensionSettings['sp-buffdifference'] ? `<span>${difference.isPos() ? '+' : '-'}${item.currency}${difference.abs().toFixed(difference.gt(1000) ? 1 : 2)}</span>` : ''}${
					extensionSettings['sp-buffdifferencepercent'] ? `<span>${extensionSettings['sp-buffdifference'] ? `(${percentageText})` : percentageText}</span>` : ''
				}
			</div>
		`;
		saleTag.innerHTML = buffPriceHTML;
		saleTag.setAttribute('data-betterfloat', JSON.stringify({ priceFromReference, difference, percentage }));
	}

	return {
		price_difference: difference,
		percentage,
	};
}

let extensionSettings: IStorage;
// mutation observer active?
let isObserverActive = false;
