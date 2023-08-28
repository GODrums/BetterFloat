import { ExtensionSettings, ItemStyle, Skinport } from '../@typings/FloatTypes';
import { getBuffMapping, getInventoryHelperPrice, getPriceMapping, getUserCurrencyRate, loadBuffMapping, loadMapping } from '../mappinghandler';
import { activateHandler } from '../eventhandler';
import { initSettings } from '../util/extensionsettings';
import { handleSpecialStickerNames } from '../util/helperfunctions';

async function init() {
    //get current url
    let url = window.location.href;
    if (!url.includes('skinport.com')) {
        return;
    }
    console.log('[BetterFloat] Starting BetterFloat');
    // catch the events thrown by the script
    // this has to be done as first thing to not miss timed events
    activateHandler();

    extensionSettings = await initSettings();

    await loadMapping();
    await loadBuffMapping();

    // //check if url is in supported subpages
    // if (url.endsWith('float.com/')) {
    //     await firstLaunch();
    // } else {
    //     for (let i = 0; i < supportedSubPages.length; i++) {
    //         if (url.includes(supportedSubPages[i])) {
    //             await firstLaunch();
    //         }
    //     }
    // }

    // mutation observer is only needed once
    if (!isObserverActive) {
        console.debug('[BetterFloat] Starting observer');
        await applyMutation();
        console.log('[BetterFloat] Observer started');

        isObserverActive = true;
    }
}

async function applyMutation() {
    let observer = new MutationObserver(async (mutations) => {
        if (extensionSettings.spBuffPrice) {
            for (let mutation of mutations) {
                for (let i = 0; i < mutation.addedNodes.length; i++) {
                    let addedNode = mutation.addedNodes[i];
                    // some nodes are not elements, so we need to check
                    if (!(addedNode instanceof HTMLElement)) continue;

                    // console.log('[BetterFloat] Mutation observer triggered, added node:', addedNode);

                    if (addedNode.className && addedNode.className.toString().includes('CatalogPage-item')) {
                        await adjustItem(addedNode);
                    }
                    // item popout
                    // if (addedNode.tagName && addedNode.tagName.toLowerCase() == 'item-detail') {
                    //     await adjustItem(addedNode, true);
                    //     // item from listings
                    // } else if (addedNode.className && addedNode.className.toString().includes('flex-item')) {
                    //     await adjustItem(addedNode);
                    // }
                }
            }
        }
    });
    observer.observe(document, { childList: true, subtree: true });
}

async function adjustItem(container: Element) {
    const item = getFloatItem(container);
    if (!item) return;
    await addBuffPrice(item, container);
    // if (extensionSettings.stickerPrices) {
    //     await addStickerInfo(item, container, cachedItem, priceResult);
    // }
    // if (extensionSettings.listingAge > 0) {
    //     await addListingAge(item, container, cachedItem);
    // }
}

