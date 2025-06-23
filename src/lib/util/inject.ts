export function addScript() {
	let loadNumber = 0;

	/**
	 * Intercept XMLHttpRequests to get data from the requests.
	 * Older frameworks and libraries use XMLHttpRequests to fetch data.
	 */
	function xmlHttpRequestIntercept() {
		// Check if we've already intercepted XMLHttpRequest
		if ((window as any).__BetterFloat_XMLHttpRequest_Intercepted) {
			return;
		}

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
						}, 500);
					}
				}
			});

			return open.apply(this, arguments);
		};

		// Mark as intercepted
		(window as any).__BetterFloat_XMLHttpRequest_Intercepted = true;
	}

	/**
	 * Some sites use the modern fetch API instead of XMLHttpRequest,
	 * so we need to intercept fetch requests as well.
	 */
	function fetchIntercept() {
		// Check if we've already intercepted fetch
		if ((window as any).__BetterFloat_Fetch_Intercepted) {
			return;
		}

		const originalFetch = window.fetch;
		console.log('[BetterFloat] Activating Fetch Intercept...');

		window.fetch = async function (...args) {
			const response = await originalFetch.apply(this, args);
			const url = response.url;
			const targetUrl = new URL(url);

			if (!targetUrl.hostname.includes(location.hostname)) {
				return response;
			}
			if (['.js', '.css', '.svg', '.proto'].some((ext) => targetUrl.pathname.endsWith(ext))) {
				return response;
			}

			// Clone the response to be able to read its body multiple times
			const clone = response.clone();
			try {
				const data = await clone.json();
				document.dispatchEvent(
					new CustomEvent('BetterFloat_INTERCEPTED_REQUEST', {
						detail: {
							status: response.status,
							url: url,
							headers: Array.from(response.headers.entries()),
							data: data,
						},
					})
				);
			} catch (_) {
				console.debug(`[BetterFloat] Failed to parse JSON for ${url}`);
			}

			return response;
		};

		// Mark as intercepted
		(window as any).__BetterFloat_Fetch_Intercepted = true;
	}

	xmlHttpRequestIntercept();
	fetchIntercept();
}
