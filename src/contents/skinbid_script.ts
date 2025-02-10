import getSymbolFromCurrency from 'currency-symbol-map';
import Decimal from 'decimal.js';

import { activateHandler, initPriceMapping } from '~lib/handlers/eventhandler';
import { getItemPrice, getMarketID, loadMapping } from '~lib/handlers/mappinghandler';
import { fetchBlueGemPastSales } from '~lib/handlers/networkhandler';
import { ICON_ARROWUP_SMALL, ICON_BUFF, ICON_C5GAME, ICON_CAMERA, ICON_CLOCK, ICON_CSFLOAT, ICON_STEAM, ICON_YOUPIN, MarketSource } from '~lib/util/globals';
import {
	CurrencyFormatter,
	calculateEpochFromDate,
	calculateTime,
	getBuffLink,
	getBuffPrice,
	getMarketURL,
	getSPBackgroundColor,
	handleSpecialStickerNames,
	isBuffBannedItem,
	toTitleCase,
} from '~lib/util/helperfunctions';
import { getAllSettings } from '~lib/util/storage';

import { html } from 'common-tags';
import type { PlasmoCSConfig } from 'plasmo';
import type { ItemStyle } from '~lib/@typings/FloatTypes';
import type { Skinbid } from '~lib/@typings/SkinbidTypes';
import { getFirstSkbItem, getSkbCurrency, getSkbUserConversion, getSkbUserCurrencyRate, getSpecificSkbInventoryItem, getSpecificSkbItem } from '~lib/handlers/cache/skinbid_cache';
import { type SKINBID_SELECTOR, SKINBID_SELECTORS } from '~lib/handlers/selectors/skinbid_selectors';
import type { IStorage } from '~lib/util/storage';

export const config: PlasmoCSConfig = {
	matches: ['https://*.skinbid.com/*'],
	css: ['../css/hint.min.css', '../css/common_styles.css', '../css/skinbid_styles.css'],
	run_at: 'document_end',
};

init();

async function init() {
	if (location.host !== 'skinbid.com') {
		return;
	}

	console.log('[BetterFloat] Starting BetterFloat');
	console.time('[BetterFloat] Skinbid init timer');
	// catch the events thrown by the script
	// this has to be done as first thing to not miss timed events
	activateHandler();

	extensionSettings = await getAllSettings();

	if (!extensionSettings['skb-enable']) {
		console.log('[BetterFloat] Skinbid disabled');
		return;
	}

	await initPriceMapping(extensionSettings, 'skb');

	console.group('[BetterFloat] Loading mappings...');
	await loadMapping(extensionSettings['skb-pricingsource'] as MarketSource);
	console.groupEnd();

	console.timeEnd('[BetterFloat] Skinbid init timer');

	await firstLaunch();

	// mutation observer is only needed once
	if (!isObserverActive) {
		isObserverActive = true;
		applyMutation();
		console.log('[BetterFloat] Observer started');
	}
}

async function firstLaunch() {
	console.log('[BetterFloat] First launch, url: ', location.pathname, location.search);
	if (location.pathname === '/') {
		const items = document.getElementsByTagName('NGU-TILE');
		for (let i = 0; i < items.length; i++) {
			await adjustItem(items[i], SKINBID_SELECTORS.card);
		}
	} else if (location.pathname === '/listings') {
		const items = document.getElementsByClassName('item-card');
		for (let i = 0; i < items.length; i++) {
			await adjustItem(items[i], SKINBID_SELECTORS.list);
		}
	} else if (location.pathname.startsWith('/market/') || location.pathname.startsWith('/auctions/')) {
		const items = document.querySelectorAll('.item');
		// first one is big item
		await adjustItem(items[0], SKINBID_SELECTORS.page);
		for (let i = 1; i < items.length; i++) {
			await adjustItem(items[i], SKINBID_SELECTORS.card);
		}
	} else if (location.pathname.includes('/shop/')) {
		const items = document.querySelectorAll('.items-desktop .auction-item-card');
		for (let i = 0; i < items.length; i++) {
			await adjustItem(items[i].parentElement!, SKINBID_SELECTORS.card);
		}
	} else if (location.pathname.includes('/inventory')) {
		const items = document.querySelectorAll('APP-INVENTORY-LIST-ITEM');
		for (let i = 0; i < items.length; i++) {
			await adjustInventoryItem(items[i]);
		}
	}
}

