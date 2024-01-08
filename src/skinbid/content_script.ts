import { Extension } from '../@typings/ExtensionTypes';
import { ItemStyle } from '../@typings/FloatTypes';
import { Skinbid } from '../@typings/SkinbidTypes';
import { activateHandler } from '../eventhandler';
import { getBuffMapping, getItemPrice, getSkbUserCurrencyRate, getSpecificSkbItem, loadBuffMapping, loadMapping } from '../mappinghandler';
import { initSettings } from '../util/extensionsettings';
import { calculateTime, getBuffPrice, getSPBackgroundColor, handleSpecialStickerNames } from '../util/helperfunctions';

async function init() {
    if (!location.hostname.includes('skinbid.com')) {
        return;
    }

    console.log('[BetterFloat] Starting BetterFloat');
    console.time('[BetterFloat] Skinbid init timer');
    // catch the events thrown by the script
    // this has to be done as first thing to not miss timed events
    activateHandler();

    extensionSettings = await initSettings();

    if (!extensionSettings.enableSkinbid) {
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
        await applyMutation();
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
        let items = document.getElementsByClassName('item');
        for (let i = 0; i < items.length; i++) {
            await adjustItem(items[i], itemSelectors.list);
        }
    } else if (location.pathname.includes('/market/')) {
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

async function applyMutation() {
    let observer = new MutationObserver(async (mutations) => {
        if (extensionSettings.enableSkinbid) {
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

const itemSelectors = {
    card: {
        self: 'card',
        name: '.item-name',
        type: '.item-type',
        price: '.item-price-wrapper > div',
        priceDiv: '.item-price-wrapper',
        wear: '.quality-float-row',
        discount: '.discount',
        discountDiv: '.item-price-wrapper',
        listingAge: '.left.flex > app-quality-float-row',
        stickerDiv: '.on-top-of-image .items-center',
    },
    list: {
        self: 'list',
        name: '.item-category-and-stickers .first-row',
        type: '.item-category-and-stickers .second-row',
        price: '.section-price .price',
        priceDiv: '.section-price-first-row',
        wear: '.quality-float-row',
        discount: '.section-discount',
        discountDiv: '.section-discount',
        listingAge: '.stickers-and-fade',
        stickerDiv: '.stickers',
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
    } else if (container.tagName.includes('APP-AUCTION-CARD-ITEM')) {
        hashHTML = container.parentElement?.getAttribute('href')?.split('/')[2];
    } else {
        hashHTML = container.querySelector('a')?.getAttribute('href')?.split('/')[2];
    }
    if (!hashHTML) return;
    const cachedItem = getSpecificSkbItem(hashHTML);
    const priceResult = await addBuffPrice(cachedItem, container, selector);
    if (cachedItem) {
        if (extensionSettings.skbListingAge || selector.self == 'page') {
            addListingAge(container, cachedItem, selector.self);
        }
        if ((extensionSettings.skbStickerPrices || selector.self == 'page') && priceResult?.price_difference) {
            await addStickerInfo(container, cachedItem, selector, priceResult.price_difference);
        }
    }
}

async function addStickerInfo(container: Element, item: Skinbid.Listing, selector: ItemSelectors, priceDifference: number) {
    if (!item.items) return;
    let stickers = item.items[0].item.stickers;
    const stickerPrices = await Promise.all(stickers.map(async (s) => await getItemPrice('Sticker | ' + s.name)));
    const priceSum = stickerPrices.reduce((a, b) => a + b.starting_at, 0);
    const spPercentage = priceDifference / priceSum;

    if (priceSum >= 2) {
        let overlayContainer = container.querySelector(selector.stickerDiv);
        if (selector == itemSelectors.card) {
            (<HTMLElement>overlayContainer).style.justifyContent = 'flex-end';
        } else if (selector === itemSelectors.page) {
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
            listingContainer.childNodes[1].textContent = calculateTime(cachedItem.auction.created);
        }
        referenceDiv.after(listingContainer);
    } else {
        const listingAge = document.createElement('div');
        const listingAgeText = document.createElement('p');
        const listingIcon = document.createElement('img');
        listingAge.classList.add('betterfloat-listing-age');
        listingAge.classList.add('betterfloat-age-' + page);
        listingIcon.setAttribute('src', extensionSettings.runtimePublicURL + '/clock-solid.svg');

        listingAgeText.textContent = calculateTime(cachedItem.auction.created);
        listingAge.appendChild(listingIcon);
        listingAge.appendChild(listingAgeText);

        if (page === 'card') {
            (<HTMLElement>referenceDiv.parentElement).style.flexDirection = 'column';
        }
        referenceDiv.before(listingAge);
    }
}

async function addBuffPrice(cachedItem: Skinbid.Listing, container: Element, selector: ItemSelectors): Promise<{
    price_difference: number,
} | void> {
    await loadMapping();
    const listingItem = cachedItem?.items?.at(0)?.item;
    if (!listingItem) return;
    const { buff_name, priceListing, priceOrder } = await calculateBuffPrice(listingItem);
    const buff_id = await getBuffMapping(buff_name);

    if (priceListing === 0 && priceOrder === 0) {
        console.debug('[BetterFloat] No buff price found for ', buff_name);
        return;
    }

    const priceDiv = container.querySelector(selector.priceDiv);
    if (!priceDiv?.firstChild) {
        console.debug('[BetterFloat] No currency symbol found. ', selector.priceDiv);
        return;
    }
    const currencySymbol = (<HTMLElement>priceDiv.firstChild).textContent?.trim().charAt(0);
    if (priceDiv && !container.querySelector('.betterfloat-buffprice')) {
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
        if (selector == itemSelectors.list) {
            (<HTMLElement>buffContainer).style.alignItems = 'center';
            let suggestContainer = <HTMLElement>buffContainer.querySelector('.suggested-price');
            suggestContainer.style.display = 'flex';
            suggestContainer.style.flexDirection = 'column';
            suggestContainer.children[2].remove();
            let buffIcon = <HTMLElement>buffContainer.children[0];
            buffIcon.style.height = '30px';
        } else if (selector == itemSelectors.page) {
            let parentDiv = container.querySelector('.item-bids-time-info');
            if (parentDiv) {
                // buffContainer.parentElement?.removeChild(buffContainer);
                (<HTMLElement>parentDiv).style.marginTop = '0';
                parentDiv.before(buffContainer);
            }
            (<HTMLElement>buffContainer).style.margin = '20px 0 0 0';
        }
    }

    const difference = cachedItem.nextMinimumBid - (extensionSettings.skbPriceReference == 1 ? priceListing : priceOrder);
    if (extensionSettings.skbBuffDifference) {
        let discountContainer = <HTMLElement>container.querySelector(selector.discount);
        if (!discountContainer) {
            discountContainer = document.createElement('div');
            discountContainer.className = selector.discount.substring(1);
            container.querySelector(selector.discountDiv)?.appendChild(discountContainer);
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
                difference === 0 ? extensionSettings.colors.skinbid.neutral : difference < 0 ? extensionSettings.colors.skinbid.profit : extensionSettings.colors.skinbid.loss;
            discountContainer.style.fontWeight = '400';
            discountContainer.style.fontSize = '14px';
            discountContainer.textContent = difference === 0 ? `-${currencySymbol}0` : (difference > 0 ? '+' : '-') + currencySymbol + Math.abs(difference).toFixed(2);
        }
    } else {
        if (container.querySelector('.discount')) {
            (<HTMLElement>container.querySelector('.discount')).className += 'betterfloat-sale-tag';
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
        parentDiv.after(buffContainer);
        let divider = document.createElement('div');
        parentDiv.after(divider);
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

let extensionSettings: Extension.Settings;
// mutation observer active?
let isObserverActive = false;
init();
