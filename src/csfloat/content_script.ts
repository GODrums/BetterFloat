// Official documentation: https://developer.chrome.com/docs/extensions/mv3/content_scripts/

import { ExtensionSettings, CSFloat, ItemStyle, ItemCondition } from '../@typings/FloatTypes';
import { activateHandler } from '../eventhandler';
import { getBuffMapping, getCSFPopupItem, getFirstCSFItem, getFirstHistorySale, getItemPrice, getPriceMapping, getWholeHistory, loadBuffMapping, loadMapping } from '../mappinghandler';
import { initSettings } from '../util/extensionsettings';
import { handleSpecialStickerNames, parseHTMLString } from '../util/helperfunctions';
import { genRefreshButton } from '../util/uigeneration';

type PriceResult = {
    price_difference: number;
};

async function init() {
    console.time('[BetterFloat] CSFloat init timer');

    if (!location.hostname.includes('csfloat.com') || location.hostname.includes('blog.')) {
        return;
    }
    // catch the events thrown by the script
    // this has to be done as first thing to not miss timed events
    activateHandler();

    extensionSettings = await initSettings();

    if (location.search.includes('?tab=') && extensionSettings.enableCSFloat) {
        console.log('[BetterFloat] Tab State: Switching to tab ' + location.search.split('=')[1]);
        switchTab(Number(location.search.split('=')[1]) - 1);
    }

    console.group('[BetterFloat] Loading mappings...');
    await loadMapping();
    await loadBuffMapping();
    console.groupEnd();
    console.timeEnd('[BetterFloat] CSFloat init timer');

    if (extensionSettings.showTopButton) {
        createTopButton();
    }

    //check if url is in supported subpages
    if (location.pathname == '/') {
        await firstLaunch();
    } else {
        for (let i = 0; i < supportedSubPages.length; i++) {
            if (location.pathname.includes(supportedSubPages[i])) {
                await firstLaunch();
                break;
            }
        }
    }

    // mutation observer is only needed once
    if (!isObserverActive) {
        isObserverActive = true;
        await applyMutation();
        console.log('[BetterFloat] Mutation observer started');
    }
}

// required as mutation does not detect initial DOM
async function firstLaunch() {
    if (!extensionSettings.enableCSFloat) return;

    createTabListeners();

    let items = document.querySelectorAll('item-card');
    console.log('[BetterFloat] Found ' + items.length + ' items on page');

    for (let i = 0; i < items.length; i++) {
        adjustItem(items[i], items[i].getAttribute('width')?.includes('100%') ?? false);
    }

    if (location.pathname == '/profile/offers') {
        let matActionList = document.querySelector('.mat-action-list')?.children;
        if (!matActionList) return;
        for (let i = 0; i < matActionList.length; i++) {
            let child = matActionList[i];
            if (child?.className.includes('mat-list-item')) {
                offerItemClickListener(child);
            }
        }

        await waitForElement('.betterfloat-buffprice');
        let offerBubbles = document.querySelectorAll('.offer-bubble');
        for (let i = 0; i < offerBubbles.length; i++) {
            await adjustItemBubble(offerBubbles[i]);
        }
    }
}

// return if element has been successfully waited for, else limit has been reached
async function waitForElement(selector: string, interval = 200, maxTries = 10) {
    let tries = 0;
    while (!document.querySelector(selector) && tries < maxTries) {
        tries++;
        await new Promise((r) => setTimeout(r, interval));
    }
    return tries < maxTries;
}

function offerItemClickListener(listItem: Element) {
    listItem.addEventListener('click', async () => {
        await new Promise((r) => setTimeout(r, 100));
        let itemCard = document.querySelector('item-card');
        if (itemCard) {
            await adjustItem(itemCard);
        }
    });
}

function switchTab(tab: number) {
    let tabList = document.querySelectorAll('.mat-tab-label');
    (<HTMLElement>tabList[tab]).click();
    document.title = tabList[tab].textContent?.trim() + ' | CSFloat';
}