function applyMutation() {
	const observer = new MutationObserver(async (mutations) => {
		if (extensionSettings['skb-enable']) {
			for (const mutation of mutations) {
				for (let i = 0; i < mutation.addedNodes.length; i++) {
					const addedNode = mutation.addedNodes[i];
					// some nodes are not elements, so we need to check
					if (!(addedNode instanceof HTMLElement)) continue;
					// console.log("Added node: ", addedNode);

					if (addedNode.children.length === 1) {
						const firstChild = addedNode.children[0];
						if (firstChild.tagName === 'AUCTION-LIST-ITEM') {
							await adjustItem(firstChild, SKINBID_SELECTORS.list);
							continue;
						} else if (firstChild.tagName === 'APP-AUCTION-CARD-ITEM') {
							// Items in user shop
							await adjustItem(firstChild, SKINBID_SELECTORS.card);
							continue;
						} else if (firstChild.tagName === 'APP-ITEM-CARD') {
							if (location.pathname === '/listings') {
								await adjustItem(firstChild, SKINBID_SELECTORS.list);
							} else {
								await adjustItem(firstChild, SKINBID_SELECTORS.card);
							}
							continue;
						}
					}
					if (addedNode.tagName === 'APP-INVENTORY-LIST-ITEM') {
						await adjustInventoryItem(addedNode);
					}
					if (addedNode.className) {
						const className = addedNode.className.toString();
						if (className.includes('item') && addedNode.tagName === 'NGU-TILE' && !isMobileItem(addedNode)) {
							// console.log('Found item: ', addedNode);
							await adjustItem(addedNode, SKINBID_SELECTORS.card);
						} else if (className.includes('item-category')) {
							// big item page
							const item = document.querySelector('.item');
							if (item) {
								await adjustItem(item, SKINBID_SELECTORS.page);
							}
						} else if (addedNode.tagName === 'APP-PRICE-CHART') {
							// console.log('Found price chart: ', addedNode);
						}
					}
				}
			}
		}
	});
	observer.observe(document, { childList: true, subtree: true });
}

function isMobileItem(container: Element) {
	return container.parentElement?.parentElement?.parentElement?.parentElement?.className.includes('item');
}

async function adjustItem(container: Element, selector: SKINBID_SELECTOR) {
	let hashHTML: string | undefined;
	if (selector.self === 'page') {
		hashHTML = location.pathname.split('/')[2];
	} else if (selector.self === 'card') {
		hashHTML = container.querySelector('a')?.getAttribute('href')?.split('/')[2];
	}
	let cachedItem: Skinbid.Listing | null | undefined;
	if (hashHTML) {
		cachedItem = getSpecificSkbItem(hashHTML);
	} else {
		cachedItem = getFirstSkbItem();
	}

	if (!cachedItem) return;

	const priceResult = await addBuffPrice(cachedItem, container, selector);
	if (extensionSettings['skb-listingage'] || selector.self === 'page') {
		addListingAge(container, cachedItem, selector.self);
	}
	if ((extensionSettings['skb-stickerprices'] || selector.self === 'page') && priceResult && priceResult?.price_difference) {
		await addStickerInfo(container, cachedItem, selector, priceResult.price_difference);
	}
	if (selector.self === 'page') {
		addBrowserInspect(container, cachedItem);
		await caseHardenedDetection(container, cachedItem);
	}
}

async function adjustInventoryItem(container: Element) {
	// on the first item, wait for the api data
	if (!document.querySelector('.betterfloat-buffprice')) {
		await new Promise((resolve) => setTimeout(resolve, 1000));
	}
	const source = extensionSettings['skb-pricingsource'] as MarketSource;
	const steamImage = container.querySelector('.item-image > img')?.getAttribute('src');
	const listedItem = getSpecificSkbInventoryItem(steamImage ?? '');
	console.log('[BetterFloat] Inventory item: ', listedItem);
	if (!listedItem) return;

	const item = listedItem.item;
	const { buff_name, priceListing, priceOrder } = await calculateBuffPrice(item);
	const market_id = getMarketID(buff_name, source);
	const buffHref =
		source === MarketSource.Buff && Number(market_id) > 0
			? getBuffLink(Number(market_id), item.dopplerPhase)
			: `https://buff.163.com/market/csgo#tab=selling&page_num=1&search=${encodeURIComponent(buff_name)}`;

	if (priceListing || priceOrder) {
		const currencyText = getUserCurrency().text;
		const cardFooter = container.querySelector<HTMLElement>('.card-footer > div');
		if (cardFooter && !container.querySelector('.betterfloat-buffprice')) {
			generateBuffContainer(cardFooter, priceListing, priceOrder, currencyText ?? 'USD', buffHref, source);
		}
	}
}

