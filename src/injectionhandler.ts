//we do not want to inject the script into the blog page
if (!location.hostname.includes('blog.')) {
    injectScript();
}
// some markets like skinport use websockets to update the page
if (location.href.includes('skinport.com')) {
    injectWebsocketListener();
}

// inject script into page
function injectScript() {
    let script = document.createElement('script');
    script.src = chrome.runtime.getURL('js/inject.js');
    script.onload = function () {
        (<HTMLScriptElement>this).remove();
    };
    (document.head || document.documentElement).appendChild(script);
}

// inject wss stream listener into page
function injectWebsocketListener() {
    let script = document.createElement('script');
    script.type = 'module';
    script.src = chrome.runtime.getURL('js/skinport/socketConnection.js');
    script.onload = function () {
        (<HTMLScriptElement>this).remove();
    };
    (document.head || document.documentElement).appendChild(script);
}
