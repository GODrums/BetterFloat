// Official documentation: https://developer.chrome.com/docs/extensions/mv3/content_scripts/

import { ExtensionSettings, FloatItem, HistoryData, ItemCondition, ItemStyle, ListingData } from './@typings/FloatTypes';
import { activateHandler } from './eventhandler';
import { getBuffMapping, getFirstCachedItem, getItemPrice, getPriceMapping, getWholeHistory, loadBuffMapping, loadMapping } from './mappinghandler';

type PriceResult = {
    price_difference: number;
};

async function init() {
    //get current url
    let url = window.location.href;
    if (!url.includes('csgofloat.com') && !url.includes('csfloat.com')) {
        return;
    }
    activateHandler();

    // mutation observer is only needed once
    if (!isObserverActive) {
        console.debug('[BetterFloat] Starting observer');
        await applyMutation();
        console.log('[BetterFloat] Observer started');

        isObserverActive = true;
    }

    await initSettings();

    //check if url is in supported subpages
    if (url.endsWith('float.com/')) {
        await firstLaunch();
        return;
    } else {
        for (let i = 0; i < supportedSubPages.length; i++) {
            if (url.includes(supportedSubPages[i])) {
                console.debug('[BetterFloat] Current page supported');
                await firstLaunch();
                return;
            }
        }
    }
    console.debug('[BetterFloat] Current page not supported: ' + url);
}

// required as mutation does not detect initial DOM
async function firstLaunch() {
    if (!extensionSettings.buffprice) return;

    let items = document.querySelectorAll('item-card');

    for (let i = 0; i < items.length; i++) {
        adjustItem(items[i]);
    }
}

async function initSettings() {
    extensionSettings = <ExtensionSettings>{};
    chrome.storage.local.get((data) => {
        if (data.buffprice) {
            extensionSettings.buffprice = Boolean(data.buffprice);
        }
        if (data.autorefresh) {
            extensionSettings.autorefresh = Boolean(data.autorefresh);
        }
        if (data.priceReference) {
            extensionSettings.priceReference = data.priceReference as ExtensionSettings['priceReference'];
        }
        if (data.refreshInterval) {
            extensionSettings.refreshInterval = data.refreshInterval as ExtensionSettings['refreshInterval'];
        }
        if (data.showSteamPrice) {
            extensionSettings.showSteamPrice = Boolean(data.showSteamPrice);
        }
        if (data.stickerPrices) {
            extensionSettings.stickerPrices = Boolean(data.stickerPrices);
        }
        if (data.listingAge) {
            extensionSettings.listingAge = Number(data.listingAge) as ExtensionSettings['listingAge'];
        }
        if (data.showBuffDifference) {
            extensionSettings.showBuffDifference = Boolean(data.showBuffDifference);
        }
    });

    // wait for settings to be loaded, takes about 1.5 seconds
    await new Promise<void>((resolve) => {
        setTimeout(() => {
            resolve();
        }, 1500);
    });
}

function parseHTMLString(htmlString: string, container: HTMLElement) {
    let parser = new DOMParser();
    let doc = parser.parseFromString(htmlString, 'text/html');
    const tags = doc.getElementsByTagName(`body`)[0];

    for (const tag of tags.children) {
        container.appendChild(tag);
    }
}