export function addBrowserInspect(container: Element, item: Skinbid.Listing) {
	const bottomLeft = container.querySelector('.bottom-left');
	if (!bottomLeft) return;

	const inspectButton = document.createElement('button');
	inspectButton.setAttribute('style', 'font-weight: 400; padding: 12px;');
	inspectButton.className = 'skb-button-ghost';
	inspectButton.innerHTML = `<img src="${ICON_CAMERA}" style="height: 1em; margin-right: 7px; filter: brightness(0) saturate(100%) invert(88%) sepia(7%) saturate(4339%) hue-rotate(189deg) brightness(85%) contrast(84%);"> Inspect in browser `;
	inspectButton.onclick = (event) => {
		event.stopPropagation();
		window.open(`https://swap.gg/screenshot?inspectLink=${item.items?.at(0)?.item.inspectLink}`);
	};
	bottomLeft.appendChild(inspectButton);
}

export async function caseHardenedDetection(container: Element, listing: Skinbid.Listing) {
	const chartContainer = container.querySelector('.price-chart-and-history');
	const item = listing.items?.at(0)?.item;
	if (!chartContainer || !item || item.name !== 'Case Hardened') return;

	let currency = getSkbCurrency();
	if (currency.length === 0) {
		currency = 'USD';
	}
	const currencySymbol = getSymbolFromCurrency(currency);
	const pastSales = await fetchBlueGemPastSales({ type: item.subCategory, paint_seed: item.paintSeed, currency });

	const newTab = document.createElement('div');
	newTab.className = 'tab betterfloat-tab-bluegem';
	newTab.innerHTML = `<div>Buff Pattern Sales (${pastSales?.length ?? 0})</div><a href="https://csbluegem.com/search?skin=${item.subCategory}&pattern=${
		item.paintSeed
	}" target="_blank" style="margin-left: 8px; translate: 0 2px;">${ICON_ARROWUP_SMALL}</a>`;
	newTab.addEventListener('click', () => {
		chartContainer.querySelector('.tab.active')?.classList.remove('active');
		newTab.classList.add('active');
		newTab.style.borderBottom = '2px solid #a3a3cb';

		// chartContainer.querySelector('app-price-chart')?.replaceWith(document.createComment(''));
		// chartContainer.querySelector('app-previous-sales')?.replaceWith(document.createComment(''));

		chartContainer.querySelector('app-price-chart')?.setAttribute('style', 'display: none;');
		chartContainer.querySelector('app-previous-sales')?.setAttribute('style', 'display: none;');

		const salesTable = document.createElement('app-bluegem-sales');
		const thStyle = 'text-align: start; padding-bottom: 6px; font-size: 12px; color: #a3a3cb;';
		const tdStyle = 'padding: 8px 0;text-align: start;border-top: 1px solid #21212b;';
		const getWear = (float: number) => {
			let wear = '';
			if (float < 0.07) {
				wear = 'Factory New';
			} else if (float < 0.15) {
				wear = 'Minimal Wear';
			} else if (float < 0.38) {
				wear = 'Field-Tested';
			} else if (float < 0.45) {
				wear = 'Well-Worn';
			} else {
				wear = 'Battle-Scarred';
			}
			return wear;
		};
		salesTable.innerHTML = `
            <div class="content">
                <table class="main-table" style="margin-top: 32px; width: 100%;">
                    <thead class="from-sm-table-cell">
                        <th style="${thStyle}">Source</th>
                        <th style="${thStyle}">Float</th>
                        <th style="${thStyle}">Pattern ID</th>
                        <th style="${thStyle}">Details</th>
                        <th style="${thStyle}">Date</th>
                        <th style="${thStyle}">Price</th>
                    </thead>
                <tbody style="font-size: 14px;">
                    ${pastSales
						?.map(
							(sale) => `
                        <tr class="has-wear" style="vertical-align: top;">
                            <td class="main-td img" style="${tdStyle}">
                                <img style="height: 24px;" src="${sale.origin === 'CSFloat' ? ICON_CSFLOAT : ICON_BUFF}"></img>
                            </td>
                            <td class="main-td wear" style="${tdStyle}">
                                <div>${getWear(sale.wear)}</div>
                                <div class="text-purple200" style="color: #a3a3cb; font-size: 12px;">${sale.wear.toFixed(6)}</div>
                            </td>
                            <td class="main-td pattern-id from-sm-table-cell" style="${tdStyle}"> ${sale.pattern} </td>
                            <td class="main-td from-sm-table-cell" style="${tdStyle} display: flex; flex-direction: column;">
                                ${sale.type === 'stattrak' ? '<span style="color: rgb(255, 120, 44);">StatTrak™ </span>' : ''}
								${
									sale.screenshots.inspect
										? html`
												<a href="${sale.screenshots.inspect}" target="_blank" title="Show Buff screenshot">
													<mat-icon role="img" class="mat-icon notranslate material-icons mat-ligature-font mat-icon-no-color">photo_camera</mat-icon>
												</a>
										  `
										: ''
								}
								${
									sale.screenshots.inspect_playside
										? html`
												<div style="display: flex; align-items: center; gap: 8px;">
													<a href="${sale.screenshots.inspect_playside}" target="_blank" title="Show CSFloat font screenshot">
														<mat-icon role="img" class="mat-icon notranslate material-icons mat-ligature-font mat-icon-no-color">photo_camera</mat-icon>
													</a>
													<a href="${sale.screenshots.inspect_backside}" target="_blank" title="Show CSFloat back screenshot">
														<mat-icon role="img" class="mat-icon notranslate material-icons mat-ligature-font mat-icon-no-color">photo_camera</mat-icon>
													</a>
												</div>
										  `
										: ''
								}
                            </td>
                            <td class="main-td time-ago text-purple200 from-sm-table-cell" style="${tdStyle}">
                                ${sale.date}
                            </td>
                            <td class="main-td price from-sm-table-cell" style="${tdStyle}">${`${currencySymbol}${sale.price}`}</td>
                        </tr>
                    `
						)
						.join('')}
                </tbody>
                </table>
            </div>
        `;
		chartContainer.childNodes[5].replaceWith(salesTable);
	});
	Array.from(chartContainer.querySelectorAll('.tab')).forEach((tabContainer) => {
		console.log(tabContainer);
		if (tabContainer.className.includes('betterfloat-tab-bluegem')) return;
		tabContainer.addEventListener('click', () => {
			newTab.classList.remove('active');
			newTab.style.borderBottom = 'none';
			chartContainer.querySelector('app-bluegem-sales')?.replaceWith(document.createComment(''));
			chartContainer.querySelector('app-price-chart')?.setAttribute('style', 'display: block;');
			chartContainer.querySelector('app-previous-sales')?.setAttribute('style', 'display: block;');
		});
	});

	chartContainer.querySelector('.tabs')?.appendChild(newTab);
}

