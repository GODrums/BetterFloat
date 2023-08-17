import { EventData, FloatItem } from './@typings/FloatTypes';

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
    console.log('[BetterFloat] Received data:', JSON.stringify(eventData, null, 2));
    if (eventData.url.includes('v1/listings')) {
        let data = eventData.data as FloatItem[];
        let itemDivs = document.querySelectorAll('item-card');
        console.log('[BetterFloat] Found ' + itemDivs.length + ' item-card elements');
    } else if (eventData.url.includes('v1/me')) {

    }
}
