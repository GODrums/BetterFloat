import getSymbolFromCurrency from 'currency-symbol-map';
import type { ItemStyle } from '../lib/@typings/FloatTypes';
import type { Skinbid } from '../lib/@typings/SkinbidTypes';
import { activateHandler } from '../eventhandler';
import { getBuffMapping, getFirstSkbItem, getItemPrice, getSkbCurrency, getSkbUserCurrencyRate, getSpecificSkbItem, loadBuffMapping, loadMapping } from '../mappinghandler';
import { fetchCSBlueGem } from '../networkhandler';
import { calculateTime, getBuffPrice, getSPBackgroundColor, handleSpecialStickerNames } from '../lib/util/helperfunctions';
import type { PlasmoCSConfig } from 'plasmo';
import { getAllSettings, type IStorage } from '~lib/util/storage';

export const config: PlasmoCSConfig = {
    matches: ["https://*.skinbid.com/*"],
    css: ["../css/skinbid_styles.css"],
    run_at: "document_end",
}

init();

async function init() {
    if (!location.hostname.includes('skinbid.com')) {
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
    await loadBuffMapping();
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
        let items = document.getElementsByTagName('NGU-TILE');
        for (let i = 0; i < items.length; i++) {
            await adjustItem(items[i], itemSelectors.card);
        }
    } else if (location.pathname == '/listings') {
        let items = document.getElementsByClassName('item-card');
        for (let i = 0; i < items.length; i++) {
            await adjustItem(items[i], itemSelectors.list);
        }
    } else if (location.pathname.startsWith('/market/') || location.pathname.startsWith('/auctions/')) {
        let items = document.querySelectorAll('.item');
        // first one is big item
        await adjustItem(items[0], itemSelectors.page);
        for (let i = 1; i < items.length; i++) {
            await adjustItem(items[i], itemSelectors.card);
        }
    } else if (location.pathname.includes('/shop/')) {
        let items = document.querySelectorAll('.items-desktop .auction-item-card');
        for (let i = 0; i < items.length; i++) {
            await adjustItem(items[i].parentElement!, itemSelectors.card);
        }
    }
}

