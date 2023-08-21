import { EventData, ListingData } from './@typings/FloatTypes';
import { cacheItems } from './mappinghandler';

export function activateHandler() {
    // important: https://stackoverflow.com/questions/9515704/access-variables-and-functions-defined-in-page-context-using-a-content-script/9517879#9517879
    document.addEventListener('BetterFloat_INTERCEPTED_REQUEST', function (e) {
        var eventData = (<CustomEvent>e).detail;
        processEvent(eventData);
    });
}

// process intercepted data
function processEvent(eventData: EventData<unknown>) {
    console.debug('[BetterFloat] Received data from url: ' + eventData.url + ', data:', eventData.data);
    if (eventData.url.includes('v1/listings?')) {
        cacheItems(eventData.data as ListingData[]);
    } else if (eventData.url.includes('v1/me/watchlist')) {
        cacheItems(eventData.data as ListingData[]);
    } else if (eventData.url.includes('v1/me')) {
    } else if (eventData.url.includes('v1/listings/')) {
        // item popup
    }
}
