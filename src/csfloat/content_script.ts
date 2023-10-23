// Official documentation: https://developer.chrome.com/docs/extensions/mv3/content_scripts/

import { CSFloat, ItemStyle, ItemCondition } from '../@typings/FloatTypes';
import { BlueGem, Extension, FadePercentage } from '../@typings/ExtensionTypes';
import { activateHandler } from '../eventhandler';
import { getBuffMapping, getCSFPopupItem, getFirstCSFItem, getFirstHistorySale, getItemPrice, getPriceMapping, getStallData, getWholeHistory, loadBuffMapping, loadMapping } from '../mappinghandler';
import { initSettings } from '../util/extensionsettings';
import { calculateTime, cutSubstring, getFloatColoring, getSPBackgroundColor, handleSpecialStickerNames, parseHTMLString, toTruncatedString, waitForElement } from '../util/helperfunctions';
import { genRefreshButton } from '../util/uigeneration';
import { AmberFadeCalculator, AcidFadeCalculator } from 'csgo-fade-percentage-calculator';

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

    createUrlListener();
    createTabListeners();

    const items = document.querySelectorAll('item-card');

    for (let i = 0; i < items.length; i++) {
        adjustItem(items[i], items[i].getAttribute('width')?.includes('100%') ?? false);
    }

    if (location.pathname == '/profile/offers') {
        const matActionList = document.querySelector('.mat-action-list')?.children;
        if (!matActionList) return;
        for (let i = 0; i < matActionList.length; i++) {
            const child = matActionList[i];
            if (child?.className.includes('mat-list-item')) {
                offerItemClickListener(child);
            }
        }

        await waitForElement('.betterfloat-buffprice');
        const offerBubbles = document.querySelectorAll('.offer-bubble');
        for (let i = 0; i < offerBubbles.length; i++) {
            await adjustItemBubble(offerBubbles[i]);
        }
    } else if (location.pathname.includes('/stall/')) {
        await customStall(location.pathname.split('/').pop() ?? '');
    }
}

