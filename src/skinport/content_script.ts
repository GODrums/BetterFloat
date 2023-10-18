import { ItemStyle } from '../@typings/FloatTypes';
import { Skinport } from '../@typings/SkinportTypes';
import { getBuffMapping, getItemPrice, getPriceMapping, getSpUserCurrencyRate, loadBuffMapping, loadMapping } from '../mappinghandler';
import { activateHandler } from '../eventhandler';
import { initSettings } from '../util/extensionsettings';
import { handleSpecialStickerNames, waitForElement } from '../util/helperfunctions';
import { generateSpStickerContainer } from '../util/uigeneration';
import { Extension } from '../@typings/ExtensionTypes';

async function init() {
    if (!location.hostname.includes('skinport.com')) {
        return;
    }

    console.log('[BetterFloat] Starting BetterFloat');
    console.time('[BetterFloat] Skinport init timer');
    // catch the events thrown by the script
    // this has to be done as first thing to not miss timed events
    activateHandler();

    extensionSettings = await initSettings();
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
            await addLiveFilterMenu(document.querySelector('.CatalogHeader-tooltipLive') as Element);
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
        const cartContainer = document.querySelector('.CheckoutConfirmation-item');
        if (cartContainer) {
            await adjustItem(cartContainer);
        }
    }
}

function createLiveLink() {
    const marketLink = <HTMLElement>document.querySelector('.HeaderContainer-link--market');
    if (!marketLink || document.querySelector('.betterfloat-liveLink')) return;
    marketLink.style.marginRight = '30px';
    const liveLink = marketLink.cloneNode(true) as HTMLAnchorElement;
    liveLink.setAttribute('href', '/market?sort=date&order=desc&bf=live');
    liveLink.setAttribute('class', 'HeaderContainer-link HeaderContainer-link--market betterfloat-liveLink');
    liveLink.textContent = 'Live';
    marketLink.after(liveLink);
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
    warningIcon.src = runtimePublicURL + '/triangle-exclamation-solid.svg';
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
                        if (className.includes('CatalogPage-item') || className.includes('InventoryPage-item') || className.includes('CheckoutConfirmation-item')) {
                            await adjustItem(addedNode);
                        } else if (className.includes('Cart-container')) {
                            await adjustCart(addedNode);
                        } else if (className == 'ItemPage') {
                            await adjustItemPage(addedNode);
                        } else if (className.includes('PopularList')) {
                            await handlePopularList(addedNode);
                        } else if (className.includes('CatalogHeader-tooltipLive')) {
                            // contains live button
                            addLiveFilterMenu(addedNode);
                        }
                    }
                }
            }
        }
    });
    observer.observe(document, { childList: true, subtree: true });
}

async function addLiveFilterMenu(container: Element) {
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
    filterIcon.src = runtimePublicURL + '/filter-solid.svg';
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
    if (list.querySelector('h3')?.textContent?.includes('CS2')) {
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
            window.open(linkInspect);
        };
        inspectButton.type = 'button';
        inspectButton.textContent = 'Inspect';
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
    console.log('[BetterFloat] Item: ', item);
    if (!item) return;
    const { buff_name: buff_name, priceListing, priceOrder } = await getBuffPrice(item);
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

    const tooltipLink = container.querySelector('.ItemPage-value .Tooltip-link');
    if (!tooltipLink) return;
    const currencySymbol = getCurrencySymbol(tooltipLink);
    const suggestedContainer = container.querySelector('.ItemPage-suggested');
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
    const priceContainer = <HTMLElement>container.querySelector('.ItemPage-price');
    if (priceContainer) {
        const newContainer = document.createElement('div');
        const saleTag = document.createElement('span');
        newContainer.className = 'ItemPage-discount betterfloat-discount-container';
        newContainer.style.background = `linear-gradient(135deg,#0073d5,${difference == 0 ? extensionSettings.colors.skinport.neutral : difference < 0 ? extensionSettings.colors.skinport.profit : extensionSettings.colors.skinport.loss})`;
        newContainer.style.transform = 'skewX(-15deg)';
        newContainer.style.borderRadius = '3px';
        newContainer.style.paddingTop = '2px';
        saleTag.style.margin = '5px';
        saleTag.style.fontWeight = '700';
        saleTag.textContent = difference == 0 ? `-${currencySymbol}0` : (difference > 0 ? '+' : '-') + currencySymbol + Math.abs(difference).toFixed(2);
        newContainer.appendChild(saleTag);
        priceContainer.appendChild(newContainer);
    }

    if (extensionSettings.spStickerPrices) {
        await addStickerInfo(container, item, itemSelectors.page, difference, true);
    }

    await addFloatColoring(container, item);
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
    const filterItem = document.querySelector('.LiveBtn')?.className.includes('--isActive') ? applyFilter(item) : false;
    if (filterItem) {
        console.log('[BetterFloat] Filtered item: ', item.name);
        (<HTMLElement>container).style.display = 'none';
        return;
    }

    const priceResult = await addBuffPrice(item, container);
    if (extensionSettings.spStickerPrices) {
        await addStickerInfo(container, item, itemSelectors.preview, priceResult.price_difference);
    }
    if (extensionSettings.spFloatColoring) {
        await addFloatColoring(container, item);
    }
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
    let color = '';
    const w = item.wear;
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
    const name = container.querySelector(selector.name)?.textContent ?? '';
    if (name == '') {
        return null;
    }

    let priceText = container.querySelector(selector.price + ' .Tooltip-link')?.textContent ?? '';
    if (priceText.split(' ').length > 1) {
        priceText = priceText.split(' ')[0].replace('.', '').replace(',', '.');
    } else {
        priceText = priceText.replace(',', '').substring(1);
    }
    let price = Number(priceText) ?? 0;

    const type = container.querySelector(selector.title)?.textContent ?? '';
    const text = container.querySelector(selector.text)?.innerHTML ?? '';
    // Skinport uses more detailed item types than Buff163, they are called cateogiories here
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
    return {
        name: name,
        price: price,
        type: type,
        category: category,
        text: text,
        stickers: stickers,
        style: style,
        wear: Number(wearDiv?.innerHTML),
        wear_name: wear,
    };
}

