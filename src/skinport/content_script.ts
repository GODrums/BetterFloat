import { ExtensionSettings, ItemStyle, Skinport } from '../@typings/FloatTypes';
import { getBuffMapping, getPriceMapping, getUserCurrencyRate, loadBuffMapping, loadMapping } from '../mappinghandler';
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

    if (extensionSettings.spBuffPrice && document.getElementsByClassName("CountryFlag--GB").length == 0) {
        console.log('[BetterFloat] Skinport language has to be English for this extension to work. Aborting ...');
        createLanguagePopup();
        return;
    }

    await loadMapping();
    await loadBuffMapping();

    await firstLaunch();

    // mutation observer is only needed once
    if (!isObserverActive) {
        console.debug('[BetterFloat] Starting observer');
        await applyMutation();
        console.log('[BetterFloat] Observer started');

        isObserverActive = true;
    }
}

async function firstLaunch() {
    let url = window.location.href;
    console.log('[BetterFloat] First launch on Skinport, url: ', url);
    if (url == 'https://skinport.com/') {
        let popularLists = document.querySelectorAll('.PopularList');
        for (let list of popularLists) {
            if (list.querySelector('h3')?.textContent?.includes('CS:GO')) {
                let popularItems = list.querySelectorAll('.PopularList-item');
                for (let item of popularItems) {
                    await adjustItem(item);
                }
            }
        }
    } else if (url.includes('/market')) {
        let catalogItems = document.querySelectorAll('.CatalogPage-item');
        for (let item of catalogItems) {
            await adjustItem(item);
        }
    } else if (url.includes('/cart')) {
        let cartContainer = document.querySelector('.Cart-container');
        if (cartContainer) {
            await adjustCart(cartContainer);
        }
    } else if (url.includes('/item')) {
        let itemPage = document.querySelectorAll('.ItemPage');
        for (let item of itemPage) {
            await adjustItemPage(item);
        }
    } else if (url.includes('/myitems/')) {
        let inventoryItems = document.querySelectorAll('.InventoryPage-item');
        for (let item of inventoryItems) {
            await adjustItem(item);
        }
    }
}