async function customStall(stall_id: string) {
    if (stall_id == 'me') {
        const popupOuter = document.createElement('div');
        const settingsPopup = document.createElement('div');
        settingsPopup.setAttribute('class', 'betterfloat-customstall-popup');
        settingsPopup.setAttribute('style', 'display: none;');

        const popupHeader = document.createElement('h3');
        popupHeader.textContent = 'CUSTOM STALL';
        popupHeader.setAttribute('style', 'font-weight: 600; font-size: 24px; line-height: 0; margin-top: 20px;');
        const popupSubHeader = document.createElement('h4');
        popupSubHeader.textContent = 'by BetterFloat';
        popupSubHeader.setAttribute('style', 'font-size: 18px; color: rgb(130, 130, 130); line-height: 0;');
        const popupCloseButton = document.createElement('button');
        popupCloseButton.type = 'button';
        popupCloseButton.className = 'betterfloat-customstall-close';
        popupCloseButton.textContent = 'x';
        popupCloseButton.onclick = () => {
            settingsPopup.style.display = 'none';
        };
        settingsPopup.appendChild(popupHeader);
        settingsPopup.appendChild(popupSubHeader);
        settingsPopup.appendChild(popupCloseButton);

        const popupBackground = document.createElement('div');
        popupBackground.className = 'betterfloat-customstall-popup-content';
        const backgroundText = document.createElement('p');
        backgroundText.setAttribute('style', 'font-weight: 600; margin: 5px 0;');
        backgroundText.textContent = 'BACKGROUND';
        popupBackground.appendChild(backgroundText);

        const inputField = {
            img: {
                placeholder: 'Image URL',
                text: 'IMG:',
            },
            webm: {
                placeholder: 'Webm URL',
                text: 'WEBM:',
            },
            mp4: {
                placeholder: 'Mp4 URL',
                text: 'MP4:',
            },
        };
        for (const key in inputField) {
            const div = document.createElement('div');
            div.className = 'flex justify-between w-full';
            const label = document.createElement('label');
            label.textContent = inputField[key as keyof typeof inputField].text;
            const input = document.createElement('input');
            input.className = 'w-2/4';
            input.type = 'url';
            input.placeholder = inputField[key as keyof typeof inputField].placeholder;
            input.id = 'betterfloat-customstall-' + key;
            // input.className = 'mat-input-element';
            div.appendChild(label);
            div.appendChild(input);
            popupBackground.appendChild(div);
        }
        const colorDiv = document.createElement('div');
        colorDiv.className = 'flex justify-between w-full';
        const colorLabel = document.createElement('label');
        colorLabel.textContent = 'Color:';
        const colorInput = document.createElement('input');
        colorInput.type = 'color';
        colorInput.id = 'betterfloat-customstall-color';
        colorDiv.appendChild(colorLabel);
        colorDiv.appendChild(colorInput);
        const transparentDiv = document.createElement('div');
        transparentDiv.className = 'flex justify-between w-full';
        const transparentLabel = document.createElement('label');
        transparentLabel.textContent = 'Transparent Elements:';
        const transparentInput = document.createElement('input');
        transparentInput.setAttribute('style', 'height: 24px; width: 24px; accent-color: #ff5722;');
        transparentInput.type = 'checkbox';
        transparentInput.id = 'betterfloat-customstall-transparent';
        transparentDiv.appendChild(transparentLabel);
        transparentDiv.appendChild(transparentInput);

        const popupSaveButton = document.createElement('button');
        popupSaveButton.className = 'mat-raised-button mat-warn betterfloat-customstall-buttondiv';
        popupSaveButton.style.marginTop = '15px';
        popupSaveButton.type = 'button';
        const saveButtonTextNode = document.createElement('span');
        saveButtonTextNode.textContent = 'Save';
        popupSaveButton.onclick = async () => {
            const stall_id = (<HTMLInputElement>document.getElementById('mat-input-1')).value.split('/').pop();
            if (isNaN(Number(stall_id)) || location.pathname != '/stall/me') {
                console.debug('[BetterFloat] Invalid stall id');
                return;
            }
            // send get to /api/v1/me to get obfuscated user id
            let obfuscated_id: string = await fetch('https://csfloat.com/api/v1/me')
                .then((res) => res.json())
                .then((data) => data?.user?.obfuscated_id);
            if (!obfuscated_id) {
                console.debug('[BetterFloat] Could not get obfuscated user id');
                return;
            }
            const stallData = {
                stall_id: stall_id,
                options: {
                    video: {
                        poster: (<HTMLInputElement>document.getElementById('betterfloat-customstall-img')).value,
                        webm: (<HTMLInputElement>document.getElementById('betterfloat-customstall-webm')).value,
                        mp4: (<HTMLInputElement>document.getElementById('betterfloat-customstall-mp4')).value,
                    },
                    'background-color': (<HTMLInputElement>document.getElementById('betterfloat-customstall-color')).value,
                    transparent_elements: (<HTMLInputElement>document.getElementById('betterfloat-customstall-transparent')).checked,
                },
            };
            console.debug('[BetterFloat] New stall settings: ', stallData);

            // send post to /api/v1/stall/{id} to update stall
            await fetch('https://api.rums.dev/v1/csfloatstalls/store', {
                method: 'POST',
                headers: {
                    Accept: '*/*',
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    stall_id: stallData.stall_id,
                    // token: obfuscated_id,
                    token: 'testtoken',
                    data: stallData.options,
                }),
            })
                .then((res) => res.json())
                .then((data) => console.debug('[BetterFloat] Stall update - success response from api.rums.dev: ', data))
                .catch((err) => console.debug('[BetterFloat] Stall update - error: ', err));

            settingsPopup.style.display = 'none';
        };
        popupSaveButton.appendChild(saveButtonTextNode);

        popupBackground.appendChild(colorDiv);
        popupBackground.appendChild(transparentDiv);
        settingsPopup.appendChild(popupBackground);
        settingsPopup.appendChild(popupSaveButton);

        const settingsButton = document.createElement('button');
        settingsButton.setAttribute('style', 'background: none; border: none; margin-left: 60px');
        const settingsIcon = document.createElement('img');
        settingsIcon.setAttribute('src', runtimePublicURL + '/gear-solid.svg');
        settingsIcon.style.height = '64px';
        settingsIcon.style.filter = 'brightness(0) saturate(100%) invert(59%) sepia(55%) saturate(3028%) hue-rotate(340deg) brightness(101%) contrast(101%)';
        settingsButton.onclick = () => {
            settingsPopup.style.display = 'block';
        };
        settingsButton.appendChild(settingsIcon);
        popupOuter.appendChild(settingsPopup);
        popupOuter.appendChild(settingsButton);

        const container = document.querySelector('.settings')?.parentElement;
        if (container) {
            container.after(popupOuter);
            (<HTMLElement>container.parentElement).style.alignItems = 'center';
        }

        // get stall id from input field to still load custom stall
        let newID = (<HTMLInputElement>document.getElementById('mat-input-1')).value.split('/').pop();
        if (newID) {
            stall_id = newID;
        } else {
            console.log('[BetterFloat] Could not load stall data');
            return;
        }
    }
    let stallData = await getStallData(stall_id);
    if (!stallData || !stall_id.includes(stallData.stall_id)) {
        console.log('[BetterFloat] Could not load stall data');
        return;
    }

    document.body.classList.add('betterfloat-custom-stall');

    let backgroundVideo = document.createElement('video');
    backgroundVideo.setAttribute('playsinline', '');
    backgroundVideo.setAttribute('autoplay', '');
    backgroundVideo.setAttribute('muted', '');
    backgroundVideo.setAttribute('loop', '');
    backgroundVideo.setAttribute('poster', stallData.options.video.poster);
    backgroundVideo.setAttribute(
        'style',
        `position: absolute; width: 100%; height: 100%; z-index: -100; background-size: cover; background-position: center center; object-fit: cover; background-color: ${stallData.options['background-color']}`
    );
    let sourceWebm = document.createElement('source');
    sourceWebm.setAttribute('src', stallData.options.video.webm);
    sourceWebm.setAttribute('type', 'video/webm');
    let sourceMp4 = document.createElement('source');
    sourceMp4.setAttribute('src', stallData.options.video.mp4);
    sourceMp4.setAttribute('type', 'video/mp4');

    backgroundVideo.appendChild(sourceWebm);
    backgroundVideo.appendChild(sourceMp4);
    document.body.firstChild?.before(backgroundVideo);

    // start video after it is loaded
    backgroundVideo.addEventListener('canplay', () => {
        backgroundVideo.muted = true;
        backgroundVideo.play();
    });

    if (stallData.options.transparent_elements) {
        let stallHeader = document.querySelector('.betterfloat-custom-stall .mat-card.header');
        if (stallHeader) {
            (<HTMLElement>stallHeader).style.backgroundColor = 'transparent';
        }
        let stallFooter = document.querySelector('.betterfloat-custom-stall > app-root > div > div.footer');
        if (stallFooter) {
            (<HTMLElement>stallFooter).style.backgroundColor = 'transparent';
        }
    }

    let matChipWrapper = document.querySelector('.mat-chip-list-wrapper');
    if (matChipWrapper && matChipWrapper.firstElementChild) {
        let bfChip = <HTMLElement>matChipWrapper.firstElementChild.cloneNode(true);
        bfChip.style.backgroundColor = 'purple';
        bfChip.textContent = 'BetterFloat ' + stallData.roles[0];
        matChipWrapper.appendChild(bfChip);
    }
}

