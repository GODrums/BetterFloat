import { ExtensionSettings, FloatItem, ItemCondition, ItemStyle } from './@typings/FloatTypes';
import { injectScript } from './eventhandler';

async function init() {
    //get current url
    let url = window.location.href;
    if (!url.includes('csgofloat.com') && !url.includes('csfloat.com')) {
        return;
    }
    injectScript();

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
            refreshText.textContent = 'active';
            refreshText.setAttribute('style', 'color: greenyellow;');

            // save timer to avoid multiple executions
            refreshInterval.push(
                setInterval(() => {
                    let refreshButton = document.querySelector('.mat-chip-list-wrapper').querySelector('.mat-tooltip-trigger')?.children[0] as HTMLElement;
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
            refreshText.textContent = 'inactive';
            refreshText.setAttribute('style', 'color: #ce0000;');

            //clearinterval for every entry in refreshInterval
            for (let i = 0; i < refreshInterval.length; i++) {
                clearInterval(refreshInterval[i]);
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

async function loadMapping() {
    if (Object.keys(priceMapping).length == 0) {
        console.debug('[BetterFloat] Attempting to load price mapping from local storage');

        let mapping = null;

        chrome.storage.local.get('prices', (data) => {
            if (data) {
                mapping = data.prices;
            } else {
                mapping = '';
            }
        });

        // since chrome.storage.local.get is async, we might need to wait for it to finish
        let tries = 20;
        while (mapping == null && tries-- > 0) {
            await new Promise((r) => setTimeout(r, 100));
        }

        if (tries == 0) {
            console.debug('[BetterFloat] Did not receive a response from Csgotrader.');
            mapping = {};
            priceMapping = {};
        }

        if (mapping.length > 0) {
            priceMapping = JSON.parse(mapping);
        } else {
            console.debug('[BetterFloat] Failed. Loading price mapping from file is currently disabled.');
            return false;
            // fallback to loading older prices from file currently disabled
            // console.debug('[BetterFloat] Failed. Loading price mapping from file.');
            // let response = await fetch(runtimePublicURL + '/prices_v6.json');
            // priceMapping = await response.json();
        }
        console.debug('[BetterFloat] Price mapping successfully initialized');
    }
    return true;
}

// get mapping from rums.dev
// currently has no fallback if api is down
async function loadBuffMapping() {
    console.debug('[BetterFloat] Attempting to load buff mapping from rums.dev');
    await fetch('https://api.rums.dev/file/buff_name_to_id')
        .then((response) => response.json())
        .then((data) => {
            buffMapping = data;
            console.debug('[BetterFloat] Buff mapping successfully loaded from rums.dev');
        })
        .catch((err) => console.error(err));
}

async function getBuffMapping(name: string) {
    if (Object.keys(buffMapping).length == 0) {
        await loadBuffMapping();
    }
    if (buffMapping[name]) {
        return buffMapping[name];
    } else {
        console.log(`[BetterFloat] No buff mapping found for ${name}`);
        return 0;
    }
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
                        adjustItem(addedNode, true);
                        // item from listings
                    } else if (addedNode.className && addedNode.className.toString().includes('flex-item')) {
                        adjustItem(addedNode);
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

function adjustItem(container: Element, isPopout = false) {
    const item = getFloatItem(container);
    addBuffPrice(item, container, isPopout);
}

function getFloatItem(container: Element): FloatItem {
    const nameContainer = container.querySelector('app-item-name');
    const floatContainer = container.querySelector('item-float-bar');
    const priceContainer = container.querySelector('.price');
    const header_details = <Element>nameContainer.childNodes[1];

    let name = nameContainer.querySelector('.item-name').textContent.replace('\n', '');
    let price = priceContainer.textContent;
    let condition: ItemCondition = '';
    let quality = '';
    let style: ItemStyle = '';

    header_details.childNodes.forEach((node) => {
        switch (node.nodeType) {
            case Node.ELEMENT_NODE:
                let text = node.textContent.trim();
                if (text.includes('StatTrak') || text.includes('Souvenir') || text.includes('Container') || text.includes('Sticker')) {
                    // TODO: integrate the ItemQuality type
                    // https://stackoverflow.com/questions/51528780/typescript-check-typeof-against-custom-type
                    quality = text;
                } else {
                    style = text.substring(1, text.length - 1) as ItemStyle;
                }
                break;
            case Node.TEXT_NODE:
                condition = node.textContent.trim() as ItemCondition;
                break;
            case Node.COMMENT_NODE:
                break;
        }
    });

    if (!name.includes('|')) {
        style = 'Vanilla';
    }
    return {
        name: name,
        quality: quality,
        style: style,
        condition: condition,
        float: Number(floatContainer?.querySelector('.ng-star-inserted')?.textContent ?? 0),
        price: price.includes('Bids') ? 0 : Number(price.split('  ')[0].trim().replace('$', '').replace(',', '')),
        bargain: false,
    };
}

async function addBuffPrice(item: FloatItem, container: Element, isPopout = false) {
    await loadMapping();
    let buff_name = createBuffName(item);
    let buff_id = await getBuffMapping(buff_name);

    if (!priceMapping[buff_name] || !priceMapping[buff_name]['buff163']) {
        console.debug(`[BetterFloat] No price mapping found for ${buff_name}`);
        return;
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

    const priceContainer = <HTMLElement>container.querySelector('.price');
    if (priceContainer.querySelector('.sale-tag')) {
        priceContainer.removeChild(priceContainer.querySelector('.sale-tag'));
    }
    const difference = item.price - (extensionSettings.priceReference == 0 ? priceOrder : priceListing);
    if (item.price !== 0) {
        const buffPriceHTML = `<span class="sale-tag betterfloat-sale-tag" style="background-color: ${difference == 0 ? 'slategrey;' : difference < 0 ? 'green;' : '#ce0000;'}"> ${
            difference == 0 ? '-$0' : (difference > 0 ? '+$' : '-$') + Math.abs(difference).toFixed(2)
        } </span>`;
        parseHTMLString(buffPriceHTML, priceContainer);
    }
}

function createBuffName(item: FloatItem): string {
    let full_name = `${item.name}`;
    if (item.quality.includes('Sticker')) {
        full_name = `Sticker |` + full_name;
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

let supportedSubPages = ['/item/', '/stall/', '/profile/watchlist'];
let unsupportedSubPages = ['/sell'];

let extensionSettings: ExtensionSettings;
let runtimePublicURL = chrome.runtime.getURL('./public');
let refreshInterval: [ReturnType<typeof setTimeout>] = [null];
// time of last refresh in auto-refresh functionality
let lastRefresh = 0;
// mutation observer active?
let isObserverActive = false;
// maps buff_name to buff_id
let buffMapping = {};
// maps buff_name to prices and more - from csgotrader
let priceMapping = {};
init();