export async function addStickerInfo(container: Element, item: Skinbid.Listing, selector: SKINBID_SELECTOR, priceDifference: Decimal) {
	if (!item.items || item.items[0].item.category === 'Sticker') return;
	let stickers = item.items[0].item.stickers;
	if (item.items[0].item.isSouvenir) {
		stickers = stickers.filter((s) => !s.name.includes('(Gold)'));
	}
	const stickerPrices = await Promise.all(stickers.map(async (s) => await getItemPrice(`Sticker | ${s.name}`, extensionSettings['skb-pricingsource'] as MarketSource)));
	const priceSum = stickerPrices.reduce((a, b) => a + b.starting_at, 0);
	const spPercentage = priceDifference.div(priceSum);

	if (priceSum >= 2) {
		const overlayContainer = container.querySelector(selector.stickerDiv);
		if (selector === SKINBID_SELECTORS.page) {
			(<HTMLElement>overlayContainer).style.display = 'flex';
		}

		const stickerDiv = document.createElement('div');
		stickerDiv.className = 'betterfloat-sticker-container';
		const backgroundImageColor = getSPBackgroundColor(spPercentage.toNumber());
		if (spPercentage.gt(2) || spPercentage.lt(0.005)) {
			stickerDiv.textContent = `$${priceSum.toFixed(0)} SP`;
		} else {
			stickerDiv.textContent = (spPercentage.isPos() ? spPercentage.mul(100) : 0).toFixed(1) + '% SP';
		}
		stickerDiv.style.backgroundColor = backgroundImageColor;
		if (selector === SKINBID_SELECTORS.page) {
			stickerDiv.style.marginLeft = '15px';
		} else if (selector === SKINBID_SELECTORS.list || selector === SKINBID_SELECTORS.card) {
			stickerDiv.style.position = 'absolute';
			stickerDiv.style.bottom = '10px';
			stickerDiv.style.right = '5px';
		}

		overlayContainer?.appendChild(stickerDiv);
	}
}

