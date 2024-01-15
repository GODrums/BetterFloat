import { ItemStyle } from '../@typings/FloatTypes';
import { Skinport } from '../@typings/SkinportTypes';
import { getBuffMapping, getFirstSpItem, getItemPrice, getSpCSRF, getSpMinOrderPrice, getSpPopupItem, getSpUserCurrencyRate, loadBuffMapping, loadMapping } from '../mappinghandler';
import { activateHandler } from '../eventhandler';
import { getAllSettings } from '../util/extensionsettings';
import { Euro, USDollar, createUrlListener, getBuffPrice, getFloatColoring, handleSpecialStickerNames, waitForElement } from '../util/helperfunctions';
import { genGemContainer, generateSpStickerContainer } from '../util/uigeneration';
import { Extension } from '../@typings/ExtensionTypes';
import { fetchCSBlueGem } from '../networkhandler';

import getSymbolFromCurrency from 'currency-symbol-map';
import Decimal from 'decimal.js';

async function init() {
    if (!location.hostname.includes('skinport.com')) {
        return;
    }

    console.log('[BetterFloat] Starting BetterFloat');
    console.time('[BetterFloat] Skinport init timer');
    // catch the events thrown by the script
    // this has to be done as first thing to not miss timed events
    activateHandler();

    extensionSettings = await getAllSettings();
    console.debug('[BetterFloat] Settings: ', extensionSettings);

    if (extensionSettings.enableSkinport && document.getElementsByClassName('Language').length > 0 && document.getElementsByClassName('CountryFlag--GB').length == 0) {
        console.warn('[BetterFloat] Skinport language has to be English for this extension to work. Aborting ...');
        createLanguagePopup();
        return;
    }

    console.group('[BetterFloat] Loading mappings...');
    await loadMapping();
    await loadBuffMapping();
    console.groupEnd();

    console.timeEnd('[BetterFloat] Skinport init timer');

    createLiveLink();

    await firstLaunch();

    // mutation observer is only needed once
    if (!isObserverActive) {
        isObserverActive = true;
        await applyMutation();
        console.log('[BetterFloat] Observer started');
    }
}

async function firstLaunch() {
    if (!extensionSettings.enableSkinport) return;

    const path = location.pathname;

    console.log('[BetterFloat] First launch, url:', path);
    if (path == '/') {
        const popularLists = Array.from(document.querySelectorAll('.PopularList'));
        for (const list of popularLists) {
            await handlePopularList(list);
        }
    } else if (path.startsWith('/market')) {
        const catalogItems = Array.from(document.querySelectorAll('.CatalogPage-item'));
        for (const item of catalogItems) {
            await adjustItem(item);
        }
        if (location.search.includes('sort=date')) {
            await waitForElement('.CatalogHeader-tooltipLive');
            addLiveFilterMenu(document.querySelector('.CatalogHeader-tooltipLive') as Element);
        }
        if (location.search.includes('bf=live')) {
            (<HTMLButtonElement>document.querySelector('.LiveBtn'))?.click();
        }
    } else if (path.startsWith('/cart')) {
        const cartContainer = document.querySelector('.Cart-container');
        if (cartContainer) {
            await adjustCart(cartContainer);
        }
    } else if (path.startsWith('/item')) {
        const itemPage = Array.from(document.querySelectorAll('.ItemPage'));
        for (const item of itemPage) {
            await adjustItemPage(item);
        }
    } else if (path.startsWith('/myitems/')) {
        const inventoryItems = Array.from(document.querySelectorAll('.InventoryPage-item'));
        for (const item of inventoryItems) {
            await adjustItem(item);
        }
    } else if (path.startsWith('/checkout/confirmation')) {
        const cartItems = Array.from(document.querySelectorAll('.CheckoutConfirmation-item'));
        for (const item of cartItems) {
            await adjustItem(item);
        }
    }
}

function createLiveLink() {
    const generateLink = () => {
        const marketLink = <HTMLElement>document.querySelector('.HeaderContainer-link--market');
        if (!marketLink || document.querySelector('.betterfloat-liveLink')) return;
        marketLink.style.marginRight = '30px';
        const liveLink = marketLink.cloneNode(true) as HTMLAnchorElement;
        liveLink.setAttribute('href', '/market?sort=date&order=desc&bf=live');
        liveLink.setAttribute('class', 'HeaderContainer-link HeaderContainer-link--market betterfloat-liveLink');
        liveLink.textContent = 'Live';
        marketLink.after(liveLink);
    };

    generateLink();

    createUrlListener(() => {
        if (!document.querySelector('.betterfloat-liveLink')) {
            generateLink();
        }
    });
}

function createLanguagePopup() {
    const popupOuter = document.createElement('div');
    popupOuter.className = 'betterfloat-popup-outer';
    popupOuter.style.backdropFilter = 'blur(2px)';
    popupOuter.style.fontSize = '16px';
    const popup = document.createElement('div');
    popup.className = 'betterfloat-popup-language';
    const popupHeaderDiv = document.createElement('div');
    popupHeaderDiv.style.display = 'flex';
    popupHeaderDiv.style.alignItems = 'center';
    popupHeaderDiv.style.justifyContent = 'space-between';
    popupHeaderDiv.style.margin = '0 10px';
    const warningIcon = document.createElement('img');
    warningIcon.src = extensionSettings.runtimePublicURL + '/triangle-exclamation-solid.svg';
    warningIcon.style.width = '32px';
    warningIcon.style.height = '32px';
    warningIcon.style.filter = 'brightness(0) saturate(100%) invert(42%) sepia(99%) saturate(1934%) hue-rotate(339deg) brightness(101%) contrast(105%)';
    const popupHeaderText = document.createElement('h2');
    popupHeaderText.style.fontWeight = '700';
    popupHeaderText.textContent = 'Warning: Language not supported';
    const closeButton = document.createElement('a');
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
    const popupText = document.createElement('p');
    popupText.style.marginTop = '30px';
    popupText.textContent =
        "BetterFloat currently only supports the English language on Skinport. If you prefer to pass on most of BetterFloat's features on Skinport, please disable the 'Buff Price Calculation'-feature in the extension settings.";
    const buttonDiv = document.createElement('div');
    buttonDiv.style.display = 'flex';
    buttonDiv.style.justifyContent = 'center';
    const changeLanguageButton = document.createElement('button');
    changeLanguageButton.type = 'button';
    changeLanguageButton.className = 'betterfloat-language-button';
    changeLanguageButton.textContent = 'Change language';
    changeLanguageButton.onclick = () => {
        (<HTMLButtonElement>document.querySelector('.Dropdown-button')).click();
        (<HTMLButtonElement>document.querySelector('.Dropdown-dropDownItem')).click();
    };
    buttonDiv.appendChild(changeLanguageButton);
    popup.appendChild(popupHeaderDiv);
    popup.appendChild(popupText);
    popup.appendChild(buttonDiv);
    popupOuter.appendChild(popup);
    document.body.appendChild(popupOuter);
}