async function refreshButton() {
    const matChipList = document.querySelector('.mat-chip-list-wrapper');

    let refreshChip = document.createElement('div');
    refreshChip.classList.add('betterfloat-refresh');
    refreshChip.setAttribute('style', 'display: inline-flex; margin-left: 20px;');

    let refreshContainer = document.createElement('div');
    let autorefreshContainer = document.createElement('span');
    let refreshText = document.createElement('span');
    let intervalContainer = document.createElement('span');
    refreshContainer.classList.add('betterfloat-refreshContainer');
    autorefreshContainer.textContent = 'Auto-Refresh: ';
    refreshText.classList.add('betterfloat-refreshText');
    refreshText.setAttribute('style', 'color: #ce0000;');
    refreshText.textContent = 'inactive';
    intervalContainer.setAttribute('style', 'color: gray;');
    intervalContainer.textContent = 'Interval: ' + (extensionSettings.refreshInterval?.toString() ?? 0) + 's';

    refreshContainer.appendChild(autorefreshContainer);
    refreshContainer.appendChild(refreshText);
    refreshContainer.appendChild(intervalContainer);
    refreshChip.appendChild(refreshContainer);

    let startStopContainer = document.createElement('div');
    let startElement = genRefreshButton('Start');
    let stopElement = genRefreshButton('Stop');
    startStopContainer.style.display = 'flex';
    startStopContainer.style.flexDirection = 'row';
    startStopContainer.appendChild(startElement);
    startStopContainer.appendChild(stopElement);

    if (matChipList) {
        if (!matChipList.innerHTML.includes('betterfloat-refresh')) {
            matChipList.appendChild(refreshChip);
            refreshChip.after(startStopContainer);
        }
        //while (!document.getElementsByClassName('betterfloat-refresh')[0]) await new Promise((r) => setTimeout(r, 100));

        startElement.addEventListener('click', () => {
            // somehow Angular calls the eventlistener multiple times, this prevents side effects
            if (refreshInterval.length > 1) {
                console.debug('[BetterFloat] Auto-refresh already active');
                return;
            }
            console.log('[BetterFloat] Starting auto-refresh, interval: 30s, current time: ' + Date.now());

            let refreshDelay = (Number(extensionSettings.refreshInterval) ?? 30) * 1000;
            let refreshText = document.querySelector('.betterfloat-refreshText');

            if (!refreshText) return;
            refreshText.textContent = 'active';
            refreshText.setAttribute('style', 'color: greenyellow;');

            // save timer to avoid multiple executions
            refreshInterval.push(
                setInterval(() => {
                    let refreshButton = document.querySelector('.mat-chip-list-wrapper')?.querySelector('.mat-tooltip-trigger')?.children[0] as HTMLElement;
                    // time should be lower than interval due to inconsistencies
                    if (refreshButton && lastRefresh + refreshDelay * 0.9 < Date.now()) {
                        lastRefresh = Date.now();
                        refreshButton.click();
                    }
                }, refreshDelay)
            );
        });
        stopElement.addEventListener('click', () => {
            // gets called multiple times, maybe needs additional handling in the future
            console.log('[BetterFloat] Stopping auto-refresh, current time: ' + Date.now());

            let refreshText = document.querySelector('.betterfloat-refreshText');
            if (!refreshText) return;
            refreshText.textContent = 'inactive';
            refreshText.setAttribute('style', 'color: #ce0000;');

            //clearinterval for every entry in refreshInterval
            for (let i = 0; i < refreshInterval.length; i++) {
                clearInterval(refreshInterval[i] ?? 0);
                refreshInterval.splice(i, 1);
            }
        });
    }
}

function genRefreshButton(name: 'Start' | 'Stop'): HTMLDivElement {
    let element = document.createElement('div');
    element.classList.add('betterfloat-refresh' + name.toString());
    element.textContent = name.toString();
    return element;
}

async function applyMutation() {
    let observer = new MutationObserver(async (mutations) => {
        if (extensionSettings.buffprice) {
            let url = window.location.href;
            for (let i = 0; i < unsupportedSubPages.length; i++) {
                if (url.includes(unsupportedSubPages[i])) {
                    //console.debug('[BetterFloat] Current page is currently NOT supported');
                    return;
                }
            }
            for (let mutation of mutations) {
                for (let i = 0; i < mutation.addedNodes.length; i++) {
                    let addedNode = mutation.addedNodes[i];
                    // some nodes are not elements, so we need to check
                    if (!(addedNode instanceof HTMLElement)) continue;

                    // item popout
                    if (addedNode.tagName && addedNode.tagName.toLowerCase() == 'item-detail') {
                        await adjustItem(addedNode, true);
                        // item from listings
                    } else if (addedNode.className && addedNode.className.toString().includes('flex-item')) {
                        await adjustItem(addedNode);
                    }
                }
            }
        }

        let activeTab = getTabNumber();
        if (activeTab == 4 && extensionSettings.autorefresh) {
            await refreshButton();
        }
    });
    await loadMapping();
    await loadBuffMapping();
    observer.observe(document, { childList: true, subtree: true });
}