type PageTypes = keyof typeof SKINBID_SELECTORS;

export function addListingAge(container: Element, cachedItem: Skinbid.Listing, page: PageTypes) {
	const referenceDiv = container.querySelector(SKINBID_SELECTORS[page].listingAge);
	if (!referenceDiv) return;

	if (page === 'page') {
		const listingContainer = referenceDiv?.cloneNode(true);
		if (listingContainer.firstChild) {
			listingContainer.firstChild.textContent = ' Time of Listing ';
			listingContainer.childNodes[1].textContent = calculateTime(calculateEpochFromDate(cachedItem.auction.created));
		}
		referenceDiv.after(listingContainer);
	} else {
		const listingAge = document.createElement('div');
		const listingAgeText = document.createElement('p');
		const listingIcon = document.createElement('img');
		listingAge.classList.add('betterfloat-listing-age');
		listingAge.classList.add('betterfloat-age-' + page);
		listingIcon.setAttribute('src', ICON_CLOCK);

		listingAgeText.textContent = calculateTime(calculateEpochFromDate(cachedItem.auction.created));
		listingAge.appendChild(listingIcon);
		listingAge.appendChild(listingAgeText);

		if (page === 'card') {
			(<HTMLElement>referenceDiv.parentElement).style.flexDirection = 'column';
		}
		referenceDiv.before(listingAge);
	}
}

