let loadNumber = 0;
openIntercept();

function openIntercept() {
	const open = window.XMLHttpRequest.prototype.open;
	console.log('[BetterFloat] Activating HttpRequest Intercept...');

	window.XMLHttpRequest.prototype.open = function () {
		(<XMLHttpRequest>this).addEventListener('load', (e) => {
			const target = <XMLHttpRequest>e.currentTarget;
			const targetUrl = new URL(target.responseURL);

			if (!targetUrl.hostname.includes(location.hostname)) {
				// console.debug('[BetterFloat] Ignoring HTTP request to: ' + target.responseURL);
				return;
			}
			if (['.js', '.css', '.svg', '.proto'].some((ext) => targetUrl.pathname.endsWith(ext))) {
				return;
			}

			const reponseHeaders = target.getAllResponseHeaders().split('\r\n');

			function parseJSON(text: string): undefined | any {
				try {
					return JSON.parse(text);
				} catch (_) {
					console.debug(`[BetterFloat] Failed to parse JSON for ${target.responseURL} : ${text}`);
					return {
						text: text,
					};
				}
			}

			// request finished loading
			if (target.readyState === 4) {
				document.dispatchEvent(
					new CustomEvent('BetterFloat_INTERCEPTED_REQUEST', {
						detail: {
							status: target.status,
							url: target.responseURL,
							headers: reponseHeaders,
							data: parseJSON(target.responseText),
						},
					})
				);
				// dispatch again on first page load
				if (loadNumber++ === 0) {
					setTimeout(() => {
						document.dispatchEvent(
							new CustomEvent('BetterFloat_INTERCEPTED_REQUEST', {
								detail: {
									status: target.status,
									url: target.responseURL,
									headers: reponseHeaders,
									data: parseJSON(target.responseText),
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
