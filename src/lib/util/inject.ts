export function addScript() {
	const isDev = process.env.NODE_ENV !== 'production';
	let loadNumber = 0;

	/**
	 * Waxpeer now server-renders its catalog into Nuxt state. Consequently, the
	 * initial listings never pass through fetch/XMLHttpRequest for the generic
	 * interceptor below to observe. Expose the small part of the hydrated state
	 * the isolated content script needs through the same DOM-event bridge.
	 */
	function waxpeerNuxtStateBridge() {
		if (location.hostname !== 'waxpeer.com' && !location.hostname.endsWith('.waxpeer.com')) return;
		const pageWindow = window as typeof window & {
			__BetterFloat_Waxpeer_State_Bridge?: boolean;
			__NUXT__?: unknown;
			$nuxt?: { payload?: unknown; $pinia?: { state?: { value?: unknown } } };
		};
		if (pageWindow.__BetterFloat_Waxpeer_State_Bridge) return;
		pageWindow.__BetterFloat_Waxpeer_State_Bridge = true;

		const requestEvent = 'BetterFloat_WAXPEER_STATE_REQUEST';
		const responseEvent = 'BetterFloat_WAXPEER_STATE';
		let scheduled = false;

		function readPrice(value: Record<string, any>) {
			const price = value.price ?? value.price_value ?? value.priceValue;
			if (typeof price === 'number' || typeof price === 'string') return Number(price);
			if (price && typeof price === 'object') return Number(price.USD ?? price.usd ?? price.amount ?? price.value);
			return Number.NaN;
		}

		function emitHydratedItems() {
			scheduled = false;
			const roots = [pageWindow.__NUXT__, pageWindow.$nuxt?.payload, pageWindow.$nuxt?.$pinia?.state?.value];
			const seen = new WeakSet<object>();
			const items = new Map<string, { item_id: string; name: string; price: number; phase?: string }>();
			let visited = 0;

			function visit(value: unknown, depth: number) {
				if (!value || typeof value !== 'object' || depth > 14 || visited++ > 50_000 || seen.has(value)) return;
				seen.add(value);

				const record = value as Record<string, any>;
				const id = record.item_id ?? record.itemId ?? record.listing_id ?? record.listingId ?? record.id;
				const name = record.market_hash_name ?? record.marketHashName ?? record.name;
				const price = readPrice(record);
				if ((typeof id === 'string' || typeof id === 'number') && typeof name === 'string' && name.length > 2 && Number.isFinite(price)) {
					const normalizedId = String(id);
					const rawPhase = record.phase ?? record.doppler_phase ?? record.dopplerPhase;
					const phase = typeof rawPhase === 'string' ? rawPhase : undefined;
					items.set(normalizedId, { item_id: normalizedId, name, price, phase });
				}

				try {
					for (const child of Array.isArray(value) ? value : Object.values(record)) visit(child, depth + 1);
				} catch (_) {
					// Vue proxies may throw while a route is being replaced. The next request
					// from the content script will inspect the settled state again.
				}
			}

			for (const root of roots) visit(root, 0);
			if (items.size > 0) {
				document.dispatchEvent(new CustomEvent(responseEvent, { detail: { items: Array.from(items.values()) } }));
			}
		}

		function scheduleEmit() {
			if (scheduled) return;
			scheduled = true;
			setTimeout(emitHydratedItems, 0);
		}

		document.addEventListener(requestEvent, scheduleEmit);
		// Cover the case where the content script listener was already installed.
		setTimeout(scheduleEmit, 0);
		setTimeout(scheduleEmit, 500);
	}

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
		if (isDev) {
			console.log('[BetterFloat] Activating HttpRequest Intercept...');
		}

		window.XMLHttpRequest.prototype.open = function () {
			(<XMLHttpRequest>this).addEventListener('load', (e) => {
				const target = <XMLHttpRequest>e.currentTarget;
				const targetUrl = new URL(target.responseURL);

				if (!isRelatedHost(targetUrl.hostname)) {
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
						if (isDev) {
							console.debug(`[BetterFloat] Failed to parse JSON for ${target.responseURL} : ${text}`);
						}
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

			return Reflect.apply(open, this, arguments as unknown as Parameters<typeof open>);
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
		if (isDev) {
			console.log('[BetterFloat] Activating Fetch Intercept...');
		}

		window.fetch = (async (...args) => {
			const response = await originalFetch(...args);
			const url = response.url;
			const targetUrl = new URL(url);

			if (!isRelatedHost(targetUrl.hostname)) {
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
				if (isDev) {
					console.debug(`[BetterFloat] Failed to parse JSON for ${url}`);
				}
			}

			return response;
		}) as typeof fetch;

		// Mark as intercepted
		(window as any).__BetterFloat_Fetch_Intercepted = true;
	}

	if (location.hostname === 'gamerpay.gg') {
		return;
	}

	function isRelatedHost(hostname: string) {
		return hostname === location.hostname || hostname.endsWith(`.${location.hostname}`) || location.hostname.endsWith(`.${hostname}`);
	}

	xmlHttpRequestIntercept();
	fetchIntercept();
	waxpeerNuxtStateBridge();
}