export async function addBuffPrice(
	cachedItem: Skinbid.Listing,
	container: Element,
	selector: SKINBID_SELECTOR
): Promise<{
	price_difference: Decimal;
} | void> {
	const listingItem = cachedItem?.items?.at(0)?.item;
	if (!listingItem) return;
	const { buff_name, priceListing, priceOrder } = await calculateBuffPrice(listingItem);
	const market_id = getMarketID(buff_name, MarketSource.Buff);
	const source = extensionSettings['skb-pricingsource'] as MarketSource;

	if ((source === MarketSource.Buff && isBuffBannedItem(buff_name)) || (!priceListing && !priceOrder)) {
		console.debug('[BetterFloat] No buff price found for ', buff_name);
		return;
	}

	// restyle layout to make it more compact
	if ((selector === SKINBID_SELECTORS.card || selector === SKINBID_SELECTORS.list) && container.querySelector('.offers')) {
		container.querySelector('.item-type')?.setAttribute('style', 'display: none;');
	}

	const priceDiv = container.querySelector(selector.priceDiv);
	const currency = getUserCurrency();
	const href = getMarketURL({ source, buff_name, market_id, phase: listingItem.dopplerPhase ?? undefined });
	if (!container.querySelector('.betterfloat-buffprice')) {
		generateBuffContainer(priceDiv as HTMLElement, priceListing, priceOrder, currency.text ?? 'USD', href, source, selector.self === 'page');
	}
	const buffContainer = container.querySelector<HTMLElement>('.betterfloat-buff-container');
	if (buffContainer && selector === SKINBID_SELECTORS.page) {
		const parentDiv = container.querySelector<HTMLElement>('.item-bids-time-info');
		if (parentDiv) {
			parentDiv.style.marginTop = '0';
			parentDiv.before(buffContainer);
		}
		buffContainer.style.margin = '20px 0 0 0';
	}

	const priceFromReference = [MarketSource.Buff, MarketSource.Steam].includes(source) && extensionSettings['skb-pricereference'] === 0 ? priceOrder : priceListing;
	const listingPrice = await getListingPrice(cachedItem);
	const difference = new Decimal(listingPrice).minus(priceFromReference ?? 0);

	if (extensionSettings['skb-buffdifference'] && priceFromReference) {
		let discountContainer = <HTMLElement>container.querySelector(selector.discount);
		if (cachedItem.auction.sellType === 'FIXED_PRICE' || selector.self !== 'page') {
			if (!discountContainer) {
				discountContainer = document.createElement('div');
				discountContainer.className = selector.discount.substring(1);
				const bidPrice = container.querySelector('.bid-price');
				if (bidPrice) {
					bidPrice.setAttribute('style', 'display: flex; gap: 5px;');
					bidPrice.appendChild(discountContainer);
				} else {
					const discountDiv = container.querySelector(selector.discountDiv);
					if (discountDiv) {
						discountDiv.appendChild(discountContainer);
					} else {
						priceDiv?.appendChild(discountContainer);
					}
				}
			} else if (selector.self !== 'page') {
				const bidPrice = container.querySelector('.bid-price');
				if (bidPrice) {
					bidPrice.setAttribute('style', 'display: flex; gap: 5px;');
					bidPrice.appendChild(discountContainer);
				}
			}

			if (cachedItem.nextMinimumBid !== 0 && !discountContainer.querySelector('.betterfloat-sale-tag')) {
				if (selector === SKINBID_SELECTORS.page) {
					const discountSpan = document.createElement('span');
					discountSpan.style.marginLeft = '5px';
					discountContainer.appendChild(discountSpan);
					discountContainer = discountSpan;
				}
				discountContainer.className += ' betterfloat-sale-tag';
				discountContainer.setAttribute(
					'style',
					`color: ${
						difference.isZero() ? extensionSettings['skb-color-neutral'] : difference.isNeg() ? extensionSettings['skb-color-profit'] : extensionSettings['skb-color-loss']
					}; font-size: 14px; background: transparent; margin-left: 5px;`
				);
				discountContainer.innerHTML = `<span style="translate: 0 -1px;">${
					difference.isZero() ? `-${currency.symbol}0` : (difference.isPos() ? '+' : '-') + currency.symbol + difference.abs().toFixed(2)
				}</span>`;
				if (extensionSettings['skb-buffdifferencepercent']) {
					discountContainer.style.display = 'flex';
					discountContainer.style.flexDirection = 'column';
					const percentage = new Decimal(listingPrice).div(priceFromReference).times(100);
					const decimalPlaces = percentage.greaterThan(200) ? 0 : percentage.greaterThan(150) ? 1 : 2;
					discountContainer.innerHTML += `<span>(${percentage.toDP(decimalPlaces).toNumber()}%)</span>`;
				}
			}
		} else if (selector.self === 'page') {
			const startingPriceDiv = container.querySelector('.item-bids-time-info .item-detail');
			if (startingPriceDiv) {
				const startingDifference = new Decimal(listingPrice).minus(priceFromReference);
				const startingPrice = document.createElement('div');
				startingPrice.className = 'betterfloat-sale-tag';
				startingPrice.setAttribute(
					'style',
					`font-size: 14px; margin-left: 5px; color: ${
						startingDifference.isZero() ? extensionSettings['skb-color-neutral'] : startingDifference.isNeg() ? extensionSettings['skb-color-profit'] : extensionSettings['skb-color-loss']
					}`
				);
				startingPrice.textContent = startingDifference.isZero() ? `-${currency.symbol}0` : (startingDifference.isPos() ? '+' : '-') + currency.symbol + startingDifference.abs().toDP(2);
				startingPriceDiv.querySelector('.value')?.appendChild(startingPrice);
			}

			const bids = container.querySelectorAll('.bids .bid-price');
			for (let i = 0; i < bids.length; i++) {
				const bidPrice = bids[i];
				const bidData = cachedItem.bids[i];
				const bidDifference = new Decimal(bidData.amount).minus(priceFromReference);
				const bidDiscountContainer = document.createElement('div');
				bidDiscountContainer.className = 'betterfloat-bid-sale-tag';
				bidDiscountContainer.setAttribute(
					'style',
					`padding: 1px 3px; border-radius: 5px; font-size: 14px; background-color: ${
						bidDifference.isZero() ? extensionSettings['skb-color-neutral'] : bidDifference.isNeg() ? extensionSettings['skb-color-profit'] : extensionSettings['skb-color-loss']
					}`
				);
				bidDiscountContainer.textContent = bidDifference.isZero() ? `-${currency.symbol}0` : (bidDifference.isPos() ? '+' : '-') + currency.symbol + bidDifference.abs().toDecimalPlaces(2);
				bidPrice.setAttribute('style', 'display: flex; align-items: center; gap: 5px;');
				bidPrice.insertAdjacentElement('afterbegin', bidDiscountContainer);
			}
		}
	}

	return {
		price_difference: difference,
	};
}

