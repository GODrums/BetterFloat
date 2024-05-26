import getSymbolFromCurrency from 'currency-symbol-map';
import Decimal from 'decimal.js';

import { activateHandler } from '~lib/handlers/eventhandler';
import { getBuffMapping, getFirstSkbItem, getItemPrice, getSkbCurrency, getSkbUserConversion, getSkbUserCurrencyRate, getSpecificSkbInventoryItem, getSpecificSkbItem, loadMapping } from '~lib/handlers/mappinghandler';
import { fetchCSBlueGem } from '~lib/handlers/networkhandler';
import { ICON_ARROWUP_SMALL, ICON_BAN, ICON_BUFF, ICON_CAMERA, ICON_CLOCK, ICON_CSFLOAT } from '~lib/util/globals';
import { calculateTime, getBuffLink, getBuffPrice, getSPBackgroundColor, handleSpecialStickerNames, isBuffBannedItem } from '~lib/util/helperfunctions';
import { getAllSettings } from '~lib/util/storage';

import type { DopplerPhase, ItemStyle } from '~lib/@typings/FloatTypes';
import type { Skinbid } from '~lib/@typings/SkinbidTypes';
import type { IStorage } from '~lib/util/storage';
import type { PlasmoCSConfig } from 'plasmo';

export const config: PlasmoCSConfig = {
	matches: ['https://*.skinbid.com/*'],
	css: ['../css/skinbid_styles.css'],
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

	console.group('[BetterFloat] Loading mappings...');
	await loadMapping();
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
			await adjustItem(items[i], itemSelectors.card);
		}
	} else if (location.pathname === '/listings') {
		const items = document.getElementsByClassName('item-card');
		for (let i = 0; i < items.length; i++) {
			await adjustItem(items[i], itemSelectors.list);
		}
	} else if (location.pathname.startsWith('/market/') || location.pathname.startsWith('/auctions/')) {
		const items = document.querySelectorAll('.item');
		// first one is big item
		await adjustItem(items[0], itemSelectors.page);
		for (let i = 1; i < items.length; i++) {
			await adjustItem(items[i], itemSelectors.card);
		}
	} else if (location.pathname.includes('/shop/')) {
		const items = document.querySelectorAll('.items-desktop .auction-item-card');
		for (let i = 0; i < items.length; i++) {
			await adjustItem(items[i].parentElement, itemSelectors.card);
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
							await adjustItem(firstChild, itemSelectors.list);
							continue;
						} else if (firstChild.tagName === 'APP-AUCTION-CARD-ITEM') {
							// Items in user shop
							await adjustItem(firstChild, itemSelectors.card);
							continue;
						} else if (firstChild.tagName === 'APP-ITEM-CARD') {
							if (location.pathname === '/listings') {
								await adjustItem(firstChild, itemSelectors.list);
							} else {
								await adjustItem(firstChild, itemSelectors.card);
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
							await adjustItem(addedNode, itemSelectors.card);
						} else if (className.includes('item-category')) {
							// big item page
							await adjustItem(document.querySelector('.item'), itemSelectors.page);
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

// TODO: rework as card and list are very similar / the same in the new design
const itemSelectors = {
	card: {
		self: 'card',
		name: '.item-name',
		type: '.item-type',
		price: '.item-price .price',
		priceDiv: '.item-price',
		wear: '.quality-float-row',
		discount: '.price-discount',
		discountDiv: '.price-discount',
		listingAge: '.left.flex > app-quality-float-row',
		stickerDiv: '.card-top-section',
	},
	list: {
		self: 'list',
		name: '.item-name',
		type: '.item-type',
		price: '.item-price .price',
		priceDiv: '.item-price',
		wear: '.quality-float-row',
		discount: '.price-discount',
		discountDiv: '.price-discount',
		listingAge: '.quality-float-row',
		stickerDiv: '.card-top-section',
	},
	page: {
		self: 'page',
		name: '.item-title',
		type: '.item-category',
		price: '.item-bids-time-info > div',
		priceDiv: '.item-bids-time-info .value',
		wear: '.item-detail:nth-child(2)',
		discount: '.item-bids-time-info .value > div',
		discountDiv: '.section-discount',
		listingAge: '.item-detail:last-child',
		stickerDiv: '.stickers-wrapper .title',
	},
} as const;

type PageTypes = keyof typeof itemSelectors;

type ItemSelectors = (typeof itemSelectors)[keyof typeof itemSelectors];

function isMobileItem(container: Element) {
	return container.parentElement?.parentElement?.parentElement?.parentElement?.className.includes('item');
}

async function adjustItem(container: Element, selector: ItemSelectors) {
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
	console.log('[BetterFloat] Cached item: ', cachedItem);
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
	const steamImage = container.querySelector('.item-image > img').getAttribute('src');
	const listedItem = getSpecificSkbInventoryItem(steamImage);
	console.log('[BetterFloat] Inventory item: ', listedItem);
	if (!listedItem) return;

	const item = listedItem.item;
	const { buff_name, priceListing, priceOrder } = await calculateBuffPrice(item);
	const buff_id = await getBuffMapping(buff_name);
	const buffHref = buff_id > 0 ? getBuffLink(buff_id, item.dopplerPhase) : `https://buff.163.com/market/csgo#tab=selling&page_num=1&search=${encodeURIComponent(buff_name)}`;

	if (priceListing > 0 || priceOrder > 0) {
		const currencySymbol = document.querySelector('.currency-and-payment-methods')?.firstElementChild?.textContent?.trim().split(' ')[0];
		const cardFooter = container.querySelector<HTMLElement>('.card-footer > div');
		if (cardFooter && !container.querySelector('.betterfloat-buffprice')) {
			generateBuffContainer(cardFooter, priceListing, priceOrder, currencySymbol ?? '$', buffHref);
		}
	}
}

function addBrowserInspect(container: Element, item: Skinbid.Listing) {
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

async function caseHardenedDetection(container: Element, listing: Skinbid.Listing) {
	const chartContainer = container.querySelector('.price-chart-and-history');
	const item = listing.items?.at(0)?.item;
	if (!chartContainer || !item || item.name !== 'Case Hardened') return;

	let currency = getSkbCurrency();
	if (currency.length === 0) {
		currency = 'USD';
	}
	const currencySymbol = getSymbolFromCurrency(currency);
	const { pastSales } = await fetchCSBlueGem(item.subCategory, item.paintSeed, currency);

	const newTab = document.createElement('div');
	newTab.className = 'tab betterfloat-tab-bluegem';
	newTab.setAttribute('style', 'display: flex; cursor: pointer; color: deepskyblue; padding-bottom: 9px; border-bottom: 2px solid transparent;');
	newTab.innerHTML = `<div>Buff Pattern Sales (${pastSales?.length ?? 0})</div><a href="https://csbluegem.com/search?skin=${item.subCategory}&pattern=${
		item.paintSeed
	}&currency=CNY&filter=date&sort=descending" target="_blank" style="margin-left: 10px;">${ICON_ARROWUP_SMALL}</a>`;
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
                                <div>${getWear(sale.float)}</div>
                                <div class="text-purple200" style="color: #a3a3cb; font-size: 12px;">${sale.float.toFixed(6)}</div>
                            </td>
                            <td class="main-td pattern-id from-sm-table-cell" style="${tdStyle}"> ${sale.pattern} </td>
                            <td class="main-td from-sm-table-cell" style="${tdStyle} display: flex; flex-direction: column;">
                                ${sale.isStattrak ? '<span style="color: rgb(255, 120, 44);">StatTrak™ </span>' : ''}
                                <a ${
									sale.url === 'No Link Available'
										? 'style="pointer-events: none;cursor: default;"><img src="' +
											ICON_BAN +
											'" style="filter: brightness(0) saturate(100%) invert(44%) sepia(56%) saturate(7148%) hue-rotate(359deg) brightness(102%) contrast(96%);'
										: 'href="' +
											(sale.inspect ?? sale.inspect_playside) +
											'" target="_blank"><img src="' +
											ICON_CAMERA +
											'" style="translate: 0px 1px; filter: brightness(0) saturate(100%) invert(73%) sepia(57%) saturate(1739%) hue-rotate(164deg) brightness(92%) contrast(84%); margin-right: 5px;'
								}height: 20px;"></img></a>
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

async function addStickerInfo(container: Element, item: Skinbid.Listing, selector: ItemSelectors, priceDifference: number) {
	if (!item.items) return;
	let stickers = item.items[0].item.stickers;
	if (item.items[0].item.isSouvenir) {
		stickers = stickers.filter((s) => !s.name.includes('(Gold)'));
	}
	const stickerPrices = await Promise.all(stickers.map(async (s) => await getItemPrice('Sticker | ' + s.name)));
	const priceSum = stickerPrices.reduce((a, b) => a + b.starting_at, 0);
	const spPercentage = priceDifference / priceSum;

	if (priceSum >= 2) {
		const overlayContainer = container.querySelector(selector.stickerDiv);
		if (selector === itemSelectors.page) {
			(<HTMLElement>overlayContainer).style.display = 'flex';
		}

		const stickerDiv = document.createElement('div');
		stickerDiv.className = 'betterfloat-sticker-container';
		const backgroundImageColor = getSPBackgroundColor(spPercentage);
		if (spPercentage > 2 || spPercentage < 0.005) {
			stickerDiv.textContent = `$${priceSum.toFixed(0)} SP`;
		} else {
			stickerDiv.textContent = (spPercentage > 0 ? spPercentage * 100 : 0).toFixed(1) + '% SP';
		}
		stickerDiv.style.backgroundColor = backgroundImageColor;
		if (selector === itemSelectors.page) {
			stickerDiv.style.marginLeft = '15px';
		} else if (selector === itemSelectors.list || selector === itemSelectors.card) {
			stickerDiv.style.position = 'absolute';
			stickerDiv.style.bottom = '10px';
			stickerDiv.style.right = '5px';
		}

		overlayContainer?.appendChild(stickerDiv);
	}
}

function addListingAge(container: Element, cachedItem: Skinbid.Listing, page: PageTypes) {
	const referenceDiv = container.querySelector(itemSelectors[page].listingAge);
	if (!referenceDiv) return;

	if (page === 'page') {
		const listingContainer = referenceDiv?.cloneNode(true);
		if (listingContainer.firstChild) {
			listingContainer.firstChild.textContent = ' Time of Listing ';
			listingContainer.childNodes[1].textContent = calculateTime(cachedItem.auction.created, 1);
		}
		referenceDiv.after(listingContainer);
	} else {
		const listingAge = document.createElement('div');
		const listingAgeText = document.createElement('p');
		const listingIcon = document.createElement('img');
		listingAge.classList.add('betterfloat-listing-age');
		listingAge.classList.add('betterfloat-age-' + page);
		listingIcon.setAttribute('src', ICON_CLOCK);

		listingAgeText.textContent = calculateTime(cachedItem.auction.created, 1);
		listingAge.appendChild(listingIcon);
		listingAge.appendChild(listingAgeText);

		if (page === 'card') {
			(<HTMLElement>referenceDiv.parentElement).style.flexDirection = 'column';
		}
		referenceDiv.before(listingAge);
	}
}

async function addBuffPrice(
	cachedItem: Skinbid.Listing,
	container: Element,
	selector: ItemSelectors
): Promise<{
	price_difference: number;
} | void> {
	const listingItem = cachedItem?.items?.at(0)?.item;
	if (!listingItem) return;
	const { buff_name, priceListing, priceOrder } = await calculateBuffPrice(listingItem);
	const buff_id = await getBuffMapping(buff_name);

	if (isBuffBannedItem(buff_name) || (priceListing === 0 && priceOrder === 0)) {
		console.debug('[BetterFloat] No buff price found for ', buff_name);
		return;
	}

	// restyle layout to make it more compact
	if ((selector === itemSelectors.card || selector === itemSelectors.list) && container.querySelector('.offers')) {
		container.querySelector('.item-type').setAttribute('style', 'display: none;');
	}

	const priceDiv = container.querySelector(selector.priceDiv);
	const currencySymbol = document.querySelector('.currency-and-payment-methods')?.firstElementChild?.textContent?.trim().split(' ')[0];
	const buffHref = buff_id > 0 ? getBuffLink(buff_id, listingItem.dopplerPhase as DopplerPhase) : `https://buff.163.com/market/csgo#tab=selling&page_num=1&search=${encodeURIComponent(buff_name)}`;
	if (!container.querySelector('.betterfloat-buffprice')) {
		generateBuffContainer(priceDiv as HTMLElement, priceListing, priceOrder, currencySymbol ?? '$', buffHref);
	}
	const buffContainer = container.querySelector<HTMLElement>('.betterfloat-buff-container');
	if (buffContainer && selector === itemSelectors.page) {
		const parentDiv = container.querySelector<HTMLElement>('.item-bids-time-info');
		if (parentDiv) {
			parentDiv.style.marginTop = '0';
			parentDiv.before(buffContainer);
		}
		buffContainer.style.margin = '20px 0 0 0';
	}

	const priceFromReference = extensionSettings['skb-pricereference'] === 1 ? priceListing : priceOrder;
	const listingPrice = await getListingPrice(cachedItem);
	const difference = listingPrice - priceFromReference;
	if (extensionSettings['skb-buffdifference']) {
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
						priceDiv.appendChild(discountContainer);
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
				if (selector === itemSelectors.page) {
					const discountSpan = document.createElement('span');
					discountSpan.style.marginLeft = '5px';
					discountContainer.appendChild(discountSpan);
					discountContainer = discountSpan;
				}
				discountContainer.className += ' betterfloat-sale-tag';
				discountContainer.setAttribute('style', `color: ${difference === 0 ? extensionSettings['skb-color-neutral'] : difference < 0 ? extensionSettings['skb-color-profit'] : extensionSettings['skb-color-loss']}; font-size: 14px; background: transparent; margin-left: 5px;`);
				discountContainer.innerHTML = `<span style="translate: 0 -1px;">${difference === 0 ? `-${currencySymbol}0` : (difference > 0 ? '+' : '-') + currencySymbol + Math.abs(difference).toFixed(2)}</span>`;
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
					`font-size: 14px; margin-left: 5px; color: ${startingDifference.isZero() ? extensionSettings['skb-color-neutral'] : startingDifference.isNeg() ? extensionSettings['skb-color-profit'] : extensionSettings['skb-color-loss']}`
				);
				startingPrice.textContent = startingDifference.isZero() ? `-${currencySymbol}0` : (startingDifference.isPos() ? '+' : '-') + currencySymbol + startingDifference.abs().toDP(2);
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
					`padding: 1px 3px; border-radius: 5px; font-size: 14px; background-color: ${bidDifference.isZero() ? extensionSettings['skb-color-neutral'] : bidDifference.isNeg() ? extensionSettings['skb-color-profit'] : extensionSettings['skb-color-loss']}`
				);
				bidDiscountContainer.textContent = bidDifference.isZero() ? `-${currencySymbol}0` : (bidDifference.isPos() ? '+' : '-') + currencySymbol + bidDifference.abs().toDecimalPlaces(2);
				bidPrice.setAttribute('style', 'display: flex; align-items: center; gap: 5px;');
				bidPrice.insertAdjacentElement('afterbegin', bidDiscountContainer);
			}
		}
	}

	return {
		price_difference: difference,
	};
}

async function getListingPrice(listing: Skinbid.Listing) {
	if (listing.currentHighestBid > 0 && listing.auction?.sellType === 'AUCTION') {
		if (listing.currentHighestBidEur === 0) {
			return listing.currentHighestBid * (await getSkbUserConversion());
		} else {
			return listing.currentHighestBid;
		}
	} else {
		if (listing.auction.startBidEur === 0) {
			return listing.auction.startBid * (await getSkbUserConversion());
		} else {
			return listing.auction.startBid;
		}
	}
}

function generateBuffContainer(container: HTMLElement, priceListing: number, priceOrder: number, currencySymbol: string, href: string, isItemPage = false) {
	const buffContainer = document.createElement('a');
	buffContainer.className = 'betterfloat-buff-container';
	buffContainer.target = '_blank';
	buffContainer.href = href;
	buffContainer.style.display = 'flex';
	buffContainer.style.margin = '5px 0';
	buffContainer.style.cursor = 'pointer';
	buffContainer.style.alignItems = 'center';
	const buffImage = document.createElement('img');
	buffImage.setAttribute('src', ICON_BUFF);
	buffImage.setAttribute('style', `height: 20px; margin-right: 5px; border: 1px solid #323c47; ${isItemPage ? 'margin-bottom: 1px;' : ''}`);
	buffContainer.appendChild(buffImage);
	const buffPrice = document.createElement('div');
	buffPrice.setAttribute('class', 'suggested-price betterfloat-buffprice');
	buffPrice.setAttribute('style', 'margin: 2px 0 0 0');
	if (isItemPage) {
		buffPrice.style.fontSize = '18px';
	}
	const tooltipSpan = document.createElement('span');
	// rework tooltip for list view
	// tooltipSpan.setAttribute('class', 'betterfloat-buff-tooltip');
	// tooltipSpan.textContent = 'Bid: Highest buy order price; Ask: Lowest listing price';
	buffPrice.appendChild(tooltipSpan);
	const buffPriceBid = document.createElement('span');
	buffPriceBid.setAttribute('style', 'color: orange;');
	buffPriceBid.textContent = `Bid ${currencySymbol}${priceOrder.toFixed(2)}`;
	buffPrice.appendChild(buffPriceBid);
	const buffPriceDivider = document.createElement('span');
	buffPriceDivider.setAttribute('style', 'color: #323c47;margin: 0 3px 0 3px;');
	buffPriceDivider.textContent = '|';
	buffPrice.appendChild(buffPriceDivider);
	const buffPriceAsk = document.createElement('span');
	buffPriceAsk.setAttribute('style', 'color: greenyellow;');
	buffPriceAsk.textContent = `Ask ${currencySymbol}${priceListing.toFixed(2)}`;
	buffPrice.appendChild(buffPriceAsk);
	buffContainer.appendChild(buffPrice);
	const parentDiv = container.parentElement;
	if (parentDiv) {
		parentDiv.before(buffContainer);
		// let divider = document.createElement('div');
		// parentDiv.before(divider);
	}
}

async function calculateBuffPrice(item: Skinbid.Item): Promise<{ buff_name: string; priceListing: number; priceOrder: number }> {
	const buff_name = handleSpecialStickerNames(item.fullName);
	const style: ItemStyle = item.dopplerPhase ?? (item.paintIndex === 0 ? 'Vanilla' : '');
	let { priceListing, priceOrder } = await getBuffPrice(buff_name, style);

	// convert prices to user's currency
	const currencyRate = await getSkbUserCurrencyRate();
	if (currencyRate !== 1) {
		priceListing = priceListing * currencyRate;
		priceOrder = priceOrder * currencyRate;
	}

	return { buff_name, priceListing, priceOrder };
}

let extensionSettings: IStorage;
// mutation observer active?
let isObserverActive = false;