function createTabListeners() {
    const tabList = document.querySelectorAll('.mat-tab-label');
    const tabContainer = tabList[0]?.parentElement;
    if (!tabList || tabContainer?.className.includes('betterfloat-tabs')) return;
    tabContainer?.classList.add('betterfloat-tabs');
    for (let i = 0; i < tabList.length; i++) {
        tabList[i].addEventListener('click', () => {
            window.history.replaceState({}, '', '?tab=' + tabList[i].getAttribute('aria-posinset'));
            document.title = tabList[i].textContent?.trim() + ' | CSFloat';
        });
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
            if (refreshThreads.length > 1) {
                console.debug('[BetterFloat] Auto-refresh already active');
                return;
            }
            console.log('[BetterFloat] Starting auto-refresh, interval: 30s, current time: ' + Date.now());

            let refreshDelay = (Number(extensionSettings.refreshInterval) ?? 30) * 1000;
            let refreshText = document.querySelector('.betterfloat-refreshText');

            if (!refreshText) return;
            refreshText.textContent = 'active';
            refreshText.setAttribute('style', 'color: greenyellow;');

            // save timer to avoid uncoordinated executions
            refreshThreads.push(
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
            console.log('[BetterFloat] Stopping auto-refresh, current time: ' + Date.now(), ', #active threads: ' + refreshThreads.length);

            let refreshText = document.querySelector('.betterfloat-refreshText');
            if (!refreshText) return;
            refreshText.textContent = 'inactive';
            refreshText.setAttribute('style', 'color: #ce0000;');

            //clearinterval for every entry in refreshInterval
            for (let i = 0; i < refreshThreads.length; i++) {
                clearInterval(refreshThreads[i] ?? 0);
                refreshThreads.splice(i, 1);
            }
            setTimeout(() => {
                //for some weird reason one element stays in the array
                if (refreshThreads.length > 0) {
                    clearInterval(refreshThreads[0] ?? 0);
                    refreshThreads.splice(0, 1);
                }
            }, 1000);
        });
    }
}

async function applyMutation() {
    let observer = new MutationObserver(async (mutations) => {
        if (extensionSettings.enableCSFloat) {
            for (let i = 0; i < unsupportedSubPages.length; i++) {
                if (location.href.includes(unsupportedSubPages[i])) {
                    console.debug('[BetterFloat] Current page is currently NOT supported');
                    return;
                }
            }
            for (let mutation of mutations) {
                for (let i = 0; i < mutation.addedNodes.length; i++) {
                    let addedNode = mutation.addedNodes[i];
                    // some nodes are not elements, so we need to check
                    if (!(addedNode instanceof HTMLElement)) continue;

                    // item popout
                    if (addedNode.tagName.toLowerCase() == 'item-detail') {
                        await adjustItem(addedNode, true);
                        // item from listings
                    } else if (addedNode.className.toString().includes('flex-item')) {
                        await adjustItem(addedNode);
                    } else if (addedNode.className.toString().includes('mat-row cdk-row')) {
                        // row from the sales table in an item popup
                        await adjustSalesTableRow(addedNode);
                    } else if (location.pathname == '/profile/offers' && addedNode.className.includes('reference-container')) {
                        // item in the offers page when switching from another page
                        await adjustItem(document.querySelector('item-card')!);
                    } else if (addedNode.className.toString().includes('offer-bubble')) {
                        // offer bubbles in offers page
                        await adjustItemBubble(addedNode);
                    } else if (location.pathname == '/profile/offers' && addedNode.className.toString().includes('mat-list-item')) {
                        // offer list in offers page
                        offerItemClickListener(addedNode);
                    }
                }
            }
        }

        createTabListeners();

        let activeTab = getTabNumber();
        if (activeTab == 4 && extensionSettings.autorefresh) {
            await refreshButton();
        }
    });
    observer.observe(document, { childList: true, subtree: true });
}

