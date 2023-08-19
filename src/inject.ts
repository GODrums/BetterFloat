let loadNumber = 0;
let lastRequestUrl = '';

openIntercept();

function openIntercept() {
    const open = window.XMLHttpRequest.prototype.open;
    console.log('[BetterFloat] Activating HttpRequest Intercept...');

    window.XMLHttpRequest.prototype.open = function () {
        (<XMLHttpRequest>this).addEventListener('load', (e) => {
            let target = <XMLHttpRequest>e.currentTarget;
            if (target.responseURL == lastRequestUrl) {
                console.debug('[BetterFloat] Ignoring duplicate request: ' + target.responseURL);
                return;
            }
            lastRequestUrl = target.responseURL;

            // request finished loading
            if (target.readyState == 4) {
                document.dispatchEvent(
                    new CustomEvent('BetterFloat_INTERCEPTED_REQUEST', {
                        detail: {
                            status: target.status,
                            url: target.responseURL,
                            data: JSON.parse(target.responseText),
                        },
                    })
                );
                // dispatch again on first page load
                if (loadNumber++ == 0) {
                    setTimeout(() => {
                        document.dispatchEvent(
                            new CustomEvent('BetterFloat_INTERCEPTED_REQUEST', {
                                detail: {
                                    status: target.status,
                                    url: target.responseURL,
                                    data: JSON.parse(target.responseText),
                                },
                            })
                        );
                    }, 1000);
                }
            }
        });

        return open.apply(this, arguments);
    };
}
