import { EventData, ListingData } from './@typings/FloatTypes';
import { getItemPrice } from './mappinghandler';

// inject script into page
export function injectScript() {
    let script = document.createElement('script');
    script.src = chrome.runtime.getURL('js/inject.js');
    script.onload = function () {
        (<HTMLScriptElement>this).remove();
    };
    document.head.appendChild(script);
    // important: https://stackoverflow.com/questions/9515704/access-variables-and-functions-defined-in-page-context-using-a-content-script/9517879#9517879
    document.addEventListener('BetterFloat_INTERCEPTED_REQUEST', function (e) {
        var eventData = e.detail;
        processEvent(eventData);
    });
}

// process intercepted data
function processEvent(eventData: EventData<unknown>) {
    console.log('[BetterFloat] Received data:', eventData);
    if (eventData.url.includes('v1/listings')) {
        adjustItems(eventData.data as ListingData[]);
    } else if (eventData.url.includes('v1/me')) {

    }
}

async function adjustItems(data: ListingData[]) {
    let maxTries = 20;
    // wait for item cards to load but maximum 2 seconds
    while (document.querySelectorAll('item-card').length == 0 && maxTries-- > 0) {
        await new Promise((resolve) => setTimeout(resolve, 100));
    }
    let itemDivs = document.querySelectorAll('item-card');
    console.log('[BetterFloat] Adjusting items:', itemDivs, data);
    for (let i = 0; i < itemDivs.length; i++) {
        let itemDiv = itemDivs[i];
        let listing = data[i];
        if (listing && itemDiv) {
            let item = listing.item;
            if (itemDiv.querySelector('.item-name').textContent.trim() != item.item_name) {
                console.log('[BetterFloat] Item name mismatch:', itemDiv.querySelector('.item-name').textContent, item.item_name);
                return;
            }
            // add sticker percentages
            let stickerDiv = itemDiv.querySelector('.sticker-container')?.children[0];
            let stickers = item.stickers;
            if (stickerDiv) {
                let stickerPrices = await Promise.all(stickers.map(async (s) => await getItemPrice(s.name)));
                let totalPrice = stickerPrices.reduce((a, b) => a + b.starting_at, 0);
                const spContainer = document.createElement('div');
                spContainer.classList.add('betterfloat-sticker-price');
                spContainer.style.backgroundSize = '170%';
                spContainer.style.backgroundImage = "linear-gradient(to right,#d9bba5,#e5903b,#db5977,#6775e1)"
                spContainer.style.color = '#00000080';
                spContainer.style.padding = '2px';
                spContainer.style.borderRadius = '7px';
                spContainer.textContent = `$${totalPrice.toFixed(2)}`;
                stickerDiv.before(spContainer);
            }
        }
    }
}