async function adjustItemBubble(container: Element) {
    let personDiv = container.querySelector('div > span')!;
    let buffData: { buff_name: string; priceFromReference: number } = JSON.parse(document.querySelector('.betterfloat-buffprice')?.getAttribute('data-betterfloat') ?? '{}');
    let bargainPrice = Number(container.querySelector('b')?.textContent?.replace('$', ''));
    let difference = bargainPrice - buffData.priceFromReference;
    let isSeller = personDiv.textContent?.includes('Seller') ?? false;

    let buffContainer = document.createElement('div');
    buffContainer.setAttribute('style', `width: 80%; display: inline-flex; align-items: center; justify-content: ${isSeller ? 'flex-start' : 'flex-end'}; translate: 0 3px;`);
    let buffImage = document.createElement('img');
    buffImage.setAttribute('src', runtimePublicURL + '/buff_favicon.png');
    buffImage.setAttribute('style', 'height: 20px; margin-right: 5px');
    buffContainer.appendChild(buffImage);

    let buffPrice = document.createElement('span');
    buffPrice.setAttribute('style', `color: ${difference < 0 ? 'greenyellow' : 'orange'};`);
    buffPrice.textContent = `${difference > 0 ? '+' : ''}$${difference.toFixed(2)}`;
    buffContainer.appendChild(buffPrice);
    if (isSeller) {
        personDiv.before(buffContainer);
    } else {
        personDiv.after(buffContainer);
    }
}

async function adjustSalesTableRow(container: Element) {
    let cachedSale = await getFirstHistorySale();
    if (!cachedSale) {
        return;
    }

    // link to item page
    let firstRow = container.firstElementChild;
    let ageSpan = firstRow?.firstElementChild;
    if (firstRow && ageSpan) {
        let aLink = document.createElement('a');
        aLink.href = 'https://csfloat.com/item/' + cachedSale.id;
        aLink.target = '_blank';
        let linkIcon = document.createElement('img');
        linkIcon.setAttribute('src', runtimePublicURL + '/arrow-up-right-from-square-solid.svg');
        linkIcon.style.height = '18px';
        linkIcon.style.marginRight = '10px';
        linkIcon.style.filter = 'brightness(0) saturate(100%) invert(100%) sepia(0%) saturate(7461%) hue-rotate(14deg) brightness(94%) contrast(106%)';
        linkIcon.style.translate = '0 3px';
        (<HTMLElement>ageSpan).style.color = 'white';
        aLink.appendChild(linkIcon);
        aLink.appendChild(firstRow.firstChild as Node);
        firstRow.appendChild(aLink);
    }

    let appStickerView = container.querySelector('.cdk-column-stickers')?.firstElementChild;
    if (appStickerView) {
        if (appStickerView.querySelectorAll('.sticker').length == 0) return;
        let stickerData = cachedSale.item.stickers;
        const price_difference = document.querySelector('.betterfloat-big-sale')?.getAttribute('data-betterfloat');

        if (price_difference && stickerData.length > 0) {
            let stickerContainer = document.createElement('div');
            stickerContainer.className = 'betterfloat-table-sp';
            (<HTMLElement>appStickerView).style.display = 'flex';
            (<HTMLElement>appStickerView).style.alignItems = 'center';

            const doChange = await changeSpContainer(stickerContainer, stickerData, Number(price_difference));
            if (doChange) {
                appStickerView.appendChild(stickerContainer);
                (<HTMLElement>appStickerView.parentElement).style.paddingRight = '0';
            }
        }
    }
}

async function adjustItem(container: Element, isPopout = false) {
    const item = getFloatItem(container);
    if (Number.isNaN(item.price)) return;
    const priceResult = await addBuffPrice(item, container, isPopout);
    let cachedItem = await getFirstCSFItem();
    if (cachedItem) {
        if (item.name != cachedItem.item.item_name) {
            console.log('[BetterFloat] Item name mismatch:', item.name, cachedItem.item.item_name);
            return;
        }
        if (extensionSettings.stickerPrices) {
            await addStickerInfo(container, cachedItem, priceResult.price_difference);
        }
        if (extensionSettings.listingAge > 0) {
            await addListingAge(container, cachedItem);
        }
        storeApiItem(container, cachedItem);
    }
    if (isPopout) {
        // need timeout as request is only sent after popout is loaded
        setTimeout(async () => {
            await addItemHistory(container.parentElement!.parentElement!);

            const itemPreview = document.getElementsByClassName('item-' + location.pathname.split('/').pop())[0];

            let apiItem = getApiItem(itemPreview);
            // if this is the first launch, the item has to be newly retrieved by the api
            if (!apiItem) {
                apiItem = await getCSFPopupItem();
            }
            if (apiItem) {
                await addStickerInfo(container, apiItem, priceResult.price_difference);
                await addListingAge(container, apiItem);
            }
        }, 500);
    }
}

