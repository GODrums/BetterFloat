injectScript();
// injectWebsocketListener();

// inject script into page
function injectScript() {
    let script = document.createElement('script');
    script.src = chrome.runtime.getURL('js/inject.js');
    script.onload = function () {
        (<HTMLScriptElement>this).remove();
    };
    (document.head || document.documentElement).appendChild(script);
}

// can listen to Skinport websocket wss stream
// function injectWebsocketListener() {
//     let script = document.createElement('script');
//     script.src = chrome.runtime.getURL('js/websocketlistener.js');
//     script.onload = function () {
//         (<HTMLScriptElement>this).remove();
//     };
//     (document.head || document.documentElement).appendChild(script);
// }