async function getBuffPrice(item: Skinport.Listing): Promise<{ buff_name: string; priceListing: number; priceOrder: number }> {
    const priceMapping = await getPriceMapping();
    const buff_name = handleSpecialStickerNames(createBuffName(item));
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

async function generateBuffContainer(container: HTMLElement, priceListing: number, priceOrder: number, currencySymbol: string, isItemPage = false) {
    container.className += ' betterfloat-buffprice';
    const buffContainer = document.createElement('div');
    buffContainer.className = 'betterfloat-buff-container';
    buffContainer.style.display = 'flex';
    buffContainer.style.marginTop = '5px';
    buffContainer.style.alignItems = 'center';
    const buffImage = document.createElement('img');
    buffImage.setAttribute('src', runtimePublicURL + '/buff_favicon.png');
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
    if (extensionSettings.spSteamPrice || isItemPage) {
        const divider = document.createElement('div');
        container.after(buffContainer);
        container.after(divider);
    } else {
        container.replaceWith(buffContainer);
    }
}

function getCurrencySymbol(tooltipLink: Element) {
    let currencySymbol = tooltipLink.textContent?.charAt(0);
    if (!isNaN(+(currencySymbol ?? ''))) {
        // in some instances skinport displays the currency at the end of the price
        currencySymbol = tooltipLink.textContent?.charAt(tooltipLink.textContent?.length - 1);
    }
    return currencySymbol;
}

async function addBuffPrice(item: Skinport.Listing, container: Element) {
    await loadMapping();
    const { buff_name, priceListing, priceOrder } = await getBuffPrice(item);
    const buff_id = await getBuffMapping(buff_name);

    const tooltipLink = <HTMLElement>container.querySelector('.ItemPreview-priceValue')?.firstChild;
    const currencySymbol = getCurrencySymbol(tooltipLink);
    const priceDiv = container.querySelector('.ItemPreview-oldPrice');
    if (priceDiv && !container.querySelector('.betterfloat-buffprice')) {
        generateBuffContainer(priceDiv as HTMLElement, priceListing, priceOrder, currencySymbol ?? '$');
    }

    const buffHref = buff_id > 0 ? `https://buff.163.com/goods/${buff_id}` : `https://buff.163.com/market/csgo#tab=selling&page_num=1&search=${encodeURIComponent(buff_name)}`;
    if (extensionSettings.spBuffLink == 'action') {
        const presentationDiv = container.querySelector('.ItemPreview-mainAction');
        if (presentationDiv) {
            const buffLink = document.createElement('a');
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
        if (item.price !== 0 && saleTag && tooltipLink && !discountContainer.querySelector('.betterfloat-sale-tag')) {
            saleTag.className = 'sale-tag betterfloat-sale-tag';
            discountContainer.style.background = `linear-gradient(135deg,#0073d5,${difference == 0 ? extensionSettings.colors.skinport.neutral : difference < 0 ? extensionSettings.colors.skinport.profit : extensionSettings.colors.skinport.loss})`;
            saleTag.textContent = difference == 0 ? `-${currencySymbol}0` : (difference > 0 ? '+' : '-') + currencySymbol + Math.abs(difference).toFixed(2);
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

let extensionSettings: Extension.Settings;
const runtimePublicURL = chrome.runtime.getURL('../public');
// mutation observer active?
let isObserverActive = false;
init();