function storeApiItem(container: Element, item: CSFloat.ListingData) {
    // add id as class to find the element later more easily
    container.classList.add('item-' + item.id);
    container.setAttribute('data-betterfloat', JSON.stringify(item));
}

function getApiItem(container: Element | null): CSFloat.ListingData | null {
    let data = container?.getAttribute('data-betterfloat');
    if (data) {
        return JSON.parse(data);
    }
    return null;
}

async function addItemHistory(container: Element) {
    const itemHistory = calculateHistoryValues(await getWholeHistory());
    const headerContainer = <HTMLElement>container.querySelector('#header');
    if (!headerContainer || !itemHistory) {
        console.log('[BetterFloat] Could not add item history: ', itemHistory);
        return;
    }

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
    highestContainer.textContent = 'High: $' + itemHistory.highest.avg_price.toFixed(2);

    const lowestContainer = document.createElement('span');
    lowestContainer.classList.add('betterfloat-history-lowest');
    lowestContainer.textContent = 'Low: $' + itemHistory.lowest.avg_price.toFixed(2);

    const divider = document.createElement('span');
    divider.textContent = ' | ';
    divider.style.margin = '0 5px';

    historyContainer.appendChild(lowestContainer);
    historyContainer.appendChild(divider);
    historyContainer.appendChild(highestContainer);
    headerContainer.appendChild(historyContainer);
}

function calculateHistoryValues(itemHistory: CSFloat.HistoryGraphData[]) {
    if (itemHistory.length == 0) {
        return null;
    }
    const highestElement = itemHistory.reduce((prev, current) => (prev.avg_price > current.avg_price ? prev : current));
    const lowestElement = itemHistory.reduce((prev, current) => (prev.avg_price < current.avg_price ? prev : current));

    return {
        total: itemHistory,
        highest: highestElement,
        lowest: lowestElement,
    };
}

async function addListingAge(container: Element, cachedItem: CSFloat.ListingData) {
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

async function addStickerInfo(container: Element, cachedItem: CSFloat.ListingData, price_difference: number) {
    let stickers = cachedItem.item.stickers;
    // quality 12 is souvenir
    if (!stickers || cachedItem.item?.quality == 12) {
        return;
    }

    let csfSP = container.querySelector('.sticker-percentage');
    if (csfSP) {
        let didChange = await changeSpContainer(csfSP, stickers, price_difference);
        if (!didChange) {
            csfSP.remove();
        }
    }
}

// returns if the SP container was created, so priceSum > 1
async function changeSpContainer(csfSP: Element, stickers: CSFloat.StickerData[], price_difference: number) {
    let stickerPrices = await Promise.all(stickers.map(async (s) => await getItemPrice(s.name)));
    let priceSum = stickerPrices.reduce((a, b) => a + b.starting_at, 0);
    let spPercentage = price_difference / priceSum;

    // don't display SP if total price is below $1
    if (priceSum > 1) {
        let backgroundImageColor = '';
        if (spPercentage < 0.005 || spPercentage > 2) {
            backgroundImageColor = '#0003';
        } else if (spPercentage > 1) {
            backgroundImageColor = 'rgb(245 0 0 / 40%)';
        } else if (spPercentage > 0.5) {
            backgroundImageColor = 'rgb(245 164 0 / 40%)';
        } else if (spPercentage > 0.25) {
            backgroundImageColor = 'rgb(244 245 0 / 40%)';
        } else {
            backgroundImageColor = 'rgb(83 245 0 / 40%)';
        }
        if (spPercentage > 2 || spPercentage < 0.005) {
            csfSP.textContent = `$${priceSum.toFixed(0)} SP`;
        } else {
            csfSP.textContent = (spPercentage > 0 ? spPercentage * 100 : 0).toFixed(1) + '% SP';
        }
        (<HTMLElement>csfSP).style.backgroundColor = backgroundImageColor;
        (<HTMLElement>csfSP).style.marginBottom = '5px';
        return true;
    } else {
        return false;
    }
}

function getFloatItem(container: Element): CSFloat.FloatItem {
    const nameContainer = container.querySelector('app-item-name');
    const floatContainer = container.querySelector('item-float-bar');
    const priceContainer = container.querySelector('.price');
    const header_details = <Element>nameContainer?.childNodes[1];

    let name = nameContainer?.querySelector('.item-name')?.textContent?.replace('\n', '').trim();
    let priceText = priceContainer?.textContent?.trim().split(' ') ?? [];
    let price: string;
    if (location.pathname == '/sell') {
        price = priceText[1].split('Price')[1];
    } else {
        price = priceText.includes('Bids') ? "0" : priceText[0];
    }
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
                condition = (node.textContent?.trim() ?? '') as ItemCondition;
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
        price: price?.includes('Bids') ? 0 : Number(price?.split(' ver')[0].split('  ')[0].trim().replace('$', '').replace(',', '')),
        bargain: false,
    };
}