async function adjustItem(container: Element, isPopout = false) {
    const item = getFloatItem(container);
    const priceResult = await addBuffPrice(item, container, isPopout);
    let cachedItem = await getFirstCachedItem();
    if (cachedItem) {
        if (item.name != cachedItem.item.item_name) {
            console.log('[BetterFloat] Item name mismatch:', item.name, cachedItem.item.item_name);
            return;
        }
        if (extensionSettings.stickerPrices) {
            await addStickerInfo(item, container, cachedItem, priceResult);
        }
        if (extensionSettings.listingAge > 0) {
            await addListingAge(item, container, cachedItem);
        }
    }
    if (isPopout) {
        // need timeout as request is only sent after popout is loaded
        setTimeout(async () => {
            await addItemHistory(container, item);
        }, 1000);
    }
}

async function addItemHistory(container: Element, item: FloatItem) {
    const itemHistory = calculateHistoryValues(await getWholeHistory());
    const headerContainer = <HTMLElement>container.querySelector('#header');
    if (!headerContainer || !itemHistory) {
        console.log('[BetterFloat] Could not add item history: ' + itemHistory);
        return;
    };

    headerContainer.style.display = 'flex';
    headerContainer.style.justifyContent = 'space-between';
    const replacementContainer = document.createElement('div');
    while (headerContainer.firstChild) {
        replacementContainer.appendChild(headerContainer.firstChild);
    }
    headerContainer.appendChild(replacementContainer);

    const historyContainer = document.createElement('div');
    historyContainer.classList.add('betterfloat-history-container');
    historyContainer.style.display = 'flex';
    historyContainer.style.justifyContent = 'flex-end';
    historyContainer.style.color = '#a9a9a9';
    historyContainer.style.marginTop = '2px';

    const highestContainer = document.createElement('span');
    highestContainer.classList.add('betterfloat-history-highest');
    highestContainer.textContent = 'High: $' + itemHistory.highest.avg_price;

    const lowestContainer = document.createElement('span');
    lowestContainer.classList.add('betterfloat-history-lowest');
    lowestContainer.textContent = 'Low: $' + itemHistory.lowest.avg_price;

    const divider = document.createElement('span');
    divider.textContent = ' | ';
    divider.style.margin = '0 5px';

    historyContainer.appendChild(lowestContainer);
    historyContainer.appendChild(divider);
    historyContainer.appendChild(highestContainer);
    headerContainer.appendChild(historyContainer);
}

function calculateHistoryValues(itemHistory: HistoryData[]) {
    if (itemHistory.length == 0) {
        return null;
    }
    const highestElement = itemHistory.reduce((prev, current) => (prev.avg_price > current.avg_price) ? prev : current);
    const lowestElement = itemHistory.reduce((prev, current) => (prev.avg_price < current.avg_price) ? prev : current);
    
    return {
        total: itemHistory,
        highest: highestElement,
        lowest: lowestElement
    }
}

