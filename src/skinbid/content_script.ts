import { Extension } from '../@typings/ExtensionTypes';
import { ItemStyle } from '../@typings/FloatTypes';
import { Skinbid } from '../@typings/SkinbidTypes';
import { activateHandler } from '../eventhandler';
import { getBuffMapping, getFirstSkbItem, getItemPrice, getSkbUserCurrencyRate, loadBuffMapping, loadMapping } from '../mappinghandler';
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
    if (location.pathname == '/') {
        let items = document.getElementsByTagName('NGU-TILE');
        for (let i = 0; i < items.length; i++) {
            await adjustItem(items[i]);
        }
    } else if (location.pathname == '/listings') {
        let items = document.getElementsByClassName('item');
        for (let i = 0; i < items.length; i++) {
            await adjustListItem(items[i]);
        }
    } else if (location.pathname.includes('/market/')) {
        let items = document.querySelectorAll('.item');
        // first one is big item
        await adjustBigItem(items[0]);
        for (let i = 1; i < items.length; i++) {
            await adjustItem(items[i]);
        }
    } else if (location.pathname.includes('/shop/')) {
        let items = document.querySelectorAll('.items-desktop .auction-item-card');
        console.log('[BetterFloat] Found items: ', items);
        for (let i = 0; i < items.length; i++) {
            await adjustItem(items[i]);
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
                            await adjustListItem(firstChild);
                            continue;
                        } else if (firstChild.tagName.includes('APP-AUCTION-CARD-ITEM')) {
                            // Items in user shop
                            await adjustItem(firstChild);
                            continue;
                        }
                    }
                    if (addedNode.className) {
                        let className = addedNode.className.toString();
                        if (className.includes('item') && addedNode.tagName == 'NGU-TILE' && !isMobileItem(addedNode)) {
                            // console.log('Found item: ', addedNode);
                            await adjustItem(addedNode);
                        } else if (className.includes('item-category')) {
                            // big item page
                            await adjustBigItem(document.querySelector('.item')!);
                        } else if (addedNode.tagName == 'APP-PRICE-CHART') {
                            console.log('Found price chart: ', addedNode);
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

async function adjustBigItem(container: Element) {
    const item = getSkinbidFullItem(container);
    if (!item) return;
    const { priceResult, cachedItem } = await handleSkbNameIssues(item, container, itemSelectors.page); // eslint-disable-line @typescript-eslint/no-unused-vars
    if (cachedItem) {
        await addListingAge(container, cachedItem, 'page');
        await addStickerInfo(container, cachedItem, itemSelectors.page, priceResult?.price_difference ?? 0);
    }
}

async function adjustListItem(container: Element) {
    const item = getSkinbidItem(container, itemSelectors.list);
    if (!item) return;
    const { priceResult, cachedItem } = await handleSkbNameIssues(item, container, itemSelectors.list); // eslint-disable-line @typescript-eslint/no-unused-vars
    if (cachedItem) {
        if (extensionSettings.skbListingAge) {
            await addListingAge(container, cachedItem, 'list');
        }
        if (extensionSettings.skbStickerPrices) {
            await addStickerInfo(container, cachedItem, itemSelectors.list, priceResult?.price_difference ?? 0);
        }
    }
}

async function adjustItem(container: Element) {
    const item = getSkinbidItem(container, itemSelectors.card);
    if (!item) return;
    const { priceResult, cachedItem } = await handleSkbNameIssues(item, container, itemSelectors.card); // eslint-disable-line @typescript-eslint/no-unused-vars
    if (cachedItem) {
        if (extensionSettings.skbListingAge) {
            await addListingAge(container, cachedItem, 'card');
        }
        if (extensionSettings.skbStickerPrices) {
            await addStickerInfo(container, cachedItem, itemSelectors.card, priceResult?.price_difference ?? 0);
        }
    }
    // if (extensionSettings.spFloatColoring) {
    //     await addFloatColoring(container, item);
    // }
}

async function handleSkbNameIssues(item: Skinbid.HTMLItem, container: Element, selector: ItemSelectors) {
    let priceResult;
    let cachedItem;
    if (item.type == 'Agent') {
        cachedItem = getFirstSkbItem();
        if (!cachedItem?.items) {
            console.log('[BetterFloat] No cached item found: ', cachedItem);
            return { priceResult, cachedItem };
        }
        let apiItem = cachedItem?.items?.at(0)?.item;
        if (apiItem) {
            item.name = apiItem.subCategory;
            item.category = apiItem.name;
        }
        priceResult = await addBuffPrice(item, container, selector);
    } else {
        priceResult = await addBuffPrice(item, container, selector);
        cachedItem = getFirstSkbItem();
    }
    return { priceResult, cachedItem };
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
        } else if (selector == itemSelectors.page) {
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

async function addListingAge(container: Element, cachedItem: Skinbid.Listing, page: PageTypes) {
    let referenceDiv = container.querySelector(itemSelectors[page].listingAge);
    if (!referenceDiv) return;

    if (page == 'page') {
        let listingContainer = referenceDiv?.cloneNode(true);
        if (listingContainer.childNodes.length > 1) {
            listingContainer.firstChild!.textContent = ' Time of Listing ';
            listingContainer.childNodes[1].textContent = calculateTime(cachedItem.auction.created);
        }
        referenceDiv.after(listingContainer);
        return;
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

        if (page == 'card') {
            (<HTMLElement>referenceDiv.parentElement).style.flexDirection = 'column';
        }
        referenceDiv.before(listingAge);
    }
}

async function addBuffPrice(item: Skinbid.HTMLItem, container: Element, selector: ItemSelectors) {
    await loadMapping();
    let { buff_name, priceListing, priceOrder } = await calculateBuffPrice(item);
    let buff_id = await getBuffMapping(buff_name);

    if (priceListing == 0 && priceOrder == 0) {
        console.debug('[BetterFloat] No buff price found for ', buff_name);
        return;
    }

    let priceDiv = container.querySelector(selector.priceDiv);
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

    const difference = item.price - (extensionSettings.skbPriceReference == 1 ? priceListing : priceOrder);
    if (extensionSettings.skbBuffDifference) {
        let discountContainer = <HTMLElement>container.querySelector(selector.discount);
        if (!discountContainer) {
            discountContainer = document.createElement('div');
            discountContainer.className = selector.discount.substring(1);
            container.querySelector(selector.discountDiv)?.appendChild(discountContainer);
        }
        if (item.price !== 0 && !discountContainer.querySelector('.betterfloat-sale-tag')) {
            if (selector == itemSelectors.page) {
                let discountSpan = document.createElement('span');
                discountSpan.style.marginLeft = '5px';
                discountContainer.appendChild(discountSpan);
                discountContainer = discountSpan;
            }
            discountContainer.className += ' betterfloat-sale-tag';
            discountContainer.style.color =
                difference == 0 ? extensionSettings.colors.skinbid.neutral : difference < 0 ? extensionSettings.colors.skinbid.profit : extensionSettings.colors.skinbid.loss;
            discountContainer.style.fontWeight = '400';
            discountContainer.style.fontSize = '14px';
            discountContainer.textContent = difference == 0 ? `-${currencySymbol}0` : (difference > 0 ? '+' : '-') + currencySymbol + Math.abs(difference).toFixed(2);
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
    tooltipSpan.setAttribute('class', 'betterfloat-buff-tooltip');
    tooltipSpan.textContent = 'Bid: Highest buy order price; Ask: Lowest listing price';
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

async function calculateBuffPrice(item: Skinbid.HTMLItem): Promise<{ buff_name: string; priceListing: number; priceOrder: number }> {
    let buff_name = handleSpecialStickerNames(createBuffName(item));
    let { priceListing, priceOrder } = await getBuffPrice(buff_name, item.style);

    // convert prices to user's currency
    let currencyRate = await getSkbUserCurrencyRate();
    if (currencyRate != 1) {
        priceListing = priceListing * currencyRate;
        priceOrder = priceOrder * currencyRate;
    }

    return { buff_name, priceListing, priceOrder };
}

function createBuffName(item: Skinbid.HTMLItem): string {
    let full_name = `${item.name}`;
    if (item.type.includes('Sticker') || item.type.includes('Patch') || item.type.includes('Music Kit')) {
        full_name = item.type + ' | ' + full_name;
    } else if (
        item.type.includes('Case') ||
        item.type.includes('Collectible') ||
        item.type.includes('Gift') ||
        item.type.includes('Key') ||
        item.type.includes('Pass') ||
        item.type.includes('Pin') ||
        item.type.includes('Tool') ||
        item.style == 'Vanilla'
    ) {
        full_name = item.name;
    } else if (item.type.includes('Agent')) {
        full_name = `${item.name} | ${item.category}`;
    } else if (item.name.includes('Dragon King')) {
        full_name = `M4A4 | 龍王 (Dragon King)${' (' + item.wear_name + ')'}`;
    } else {
        full_name = `${item.type.includes('Knife') || item.type.includes('Gloves') ? '★ ' : ''}${item.name.includes('StatTrak') ? 'StatTrak™ ' : ''}${item.type.split(' • ')[1]} | ${item.name.replace(
            'StatTrak™ ',
            ''
        )} (${item.wear_name})`;
    }
    return full_name.replace(/ +(?= )/g, '').replace(/\//g, '-');
}

const itemSelectors = {
    card: {
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

function getSkinbidFullItem(container: Element): Skinbid.HTMLItem | null {
    let name = container.querySelector('.item-title')?.textContent?.trim() ?? '';
    let category = '';
    let style: ItemStyle = '';
    if (name == '') {
        return null;
    } else if (name.includes('Marble Fade')) {
        name = 'Marble Fade';
        category = name.includes('(') ? name.split('(')[1].split(')')[0] : '';
    } else if (name.includes('Doppler')) {
        style = name.split('Doppler ')[1] as ItemStyle;
        name = 'Doppler';
    } else if (name.includes('★')) {
        style = 'Vanilla';
    }
    let priceText = container.querySelector('.item-bids-time-info')?.children[0].children[1]?.textContent?.trim() ?? '';
    let price = Number(priceText.replace(/[^0-9.-]+/g, ''));
    let type = container.querySelector('.item-category')?.textContent?.trim() ?? '';
    let itemDetails = container.querySelectorAll('.details-actions-section .item-detail');
    let wearText = itemDetails[0]?.children[1]?.textContent ?? '';
    let wear = Number(itemDetails[1]?.children[1]?.textContent ?? 0);
    return {
        name: name,
        price: price,
        type: type,
        style: style,
        wear: wear,
        wear_name: wearText,
        category: category,
    };
}

function getSkinbidItem(container: Element, selector: ItemSelectors): Skinbid.HTMLItem | null {
    let name = container.querySelector(selector.name)?.textContent?.trim() ?? '';
    let category = '';
    let style: ItemStyle = '';
    if (name == '') {
        return null;
    } else if (name.includes('💎')) {
        name = name.split('💎')[1].trim();
        category = '💎';
    } else if (name.includes('Marble Fade')) {
        name = 'Marble Fade';
        category = name.includes('(') ? name.split('(')[1].split(')')[0] : '';
    } else if (name.includes('Doppler')) {
        style = name.split('Doppler ')[1] as ItemStyle;
        name = 'Doppler';
    } else if (name.includes('★')) {
        style = 'Vanilla';
    }

    let priceText = container.querySelector(selector.price)?.textContent ?? '';
    if (priceText.includes('K')) {
        priceText = priceText.replace('.', '').replace('K', '0.00');
    }
    if (container.querySelector(selector.price + ' .item-buynow')) {
        priceText = container.querySelector(selector.price + ' .item-buynow')?.textContent ?? '';
    }
    let price = Number(priceText.replace(/[^0-9.-]+/g, '').trim());
    let type = container.querySelector(selector.type)?.textContent?.trim() ?? '';
    const getWear = (wearDiv: HTMLElement) => {
        let wear = '';

        if (wearDiv) {
            let w = wearDiv.textContent?.trim().split(' ')[0];
            switch (w) {
                case 'FN':
                    wear = 'Factory New';
                    break;
                case 'MW':
                    wear = 'Minimal Wear';
                    break;
                case 'FT':
                    wear = 'Field-Tested';
                    break;
                case 'WW':
                    wear = 'Well-Worn';
                    break;
                case 'BS':
                    wear = 'Battle-Scarred';
                    break;
                default:
                    wear = '';
                    break;
            }
        }
        return wear;
    };
    let wearDiv = container.querySelector(selector.wear);
    let wear = wearDiv ? getWear(wearDiv as HTMLElement) : '';
    return {
        name: name,
        price: price,
        type: type,
        style: style,
        wear: Number(wearDiv?.textContent?.split('/')[1]),
        wear_name: wear,
        category: category,
    };
}

let extensionSettings: Extension.Settings;
// mutation observer active?
let isObserverActive = false;
init();