async function getBuffItem(item: CSFloat.FloatItem) {
    await loadMapping();
    let buff_name = handleSpecialStickerNames(createBuffName(item));
    let priceMapping = await getPriceMapping();
    let helperPrice: number | null = null;

    if (!priceMapping[buff_name] || !priceMapping[buff_name]['buff163'] || !priceMapping[buff_name]['buff163']['starting_at'] || !priceMapping[buff_name]['buff163']['highest_order']) {
        console.debug(`[BetterFloat] No price mapping found for ${buff_name}`);
        helperPrice = 0;
    }

    let buff_id = await getBuffMapping(buff_name);
    // we cannot use the getItemPrice function here as it does not return the correct price for doppler skins
    let priceListing = 0;
    let priceOrder = 0;
    if (typeof helperPrice == 'number') {
        priceListing = helperPrice;
        priceOrder = helperPrice;
    } else {
        if (item.style != '' && item.style != 'Vanilla') {
            priceListing = priceMapping[buff_name]['buff163']['starting_at']['doppler'][item.style];
            priceOrder = priceMapping[buff_name]['buff163']['highest_order']['doppler'][item.style];
        } else {
            priceListing = priceMapping[buff_name]['buff163']['starting_at']['price'];
            priceOrder = priceMapping[buff_name]['buff163']['highest_order']['price'];
        }
    }
    if (priceListing == undefined) {
        priceListing = 0;
    }
    if (priceOrder == undefined) {
        priceOrder = 0;
    }
    const priceFromReference = extensionSettings.priceReference == 1 ? priceListing : priceOrder;
    return {
        buff_name: buff_name,
        buff_id: buff_id,
        priceListing: priceListing,
        priceOrder: priceOrder,
        priceFromReference: priceFromReference,
        difference: item.price - priceFromReference,
    };
}