function getUserCurrency() {
	const currencyText = getSkbCurrency();
	return {
		text: currencyText,
		symbol: getSymbolFromCurrency(currencyText),
	};
}

async function getListingPrice(listing: Skinbid.Listing) {
	if (listing.currentHighestBid > 0 && listing.auction?.sellType === 'AUCTION') {
		if (listing.currentHighestBidEur === 0) {
			return listing.currentHighestBid * (await getSkbUserConversion());
		} else {
			return listing.currentHighestBidEur;
		}
	} else {
		if (listing.auction.startBidEur === 0) {
			return listing.auction.startBid * (await getSkbUserConversion());
		} else {
			return listing.auction.startBidEur;
		}
	}
}

function generateBuffContainer(
	container: HTMLElement,
	priceListing: Decimal | undefined,
	priceOrder: Decimal | undefined,
	currencyText: string,
	href: string,
	source: MarketSource,
	isItemPage = false
) {
	let icon = '';
	let iconStyle = 'height: 20px; margin-right: 5px;';
	let containerStyle = '';
	if (source === MarketSource.Buff) {
		icon = ICON_BUFF;
		iconStyle += 'border: 1px solid #323c47;';
	} else if (source === MarketSource.Steam) {
		icon = ICON_STEAM;
	} else if (source === MarketSource.C5Game) {
		icon = ICON_C5GAME;
		iconStyle += 'border: 1px solid #323c47;';
		containerStyle = 'justify-content: flex-start;';
	} else if (source === MarketSource.YouPin) {
		icon = ICON_YOUPIN;
		iconStyle += 'border: 1px solid #323c47;';
		containerStyle = 'justify-content: flex-start;';
	} else if (source === MarketSource.CSFloat) {
		icon = ICON_CSFLOAT;
		iconStyle += 'border: 1px solid #323c47;';
		containerStyle = 'justify-content: flex-start;';
	}
	const formatter = CurrencyFormatter(currencyText);
	const buffContainer = html`
		<a class="betterfloat-buff-container" target="_blank" href="${href}" style="display: flex; margin: 5px 0; cursor: pointer; align-items: center;">
			${
				isItemPage
					? html`
						<div style="display: flex; align-items: center; gap: 4px; width: 50%">
							<img src="${icon}" style="${iconStyle}" />
							<span style="font-size: 14px; font-weight: 700; color: #a3a3cb;">${toTitleCase(source)}</span>
						</div>
				  `
					: html`<img src="${icon}" style="${iconStyle}" />`
			}
			<div class="suggested-price betterfloat-buffprice" style="margin: 2px 0 0 0; ${isItemPage ? 'width: 50%;' : ''}${containerStyle}">
				${
					[MarketSource.Buff, MarketSource.Steam].includes(source)
						? html`
							<span style="color: orange;">Bid ${formatter.format(priceOrder?.toDP(2).toNumber() ?? 0)}</span>
							<span style="color: #323c47; margin: 0 3px 0 3px;">|</span>
							<span style="color: greenyellow;">Ask ${formatter.format(priceListing?.toDP(2).toNumber() ?? 0)}</span>
					  `
						: html` <span style="color: white;">${formatter.format(priceListing?.toDP(2).toNumber() ?? 0)}</span> `
				}
			</div>
		</a>
	`;
	const parentDiv = container.parentElement;
	if (parentDiv) {
		parentDiv.insertAdjacentHTML('beforebegin', buffContainer);
	}
}

async function calculateBuffPrice(item: Skinbid.Item) {
	const buff_name = handleSpecialStickerNames(item.fullName);
	const style: ItemStyle = item.dopplerPhase ?? (item.paintIndex === 0 ? 'Vanilla' : '');
	let { priceListing, priceOrder } = await getBuffPrice(buff_name, style, extensionSettings['skb-pricingsource'] as MarketSource);

	// convert prices to user's currency
	const currencyRate = await getSkbUserCurrencyRate();
	if (currencyRate !== 1) {
		priceListing = priceListing?.mul(currencyRate);
		priceOrder = priceOrder?.mul(currencyRate);
	}

	return { buff_name, priceListing, priceOrder };
}

let extensionSettings: IStorage;
// mutation observer active?
let isObserverActive = false;