async function applyMutation() {
    const observer = new MutationObserver(async (mutations) => {
        if (extensionSettings.enableSkinport) {
            for (const mutation of mutations) {
                for (let i = 0; i < mutation.addedNodes.length; i++) {
                    const addedNode = mutation.addedNodes[i];
                    // some nodes are not elements, so we need to check
                    if (!(addedNode instanceof HTMLElement)) continue;

                    if (addedNode.className) {
                        const className = addedNode.className.toString();
                        if (className.includes('CatalogPage-item') || className.includes('InventoryPage-item') || className.includes('CheckoutConfirmation-item') || className.includes('ItemList-item')) {
                            await adjustItem(addedNode);
                        } else if (className.includes('Cart-container')) {
                            await adjustCart(addedNode);
                        } else if (className.includes('ItemPage')) {
                            await adjustItemPage(addedNode);
                        } else if (className.includes('PopularList')) {
                            await handlePopularList(addedNode);
                        } else if (className.includes('CatalogHeader-tooltipLive')) {
                            // contains live button
                            addLiveFilterMenu(addedNode);
                        } else if (className.includes('CartButton-tooltip')) {
                            autoCloseTooltip(addedNode);
                        } else if (className.includes('Message')) {
                            // contains 'item has been sold' message
                        }
                    }
                }
            }
        }
    });
    observer.observe(document, { childList: true, subtree: true });
}

function autoCloseTooltip(container: Element) {
    if (!extensionSettings.spAutoclosePopup) return;
    let counterValue = 5;

    // add counter to tooltip container
    const links = container.querySelector('.CartButton-tooltipLinks');
    if (!links) return;
    const counter = document.createElement('div');
    counter.style.marginLeft = '40px';
    const counterText = document.createElement('span');
    counterText.textContent = 'Auto-close in ';
    counter.appendChild(counterText);
    const counterNumber = document.createElement('span');
    counterNumber.className = 'betterfloat-tooltip-counter';
    counterNumber.textContent = String(counterValue) + 's';
    counter.appendChild(counterText);
    counter.appendChild(counterNumber);
    links.appendChild(counter);

    // start counter
    const interval = setInterval(() => {
        counterNumber.textContent = String(--counterValue) + 's';
        if (counterValue == 0) {
            clearInterval(interval);
            (<HTMLButtonElement>links.querySelector('button.ButtonSimple')).click();
        }
    }, 1000);
}