function applyMutation() {
    let observer = new MutationObserver(async (mutations) => {
        if (extensionSettings['skb-enable']) {
            for (let mutation of mutations) {
                for (let i = 0; i < mutation.addedNodes.length; i++) {
                    let addedNode = mutation.addedNodes[i];
                    // some nodes are not elements, so we need to check
                    if (!(addedNode instanceof HTMLElement)) continue;
                    // console.log("Added node: ", addedNode);

                    if (addedNode.children.length == 1) {
                        let firstChild = addedNode.children[0];
                        if (firstChild.tagName.includes('AUCTION-LIST-ITEM')) {
                            await adjustItem(firstChild, itemSelectors.list);
                            continue;
                        } else if (firstChild.tagName.includes('APP-AUCTION-CARD-ITEM')) {
                            // Items in user shop
                            await adjustItem(firstChild, itemSelectors.card);
                            continue;
                        } else if (firstChild.tagName.includes('APP-ITEM-CARD')) {
                            if (location.pathname == '/listings') {
                                await adjustItem(firstChild, itemSelectors.list);
                            } else {
                                await adjustItem(firstChild, itemSelectors.card);
                            }
                            continue;
                        }
                    }
                    if (addedNode.className) {
                        let className = addedNode.className.toString();
                        if (className.includes('item') && addedNode.tagName === 'NGU-TILE' && !isMobileItem(addedNode)) {
                            // console.log('Found item: ', addedNode);
                            await adjustItem(addedNode, itemSelectors.card);
                        } else if (className.includes('item-category')) {
                            // big item page
                            await adjustItem(document.querySelector('.item')!, itemSelectors.page);
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
    if (selector.self == 'page') {
        hashHTML = location.pathname.split('/')[2];
    } else if (selector.self == 'card') {
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
    if (extensionSettings['skb-listingage'] || selector.self == 'page') {
        addListingAge(container, cachedItem, selector.self);
    }
    if ((extensionSettings['skb-stickerprices'] || selector.self == 'page') && (<any>priceResult)?.price_difference) {
        await addStickerInfo(container, cachedItem, selector, (<any>priceResult).price_difference);
    }
    if (selector.self == 'page') {
        await caseHardenedDetection(container, cachedItem);
    }
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
    newTab.className = 'tab ng-tns-c187-0 betterfloat-tab-bluegem';
    newTab.style.cursor = 'pointer';
    newTab.style.color = 'deepskyblue';
    newTab.innerHTML = `Buff Pattern Sales (${pastSales?.length ?? 0}) <a href="https://csbluegem.com/search?skin=${item.subCategory}&pattern=${
        item.paintSeed
    }&currency=CNY&filter=date&sort=descending" target="_blank" style="vertical-align: sub;"><img src="${
        extensionSettings.runtimePublicURL
    }/arrow-up-right-from-square-solid.svg" style="height: 18px; filter: brightness(0) saturate(100%) invert(100%) sepia(0%) saturate(7461%) hue-rotate(14deg) brightness(94%) contrast(106%); margin-left: 10px;"></a>`;
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
                                <img style="height: 24px;" src="${extensionSettings.runtimePublicURL + (sale.origin == 'CSFloat' ? '/csfloat_logo.png' : '/buff_favicon.png')}"></img>
                            </td>
                            <td class="main-td wear" style="${tdStyle}">
                                <div>${getWear(sale.float)}</div>
                                <div class="text-purple200" style="color: #a3a3cb; font-size: 12px;">${sale.float.toFixed(6)}</div>
                            </td>
                            <td class="main-td pattern-id from-sm-table-cell" style="${tdStyle}"> ${sale.pattern} </td>
                            <td class="main-td from-sm-table-cell" style="${tdStyle} display: flex; flex-direction: column;">
                                ${sale.isStattrak ? '<span style="color: rgb(255, 120, 44);">StatTrak™ </span>' : ''}
                                <a ${
                                    sale.url == 'No Link Available'
                                        ? 'style="pointer-events: none;cursor: default;"><img src="' +
                                          extensionSettings.runtimePublicURL +
                                          '/ban-solid.svg" style="filter: brightness(0) saturate(100%) invert(44%) sepia(56%) saturate(7148%) hue-rotate(359deg) brightness(102%) contrast(96%);'
                                        : 'href="' +
                                          (!isNaN(Number(sale.url)) ? 'https://s.csgofloat.com/' + sale.url + '-front.png' : sale.url) +
                                          '" target="_blank"><img src="' +
                                          extensionSettings.runtimePublicURL +
                                          '/camera-solid.svg" style="translate: 0px 1px; filter: brightness(0) saturate(100%) invert(73%) sepia(57%) saturate(1739%) hue-rotate(164deg) brightness(92%) contrast(84%); margin-right: 5px;'
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
        let overlayContainer = container.querySelector(selector.stickerDiv);
        if (selector === itemSelectors.page) {
            (<HTMLElement>overlayContainer).style.display = 'flex';
        }

        let stickerDiv = document.createElement('div');
        stickerDiv.className = 'betterfloat-sticker-container';
        const backgroundImageColor = getSPBackgroundColor(spPercentage);
        if (spPercentage > 2 || spPercentage < 0.005) {
            stickerDiv.textContent = `$${priceSum.toFixed(0)} SP`;
        } else {
            stickerDiv.textContent = (spPercentage > 0 ? spPercentage * 100 : 0).toFixed(1) + '% SP';
        }
        stickerDiv.style.backgroundColor = backgroundImageColor;
        if (selector == itemSelectors.page) {
            stickerDiv.style.marginLeft = '15px';
        } else if (selector == itemSelectors.list || selector == itemSelectors.card) {
            stickerDiv.style.position = 'absolute';
            stickerDiv.style.bottom = '10px';
            stickerDiv.style.right = '5px';
        }

        overlayContainer?.appendChild(stickerDiv);
    }
}

function addListingAge(container: Element, cachedItem: Skinbid.Listing, page: PageTypes) {
    let referenceDiv = container.querySelector(itemSelectors[page].listingAge);
    if (!referenceDiv) return;

    if (page == 'page') {
        let listingContainer = referenceDiv?.cloneNode(true);
        if (listingContainer.childNodes.length > 1) {
            listingContainer.firstChild!.textContent = ' Time of Listing ';
            listingContainer.childNodes[1].textContent = calculateTime(cachedItem.auction.created, 1);
        }
        referenceDiv.after(listingContainer);
    } else {
        const listingAge = document.createElement('div');
        const listingAgeText = document.createElement('p');
        const listingIcon = document.createElement('img');
        listingAge.classList.add('betterfloat-listing-age');
        listingAge.classList.add('betterfloat-age-' + page);
        listingIcon.setAttribute('src', extensionSettings.runtimePublicURL + '/clock-solid.svg');

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

    if (priceListing === 0 && priceOrder === 0) {
        console.debug('[BetterFloat] No buff price found for ', buff_name);
        return;
    }

    const priceDiv = container.querySelector(selector.priceDiv);
    if (!priceDiv?.firstElementChild) {
        console.debug('[BetterFloat] No currency symbol found. ', selector.priceDiv);
        return;
    }

    let currencySymbol = document.querySelector('.currency-and-payment-methods')?.firstElementChild?.textContent?.trim().split(' ')[0];
    if (!container.querySelector('.betterfloat-buffprice')) {
        generateBuffContainer(priceDiv as HTMLElement, priceListing, priceOrder, currencySymbol ?? '$');
    }

    const buffHref = buff_id > 0 ? `https://buff.163.com/goods/${buff_id}` : `https://buff.163.com/market/csgo#tab=selling&page_num=1&search=${encodeURIComponent(buff_name)}`;
    const buffContainer = container.querySelector('.betterfloat-buff-container');
    if (buffContainer) {
        (<HTMLElement>buffContainer).onclick = (e: Event) => {
            e.stopPropagation();
            e.preventDefault();
            window.open(buffHref, '_blank');
        };
        if (selector == itemSelectors.page) {
            let parentDiv = container.querySelector('.item-bids-time-info');
            if (parentDiv) {
                // buffContainer.parentElement?.removeChild(buffContainer);
                (<HTMLElement>parentDiv).style.marginTop = '0';
                parentDiv.before(buffContainer);
            }
            (<HTMLElement>buffContainer).style.margin = '20px 0 0 0';
        } else {
            container.querySelector(selector.priceDiv)?.setAttribute('style', 'flex-direction: column;');
        }
    }

    const difference = cachedItem.nextMinimumBid - (extensionSettings['skb-pricereference'] == 1 ? priceListing : priceOrder);
    // console.debug('[BetterFloat] Buff price difference: ', cachedItem, container);
    if (extensionSettings['skb-buffdifference']) {
        let discountContainer = <HTMLElement>container.querySelector(selector.discount);
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
            if (selector == itemSelectors.page) {
                let discountSpan = document.createElement('span');
                discountSpan.style.marginLeft = '5px';
                discountContainer.appendChild(discountSpan);
                discountContainer = discountSpan;
            }
            discountContainer.className += ' betterfloat-sale-tag';
            discountContainer.style.color =
                difference === 0 ? extensionSettings['skb-colors'].neutral : difference < 0 ? extensionSettings['skb-colors'].profit : extensionSettings['skb-colors'].loss;
            discountContainer.style.fontSize = '14px';
            discountContainer.style.background = 'transparent';
            discountContainer.textContent = difference === 0 ? `-${currencySymbol}0` : (difference > 0 ? '+' : '-') + currencySymbol + Math.abs(difference).toFixed(2);
        }
    }

    return {
        price_difference: difference,
    };
}

function generateBuffContainer(container: HTMLElement, priceListing: number, priceOrder: number, currencySymbol: string, isItemPage = false) {
    let buffContainer = document.createElement('div');
    buffContainer.className = 'betterfloat-buff-container';
    buffContainer.style.display = 'flex';
    buffContainer.style.margin = '5px 0';
    buffContainer.style.cursor = 'pointer';
    buffContainer.style.alignItems = 'center';
    let buffImage = document.createElement('img');
    buffImage.setAttribute('src', extensionSettings.runtimePublicURL + '/buff_favicon.png');
    buffImage.setAttribute('style', `height: 20px; margin-right: 5px; border: 1px solid #323c47; ${isItemPage ? 'margin-bottom: 1px;' : ''}`);
    buffContainer.appendChild(buffImage);
    let buffPrice = document.createElement('div');
    buffPrice.setAttribute('class', 'suggested-price betterfloat-buffprice');
    buffPrice.setAttribute('style', 'margin: 2px 0 0 0');
    if (isItemPage) {
        buffPrice.style.fontSize = '18px';
    }
    let tooltipSpan = document.createElement('span');
    // rework tooltip for list view
    // tooltipSpan.setAttribute('class', 'betterfloat-buff-tooltip');
    // tooltipSpan.textContent = 'Bid: Highest buy order price; Ask: Lowest listing price';
    buffPrice.appendChild(tooltipSpan);
    let buffPriceBid = document.createElement('span');
    buffPriceBid.setAttribute('style', 'color: orange;');
    buffPriceBid.textContent = `Bid ${currencySymbol}${priceOrder.toFixed(2)}`;
    buffPrice.appendChild(buffPriceBid);
    let buffPriceDivider;
    buffPriceDivider = document.createElement('span');
    buffPriceDivider.setAttribute('style', 'color: #323c47;margin: 0 3px 0 3px;');
    buffPriceDivider.textContent = '|';
    buffPrice.appendChild(buffPriceDivider);
    let buffPriceAsk = document.createElement('span');
    buffPriceAsk.setAttribute('style', 'color: greenyellow;');
    buffPriceAsk.textContent = `Ask ${currencySymbol}${priceListing.toFixed(2)}`;
    buffPrice.appendChild(buffPriceAsk);
    buffContainer.appendChild(buffPrice);
    let parentDiv = container.parentElement;
    if (parentDiv) {
        parentDiv.before(buffContainer);
        // let divider = document.createElement('div');
        // parentDiv.before(divider);
    }
}

async function calculateBuffPrice(item: Skinbid.Item): Promise<{ buff_name: string; priceListing: number; priceOrder: number }> {
    const buff_name = handleSpecialStickerNames(item.fullName);
    const style: ItemStyle = item.dopplerPhase ?? (item.paintIndex == 0 ? 'Vanilla' : '');
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