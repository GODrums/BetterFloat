import { ExtensionSettings } from '../@typings/FloatTypes';
import {
    loadBuffMapping,
    loadMapping,
} from '../mappinghandler';
import { activateHandler } from '../eventhandler';
import { initSettings } from '../util/extensionsettings';

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

    // start intercepting websocket requests
    webSocketListener();
    
    extensionSettings = await initSettings();
    await loadMapping();
    await loadBuffMapping();

    // if (extensionSettings.showTopButton) {
    //     createTopButton();
    // }


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
    // if (!isObserverActive) {
    //     console.debug('[BetterFloat] Starting observer');
    //     await applyMutation();
    //     console.log('[BetterFloat] Observer started');

    //     isObserverActive = true;
    // }
}

// Idea from: https://stackoverflow.com/a/53990245
function webSocketListener() {
    const networkFilters = {
        urls: [
            "wss://skinport.com/socket.io/?EIO=4&transport=websocket"
        ]
    };
    chrome.webRequest.onCompleted.addListener((details) => {
        const { tabId, requestId } = details;
        console.log('[BetterFloat] Intercepted websocket request: ', details);
        // do stuff here
    }, networkFilters);
}

let extensionSettings: ExtensionSettings;
let runtimePublicURL = chrome.runtime.getURL('../public');
// mutation observer active?
let isObserverActive = false;
init();