function addLiveFilterMenu(container: Element) {
    const filterDiv = document.createElement('div');

    const filterPopup = document.createElement('div');
    filterPopup.className = 'betterfloat-filterpopup';
    const popupHeader = document.createElement('h3');
    popupHeader.textContent = 'ITEM FILTER';
    popupHeader.style.fontWeight = '600';
    popupHeader.style.fontSize = '18px';
    popupHeader.style.lineHeight = '0.5';
    popupHeader.style.marginTop = '20px';
    const popupSubHeader = document.createElement('h4');
    popupSubHeader.style.fontSize = '16px';
    popupSubHeader.style.color = '#828282';
    popupSubHeader.textContent = 'by BetterFloat';
    const popupCloseButton = document.createElement('button');
    popupCloseButton.type = 'button';
    popupCloseButton.className = 'betterfloat-filterpopup-close';
    popupCloseButton.textContent = 'x';
    popupCloseButton.onclick = () => {
        filterPopup.style.display = 'none';
    };
    const popupContent = document.createElement('div');
    popupContent.className = 'betterfloat-filterpopup-content';
    const popupHorizonalDiv = document.createElement('div');
    popupHorizonalDiv.style.display = 'flex';
    popupHorizonalDiv.style.justifyContent = 'space-between';
    popupHorizonalDiv.style.marginTop = '5px';
    const popupPriceDiv = document.createElement('div');
    popupPriceDiv.style.display = 'flex';
    popupPriceDiv.style.flexDirection = 'column';
    popupPriceDiv.style.alignItems = 'center';
    popupPriceDiv.style.marginRight = '10px';
    popupPriceDiv.style.padding = '0 20px';
    const popupPriceLabel = document.createElement('label');
    popupPriceLabel.textContent = 'PRICE';
    popupPriceLabel.style.fontWeight = '600';
    popupPriceLabel.style.margin = '5px 0';
    const popupPriceLow = document.createElement('input');
    popupPriceLow.style.fontSize = '15px';
    popupPriceLow.type = 'number';
    popupPriceLow.min = '0';
    popupPriceLow.max = '999999';
    popupPriceLow.step = '0.01';
    popupPriceLow.value = extensionSettings.spFilter.priceLow.toString();
    const popupPriceHigh = popupPriceLow.cloneNode() as HTMLInputElement;
    popupPriceHigh.value = extensionSettings.spFilter.priceHigh.toString();
    const popupPriceDivider = document.createElement('span');
    popupPriceDivider.textContent = '-';
    popupPriceDiv.appendChild(popupPriceLabel);
    popupPriceDiv.appendChild(popupPriceLow);
    popupPriceDiv.appendChild(popupPriceDivider);
    popupPriceDiv.appendChild(popupPriceHigh);
    const popupNameDiv = document.createElement('div');
    popupNameDiv.style.display = 'flex';
    popupNameDiv.style.flexDirection = 'column';
    popupNameDiv.style.alignItems = 'flex-start';
    const popupNameLabel = document.createElement('label');
    popupNameLabel.style.fontWeight = '600';
    popupNameLabel.textContent = 'NAME';
    popupNameLabel.style.margin = '5px 0';
    const popupNameInput = document.createElement('input');
    popupNameInput.type = 'text';
    popupNameInput.value = extensionSettings.spFilter.name;
    popupNameInput.style.fontSize = '15px';
    popupNameDiv.appendChild(popupNameLabel);
    popupNameDiv.appendChild(popupNameInput);
    const popupTypeDiv = document.createElement('div');
    popupTypeDiv.style.display = 'flex';
    popupTypeDiv.style.flexDirection = 'column';
    popupTypeDiv.style.alignItems = 'flex-start';
    const typeContainerHeader = document.createElement('label');
    typeContainerHeader.textContent = 'TYPE';
    typeContainerHeader.style.fontWeight = '600';
    typeContainerHeader.style.margin = '5px 0';
    popupTypeDiv.appendChild(typeContainerHeader);
    const types = ['Knife', 'Gloves', 'Agent', 'Weapon', 'Collectible', 'Container', 'Sticker'];
    for (const type of types) {
        const typeDiv = document.createElement('div');
        typeDiv.style.display = 'flex';
        typeDiv.style.alignItems = 'center';
        typeDiv.style.margin = '0 0 3px 5px';
        const typeLabel = document.createElement('label');
        typeLabel.textContent = type;
        typeLabel.style.marginRight = '5px';
        typeLabel.style.fontSize = '15px';
        const typeCheckbox = document.createElement('input');
        typeCheckbox.type = 'checkbox';
        typeCheckbox.value = type;
        typeCheckbox.checked = !extensionSettings.spFilter.types.includes(type);
        typeDiv.appendChild(typeCheckbox);
        typeDiv.appendChild(typeLabel);
        popupTypeDiv.appendChild(typeDiv);
    }
    const popupButtonDiv = document.createElement('div');
    popupButtonDiv.className = 'betterfloat-filterpopup-buttondiv';
    const popupSaveButton = document.createElement('button');
    popupSaveButton.type = 'button';
    popupSaveButton.textContent = 'Save';
    popupSaveButton.onclick = () => {
        extensionSettings.spFilter.priceLow = parseFloat(popupPriceLow.value);
        extensionSettings.spFilter.priceHigh = parseFloat(popupPriceHigh.value);
        extensionSettings.spFilter.name = popupNameInput.value;
        const typeCheckboxes = popupTypeDiv.querySelectorAll('input[type=checkbox]');
        extensionSettings.spFilter.types = Array.from(typeCheckboxes)
            .filter((el) => !(<HTMLInputElement>el).checked)
            .map((el) => (<HTMLInputElement>el).value);
        console.debug('[BetterFloat] New filter settings: ', extensionSettings.spFilter);
        chrome.storage.local.set({ spFilter: extensionSettings.spFilter });
        filterPopup.style.display = 'none';
    };
    popupButtonDiv.appendChild(popupSaveButton);
    filterPopup.appendChild(popupHeader);
    filterPopup.appendChild(popupSubHeader);
    filterPopup.appendChild(popupCloseButton);
    popupHorizonalDiv.appendChild(popupTypeDiv);
    popupHorizonalDiv.appendChild(popupPriceDiv);
    popupContent.appendChild(popupNameDiv);
    popupContent.appendChild(popupHorizonalDiv);
    filterPopup.appendChild(popupContent);
    filterPopup.appendChild(popupButtonDiv);

    const filterButton = document.createElement('button');
    const filterIcon = document.createElement('img');
    filterIcon.src = extensionSettings.runtimePublicURL + '/filter-solid.svg';
    filterIcon.style.width = '24px';
    filterIcon.style.height = '24px';
    filterIcon.style.filter = 'brightness(0) saturate(100%) invert(100%) sepia(0%) saturate(7461%) hue-rotate(14deg) brightness(94%) contrast(106%)';
    filterButton.style.marginRight = '25px';
    filterButton.appendChild(filterIcon);
    filterButton.onclick = () => {
        filterPopup.style.display = 'block';
    };

    filterDiv.appendChild(filterPopup);
    filterDiv.appendChild(filterButton);
    container.before(filterDiv);
}

async function handlePopularList(list: Element) {
    if (list.querySelector('h3')?.textContent?.includes('Counter-Strike')) {
        const popularItems = Array.from(list.querySelectorAll('.PopularList-item'));
        for (const item of popularItems) {
            await adjustItem(item);
        }
    }
}

async function adjustItemPage(container: Element) {
    const itemRating = container.querySelector('.ItemPage-rating');
    if (itemRating) {
        itemRating.remove();
    }

    const btnGroup = container.querySelector('.ItemPage-btnGroup');
    if (!btnGroup) return;
    const newGroup = document.createElement('div');
    newGroup.className = btnGroup.className ?? newGroup.className;
    // if an item is sold, the original links are unclickable, hence we reproduce them
    const links = container.querySelectorAll('.ItemPage-link');
    const linkSteam = (Array.from(links).find((el) => el.innerHTML.includes('Steam')) as HTMLAnchorElement | null)?.href;
    const linkInspect = (Array.from(links).find((el) => el.innerHTML.includes('Inspect')) as HTMLAnchorElement | null)?.href;
    if (linkInspect) {
        const inspectButton = document.createElement('button');
        inspectButton.onclick = () => {
            window.open(`https://swap.gg/screenshot?inspectLink=${linkInspect}`);
        };
        inspectButton.type = 'button';
        inspectButton.textContent = 'Swap.gg';
        newGroup.appendChild(inspectButton);
    }
    if (linkSteam) {
        const steamButton = document.createElement('button');
        steamButton.onclick = () => {
            window.open(linkSteam, '_blank');
        };
        steamButton.type = 'button';
        steamButton.textContent = 'Steam';
        newGroup.appendChild(steamButton);
    }

    const item = getSkinportItem(container, itemSelectors.page);
    if (!item) return;
    const { buff_name, priceListing, priceOrder } = await calculateBuffPrice(item);
    const buffid = await getBuffMapping(buff_name);
    const buffLink = buffid > 0 ? `https://buff.163.com/goods/${buffid}` : `https://buff.163.com/market/csgo#tab=selling&page_num=1&search=${encodeURIComponent(buff_name)}`;

    const buffButton = document.createElement('button');
    buffButton.onclick = () => {
        window.open(buffLink, '_blank');
    };
    buffButton.type = 'button';
    buffButton.textContent = 'Buff';
    newGroup.appendChild(buffButton);
    btnGroup.after(newGroup);

    const suggestedContainer = container.querySelector('.ItemPage-suggested');
    if (suggestedContainer) {
        generateBuffContainer(suggestedContainer as HTMLElement, priceListing, priceOrder, item.currency, true);
    }

    const buffContainer = container.querySelector('.betterfloat-buff-container');
    if (buffContainer) {
        (<HTMLElement>buffContainer).onclick = (e: Event) => {
            e.stopPropagation();
            e.preventDefault();
            window.open(buffLink, '_blank');
        };
    }

    const difference = item.price - (extensionSettings.spPriceReference == 0 ? priceOrder : priceListing);
    const priceContainer = <HTMLElement>container.querySelector('.ItemPage-price');
    if (priceContainer) {
        const newContainer = document.createElement('div');
        const saleTag = document.createElement('span');
        newContainer.className = 'ItemPage-discount betterfloat-discount-container';
        newContainer.style.background = `linear-gradient(135deg,#0073d5,${
            difference == 0 ? extensionSettings.colors.skinport.neutral : difference < 0 ? extensionSettings.colors.skinport.profit : extensionSettings.colors.skinport.loss
        })`;
        newContainer.style.transform = 'skewX(-15deg)';
        newContainer.style.borderRadius = '3px';
        newContainer.style.paddingTop = '2px';
        saleTag.style.margin = '5px';
        saleTag.style.fontWeight = '700';
        saleTag.textContent = difference == 0 ? `-${item.currency}0` : (difference > 0 ? '+' : '-') + item.currency + Math.abs(difference).toFixed(2);
        newContainer.appendChild(saleTag);
        priceContainer.appendChild(newContainer);
    }

    if (extensionSettings.spStickerPrices) {
        await addStickerInfo(container, item, itemSelectors.page, difference, true);
    }

    await addFloatColoring(container, item);

    const popupItem = getSpPopupItem();
    if (popupItem) {
        if (extensionSettings.spBlueGem) {
            await caseHardenedDetection(container, popupItem.data.item);
        }
        const suggestedText = container.querySelector('.ItemPage-suggested');
        if (suggestedText) {
            const currencySymbol = getSymbolFromCurrency(popupItem.data.item.currency);
            const lowPrice = new Decimal(popupItem.data.offers.lowPrice).div(100).toDP(2).toNumber();
            suggestedText.innerHTML += `<br>Lowest on Skinport: ${(currencySymbol == '€' ? Euro.format(lowPrice) : currencySymbol == '$' ? USDollar.format(lowPrice) : currencySymbol + ' ' + lowPrice)} (${popupItem.data.offers.offerCount} offers)`;
        }
    }

    const embeddedItems = Array.from(document.querySelectorAll('.ItemList-item'));
    for (const item of embeddedItems) {
        await adjustItem(item);
    }
}

