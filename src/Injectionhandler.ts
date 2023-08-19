injectScript();

// inject script into page
function injectScript() {
    let script = document.createElement('script');
    script.src = chrome.runtime.getURL('js/inject.js');
    script.onload = function () {
        (<HTMLScriptElement>this).remove();
    };
    (document.head || document.documentElement).appendChild(script);
    
}