function offerItemClickListener(listItem: Element) {
    listItem.addEventListener('click', async () => {
        await new Promise((r) => setTimeout(r, 100));
        const itemCard = document.querySelector('item-card');
        if (itemCard) {
            await adjustItem(itemCard);
        }
    });
}

function switchTab(tab: number) {
    const tabList = document.querySelectorAll('.mat-tab-label');
    (<HTMLElement>tabList[tab]).click();
    if (location.pathname == '/') {
        document.title = tabList[tab].textContent?.trim() + ' | CSFloat';
    }
}

function createTabListeners() {
    const tabList = document.querySelectorAll('.mat-tab-label');
    const tabContainer = tabList[0]?.parentElement;
    if (!tabList || tabContainer?.className.includes('betterfloat-tabs')) return;
    tabContainer?.classList.add('betterfloat-tabs');
    for (let i = 0; i < tabList.length; i++) {
        tabList[i].addEventListener('click', () => {
            window.history.replaceState({}, '', location.pathname + '?tab=' + tabList[i].getAttribute('aria-posinset'));
            if (location.pathname == '/') {
                document.title = tabList[i].textContent?.trim() + ' | CSFloat';
            }
        });
    }
}

/**
 * Updates the document title according to the current site
 * @async setInterval executed every 200ms
 */
function createUrlListener() {
    setInterval(() => {
        const newUrl = location.href;
        if (currentUrl != newUrl) {
            // URL changed
            let newTitle = '';
            if (location.pathname == '/' && location.search == '') {
                newTitle = 'Home';
            } else if (location.pathname == '/profile/offers') {
                newTitle = 'Offers';
            } else if (location.pathname == '/profile/watchlist') {
                newTitle = 'Watchlist';
            } else if (location.pathname == '/profile/trades') {
                newTitle = 'Trades';
            } else if (location.pathname == '/sell') {
                newTitle = 'Selling';
            } else if (location.pathname == '/profile') {
                newTitle = 'Profile';
            } else if (location.pathname == '/support') {
                newTitle = 'Support';
            } else if (location.pathname == '/search') {
                newTitle = 'Search';
            } else if (location.pathname == '/profile/deposit') {
                newTitle = 'Deposit';
            } else if (location.pathname.includes('/stall/')) {
                let username = document.querySelector('.username')?.textContent;
                if (username) {
                    newTitle = username + "'s Stall";
                }
            } else if (location.pathname.includes('/item/')) {
                // item titles are fine as they are
            }
            if (newTitle != '') {
                document.title = newTitle + ' | CSFloat';
            }
            currentUrl = newUrl;
            // /stall/
        }
    }, 200);
}