async function adjustCart(container: Element) {
    if (extensionSettings.spCheckBoxes) {
        const checkboxes = Array.from(container.querySelectorAll('.Checkbox-input'));
        for (const checkbox of checkboxes) {
            (checkbox as HTMLInputElement).click();
            await new Promise((r) => setTimeout(r, 50)); // to avoid bot detection
        }
    }
}

async function adjustItem(container: Element) {
    const item = getSkinportItem(container, itemSelectors.preview);
    if (!item) return;

    storeItem(container, item);

    const filterItem = document.querySelector('.LiveBtn')?.className.includes('--isActive') ? applyFilter(item) : false;
    if (filterItem) {
        console.log('[BetterFloat] Filtered item: ', item.name);
        (<HTMLElement>container).style.display = 'none';
        return;
    }

    if (item.type == 'Key') {
        return;
    }
    const priceResult = await addBuffPrice(item, container);
    if (location.pathname.startsWith('/market')) {
        addInstantOrder(item, container);
    }

    if (extensionSettings.spStickerPrices) {
        await addStickerInfo(container, item, itemSelectors.preview, priceResult.price_difference);
    }
    if (extensionSettings.floatColoring.skinport) {
        await addFloatColoring(container, item);
    }

    let cachedItem = getFirstSpItem();
    if (cachedItem) {
        if (cachedItem.name != item.name) {
            console.log('[BetterFloat] Item name mismatch:', item.name, cachedItem.name);
            return;
        }
        // console.log('[BetterFloat] Cached item: ', cachedItem);

        if (extensionSettings.spBlueGem && cachedItem.marketHashName.includes('Case Hardened') && cachedItem.category == 'Knife') {
            await addBlueBadge(container, cachedItem);
        }
    }
}

function storeItem(container: Element, item: Skinport.Listing) {
    container.className += ' sale-' + item.saleId;
    container.setAttribute('data-betterfloat', JSON.stringify(item));
}

export async function patternDetections(container: Element, item: Skinport.Item) {
    if (item.name.includes('Case Hardened')) {
        await caseHardenedDetection(container, item);
    } else if ((item.name.includes('Crimson Web') || item.name.includes('Emerald Web')) && item.name.startsWith('★')) {
        await webDetection(container, item);
    }
}

// eslint-disable-next-line @typescript-eslint/no-unused-vars
export async function webDetection(container: Element, item: Skinport.Item) {
    const itemHeader = container.querySelector('.TradeLock-lock');
    if (!itemHeader) return;
}

export async function addBlueBadge(container: Element, item: Skinport.Item) {
    let { patternElement } = await fetchCSBlueGem(item.subCategory, item.pattern);
    const itemHeader = container.querySelector('.TradeLock-lock');
    if (!itemHeader) return;
    const gemContainer = genGemContainer(extensionSettings.runtimePublicURL, patternElement, 'right');
    gemContainer.style.fontSize = '11px';
    gemContainer.style.fontWeight = '600';
    (<HTMLElement>itemHeader.parentElement).style.justifyContent = 'space-between';
    itemHeader.after(gemContainer);
}