async function addBuffPrice(item: CSFloat.FloatItem, container: Element, isPopout = false): Promise<PriceResult> {
    const { buff_name, buff_id, priceListing, priceOrder, priceFromReference, difference } = await getBuffItem(item);

    let suggestedContainer = container.querySelector('.reference-container');
    const showBoth = extensionSettings.showSteamPrice || isPopout;

    if (!suggestedContainer && location.pathname == '/sell') {
        suggestedContainer = document.createElement('div');
        suggestedContainer.setAttribute('class', 'reference-container');
        container.querySelector('.price')?.after(suggestedContainer);
    }

    if (suggestedContainer && !suggestedContainer.querySelector('.betterfloat-buffprice')) {
        let buffContainer = document.createElement('a');
        buffContainer.setAttribute('class', 'betterfloat-buff-a');
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
        buffPrice.setAttribute('data-betterfloat', JSON.stringify({ buff_name: buff_name, priceFromReference: priceFromReference }));
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

        if (!container.querySelector('.betterfloat-buffprice')) {
            if (showBoth) {
                suggestedContainer.setAttribute('href', 'https://steamcommunity.com/market/listings/730/' + encodeURIComponent(buff_name));
                let divider = document.createElement('div');
                suggestedContainer.after(buffContainer);
                suggestedContainer.after(divider);
            } else {
                suggestedContainer.replaceWith(buffContainer);
            }
        }
    } else if (container.querySelector('.betterfloat-buff-a')) {
        let buffA = container.querySelector('.betterfloat-buff-a')!;
        let buff_url = buff_id > 0 ? `https://buff.163.com/goods/${buff_id}` : `https://buff.163.com/market/csgo#tab=selling&page_num=1&search=${encodeURIComponent(buff_name)}`;
        buffA.setAttribute('href', buff_url);
        let buffPriceDiv = buffA.querySelector('.betterfloat-buffprice')!;
        buffPriceDiv.setAttribute('data-betterfloat', JSON.stringify({ buff_name: buff_name, priceFromReference: priceFromReference }));
        buffPriceDiv.children[1].textContent = `Bid $${priceOrder}`;
        buffPriceDiv.children[3].textContent = `Ask $${priceListing}`;
    }

    // edge case handling: reference price may be a valid 0 for some paper stickers etc.
    if (extensionSettings.showBuffDifference && item.price !== 0 && (priceFromReference > 0 || item.price < 0.06) && location.pathname != '/sell') {
        const priceContainer = <HTMLElement>container.querySelector('.price');
        let saleTag = priceContainer.querySelector('.sale-tag');
        let badge = priceContainer.querySelector('.badge');
        if (saleTag) {
            priceContainer.removeChild(saleTag);
        }
        if (badge) {
            priceContainer.removeChild(badge);
        }

        let backgroundColor;
        let differenceSymbol;
        if (difference < 0) {
            backgroundColor = 'green';
            differenceSymbol = '-$';
        } else if (difference > 0) {
            backgroundColor = '#ce0000';
            differenceSymbol = '+$';
        } else {
            backgroundColor = 'slategrey';
            differenceSymbol = '-$';
        }

        const buffPriceHTML = `<span class="sale-tag betterfloat-sale-tag${
            isPopout ? ' betterfloat-big-sale' : ''
        }" style="background-color: ${backgroundColor};" data-betterfloat="${difference}">${differenceSymbol}${Math.abs(difference).toFixed(2)} ${
            extensionSettings.showBuffPercentageDifference ? ' (' + ((item.price / priceFromReference) * 100).toFixed(2) + '%)' : ''
        }</span>`;
        if (item.price > 1999 && extensionSettings.showBuffPercentageDifference) parseHTMLString('<br>', priceContainer);

        parseHTMLString(buffPriceHTML, priceContainer);
    }

    return {
        price_difference: difference,
    };
}

function createBuffName(item: CSFloat.FloatItem): string {
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

function createTopButton() {
    let topButton = document.createElement('button');
    topButton.classList.add('betterfloat-top-button');
    topButton.setAttribute(
        'style',
        'position: fixed; right: 2rem; bottom: 2rem; z-index: 999; width: 40px; height: 40px; border-radius: 50%; background-color: #004594; border: none; outline: none; cursor: pointer; display: none; transition: visibility 0s, opacity 0.5s linear;'
    );
    let topButtonIcon = document.createElement('img');
    topButtonIcon.setAttribute('src', runtimePublicURL + '/chevron-up-solid.svg');
    topButtonIcon.style.marginTop = '5px';
    topButtonIcon.style.filter = 'brightness(0) saturate(100%) invert(97%) sepia(0%) saturate(2009%) hue-rotate(196deg) brightness(113%) contrast(93%)';
    topButton.addEventListener('click', () => {
        window.scrollTo({ top: 0, behavior: 'smooth' });
    });
    topButton.appendChild(topButtonIcon);
    document.body.appendChild(topButton);

    document.addEventListener('scroll', () => {
        if (document.body.scrollTop > 700 || document.documentElement.scrollTop > 700) {
            topButton.style.display = 'block';
        } else {
            topButton.style.display = 'none';
        }
    });
}

let supportedSubPages = ['/item/', '/stall', '/profile/watchlist', '/search', '/profile/offers', '/sell'];
let unsupportedSubPages = ['blog.csfloat', '/db'];

let extensionSettings: ExtensionSettings;
let runtimePublicURL = chrome.runtime.getURL('../public');
let refreshThreads: [ReturnType<typeof setTimeout> | null] = [null];
// time of last refresh in auto-refresh functionality
let lastRefresh = 0;
// mutation observer active?
let isObserverActive = false;

init();