async function addListingAge(item: FloatItem, container: Element, cachedItem: ListingData) {
    const listingAge = document.createElement('div');
    const listingAgeText = document.createElement('p');
    const listingIcon = document.createElement('img');
    listingAge.classList.add('betterfloat-listing-age');
    listingAge.style.display = 'flex';
    listingAge.style.alignItems = 'center';
    listingAge.style.justifyContent = 'flex-end';
    listingAgeText.classList.add('betterfloat-listing-age-text');
    listingAgeText.style.display = 'inline';
    listingAgeText.style.margin = '0 5px 0 0';
    listingAgeText.style.fontSize = '15px';
    listingIcon.classList.add('betterfloat-listing-age-icon');
    listingIcon.setAttribute('src', runtimePublicURL + '/clock-solid.svg');
    listingIcon.style.height = '20px';
    listingIcon.style.filter = 'brightness(0) saturate(100%) invert(59%) sepia(55%) saturate(3028%) hue-rotate(340deg) brightness(101%) contrast(101%)';

    const timeDiff = (strDate: string) => {
        const now = new Date();
        const diff = now.getTime() - Date.parse(strDate);
        return Math.floor(diff / 60_000);
    };
    const timeMin = timeDiff(cachedItem.created_at);
    const timeHours = Math.floor(timeMin / 60);
    let textTime = '';
    if (timeHours < 49) {
        if (timeMin < 120) {
            textTime = `${timeMin} minute${timeMin == 1 ? '' : 's'} ago`;
        } else {
            textTime = `${timeHours} hour${timeHours == 1 ? '' : 's'} ago`;
        }
    } else {
        textTime = `${Math.floor(timeHours / 24)} day${Math.floor(timeHours / 24) == 1 ? '' : 's'} ago`;
    }
    listingAgeText.textContent = textTime;
    listingAge.appendChild(listingAgeText);
    listingAge.appendChild(listingIcon);
    if (extensionSettings.listingAge == 1) {
        listingAge.style.marginBottom = '5px';
        listingAgeText.style.color = 'darkgray';
        container.querySelector('.online-container')?.after(listingAge);
    } else {
        let watchersContainer = container.querySelector('.watchers');
        let outerContainer = document.createElement('div');
        outerContainer.classList.add('betterfloat-listing-age-container');
        outerContainer.style.display = 'flex';
        listingAge.style.marginRight = '5px';
        outerContainer.appendChild(listingAge);
        // if logged out, watchers are not displayed
        if (watchersContainer) {
            outerContainer.appendChild(watchersContainer);
        }
        let topRightContainer = container.querySelector('.top-right-container');
        if (topRightContainer) {
            topRightContainer.replaceChild(outerContainer, topRightContainer.firstChild as Node);
        }
    }
    
}

async function addStickerInfo(item: FloatItem, container: Element, cachedItem: ListingData, priceResult: PriceResult) {
    let stickerDiv = container.querySelector('.sticker-container')?.children[0];
    let stickers = cachedItem.item.stickers;
    if (!stickers || cachedItem.item?.quality == 12) {
        return;
    }
    let stickerPrices = await Promise.all(stickers.map(async (s) => await getItemPrice(s.name)));
    let priceSum = stickerPrices.reduce((a, b) => a + b.starting_at, 0);
    let spPercentage = priceResult.price_difference / priceSum;

    // don't display SP if total price is below $1
    if (stickerDiv && priceSum > 1) {
        const outerContainer = document.createElement('div');
        const spContainer = document.createElement('span');
        spContainer.classList.add('betterfloat-sticker-price');
        let backgroundImageColor = '';
        if (spPercentage < 0.005 || spPercentage > 2) {
            backgroundImageColor = 'white';
        } else if (spPercentage > 1) {
            backgroundImageColor = 'rgba(245,0,0,1)';
        } else if (spPercentage > 0.5) {
            backgroundImageColor = 'rgba(245,164,0,1)';
        } else if (spPercentage > 0.25) {
            backgroundImageColor = 'rgba(244,245,0,1)';
        } else {
            backgroundImageColor = 'rgba(83,245,0,1)';
        }
        spContainer.style.backgroundImage = `radial-gradient(circle, ${backgroundImageColor} 10%, rgba(148,187,233,1) 100%)`;
        spContainer.style.color = 'black';
        spContainer.style.padding = '2px 5px';
        spContainer.style.borderRadius = '7px';
        // if SP is above 200% or below 0.5% display SP in $, otherwise in %
        if (spPercentage > 2 || spPercentage < 0.005) {
            spContainer.textContent = `SP: $${priceSum.toFixed(0)}`;
        } else {
            spContainer.textContent = `SP: ${(spPercentage > 0 ? spPercentage * 100 : 0).toFixed(2)}%`;
        }
        outerContainer.style.margin = '0 0 10px 10px';
        outerContainer.appendChild(spContainer);
        stickerDiv.before(outerContainer);
    }
}