async function caseHardenedDetection(container: Element, item: Skinport.Item) {
    if (!item.name.includes('Case Hardened')) return;

    // santized for CSBlueGem's supported currencies, otherwise use USD
    const sanitizedCurrency = (currency: string) => {
        return ['CNY', 'USD', 'EUR', 'JPY', 'GBP', 'AUD', 'CAD'].includes(currency) ? currency : 'CNY';
    };
    const usedCurrency = sanitizedCurrency(item.currency);
    const currencySymbol = getSymbolFromCurrency(usedCurrency);
    let { patternElement, pastSales } = await fetchCSBlueGem(item.subCategory, item.pattern, usedCurrency);

    const itemHeader = container.querySelector('.ItemPage-itemHeader');
    if (!itemHeader) return;
    itemHeader.appendChild(genGemContainer(extensionSettings.runtimePublicURL, patternElement));

    const linksContainer = container.querySelector('.ItemHistory-links');
    if (!linksContainer) return;
    const patternLink = <HTMLElement>linksContainer.lastElementChild!.cloneNode(true);
    patternLink.id = 'react-tabs-6';
    patternLink.setAttribute('aria-controls', 'react-tabs-7');
    patternLink.textContent = `Buff Pattern Sales (${pastSales?.length ?? 0})`;
    patternLink.style.color = 'deepskyblue';

    const itemHistory = container.querySelector('.ItemHistory');
    if (!itemHistory || !itemHistory.lastElementChild) return;
    const tableTab = <HTMLElement>itemHistory.lastElementChild.cloneNode(false);
    tableTab.id = 'react-tabs-7';
    tableTab.setAttribute('aria-labelledby', 'react-tabs-6');
    let tableHeader = `<div class="ItemHistoryList-header"><div>Source</div><div>Date</div><div>Float Value</div><div>Price</div><div><a href="https://csbluegem.com/search?skin=${item.subCategory}&pattern=${item.pattern}&currency=CNY&filter=date&sort=descending" target="_blank"><img src="${extensionSettings.runtimePublicURL}/arrow-up-right-from-square-solid.svg" style="height: 18px; filter: brightness(0) saturate(100%) invert(100%) sepia(0%) saturate(7461%) hue-rotate(14deg) brightness(94%) contrast(106%); margin-right: 18px;"></a></div></div>`;
    let tableBody = '';
    for (const sale of pastSales ?? []) {
        tableBody += `<div class="ItemHistoryList-row"${
            Math.abs(item.wear - sale.float) < 0.00001 ? ' style="background-color: darkslategray;"' : ''
        }><div class="ItemHistoryList-col" style="width: 25%;"><img style="height: 24px;" src="${
            extensionSettings.runtimePublicURL + (sale.origin == 'CSFloat' ? '/csfloat_logo.png' : '/buff_favicon.png')
        }"></img></div><div class="ItemHistoryList-col" style="width: 24%;">${sale.date}</div><div class="ItemHistoryList-col" style="width: 27%;">${
            sale.isStattrak ? '<span class="ItemPage-title" style="color: rgb(134, 80, 172);">★ StatTrak™</span>' : ''
        }${sale.float}</div><div class="ItemHistoryList-col" style="width: 24%;">${
            currencySymbol == '€' ? Euro.format(sale.price) : currencySymbol == '$' ? USDollar.format(sale.price) : currencySymbol + ' ' + sale.price
        }</div><div><a ${
            sale.url == 'No Link Available'
                ? 'style="pointer-events: none;cursor: default;"><img src="' +
                  extensionSettings.runtimePublicURL +
                  '/ban-solid.svg" style="filter: brightness(0) saturate(100%) invert(44%) sepia(56%) saturate(7148%) hue-rotate(359deg) brightness(102%) contrast(96%);'
                : 'href="' +
                  (!isNaN(Number(sale.url)) ? 'https://s.csgofloat.com/' + sale.url + '-front.png' : sale.url) +
                  '" target="_blank"><img src="' +
                  extensionSettings.runtimePublicURL +
                  '/camera-solid.svg" style="translate: 0px 1px; filter: brightness(0) saturate(100%) invert(73%) sepia(57%) saturate(1739%) hue-rotate(164deg) brightness(92%) contrast(84%); margin-right: 5px;'
        }height: 20px;"></img></a></div></div>`;
    }
    let tableHTML = `<div class="ItemHistoryList">${tableHeader}${tableBody}</div>`;
    tableTab.innerHTML = tableHTML;
    itemHistory?.appendChild(tableTab);

    patternLink.onclick = () => {
        let currActive = document.querySelector('.ItemHistory-link.active');
        if (currActive) {
            currActive.classList.remove('active');
            currActive.setAttribute('aria-selected', 'false');
        }
        patternLink.classList.add('active');
        patternLink.setAttribute('aria-selected', 'true');

        document.querySelector('.ItemHistory-tab.active')?.classList.remove('active');
        tableTab.classList.add('active');
    };
    for (let child of Array.from(linksContainer.children)) {
        (<HTMLElement>child).onclick = () => {
            patternLink.classList.remove('active');
            patternLink.setAttribute('aria-selected', 'false');
            tableTab.classList.remove('active');

            document.querySelector('.ItemHistory-link.active')?.classList.remove('active');
            document.querySelector('.ItemHistory-tab.active')?.classList.remove('active');
            child.classList.add('active');
            document.querySelector(`#${child.getAttribute('aria-controls')}`)?.classList.add('active');
        };
    }
    linksContainer.appendChild(patternLink);
}

// true: remove item, false: display item
function applyFilter(item: Skinport.Listing) {
    const targetName = extensionSettings.spFilter.name.toLowerCase();
    // if true, item should be filtered
    const nameCheck = targetName != '' && !(item.type + ' | ' + item.name).toLowerCase().includes(targetName);
    const priceCheck = item.price < extensionSettings.spFilter.priceLow || item.price > extensionSettings.spFilter.priceHigh;
    const typeCheck = extensionSettings.spFilter.types.includes(item.category);
    return nameCheck || priceCheck || typeCheck;
}

async function addStickerInfo(container: Element, item: Skinport.Listing, selector: ItemSelectors, price_difference: number, isItemPage = false) {
    if (item.text.includes('Agent')) return;
    const itemInfoDiv = container.querySelector(selector.info);
    const stickers = item.stickers;
    if (item.stickers.length == 0 || item.text.includes('Souvenir')) {
        return;
    }
    const stickerPrices = await Promise.all(stickers.map(async (s) => await getItemPrice(s.name)));
    const priceSum = stickerPrices.reduce((a, b) => a + b.starting_at, 0);
    const spPercentage = price_difference / priceSum;

    // don't display SP if total price is below $1
    if (itemInfoDiv && priceSum >= 2) {
        if (isItemPage) {
            const wrapperDiv = document.createElement('div');
            wrapperDiv.style.display = 'flex';
            const h3 = itemInfoDiv.querySelector('.ItemPage-h3')?.cloneNode(true);
            if (h3 && itemInfoDiv.firstChild) {
                itemInfoDiv.removeChild(itemInfoDiv.firstChild);
                wrapperDiv.appendChild(h3);
            }
            wrapperDiv.appendChild(generateSpStickerContainer(priceSum, spPercentage, true));
            itemInfoDiv.firstChild?.before(wrapperDiv);
        } else {
            itemInfoDiv.before(generateSpStickerContainer(priceSum, spPercentage));
        }
    }
}

