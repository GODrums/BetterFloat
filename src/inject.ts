interceptNetworkRequests();

function interceptNetworkRequests() {
    const open = window.XMLHttpRequest.prototype.open;
    const isNative = open.toString().indexOf('native code') != -1;
    console.log('activating network interceptor');

    // don't hijack if already hijacked
    if (isNative) {
        // shadow open and capture onLoad
        window.XMLHttpRequest.prototype.open = function() {
            (<XMLHttpRequest>this).addEventListener('load', (e) => {
                let current = <XMLHttpRequest>e.currentTarget;

                // simple try-parse
                function tryParseJSON(r: string): undefined | { data: any } {
                    try {
                        return JSON.parse(r);
                    } catch (_) {
                        return {
                            data: { raw_content: r }
                        };
                    }
                }
                // request finished loading
                if (current.readyState == 4) {
                    document.dispatchEvent(new CustomEvent("BetterFloat_INTERCEPTED_REQUEST", {
                        detail: {
                            status: current.status,
                            url: current.responseURL,
                            data: JSON.parse(current.responseText)
                        }
                    }));
                    console.debug(`[BetterFloat] Sent event for url: ${current.responseURL} with data:`, JSON.parse(current.responseText));
                }
            });

            return open.apply(this, arguments);
        };
    }
}