function getFloatItem(container: Element): Skinport.Listing | null {
    let name = container.querySelector('.ItemPreview-itemName')?.textContent ?? '';
    if (name == '') {
        return null;
    }
    let price = Number(container.querySelector('.ItemPreview-price .Tooltip-link')?.innerHTML.substring(1).replace(',', '')) ?? 0;
    let type = container.querySelector('.ItemPreview-itemTitle')?.textContent ?? '';
    let text = container.querySelector('.ItemPreview-itemText')?.innerHTML ?? '';

    let style: ItemStyle = '';
    if (name.includes('Doppler')) {
        style = name.split('(')[1].split(')')[0] as ItemStyle;
    } else if (name.includes('Vanilla')) {
        style = 'Vanilla';
    }

    let stickers: { name: string }[] = [];
    let stickersDiv = container.querySelector('.ItemPreview-stickers');
    if (stickersDiv) {
        for (let sticker of stickersDiv.children) {
            let stickerName = sticker.children[0].getAttribute('alt');
            if (stickerName) {
                stickers.push({
                    name: stickerName,
                });
            }
        }
    }
    const getWear = (wearDiv: HTMLElement) => {
        let wear = '';

        if (wearDiv) {
            let w = Number(wearDiv.innerHTML);
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
    let wearDiv = container.querySelector('.WearBar-value');
    let wear = wearDiv ? getWear(wearDiv as HTMLElement) : '';
    return {
        name: name,
        price: price,
        type: type,
        text: text,
        stickers: stickers,
        style: style,
        wear: Number(wearDiv?.innerHTML),
        wear_name: wear,
    };
}

async function addBuffPrice(item: Skinport.Listing, container: Element): Promise<any> {
    await loadMapping();
    let buff_name = handleSpecialStickerNames(createBuffName(item));
    let priceMapping = await getPriceMapping();
    let helperPrice: number | null = null;

    if (!priceMapping[buff_name] || !priceMapping[buff_name]['buff163'] || !priceMapping[buff_name]['buff163']['starting_at'] || !priceMapping[buff_name]['buff163']['highest_order']) {
        console.debug(`[BetterFloat] No price mapping found for ${buff_name}: `, container);
        helperPrice = await getInventoryHelperPrice(buff_name);
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

    //convert prices to user's currency
    let currencyRate = await getUserCurrencyRate(extensionSettings.skinportRates);
    if (extensionSettings.skinportRates == 'skinport') {
        // origin price of rate is non-USD, so we need to divide
        priceListing = priceListing / currencyRate;
        priceOrder = priceOrder / currencyRate;
    } else {
        // origin price of rate is USD, so we need to multiply
        priceListing = priceListing * currencyRate;
        priceOrder = priceOrder * currencyRate;
    }

    const presentationDiv = container.querySelector('.ItemPreview-mainAction');
    if (presentationDiv) {
        let buffLink = document.createElement('a');
        buffLink.className = 'ItemPreview-sideAction betterskinport-bufflink';
        buffLink.style.width = '60px';
        buffLink.target = '_blank';
        buffLink.innerText = 'Buff';
        if (buff_id > 0) {
            buffLink.href = `https://buff.163.com/goods/${buff_id}`;
        } else {
            buffLink.href = `https://buff.163.com/market/csgo#tab=selling&page_num=1&search=${encodeURIComponent(buff_name)}`;
        }
        if (!presentationDiv.querySelector('.betterskinport-bufflink')) {
            presentationDiv.after(buffLink);
        }
    }

    let tooltipLink = <HTMLElement>container.querySelector('.ItemPreview-priceValue')?.firstChild;
    const currencySymbol = tooltipLink.textContent?.charAt(0);
    let priceDiv = container.querySelector('.ItemPreview-oldPrice');
    if (priceDiv && !container.querySelector('.betterfloat-buffprice')) {
        priceDiv.className += ' betterfloat-buffprice';
        let buffContainer = document.createElement('div');
        buffContainer.style.display = 'flex';
        buffContainer.style.marginTop = '5px';
        buffContainer.style.justifyContent = 'center';
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
        buffPriceBid.textContent = `Bid ${currencySymbol}${priceOrder.toFixed(2)}`;
        buffPrice.appendChild(buffPriceBid);
        let buffPriceDivider = document.createElement('span');
        buffPriceDivider.setAttribute('style', 'color: gray;margin: 0 3px 0 3px;');
        buffPriceDivider.textContent = '|';
        buffPrice.appendChild(buffPriceDivider);
        let buffPriceAsk = document.createElement('span');
        buffPriceAsk.setAttribute('style', 'color: greenyellow;');
        buffPriceAsk.textContent = `Ask ${currencySymbol}${priceListing.toFixed(2)}`;
        buffPrice.appendChild(buffPriceAsk);
        buffContainer.appendChild(buffPrice);
        if (extensionSettings.spSteamPrice) {
            let divider = document.createElement('div');
            priceDiv.after(buffContainer);
            priceDiv.after(divider);
        } else {
            priceDiv.replaceWith(buffContainer);
        }
    }

    if (extensionSettings.spBuffDifference) {
        const difference = item.price - (extensionSettings.spPriceReference == 0 ? priceOrder : priceListing);
        let discountContainer = <HTMLElement>container.querySelector('.ItemPreview-discount');
        if (!discountContainer || !discountContainer.firstChild) {
            discountContainer = document.createElement('div');
            discountContainer.className = 'GradientLabel ItemPreview-discount';
            const newSaleTag = document.createElement('span');
            discountContainer.appendChild(newSaleTag);
            container.querySelector('.ItemPreview-priceValue')?.appendChild(discountContainer);
        }
        let saleTag = <HTMLElement>discountContainer.firstChild;
        if (item.price !== 0 && saleTag && tooltipLink && !discountContainer.querySelector('.betterfloat-sale-tag')) {
            saleTag.className = 'sale-tag betterfloat-sale-tag';
            discountContainer.style.background = `linear-gradient(135deg,#0073d5,${difference == 0 ? 'black' : difference < 0 ? 'green' : '#ce0000'})`;
            saleTag.textContent = difference == 0 ? `-${currencySymbol}0` : (difference > 0 ? '+' : '-') + currencySymbol + Math.abs(difference).toFixed(2);
        }
    } else {
        if (container.querySelector('.sale-tag')) {
            (<HTMLElement>container.querySelector('.sale-tag')).className += 'betterfloat-sale-tag';
        }
    }
}

function createBuffName(item: Skinport.Listing): string {
    let full_name = `${item.name}`;
    if (item.type.includes('Sticker') || item.type.includes('Patch') || item.type.includes('Music Kit')) {
        full_name = item.type + ' | ' + full_name;
    } else if (item.text.includes('Container') || item.text.includes('Collectible') || item.type.includes('Gift') || item.type.includes('Key') || item.type.includes('Pass')) {
        full_name = item.name;
    } else if (item.text.includes('Graffiti')) {
        full_name = 'Sealed Graffiti | ' + item.name;
    } else if (item.text.includes('Agent')) {
        full_name = `${item.name} | ${item.type}`;
    } else if (item.name.includes('Dragon King')) {
        full_name = `M4A4 | 龍王 (Dragon King)${' (' + item.wear_name + ')'}`;
    } else {
        full_name = `${(item.text.includes('Knife') || item.text.includes('Gloves')) && !item.text.includes('StatTrak') ? '★ ' : ''}${item.type}${
            item.name.includes('Vanilla') ? '' : ' | ' + item.name.split(' (')[0].trim()
        }${item.name.includes('Vanilla') ? '' : ' (' + item.wear_name + ')'}`;
    }
    return full_name.replace(/ +(?= )/g, '').replace(/\//g, '-');
}

let extensionSettings: ExtensionSettings;
let runtimePublicURL = chrome.runtime.getURL('../public');
// mutation observer active?
let isObserverActive = false;
init();