async function addFloatColoring(container: Element, item: Skinport.Listing) {
    const floatContainer = container.querySelector('.WearBar-value');
    if (!floatContainer) return;

    (<HTMLElement>floatContainer).style.color = getFloatColoring(item.wear);
}

const itemSelectors = {
    preview: {
        name: '.ItemPreview-itemName',
        title: '.ItemPreview-itemTitle',
        text: '.ItemPreview-itemText',
        stickers: '.ItemPreview-stickers',
        price: '.ItemPreview-price',
        info: '.ItemPreview-itemInfo',
    },
    page: {
        name: '.ItemPage-name',
        title: '.ItemPage-title',
        text: '.ItemPage-text',
        stickers: '.ItemPage-include',
        price: '.ItemPage-price',
        info: '.ItemPage-include',
    },
} as const;

type ItemSelectors = (typeof itemSelectors)[keyof typeof itemSelectors];

function getSkinportItem(container: Element, selector: ItemSelectors): Skinport.Listing | null {
    const name = container.querySelector(selector.name)?.textContent?.trim() ?? '';
    if (name == '') {
        return null;
    }

    let priceText = container.querySelector(selector.price + ' .Tooltip-link')?.textContent?.trim() ?? '';
    let currency = '';
    // regex also detects &nbsp as whitespace!
    if (priceText.split(/\s/).length > 1) {
        // format: "1 696,00 €" -> Skinport uses &nbsp instead of whitespaces in this format!
        let parts = priceText.replace(',', '').replace('.', '').split(/\s/);
        priceText = String(Number(parts.filter((x) => !isNaN(+x)).join('')) / 100);
        currency = parts.filter((x) => isNaN(+x))[0];
    } else {
        // format: "€1,696.00"
        const firstDigit = Array.from(priceText).findIndex((x) => !isNaN(Number(x)));
        currency = priceText.substring(0, firstDigit);
        priceText = String(Number(priceText.substring(firstDigit).replace(',', '').replace('.', '')) / 100);
    }
    let price = Number(priceText);

    if (isNaN(price) || !isNaN(Number(currency))) {
        price = 0;
        currency = '';
    }

    const type = container.querySelector(selector.title)?.textContent ?? '';
    const text = container.querySelector(selector.text)?.innerHTML ?? '';
    // Skinport uses more detailed item types than Buff163, they are called categories here
    const lastWord = text.split(' ').pop() ?? '';
    let category = '';
    if (lastWord == 'Knife' || lastWord == 'Gloves' || lastWord == 'Agent') {
        category = lastWord;
    } else if (lastWord == 'Rifle' || lastWord == 'Pistol' || lastWord == 'SMG' || lastWord == 'Sniper' || lastWord == 'Shotgun' || lastWord == 'Machinegun') {
        category = 'Weapon';
    } else {
        category = type;
    }

    let style: ItemStyle = '';
    if (name.includes('Doppler')) {
        style = name.split('(')[1].split(')')[0] as ItemStyle;
    } else if (name.includes('Vanilla')) {
        style = 'Vanilla';
    }

    const stickers: { name: string }[] = [];
    const stickersDiv = container.querySelector(selector.stickers);
    if (stickersDiv) {
        for (const sticker of Array.from(stickersDiv.children)) {
            const stickerName = sticker.children[0]?.getAttribute('alt');
            if (stickerName) {
                stickers.push({
                    name: 'Sticker | ' + stickerName,
                });
            }
        }
    }
    const getWear = (wearDiv: HTMLElement) => {
        let wear = '';

        if (wearDiv) {
            const w = Number(wearDiv.innerHTML);
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
    const wearDiv = container.querySelector('.WearBar-value');
    const wear = wearDiv ? getWear(wearDiv as HTMLElement) : '';

    const saleId = Number(container.querySelector('.ItemPreview-link')?.getAttribute('href')?.split('/').pop() ?? 0);
    return {
        name: name,
        price: isNaN(price) ? 0 : price,
        type: type,
        category: category,
        text: text,
        stickers: stickers,
        style: style,
        wear: Number(wearDiv?.innerHTML),
        wear_name: wear,
        currency: currency,
        saleId: saleId,
    };
}

async function calculateBuffPrice(item: Skinport.Listing): Promise<{ buff_name: string; priceListing: number; priceOrder: number }> {
    const buff_name = handleSpecialStickerNames(createBuffName(item));
    let { priceListing, priceOrder } = await getBuffPrice(buff_name, item.style);

    //convert prices to user's currency
    const currencyRate = await getSpUserCurrencyRate(extensionSettings.skinportRates);
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

function generateBuffContainer(container: HTMLElement, priceListing: number, priceOrder: number, currencySymbol: string, isItemPage = false) {
    if (!isItemPage) {
        container.className += ' betterfloat-buffprice';
    }
    const buffContainer = document.createElement('div');
    buffContainer.className = 'betterfloat-buff-container';
    buffContainer.style.display = 'flex';
    buffContainer.style.marginTop = '5px';
    buffContainer.style.alignItems = 'center';
    const buffImage = document.createElement('img');
    buffImage.setAttribute('src', extensionSettings.runtimePublicURL + '/buff_favicon.png');
    buffImage.setAttribute('style', `height: 20px; margin-right: 5px; ${isItemPage ? 'margin-bottom: 1px;' : ''}`);
    buffContainer.appendChild(buffImage);
    const buffPrice = document.createElement('div');
    buffPrice.setAttribute('class', 'suggested-price betterfloat-buffprice');
    if (isItemPage) {
        buffPrice.style.fontSize = '18px';
    }
    const tooltipSpan = document.createElement('span');
    tooltipSpan.setAttribute('class', 'betterfloat-buff-tooltip');
    tooltipSpan.textContent = 'Bid: Highest buy order price; Ask: Lowest listing price';
    buffPrice.appendChild(tooltipSpan);
    const buffPriceBid = document.createElement('span');
    buffPriceBid.setAttribute('style', 'color: orange;');
    buffPriceBid.textContent = `Bid ${currencySymbol}${priceOrder.toFixed(2)}`;
    buffPrice.appendChild(buffPriceBid);
    const buffPriceDivider = document.createElement('span');
    buffPriceDivider.setAttribute('style', 'color: gray;margin: 0 3px 0 3px;');
    buffPriceDivider.textContent = '|';
    buffPrice.appendChild(buffPriceDivider);
    const buffPriceAsk = document.createElement('span');
    buffPriceAsk.setAttribute('style', 'color: greenyellow;');
    buffPriceAsk.textContent = `Ask ${currencySymbol}${priceListing.toFixed(2)}`;
    buffPrice.appendChild(buffPriceAsk);
    buffContainer.appendChild(buffPrice);
    if (priceOrder > priceListing * 1.1) {
        const warningImage = document.createElement('img');
        warningImage.setAttribute('src', extensionSettings.runtimePublicURL + '/triangle-exclamation-solid.svg');
        warningImage.setAttribute('style', `height: 20px; margin-left: 5px; filter: brightness(0) saturate(100%) invert(28%) sepia(95%) saturate(4997%) hue-rotate(3deg) brightness(103%) contrast(104%);${isItemPage ? 'margin-bottom: 1px;' : ''}`);
        buffContainer.appendChild(warningImage);
    }
    if (extensionSettings.spSteamPrice || isItemPage) {
        const divider = document.createElement('div');
        container.after(buffContainer);
        container.after(divider);
    } else {
        container.replaceWith(buffContainer);
    }
}

function showMessageBox(title: string, message: string, success = false) {
    // Thank you chatGPT for this function (and css)
    let messageContainer = document.querySelector('.MessageContainer');
    if (!messageContainer) {
        messageContainer = document.createElement('div');
        messageContainer.className = 'MessageContainer BetterFloat-OCO-Message';
        document.getElementById('root')?.appendChild(messageContainer);
    } else {
        messageContainer.className = 'MessageContainer BetterFloat-OCO-Message';
    }
    const messageInnerContainer = document.createElement('div');
    messageInnerContainer.className = 'Message Message--error Message-enter-done';
    messageContainer.appendChild(messageInnerContainer);

    // Create title element
    const titleElement = document.createElement('div');
    titleElement.className = 'Message-title';
    titleElement.textContent = title;
    if (success) {
        titleElement.style.color = '#66ff66';
    }

    if (message === 'MUST_LOGIN') {
        // custom messages for create order request
        message = 'You have to log in again.';
    } else if (message === 'RATE_LIMIT_REACHED') {
        message = 'You are ordering too fast!';
    } else if (message === 'CART_OUTDATED') {
        message = 'Your cart is outdated. Someone was probably faster than you.';
    } else if (message === 'CAPTCHA') {
        message = 'There was an error while ordering.';
    } else if (message === 'SALE_PRICE_CHANGED') {
        message = 'Item price got changed.';
    } else if (message === 'ITEM_NOT_LISTED') {
        message = 'The item you are trying to order is not listed (anymore).';
    }

    // Create message element
    const messageElement = document.createElement('div');
    messageElement.className = 'Message-text';
    messageElement.textContent = message;

    const messageButtons = document.createElement('div');
    messageButtons.className = 'Message-buttons';
    const messageCloseButton = document.createElement('button');
    messageCloseButton.type = 'button';
    messageCloseButton.className = 'Message-actionBtn Message-closeBtn';
    messageCloseButton.textContent = 'Close';

    const fadeOutEffect = () => {
        if (!messageContainer) return;
        (<HTMLElement>messageContainer).style.opacity = '0';
        setTimeout(() => {
            messageContainer!.replaceChildren();
            (<HTMLElement>messageContainer).style.opacity = '1';
        }, 500);
    };
    messageCloseButton.onclick = fadeOutEffect;

    messageButtons.appendChild(messageCloseButton);
    messageInnerContainer.appendChild(titleElement);
    messageInnerContainer.appendChild(messageElement);
    messageInnerContainer.appendChild(messageButtons);

    // Set a timeout to remove the message after 7 seconds
    setTimeout(fadeOutEffect, 6500);
}

async function solveCaptcha(saleId: Skinport.Listing['saleId']) {
    console.debug('[BetterFloat] Solving captcha.');
    if (!extensionSettings.ocoAPIKey || extensionSettings.ocoAPIKey == '') {
        showMessageBox(
            'Please set an API key first!',
            'Please set an API Key for OneClickBuy in the extension settings. You can get one on the BetterFloat Discord server. Aftwards reload the page and try again.'
        );
        console.debug('[BetterFloat] No API key provided');
        return false;
    }

    const headers = {
        authorization: extensionSettings.ocoAPIKey, // private API key, has to be customizable in UI
    };
    try {
        const captchaAPIUrl = 'https://api.gamingtechinsider.com/captcha/betterfloat/';
        const response = await fetch(captchaAPIUrl + saleId, {
            method: 'GET',
            headers: {
                ...headers,
                'Content-Type': 'application/json',
            },
        });
        const responseJson = await response.json();
        if (response.status === 200) {
            return responseJson.token;
        } else if (response.status === 401) {
            console.error('[BetterFloat] Checkout: Please check your API key for validity.');
            showMessageBox(
                'A problem with your API key occured (HTTP 401)',
                'Please check if you API key is set correctly in the extension settings. Otherwise please use the bot commands in the Discord server.'
            );
            return false;
        } else if (response.status === 408) {
            console.error('[BetterFloat] Checkout: Captcha solving timed out.');
            showMessageBox('Server timed out (HTTP 408)', 'Please try to order again.');
            return false;
        } else if (response.status === 429) {
            console.error('[BetterFloat] Checkout: Rate limit reached. No tokens available anymore.');
            showMessageBox('Too many requests (HTTP 429)', 'The rate limit has been reached. Your API key has no tokens left.');
            return false;
        } else if (response.status === 500) {
            console.error('[BetterFloat] Checkout: A internal server error occured.');
            showMessageBox('Server error (HTTP 500)', 'Timeout or internal server error. Please try again or check the Discord server for more information.');
            return false;
        } else {
            console.error('[BetterFloat] Checkout: Unkown error.');
            showMessageBox('Unkown error.', 'An unknown error has occured. Please try again or check the Discord server for more information.');
            return false;
        }
    } catch (error) {
        console.error('[BetterFloat] ', error);
        return false;
    }
}

async function orderItem(item: Skinport.Listing) {
    console.debug('[BetterFloat] Trying to order item ', item.saleId);
    const csrfToken = await getSpCSRF();
    const postData = encodeURI(`sales[0][id]=${item.saleId}&sales[0][price]=${(item.price * 100).toFixed(0)}&_csrf=${csrfToken}`);

    return await fetch('https://skinport.com/api/cart/add', {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: postData,
    })
        .then((response) => response.json())
        .then(async (response) => {
            if (response.success) {
                const captchaToken = await solveCaptcha(item.saleId);
                if (!captchaToken) {
                    return false;
                }
                console.debug('[BetterFloat] OCO addToCart was successful.');
                const postData = encodeURI(`sales[0]=${item.saleId}&cf-turnstile-response=${captchaToken}&_csrf=${csrfToken}`);
                return await fetch('https://skinport.com/api/checkout/create-order', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
                    body: postData,
                })
                    .then((response) => response.json())
                    .then(async (response) => {
                        if (response.success) {
                            return true;
                        } else {
                            console.debug(`[BetterFloat] OCO createOrder failed ${response.message}`);
                            showMessageBox('Failed to create the order', response.message);
                            // remove item from cart again
                            await fetch('https://skinport.com/api/cart/remove', {
                                method: 'POST',
                                headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
                                body: encodeURI(`item=${item.saleId}&_csrf=${csrfToken}`),
                            });
                            return false;
                        }
                    });
            } else {
                console.debug(`[BetterFloat] OCO addToCart failed ${response.message}`);
                // same message as Skinport would show on 'ADD TO CART'
                showMessageBox('Item is sold or not listed', 'The item you try to add to the cart is not available anymore.');
                return false;
            }
        })
        .catch((error) => {
            console.warn('[BetterFloat] OCO - addToCart error:', error);
            return false;
        });
}

function addInstantOrder(item: Skinport.Listing, container: Element) {
    const presentationDiv = container.querySelector('.ItemPreview-mainAction');
    if (presentationDiv && item.price >= getSpMinOrderPrice() && extensionSettings.ocoAPIKey && extensionSettings.ocoAPIKey.length > 0) {
        const oneClickOrder = document.createElement('a');
        oneClickOrder.className = 'ItemPreview-sideAction betterskinport-oneClickOrder';
        oneClickOrder.style.borderRadius = '0';
        oneClickOrder.style.width = '60px';
        oneClickOrder.target = '_blank';
        oneClickOrder.innerText = 'Order';
        (<HTMLElement>oneClickOrder).onclick = (e: Event) => {
            e.stopPropagation();
            e.preventDefault();
            const currentCart = document.querySelector('.CartButton-count')?.textContent;
            const isLoggedOut = document.querySelector('.HeaderContainer-link--login') != null;
            if (isLoggedOut) {
                showMessageBox('You are not logged in', 'Please log in to Skinport before using BetterFloat\'s OneClickOrder.');
                return;
            }
            if (currentCart && Number(currentCart) > 0) {
                showMessageBox('Your cart is not empty', 'Please empty your cart before using OneClickOrder.');
                return;
            }
            if (container.closest('.ItemPreview-status') != null) {
                showMessageBox('Item is sold or not listed', 'The item you try to add to purchase is not available anymore.');
                return;
            }
            oneClickOrder.innerHTML = '<span class="loader"></span>';
            orderItem(item).then((result) => {
                oneClickOrder.innerText = 'Order';
                console.log('[BetterFloat] oneClickOrder result: ', result);
                if (result) {
                    showMessageBox('oneClickOrder', 'oneClickOrder was successful.', true);
                }
            });
        };

        if (!presentationDiv.querySelector('.betterskinport-oneClickOrder')) {
            presentationDiv.after(oneClickOrder);
        }
    }
}

async function addBuffPrice(item: Skinport.Listing, container: Element) {
    await loadMapping();
    const { buff_name, priceListing, priceOrder } = await calculateBuffPrice(item);
    const buff_id = await getBuffMapping(buff_name);

    const tooltipLink = <HTMLElement>container.querySelector('.ItemPreview-priceValue')?.firstChild;
    const priceDiv = container.querySelector('.ItemPreview-oldPrice');
    if (priceDiv && !container.querySelector('.betterfloat-buffprice')) {
        generateBuffContainer(priceDiv as HTMLElement, priceListing, priceOrder, item.currency);
    }

    const buffHref = buff_id > 0 ? `https://buff.163.com/goods/${buff_id}` : `https://buff.163.com/market/csgo#tab=selling&page_num=1&search=${encodeURIComponent(buff_name)}`;
    if (extensionSettings.spBuffLink == 'action') {
        const presentationDiv = container.querySelector('.ItemPreview-mainAction');
        if (presentationDiv) {
            const buffLink = document.createElement('a');
            buffLink.className = 'ItemPreview-sideAction betterskinport-bufflink';
            buffLink.style.borderRadius = '0';
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

    const difference = item.price - (extensionSettings.spPriceReference == 1 ? priceListing : priceOrder);
    if (extensionSettings.spBuffDifference) {
        let discountContainer = <HTMLElement>container.querySelector('.ItemPreview-discount');
        if (!discountContainer || !discountContainer.firstChild) {
            discountContainer = document.createElement('div');
            discountContainer.className = 'GradientLabel ItemPreview-discount';
            const newSaleTag = document.createElement('span');
            discountContainer.appendChild(newSaleTag);
            container.querySelector('.ItemPreview-priceValue')?.appendChild(discountContainer);
        }
        const saleTag = <HTMLElement>discountContainer.firstChild;
        if (item.price !== 0 && !isNaN(item.price) && saleTag && tooltipLink && !discountContainer.querySelector('.betterfloat-sale-tag')) {
            saleTag.className = 'sale-tag betterfloat-sale-tag';
            discountContainer.style.background = `linear-gradient(135deg,#0073d5,${
                difference == 0 ? extensionSettings.colors.skinport.neutral : difference < 0 ? extensionSettings.colors.skinport.profit : extensionSettings.colors.skinport.loss
            })`;
            let saleText: string;
            if (difference == 0) {
                saleText = `-${item.currency}0`;
            } else {
                const sign = difference > 0 ? '+' : '-';
                const percentage = extensionSettings.spShowBuffPercentageDifference ? (' (' + ((item.price / (extensionSettings.spPriceReference == 1 ? priceListing : priceOrder)) * 100).toFixed(2) + '%)') : '';
                saleText = `${sign}${item.currency}${Math.abs(difference).toFixed(2)}${percentage}`;
            }
            saleTag.textContent = saleText;
        }
    } else {
        if (container.querySelector('.sale-tag')) {
            (<HTMLElement>container.querySelector('.sale-tag')).className += 'betterfloat-sale-tag';
        }
    }

    return {
        price_difference: difference,
    };
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
        item.type.includes('Tool') ||
        item.type.includes('Tag')
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

let extensionSettings: Extension.Settings;
// mutation observer active?
let isObserverActive = false;
init();