async function refreshButton() {
    const matChipList = document.querySelector('.mat-chip-list-wrapper');

    const refreshChip = document.createElement('div');
    refreshChip.classList.add('betterfloat-refresh');
    refreshChip.setAttribute('style', 'display: inline-flex; margin-left: 20px;');

    const refreshContainer = document.createElement('div');
    const autorefreshContainer = document.createElement('span');
    const refreshText = document.createElement('span');
    const intervalContainer = document.createElement('span');
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

    const startStopContainer = document.createElement('div');
    const startElement = genRefreshButton('Start');
    const stopElement = genRefreshButton('Stop');
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

            const refreshDelay = (Number(extensionSettings.refreshInterval) ?? 30) * 1000;
            const refreshText = document.querySelector('.betterfloat-refreshText');

            if (!refreshText) return;
            refreshText.textContent = 'active';
            refreshText.setAttribute('style', 'color: greenyellow;');

            // save timer to avoid uncoordinated executions
            refreshThreads.push(
                setInterval(() => {
                    const refreshButton = document.querySelector('.mat-chip-list-wrapper')?.querySelector('.mat-tooltip-trigger')?.children[0] as HTMLElement;
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

            const refreshText = document.querySelector('.betterfloat-refreshText');
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
    const observer = new MutationObserver(async (mutations) => {
        if (extensionSettings.enableCSFloat) {
            for (let i = 0; i < unsupportedSubPages.length; i++) {
                if (location.href.includes(unsupportedSubPages[i])) {
                    console.debug('[BetterFloat] Current page is currently NOT supported');
                    return;
                }
            }
            for (const mutation of mutations) {
                for (let i = 0; i < mutation.addedNodes.length; i++) {
                    const addedNode = mutation.addedNodes[i];
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
                        let itemCard = document.querySelector('item-card');
                        if (itemCard) {
                            await adjustItem(itemCard);
                        }
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

        const activeTab = getTabNumber();
        if (activeTab == 4 && extensionSettings.autorefresh) {
            await refreshButton();
        }
    });
    observer.observe(document, { childList: true, subtree: true });
}

async function adjustItemBubble(container: Element) {
    const buffData: { buff_name: string; priceFromReference: number } = JSON.parse(document.querySelector('.betterfloat-buffprice')?.getAttribute('data-betterfloat') ?? '{}');
    const bargainPrice = Number(container.querySelector('b')?.textContent?.replace('$', ''));
    const difference = bargainPrice - buffData.priceFromReference;
    const isSeller = container.textContent?.includes('Seller') ?? false;

    const buffContainer = document.createElement('div');
    buffContainer.setAttribute('style', `width: 80%; display: inline-flex; align-items: center; justify-content: ${isSeller ? 'flex-start' : 'flex-end'}; translate: 0 3px;`);
    const buffImage = document.createElement('img');
    buffImage.setAttribute('src', runtimePublicURL + '/buff_favicon.png');
    buffImage.setAttribute('style', 'height: 20px; margin-right: 5px');
    buffContainer.appendChild(buffImage);

    const buffPrice = document.createElement('span');
    buffPrice.setAttribute('style', `color: ${difference < 0 ? 'greenyellow' : 'orange'};`);
    buffPrice.textContent = `${difference > 0 ? '+' : ''}$${difference.toFixed(2)}`;
    buffContainer.appendChild(buffPrice);

    const personDiv = container.querySelector('div > span');
    if (isSeller && personDiv) {
        personDiv.before(buffContainer);
    } else {
        container.querySelector('div')?.appendChild(buffContainer);
    }
}

async function adjustSalesTableRow(container: Element) {
    const cachedSale = await getFirstHistorySale();
    if (!cachedSale) {
        return;
    }

    // link to item page
    const firstRow = container.firstElementChild;
    const ageSpan = firstRow?.firstElementChild;
    if (firstRow && ageSpan) {
        const aLink = document.createElement('a');
        aLink.href = 'https://csfloat.com/item/' + cachedSale.id;
        aLink.target = '_blank';
        const linkIcon = document.createElement('img');
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

    const appStickerView = container.querySelector('.cdk-column-stickers')?.firstElementChild;
    if (appStickerView) {
        if (appStickerView.querySelectorAll('.sticker').length == 0) return;
        const stickerData = cachedSale.item.stickers;
        const priceData = JSON.parse(document.querySelector('.betterfloat-big-price')?.getAttribute('data-betterfloat') ?? '');
        const sellPrice = Number(container.querySelector('.mat-column-price')?.textContent?.replace('$', ''));

        if (priceData && stickerData.length > 0) {
            const stickerContainer = document.createElement('div');
            stickerContainer.className = 'betterfloat-table-sp';
            (<HTMLElement>appStickerView).style.display = 'flex';
            (<HTMLElement>appStickerView).style.alignItems = 'center';

            const doChange = await changeSpContainer(stickerContainer, stickerData, sellPrice - Number(priceData.priceFromReference));
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
    const cachedItem = await getFirstCSFItem();
    if (cachedItem) {
        if (item.name != cachedItem.item.item_name) {
            console.log('[BetterFloat] Item name mismatch:', item.name, cachedItem.item.item_name);
            return;
        }
        if (extensionSettings.stickerPrices && item.price > 0) {
            await addStickerInfo(container, cachedItem, priceResult.price_difference);
        } else {
            adjustExistingSP(container);
        }
        if (extensionSettings.listingAge > 0) {
            await addListingAge(container, cachedItem);
        }
        storeApiItem(container, cachedItem);

        if (extensionSettings.csBlueGem) {
            await caseHardenedDetection(container, cachedItem, false);
        }
        if (extensionSettings.floatColoring.csfloat) {
            await addFloatColoring(container, cachedItem);
        }
        await addFadePercentages(container, cachedItem);
    } else if (isPopout) {
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
                await caseHardenedDetection(container, apiItem, true);
                await addFadePercentages(container, apiItem);
                await addFloatColoring(container, apiItem);
            }
        }, 500);
    }
}

async function addFloatColoring(container: Element, item: CSFloat.ListingData) {
    const elements = container.querySelectorAll('span.mat-tooltip-trigger.ng-star-inserted');
    const rangeMarker = container.querySelectorAll('.float-range-marker');
    let [lowerLimit, upperLimit] = [0, 1];

    rangeMarker.forEach((marker) => {
        const limit = Number(cutSubstring(marker.getAttribute('style')!, '(', '%')) / 100;
        if (limit > item.item.float_value) {
            upperLimit = limit;
        } else if (limit < item.item.float_value) {
            lowerLimit = limit;
        }
    });

    elements.forEach((element) => {
        if (element.textContent && item.item.float_value.toFixed(12) === element.textContent) {
            (<HTMLElement>element).style.color = getFloatColoring(item.item.float_value, lowerLimit, upperLimit);
        }
    });
}

async function addFadePercentages(container: Element, item: CSFloat.ListingData) {
    const itemName = item.item.item_name;
    const paintSeed = item.item.paint_seed;
    if (!itemName.includes('Fade')) return;
    const weapon = itemName.split(' | ')[0];
    let fadePercentage: (FadePercentage & { background: string }) | null = null;
    if (itemName.includes('Amber Fade')) {
        fadePercentage = { ...AmberFadeCalculator.getFadePercentage(weapon, paintSeed), background: 'linear-gradient(to right,#627d66,#896944,#3b2814)' };
    } else if (itemName.includes('Acid Fade')) {
        fadePercentage = { ...AcidFadeCalculator.getFadePercentage(weapon, paintSeed), background: 'linear-gradient(to right,#6d5f55,#76c788, #574828)' };
    }
    if (fadePercentage != null) {
        let fadeTooltip = document.createElement('div');
        fadeTooltip.className = 'bf-tooltip-inner';
        let fadePercentageSpan = document.createElement('span');
        fadePercentageSpan.textContent = `Fade: ${toTruncatedString(fadePercentage.percentage, 5)}%`;
        let fadeRankingSpan = document.createElement('span');
        fadeRankingSpan.textContent = `Rank #${fadePercentage.ranking}`;
        fadeTooltip.appendChild(fadePercentageSpan);
        fadeTooltip.appendChild(fadeRankingSpan);
        let fadeBadge = document.createElement('div');
        fadeBadge.className = 'bf-fade bf-tooltip';
        let percentageDiv = document.createElement('div');
        percentageDiv.className = 'bf-fade-percentage';
        percentageDiv.setAttribute('style', `background-position-x: 10.7842%; background-image: ${fadePercentage.background};`);
        let fadeBadgePercentageSpan = document.createElement('span');
        fadeBadgePercentageSpan.style.color = '#00000080';
        fadeBadgePercentageSpan.textContent = toTruncatedString(fadePercentage.percentage, 1);
        percentageDiv.appendChild(fadeBadgePercentageSpan);
        fadeBadge.appendChild(percentageDiv);
        fadeBadge.appendChild(fadeTooltip);
        let badgeContainer = container.querySelector('.badge-container');
        if (!badgeContainer) {
            badgeContainer = document.createElement('div');
            badgeContainer.setAttribute('style', 'position: absolute; top: 5px; left: 5px;');
            container.querySelector('.item-img')?.after(badgeContainer);
        } else {
            badgeContainer = badgeContainer.querySelector('.container') ?? badgeContainer;
            badgeContainer.setAttribute('style', 'gap: 5px;');
        }
        badgeContainer.appendChild(fadeBadge);
    }
}

async function caseHardenedDetection(container: Element, listing: CSFloat.ListingData, isPopout: boolean) {
    const item = listing.item;
    if (!item.item_name.includes('Case Hardened')) return;
    let pastSales: BlueGem.PastSale[] = [];
    let patternElement: BlueGem.PatternElement | null = null;
    let type = '';
    if (item.item_name.startsWith('★')) {
        type = item.item_name.split(' | ')[0].split('★ ')[1];
    } else {
        type = item.item_name.split(' | ')[0];
    }
    // retrieve the stored data instead of fetching newly
    if (isPopout) {
        const itemPreview = document.getElementsByClassName('item-' + location.pathname.split('/').pop())[0];
        const csbluegem = itemPreview?.getAttribute('data-csbluegem');
        if (csbluegem) {
            const csbluegemData = JSON.parse(csbluegem);
            pastSales = csbluegemData.pastSales;
            patternElement = csbluegemData.patternElement;
        }
    }
    // if there is no cached data, fetch it and store it
    if (pastSales.length == 0 && !patternElement) {
        await fetchCSBlueGem(type, item.paint_seed).then((data) => {
            pastSales = data.pastSales;
            patternElement = data.patternElement;
            container.setAttribute('data-csbluegem', JSON.stringify({ pastSales, patternElement }));
        });
    }

    // add gem icon and blue gem percent if item is a knife
    let tierContainer = container.querySelector('.badge-container');
    if (!tierContainer) {
        tierContainer = document.createElement('div');
        tierContainer.setAttribute('style', 'position: absolute; top: 5px; left: 5px;');
        container.querySelector('.item-img')?.after(tierContainer);
    } else {
        tierContainer = tierContainer.querySelector('.container') ?? tierContainer;
        tierContainer.setAttribute('style', 'gap: 5px;');
    }
    const gemContainer = document.createElement('div');
    gemContainer.setAttribute('style', 'display: flex; align-items: center; justify-content: flex-end;');
    const gemImage = document.createElement('img');
    gemImage.setAttribute('src', runtimePublicURL + '/gem-shop.svg');
    gemImage.setAttribute(
        'style',
        'height: 25px; margin-right: 5px; margin-top: 1px; filter: brightness(0) saturate(100%) invert(57%) sepia(46%) saturate(3174%) hue-rotate(160deg) brightness(102%) contrast(105%);'
    );
    gemContainer.appendChild(gemImage);
    if (patternElement) {
        const gemValue = document.createElement('span');
        gemValue.style.color = 'deepskyblue';
        gemValue.textContent = `${patternElement.playside.toFixed(0)}% / ${patternElement.backside.toFixed(0)}%`;
        gemContainer.appendChild(gemValue);
    }
    tierContainer.appendChild(gemContainer);

    // add screenshot if csfloat does not offer one
    const detailButtons = container.querySelector('.detail-buttons');
    if (detailButtons && container.querySelectorAll('.detail-buttons > button').length == 0) {
        // get closest item float-wise that has a screenshot
        let sortedSales = pastSales.filter((x) => x.url != 'No Link Available').sort((a, b) => Math.abs(a.float - item.float_value) - Math.abs(b.float - item.float_value));
        if (sortedSales.length > 0 || patternElement?.screenshot) {
            detailButtons.setAttribute('style', 'display: flex;');
            const outerContainer = document.createElement('div');
            outerContainer.className = 'bf-tooltip';
            const screenshotButton = document.createElement('a');
            screenshotButton.href = sortedSales[0]?.url ?? patternElement?.screenshot;
            screenshotButton.target = '_blank';
            screenshotButton.setAttribute('style', 'vertical-align: middle; padding: 0; min-width: 0;');
            const iconButton = document.createElement('button');
            iconButton.className = 'mat-focus-indicator mat-tooltip-trigger mat-icon-button mat-button-base ng-star-inserted';
            iconButton.setAttribute('style', 'color: cyan;');
            const iconSpan = document.createElement('span');
            iconSpan.className = 'mat-button-wrapper';
            const icon = document.createElement('i');
            icon.className = 'material-icons';
            icon.textContent = 'camera_alt';
            iconSpan.appendChild(icon);
            iconButton.appendChild(iconSpan);
            screenshotButton.appendChild(iconButton);
            let tooltip = document.createElement('div');
            tooltip.className = 'bf-tooltip-inner';
            let tooltipSpan = document.createElement('span');
            tooltipSpan.textContent = `Show Buff pattern screenshot`;
            tooltip.appendChild(tooltipSpan);
            outerContainer.appendChild(screenshotButton);
            outerContainer.appendChild(tooltip);
            detailButtons.insertBefore(outerContainer, detailButtons.firstChild);
        }
    }

    // offer new table with past sales
    if (isPopout) {
        const gridHistory = document.querySelector('.grid-history');
        if (!gridHistory) return;
        const divider = document.createElement('span');
        divider.textContent = ' | ';
        divider.setAttribute('style', 'margin: 0 5px;');
        let salesHeader = document.createElement('span');
        salesHeader.textContent = `Buff Pattern (${pastSales.length})`;
        salesHeader.setAttribute('style', 'color: deepskyblue;');
        salesHeader.addEventListener('click', () => {
            Array.from(salesHeader.parentElement?.children ?? []).forEach((element) => {
                if (!element.textContent?.includes('|')) {
                    element.setAttribute('style', 'color: grey;');
                }
            });
            salesHeader.style.color = 'cyan';

            // all of this should at some point be done in a safer way
            let tableBody = '';
            pastSales.forEach((sale) => {
                tableBody += `<tr role="row" mat-row class="mat-row cdk-row ng-star-inserted" ${
                    item.float_value == sale.float ? 'style="background-color: darkslategray;"' : ''
                }><td role="cell" mat-cell class="mat-cell cdk-cell ng-star-inserted">${sale.date}</td><td role="cell" mat-cell class="mat-cell cdk-cell ng-star-inserted">¥ ${sale.price} (~$${(
                    sale.price * 0.14
                ).toFixed(0)})</td><td role="cell" mat-cell class="mat-cell cdk-cell ng-star-inserted">${sale.float}</td><td role="cell" mat-cell class="mat-cell cdk-cell ng-star-inserted">${
                    sale.pattern
                }</td><td role="cell" mat-cell class="mat-cell cdk-cell ng-star-inserted"><a ${
                    sale.url == 'No Link Available'
                        ? 'style="pointer-events: none;cursor: default;"><img src="' +
                          runtimePublicURL +
                          '/ban-solid.svg" style="height: 20px; translate: 0px 1px; filter: brightness(0) saturate(100%) invert(11%) sepia(8%) saturate(633%) hue-rotate(325deg) brightness(95%) contrast(89%);"> </img>'
                        : 'href="' + sale.url + '" target="_blank"><i _ngcontent-mua-c199="" class="material-icons" style="translate: 0px 1px;">camera_alt</i></a>'
                }</td></tr>`;
            });
            const outerContainer = document.createElement('div');
            outerContainer.setAttribute('style', 'max-height: 260px;overflow: auto;background-color: #424242;');
            const table = document.createElement('table');
            table.className = 'mat-table cdk-table bf-table';
            table.setAttribute('role', 'table');
            table.setAttribute('style', 'width: 100%;');
            const header = document.createElement('thead');
            header.setAttribute('role', 'rowgroup');
            let headerValues = ['Date', 'Price', 'Float Value', 'Paint Seed'];
            for (let i = 0; i < headerValues.length; i++) {
                const headerCell = document.createElement('th');
                headerCell.setAttribute('role', 'columnheader');
                headerCell.className = 'mat-header-cell cdk-header-cell ng-star-inserted';
                headerCell.textContent = headerValues[i];
                header.appendChild(headerCell);
            }
            const linkHeaderCell = document.createElement('th');
            linkHeaderCell.setAttribute('role', 'columnheader');
            linkHeaderCell.className = 'mat-header-cell cdk-header-cell ng-star-inserted';
            const linkHeader = document.createElement('a');
            linkHeader.setAttribute('href', `https://csbluegem.com/search?skin=${type}&pattern=${item.paint_seed}&currency=CNY&filter=date&sort=descending`);
            linkHeader.setAttribute('target', '_blank');
            const linkHeaderImage = document.createElement('img');
            linkHeaderImage.setAttribute('src', runtimePublicURL + '/arrow-up-right-from-square-solid.svg');
            linkHeaderImage.setAttribute('style', 'height: 18px; filter: brightness(0) saturate(100%) invert(100%) sepia(0%) saturate(7461%) hue-rotate(14deg) brightness(94%) contrast(106%);');
            linkHeader.appendChild(linkHeaderImage);
            linkHeaderCell.appendChild(linkHeader);
            header.appendChild(linkHeaderCell);
            table.appendChild(header);
            const body = document.createElement('tbody');
            body.innerHTML = tableBody;
            table.appendChild(body);
            outerContainer.appendChild(table);

            const historyChild = gridHistory?.querySelector('.history-component')?.firstElementChild;
            if (historyChild && historyChild.firstElementChild) {
                historyChild.removeChild(historyChild.firstElementChild);
                historyChild.appendChild(outerContainer);
            }
        });
        const gridHeading = gridHistory.querySelector('#header');
        gridHeading?.firstChild?.lastChild?.appendChild(divider);
        gridHeading?.firstChild?.lastChild?.appendChild(salesHeader);
    }
}

async function fetchCSBlueGem(type: string, paint_seed: number) {
    return fetch(`https://csbluegem.com/api?skin=${type}&pattern=${paint_seed}`)
        .then((res) => res.json())
        .then((data) => {
            const { pastSales, patternElement } = {
                pastSales: data.pop() as BlueGem.PastSale[],
                patternElement: data.pop() as BlueGem.PatternElement | null,
            };
            // console.debug('[BetterFloat] Received case hardened data from CSBlueGem: ', { patternElement, pastSales });
            return { patternElement, pastSales };
        });
}

function adjustExistingSP(container: Element) {
    const spContainer = container.querySelector('.sticker-percentage');
    let spValue = spContainer?.textContent!.trim().split('%')[0];
    if (!spValue || !spContainer) return;
    if (spValue.startsWith('>')) {
        spValue = spValue.substring(1);
    }
    const backgroundImageColor = getSPBackgroundColor(Number(spValue) / 100);
    (<HTMLElement>spContainer).style.backgroundColor = backgroundImageColor;
}

function storeApiItem(container: Element, item: CSFloat.ListingData) {
    // add id as class to find the element later more easily
    container.classList.add('item-' + item.id);
    container.setAttribute('data-betterfloat', JSON.stringify(item));
}

function getApiItem(container: Element | null): CSFloat.ListingData | null {
    const data = container?.getAttribute('data-betterfloat');
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

    listingAgeText.textContent = calculateTime(cachedItem.created_at);
    listingAge.appendChild(listingAgeText);
    listingAge.appendChild(listingIcon);
    if (extensionSettings.listingAge == 1) {
        listingAge.style.marginBottom = '5px';
        listingAgeText.style.color = 'darkgray';
        container.querySelector('.online-container')?.after(listingAge);
    } else {
        const watchersContainer = container.querySelector('.watchers');
        const outerContainer = document.createElement('div');
        outerContainer.classList.add('betterfloat-listing-age-container');
        outerContainer.style.display = 'flex';
        listingAge.style.marginRight = '5px';
        outerContainer.appendChild(listingAge);
        // if logged out, watchers are not displayed
        if (watchersContainer) {
            outerContainer.appendChild(watchersContainer);
        }
        const topRightContainer = container.querySelector('.top-right-container');
        if (topRightContainer) {
            topRightContainer.replaceChild(outerContainer, topRightContainer.firstChild as Node);
        }
    }
}

async function addStickerInfo(container: Element, cachedItem: CSFloat.ListingData, price_difference: number) {
    const stickers = cachedItem.item.stickers;
    // quality 12 is souvenir
    if (!stickers || cachedItem.item?.quality == 12) {
        return;
    }

    const csfSP = container.querySelector('.sticker-percentage');
    if (csfSP) {
        const didChange = await changeSpContainer(csfSP, stickers, price_difference);
        if (!didChange) {
            csfSP.remove();
        }
    }
}

// returns if the SP container was created, so priceSum > 1
async function changeSpContainer(csfSP: Element, stickers: CSFloat.StickerData[], price_difference: number) {
    const stickerPrices = await Promise.all(stickers.map(async (s) => await getItemPrice(s.name)));
    const priceSum = stickerPrices.reduce((a, b) => a + b.starting_at, 0);
    const spPercentage = price_difference / priceSum;

    // don't display SP if total price is below $1
    if (priceSum >= 2) {
        const backgroundImageColor = getSPBackgroundColor(spPercentage);
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

    const name = nameContainer?.querySelector('.item-name')?.textContent?.replace('\n', '').trim();
    const priceText = priceContainer?.textContent?.trim().split(' ') ?? [];
    let price: string;
    if (location.pathname == '/sell') {
        price = priceText[1].split('Price')[1];
    } else {
        price = priceText.includes('Bids') ? '0' : priceText[0];
    }
    let condition: ItemCondition = '';
    let quality = '';
    let style: ItemStyle = '';

    header_details.childNodes.forEach((node) => {
        switch (node.nodeType) {
            case Node.ELEMENT_NODE:
                const text = node.textContent?.trim();
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
    const buff_name = handleSpecialStickerNames(createBuffName(item));
    const priceMapping = await getPriceMapping();
    let helperPrice: number | null = null;

    if (!priceMapping[buff_name] || !priceMapping[buff_name]['buff163'] || !priceMapping[buff_name]['buff163']['starting_at'] || !priceMapping[buff_name]['buff163']['highest_order']) {
        console.debug(`[BetterFloat] No price mapping found for ${buff_name}`);
        helperPrice = 0;
    }

    const buff_id = await getBuffMapping(buff_name);
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
        const buffContainer = document.createElement('a');
        buffContainer.setAttribute('class', 'betterfloat-buff-a');
        const buff_url = buff_id > 0 ? `https://buff.163.com/goods/${buff_id}` : `https://buff.163.com/market/csgo#tab=selling&page_num=1&search=${encodeURIComponent(buff_name)}`;
        buffContainer.setAttribute('href', buff_url);
        buffContainer.setAttribute('target', '_blank');
        buffContainer.setAttribute('style', `${showBoth ? '' : 'margin-top: 5px; '}display: inline-flex; align-items: center;`);

        const buffImage = document.createElement('img');
        buffImage.setAttribute('src', runtimePublicURL + '/buff_favicon.png');
        buffImage.setAttribute('style', 'height: 20px; margin-right: 5px');
        buffContainer.appendChild(buffImage);
        const buffPrice = document.createElement('div');
        buffPrice.setAttribute('class', `suggested-price betterfloat-buffprice ${isPopout ? 'betterfloat-big-price' : ''}`);
        buffPrice.setAttribute(
            'data-betterfloat',
            JSON.stringify({
                buff_name: buff_name,
                priceFromReference: priceFromReference,
            })
        );
        const tooltipSpan = document.createElement('span');
        tooltipSpan.setAttribute('class', 'betterfloat-buff-tooltip');
        tooltipSpan.textContent = 'Bid: Highest buy order price; Ask: Lowest listing price';
        buffPrice.appendChild(tooltipSpan);
        const buffPriceBid = document.createElement('span');
        buffPriceBid.setAttribute('style', 'color: orange;');
        buffPriceBid.textContent = `Bid $${priceOrder}`;
        buffPrice.appendChild(buffPriceBid);
        const buffPriceDivider = document.createElement('span');
        buffPriceDivider.setAttribute('style', 'color: gray;margin: 0 3px 0 3px;');
        buffPriceDivider.textContent = '|';
        buffPrice.appendChild(buffPriceDivider);
        const buffPriceAsk = document.createElement('span');
        buffPriceAsk.setAttribute('style', 'color: greenyellow;');
        buffPriceAsk.textContent = `Ask $${priceListing}`;
        buffPrice.appendChild(buffPriceAsk);
        buffContainer.appendChild(buffPrice);

        if (!container.querySelector('.betterfloat-buffprice')) {
            if (showBoth) {
                suggestedContainer.setAttribute('href', 'https://steamcommunity.com/market/listings/730/' + encodeURIComponent(buff_name));
                const divider = document.createElement('div');
                suggestedContainer.after(buffContainer);
                suggestedContainer.after(divider);
            } else {
                suggestedContainer.replaceWith(buffContainer);
            }
        }
    } else if (container.querySelector('.betterfloat-buff-a')) {
        const buffA = container.querySelector('.betterfloat-buff-a')!;
        const buff_url = buff_id > 0 ? `https://buff.163.com/goods/${buff_id}` : `https://buff.163.com/market/csgo#tab=selling&page_num=1&search=${encodeURIComponent(buff_name)}`;
        buffA.setAttribute('href', buff_url);
        const buffPriceDiv = buffA.querySelector('.betterfloat-buffprice')!;
        buffPriceDiv.setAttribute(
            'data-betterfloat',
            JSON.stringify({
                buff_name: buff_name,
                priceFromReference: priceFromReference,
            })
        );
        buffPriceDiv.children[1].textContent = `Bid $${priceOrder}`;
        buffPriceDiv.children[3].textContent = `Ask $${priceListing}`;
    }

    // edge case handling: reference price may be a valid 0 for some paper stickers etc.
    if (extensionSettings.showBuffDifference && item.price !== 0 && (priceFromReference > 0 || item.price < 0.06) && location.pathname != '/sell') {
        const priceContainer = <HTMLElement>container.querySelector('.price');
        const saleTag = priceContainer.querySelector('.sale-tag');
        const badge = priceContainer.querySelector('.badge');
        if (saleTag) {
            priceContainer.removeChild(saleTag);
        }
        if (badge) {
            priceContainer.removeChild(badge);
        }

        let backgroundColor;
        let differenceSymbol;
        if (difference < 0) {
            backgroundColor = extensionSettings.colors.csfloat.profit;
            differenceSymbol = '-$';
        } else if (difference > 0) {
            backgroundColor = extensionSettings.colors.csfloat.loss;
            differenceSymbol = '+$';
        } else {
            backgroundColor = extensionSettings.colors.csfloat.neutral;
            differenceSymbol = '-$';
        }

        const buffPriceHTML = `<span class="sale-tag betterfloat-sale-tag" style="background-color: ${backgroundColor};" data-betterfloat="${difference}">${differenceSymbol}${Math.abs(
            difference
        ).toFixed(2)} ${extensionSettings.showBuffPercentageDifference ? ' (' + ((item.price / priceFromReference) * 100).toFixed(2) + '%)' : ''}</span>`;
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
    const topButton = document.createElement('button');
    topButton.classList.add('betterfloat-top-button');
    topButton.setAttribute(
        'style',
        'position: fixed; right: 2rem; bottom: 2rem; z-index: 999; width: 40px; height: 40px; border-radius: 50%; background-color: #004594; border: none; outline: none; cursor: pointer; display: none; transition: visibility 0s, opacity 0.5s linear;'
    );
    const topButtonIcon = document.createElement('img');
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

const supportedSubPages = ['/item/', '/stall', '/profile/watchlist', '/search', '/profile/offers', '/sell'];
const unsupportedSubPages = ['blog.csfloat', '/db'];

let extensionSettings: Extension.Settings;
const runtimePublicURL = chrome.runtime.getURL('../public');
const refreshThreads: [ReturnType<typeof setTimeout> | null] = [null];
// time of last refresh in auto-refresh functionality
let lastRefresh = 0;
// mutation observer active?
let isObserverActive = false;
// current url, automically updated per interval
let currentUrl: string = location.href;

init();