function getFloatItem(container: Element): FloatItem {
    const nameContainer = container.querySelector('app-item-name');
    const floatContainer = container.querySelector('item-float-bar');
    const priceContainer = container.querySelector('.price');
    const header_details = <Element>nameContainer?.childNodes[1];

    let name = nameContainer?.querySelector('.item-name')?.textContent?.replace('\n', '').trim();
    let price = priceContainer?.textContent;
    let condition: ItemCondition = '';
    let quality = '';
    let style: ItemStyle = '';

    header_details.childNodes.forEach((node) => {
        switch (node.nodeType) {
            case Node.ELEMENT_NODE:
                let text = node.textContent?.trim();
                if (text && (text.includes('StatTrak') || text.includes('Souvenir') || text.includes('Container') || text.includes('Sticker'))) {
                    // TODO: integrate the ItemQuality type
                    // https://stackoverflow.com/questions/51528780/typescript-check-typeof-against-custom-type
                    quality = text;
                } else {
                    style = text?.substring(1, text.length - 1) as ItemStyle;
                }
                break;
            case Node.TEXT_NODE:
                condition = (node.textContent?.trim() ?? "") as ItemCondition;
                break;
            case Node.COMMENT_NODE:
                break;
        }
    });

    if (!name?.includes('|')) {
        style = 'Vanilla';
    }
    return {
        name: name ?? '',
        quality: quality,
        style: style,
        condition: condition,
        float: Number(floatContainer?.querySelector('.ng-star-inserted')?.textContent ?? 0),
        price: price?.includes('Bids') ? 0 : Number(price?.split('  ')[0].trim().replace('$', '').replace(',', '')),
        bargain: false,
    };
}