function createLanguagePopup() {
    let popupOuter = document.createElement('div');
    popupOuter.className = 'betterfloat-popup-outer';
    popupOuter.style.backdropFilter = 'blur(2px)';
    popupOuter.style.fontSize = '16px';
    let popup = document.createElement('div');
    popup.className = 'betterfloat-popup-language';
    let popupHeaderDiv = document.createElement('div');
    popupHeaderDiv.style.display = 'flex';
    popupHeaderDiv.style.alignItems = 'center';
    popupHeaderDiv.style.justifyContent = 'space-between';
    popupHeaderDiv.style.margin = '0 10px';
    let warningIcon = document.createElement('img');
    warningIcon.src = runtimePublicURL + '/triangle-exclamation-solid.svg';
    warningIcon.style.width = '32px';
    warningIcon.style.height = '32px';
    warningIcon.style.filter = 'brightness(0) saturate(100%) invert(42%) sepia(99%) saturate(1934%) hue-rotate(339deg) brightness(101%) contrast(105%)';
    let popupHeaderText = document.createElement('h2');
    popupHeaderText.style.fontWeight = '700';
    popupHeaderText.textContent = 'Warning: Language not supported';
    let closeButton = document.createElement('a');
    closeButton.className = 'close';
    closeButton.style.marginBottom = '10px';
    closeButton.textContent = 'x';
    closeButton.style.cursor = 'pointer';
    closeButton.onclick = () => {
        popupOuter.remove();
    };
    popupHeaderDiv.appendChild(warningIcon);
    popupHeaderDiv.appendChild(popupHeaderText);
    popupHeaderDiv.appendChild(closeButton);
    let popupText = document.createElement('p');
    popupText.style.marginTop = '30px';
    popupText.textContent = 'BetterFloat currently only supports the English language on Skinport. If you prefer to pass on most of BetterFloat\'s features on Skinport, please disable the \'Buff Price Calculation\'-feature in the extension settings.';
    let buttonDiv = document.createElement('div');
    buttonDiv.style.display = 'flex';
    buttonDiv.style.justifyContent = 'center';
    let changeLanguageButton = document.createElement('button');
    changeLanguageButton.type = 'button';
    changeLanguageButton.className = 'betterfloat-language-button';
    changeLanguageButton.textContent = 'Change language';
    changeLanguageButton.onclick = () => {
        (<HTMLButtonElement>document.querySelector(".Dropdown-button")).click();
        (<HTMLButtonElement>document.querySelector(".Dropdown-dropDownItem")).click();
    };
    buttonDiv.appendChild(changeLanguageButton);
    popup.appendChild(popupHeaderDiv);
    popup.appendChild(popupText);
    popup.appendChild(buttonDiv);
    popupOuter.appendChild(popup);
    document.body.appendChild(popupOuter);
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

                    if (addedNode.className) {
                        let className = addedNode.className.toString();
                        if (className.includes('CatalogPage-item') || className.includes('InventoryPage-item')) {
                            await adjustItem(addedNode);
                        } else if (className.includes('Cart-container')) {
                            await adjustCart(addedNode);
                        } else if (className == 'ItemPage') {
                            await adjustItemPage(addedNode);
                        } else if (className.includes('PopularList')) {
                            if (addedNode.querySelector('h3')?.textContent?.includes('CS:GO')) {
                                let popularItems = addedNode.querySelectorAll('.PopularList-item');
                                for (let item of popularItems) {
                                    await adjustItem(item);
                                }
                            }
                        }
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

async function adjustItemPage(container: Element) {
    console.log('[BetterFloat] Adjusting item page: ', container);
    let itemRating = container.querySelector('.ItemPage-rating');
    if (itemRating) {
        itemRating.remove();
    }

    let btnGroup = container.querySelector('.ItemPage-btnGroup');
    if (!btnGroup) return;
    let newGroup = document.createElement('div');
    newGroup.className = btnGroup.className ?? newGroup.className;
    // if an item is sold, the original links are unclickable, hence we reproduce them
    let links = container.querySelectorAll('.ItemPage-link');
    let linkSteam = (Array.from(links).find((el) => el.innerHTML.includes('Steam')) as HTMLAnchorElement | null)?.href;
    let linkInspect = (Array.from(links).find((el) => el.innerHTML.includes('Inspect')) as HTMLAnchorElement | null)?.href;
    if (linkInspect) {
        let inspectButton = document.createElement('button');
        inspectButton.onclick = () => {
            window.open(linkInspect);
        };
        inspectButton.type = 'button';
        inspectButton.textContent = 'Inspect';
        newGroup.appendChild(inspectButton);
    }
    if (linkSteam) {
        let steamButton = document.createElement('button');
        steamButton.onclick = () => {
            window.open(linkSteam, '_blank');
        };
        steamButton.type = 'button';
        steamButton.textContent = 'Steam';
        newGroup.appendChild(steamButton);
    }

    let item = getFloatItem(container, itemSelectors.page);
    console.log('[BetterFloat] Item: ', item);
    if (!item) return;
    let { buff_name: buff_name, priceListing, priceOrder } = await getBuffPrice(item);
    let buffid = await getBuffMapping(buff_name);
    let buffLink = buffid > 0 ? `https://buff.163.com/goods/${buffid}` : `https://buff.163.com/market/csgo#tab=selling&page_num=1&search=${encodeURIComponent(buff_name)}`;

    let buffButton = document.createElement('button');
    buffButton.onclick = () => {
        window.open(buffLink, '_blank');
    };
    buffButton.type = 'button';
    buffButton.textContent = 'Buff';
    newGroup.appendChild(buffButton);
    btnGroup.after(newGroup);

    let tooltipLink = container.querySelector('.ItemPage-value .Tooltip-link');
    if (!tooltipLink) return;
    const currencySymbol = tooltipLink.textContent?.charAt(0);
    let suggestedContainer = container.querySelector('.ItemPage-suggested');
    if (suggestedContainer) {
        generateBuffContainer(suggestedContainer as HTMLElement, priceListing, priceOrder, currencySymbol ?? '$', true);
    }
    // HERE
    const buffContainer = container.querySelector('.betterfloat-buff-container');
    if (buffContainer) {
        (<HTMLElement>buffContainer).onclick = (e: Event) => {
            e.stopPropagation();
            e.preventDefault();
            window.open(buffLink, '_blank');
        };
    }

    const difference = item.price - (extensionSettings.spPriceReference == 0 ? priceOrder : priceListing);
    let priceContainer = <HTMLElement>container.querySelector('.ItemPage-price');
    if (priceContainer) {
        let newContainer = document.createElement('div');
        let saleTag = document.createElement('span');
        newContainer.className = 'ItemPage-discount betterfloat-discount-container';
        newContainer.style.background = `linear-gradient(135deg,#0073d5,${difference == 0 ? 'black' : difference < 0 ? 'green' : '#ce0000'})`;
        newContainer.style.transform = 'skewX(-15deg)';
        newContainer.style.borderRadius = '3px';
        newContainer.style.paddingTop = '2px';
        saleTag.style.margin = '5px';
        saleTag.style.fontWeight = '700';
        saleTag.textContent = difference == 0 ? `-${currencySymbol}0` : (difference > 0 ? '+' : '-') + currencySymbol + Math.abs(difference).toFixed(2);
        newContainer.appendChild(saleTag);
        priceContainer.appendChild(newContainer);
    }
    
    await addFloatColoring(container, item);
}

async function adjustCart(container: Element) {
    if (extensionSettings.spCheckBoxes) {
        let checkboxes = container.querySelectorAll('.Checkbox-input');
        for (let checkbox of checkboxes) {
            (checkbox as HTMLInputElement).click();
            await new Promise((r) => setTimeout(r, 50)); // to avoid bot detection
        }
    }
}

async function adjustItem(container: Element) {
    const item = getFloatItem(container, itemSelectors.preview);
    if (!item) return;
    await addBuffPrice(item, container);
    if (extensionSettings.spFloatColoring) {
        await addFloatColoring(container, item);
    }
    // if (extensionSettings.stickerPrices) {
    //     await addStickerInfo(item, container, cachedItem, priceResult);
    // }
}

async function addFloatColoring(container: Element, item: Skinport.Listing) {
    let floatContainer = container.querySelector('.WearBar-value');
    if (!floatContainer) return;
    let color = '';
    let w = item.wear;
    if (w < 0.01 || (w > 0.07 && w < 0.08) || (w > 0.15 && w < 0.18) || (w > 0.38 && w < 0.39)) {
        if (w === 0) {
            color = 'springgreen';
        }
        color = 'turquoise';
    } else if ((w < 0.07 && w > 0.06) || (w > 0.14 && w < 0.15) || (w > 0.32 && w < 0.38) || w > 0.9) {
        if (w === 0.999) {
            color = 'red';
        }
        color = 'indianred';
    }
    (<HTMLElement>floatContainer).style.color = color;
}

const itemSelectors = {
    preview: {
        name: '.ItemPreview-itemName',
        title: '.ItemPreview-itemTitle',
        text: '.ItemPreview-itemText',
        stickers: '.ItemPreview-stickers',
        price: '.ItemPreview-price',
    },
    page: {
        name: '.ItemPage-name',
        title: '.ItemPage-title',
        text: '.ItemPage-text',
        stickers: '.ItemPage-stickers',
        price: '.ItemPage-price',
    },
} as const;

type ItemSelectors = (typeof itemSelectors)[keyof typeof itemSelectors];

function getFloatItem(container: Element, selector: ItemSelectors): Skinport.Listing | null {
    let name = container.querySelector(selector.name)?.textContent ?? '';
    if (name == '') {
        return null;
    }
    let price =
        Number(
            container
                .querySelector(selector.price + ' .Tooltip-link')
                ?.innerHTML.substring(1)
                .replace(',', '')
        ) ?? 0;
    let type = container.querySelector(selector.title)?.textContent ?? '';
    let text = container.querySelector(selector.text)?.innerHTML ?? '';

    let style: ItemStyle = '';
    if (name.includes('Doppler')) {
        style = name.split('(')[1].split(')')[0] as ItemStyle;
    } else if (name.includes('Vanilla')) {
        style = 'Vanilla';
    }

    let stickers: { name: string }[] = [];
    let stickersDiv = container.querySelector(selector.stickers);
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

async function getBuffPrice(item: Skinport.Listing): Promise<{ buff_name: string; priceListing: number; priceOrder: number }> {
    let priceMapping = await getPriceMapping();
    let buff_name = handleSpecialStickerNames(createBuffName(item));
    let helperPrice: number | null = null;

    if (!priceMapping[buff_name] || !priceMapping[buff_name]['buff163'] || !priceMapping[buff_name]['buff163']['starting_at'] || !priceMapping[buff_name]['buff163']['highest_order']) {
        console.debug(`[BetterFloat] No price mapping found for ${buff_name}`);
        helperPrice = 0;
    }

    // we cannot use the getItemPrice function here as it does not return the correct price for doppler skins
    let priceListing = 0;
    let priceOrder = 0;
    if (typeof helperPrice == 'number') {
        priceListing = helperPrice;
        priceOrder = helperPrice;
    } else if (priceMapping[buff_name]) {
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

    return { buff_name, priceListing, priceOrder };
}

async function generateBuffContainer(container: HTMLElement, priceListing: number, priceOrder: number, currencySymbol: string, isItemPage: boolean = false) {
    container.className += ' betterfloat-buffprice';
    let buffContainer = document.createElement('div');
    buffContainer.className = 'betterfloat-buff-container';
    buffContainer.style.display = 'flex';
    buffContainer.style.marginTop = '5px';
    buffContainer.style.alignItems = 'center';
    let buffImage = document.createElement('img');
    buffImage.setAttribute('src', runtimePublicURL + '/buff_favicon.png');
    buffImage.setAttribute('style', `height: 20px; margin-right: 5px; ${isItemPage ? 'margin-bottom: 1px;' : ''}`);
    buffContainer.appendChild(buffImage);
    let buffPrice = document.createElement('div');
    buffPrice.setAttribute('class', 'suggested-price betterfloat-buffprice');
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
    let buffPriceDivider = document.createElement('span');
    buffPriceDivider.setAttribute('style', 'color: gray;margin: 0 3px 0 3px;');
    buffPriceDivider.textContent = '|';
    buffPrice.appendChild(buffPriceDivider);
    let buffPriceAsk = document.createElement('span');
    buffPriceAsk.setAttribute('style', 'color: greenyellow;');
    buffPriceAsk.textContent = `Ask ${currencySymbol}${priceListing.toFixed(2)}`;
    buffPrice.appendChild(buffPriceAsk);
    buffContainer.appendChild(buffPrice);
    if (extensionSettings.spSteamPrice || isItemPage) {
        let divider = document.createElement('div');
        container.after(buffContainer);
        container.after(divider);
    } else {
        container.replaceWith(buffContainer);
    }
}

async function addBuffPrice(item: Skinport.Listing, container: Element): Promise<any> {
    await loadMapping();
    let { buff_name, priceListing, priceOrder } = await getBuffPrice(item);
    let buff_id = await getBuffMapping(buff_name);

    let tooltipLink = <HTMLElement>container.querySelector('.ItemPreview-priceValue')?.firstChild;
    const currencySymbol = tooltipLink.textContent?.charAt(0);
    let priceDiv = container.querySelector('.ItemPreview-oldPrice');
    if (priceDiv && !container.querySelector('.betterfloat-buffprice')) {
        generateBuffContainer(priceDiv as HTMLElement, priceListing, priceOrder, currencySymbol ?? '$');
    }

    const buffHref = buff_id > 0 ? `https://buff.163.com/goods/${buff_id}` : `https://buff.163.com/market/csgo#tab=selling&page_num=1&search=${encodeURIComponent(buff_name)}`;
    if (extensionSettings.spBuffLink == 'action') {
        const presentationDiv = container.querySelector('.ItemPreview-mainAction');
        if (presentationDiv) {
            let buffLink = document.createElement('a');
            buffLink.className = 'ItemPreview-sideAction betterskinport-bufflink';
            buffLink.style.width = '60px';
            buffLink.target = '_blank';
            buffLink.innerText = 'Buff';
            buffLink.href = buffHref;
            if (!presentationDiv.querySelector('.betterskinport-bufflink')) {
                presentationDiv.after(buffLink);
            }
        }
    } else {
        const buffContainer = container.querySelector('.betterfloat-buff-container');
        if (buffContainer) {
            (<HTMLElement>buffContainer).onclick = (e: Event) => {
                e.stopPropagation();
                e.preventDefault();
                window.open(buffHref, '_blank');
            };
        }
    }

    if (extensionSettings.spBuffDifference) {
        const difference = item.price - (extensionSettings.spPriceReference == 1 ? priceListing : priceOrder);
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
    } else if (
        item.text.includes('Container') ||
        item.text.includes('Collectible') ||
        item.type.includes('Gift') ||
        item.type.includes('Key') ||
        item.type.includes('Pass') ||
        item.type.includes('Pin') ||
        item.type.includes('Tool')
    ) {
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