async function addBuffPrice(item: FloatItem, container: Element, isPopout = false): Promise<PriceResult> {
    await loadMapping();
    let buff_name = createBuffName(item);
    let buff_id = await getBuffMapping(buff_name);
    let priceMapping = await getPriceMapping();

    if (!priceMapping[buff_name] || !priceMapping[buff_name]['buff163']) {
        console.debug(`[BetterFloat] No price mapping found for ${buff_name}`);
        return { price_difference: 0 };
    }
    let priceListing = 0;
    let priceOrder = 0;
    if (item.style != '' && item.style != 'Vanilla') {
        priceListing = priceMapping[buff_name]['buff163']['starting_at']['doppler'][item.style];
        priceOrder = priceMapping[buff_name]['buff163']['highest_order']['doppler'][item.style];
    } else {
        priceListing = priceMapping[buff_name]['buff163']['starting_at']['price'];
        priceOrder = priceMapping[buff_name]['buff163']['highest_order']['price'];
    }
    if (priceListing == undefined) {
        priceListing = 0;
    }
    if (priceOrder == undefined) {
        priceOrder = 0;
    }

    const suggestedContainer = container.querySelector('.suggested-container');
    const showBoth = extensionSettings.showSteamPrice || isPopout;

    if (suggestedContainer && !suggestedContainer.querySelector('.betterfloat-buff-price')) {
        let buffContainer = document.createElement('a');
        let buff_url = buff_id > 0 ? `https://buff.163.com/goods/${buff_id}` : `https://buff.163.com/market/csgo#tab=selling&page_num=1&search=${encodeURIComponent(buff_name)}`;
        buffContainer.setAttribute('href', buff_url);
        buffContainer.setAttribute('target', '_blank');
        buffContainer.setAttribute('style', `${showBoth ? '' : 'margin-top: 5px; '}display: inline-flex; align-items: center;`);

        let buffImage = document.createElement('img');
        buffImage.setAttribute('src', runtimePublicURL + '/buff_favicon.png');
        buffImage.setAttribute('style', 'height: 20px; margin-right: 5px');
        buffContainer.appendChild(buffImage);
        let buffPrice = document.createElement('div');
        buffPrice.setAttribute('class', 'suggested-price betterfloat-buffprice');
        let tooltipSpan = document.createElement('span');
        tooltipSpan.setAttribute('class', 'betterfloat-buff-tooltip');
        tooltipSpan.textContent = 'Bid: Highest buy order price; Ask: Lowest listing price';
        buffPrice.appendChild(tooltipSpan);
        let buffPriceBid = document.createElement('span');
        buffPriceBid.setAttribute('style', 'color: orange;');
        buffPriceBid.textContent = `Bid $${priceOrder}`;
        buffPrice.appendChild(buffPriceBid);
        let buffPriceDivider = document.createElement('span');
        buffPriceDivider.setAttribute('style', 'color: gray;margin: 0 3px 0 3px;');
        buffPriceDivider.textContent = '|';
        buffPrice.appendChild(buffPriceDivider);
        let buffPriceAsk = document.createElement('span');
        buffPriceAsk.setAttribute('style', 'color: greenyellow;');
        buffPriceAsk.textContent = `Ask $${priceListing}`;
        buffPrice.appendChild(buffPriceAsk);
        buffContainer.appendChild(buffPrice);

        if (!container.querySelector('.betterfloat-buff-price')) {
            if (showBoth) {
                let divider = document.createElement('div');
                suggestedContainer.after(buffContainer);
                suggestedContainer.after(divider);
            } else {
                suggestedContainer.replaceWith(buffContainer);
            }
        }
    }

    const difference = item.price - (extensionSettings.priceReference == 0 ? priceOrder : priceListing);
    if (extensionSettings.showBuffDifference) {
        const priceContainer = <HTMLElement>container.querySelector('.price');
        let saleTag = priceContainer.querySelector('.sale-tag');
        if (saleTag) {
            priceContainer.removeChild(saleTag);
        }
        if (item.price !== 0) {
            const buffPriceHTML = `<span class="sale-tag betterfloat-sale-tag" style="background-color: ${difference == 0 ? 'slategrey;' : difference < 0 ? 'green;' : '#ce0000;'}"> ${
                difference == 0 ? '-$0' : (difference > 0 ? '+$' : '-$') + Math.abs(difference).toFixed(2)
            } </span>`;
            parseHTMLString(buffPriceHTML, priceContainer);
        }
    }

    return {
        price_difference: difference,
    };
}

function createBuffName(item: FloatItem): string {
    let full_name = `${item.name}`;
    if (item.quality.includes('Sticker')) {
        full_name = `Sticker | ` + full_name;
    } else if (!item.quality.includes('Container')) {
        if (item.quality.includes('StatTrak') || item.quality.includes('Souvenir')) {
            full_name = full_name.includes('★') ? `★ StatTrak™ ${full_name.split('★ ')[1]}` : `${item.quality} ${full_name}`;
        }
        if (item.style != 'Vanilla') {
            full_name += ` (${item.condition})`;
        }
    }
    return full_name
        .replace(/ +(?= )/g, '')
        .replace(/\//g, '-')
        .trim();
}

function getTabNumber() {
    return Number(document.querySelector('.mat-tab-label-active')?.getAttribute('aria-posinset') ?? 0);
}

let supportedSubPages = ['/item/', '/stall/', '/profile/watchlist', '/search?'];
let unsupportedSubPages = ['/sell'];

let extensionSettings: ExtensionSettings;
let runtimePublicURL = chrome.runtime.getURL('../public');
let refreshInterval: [ReturnType<typeof setTimeout> | null] = [null];
// time of last refresh in auto-refresh functionality
let lastRefresh = 0;
// mutation observer active?
let isObserverActive = false;

init();
