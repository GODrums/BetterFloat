/**
 * Connects Lis-Skins' page-owned Vue Query and Pinia stores to the isolated
 * content script via DOM events. This function must execute in the MAIN world
 * because Vue's properties are not visible across the content-script boundary.
 */
export function connectLisSkinsVue() {
	const isDev = process.env.NODE_ENV !== 'production';
	const lisWindow = window as typeof window & {
		__BetterFloat_LisSkins_Query_Bridge?: boolean;
	};
	if (lisWindow.__BetterFloat_LisSkins_Query_Bridge) return;
	lisWindow.__BetterFloat_LisSkins_Query_Bridge = true;

	const dataEvent = 'BetterFloat_LISSKINS_QUERY_DATA';
	const cartDataEvent = 'BetterFloat_LISSKINS_CART_DATA';
	const requestEvent = 'BetterFloat_REQUEST_LISSKINS_QUERY_DATA';
	const supportedQueries = new Set(['skins', 'obtained-skins', 'skin', 'inventory']);
	const emittedQueries = new Map<string, number>();
	let queryCache: any;
	let cartStore: any;

	function publishQuery(query: any, force = false) {
		const type = query?.queryKey?.[0];
		if (!supportedQueries.has(type) || query?.state?.status !== 'success' || query?.getObserversCount?.() <= 0) return;

		const queryHash = String(query.queryHash ?? JSON.stringify(query.queryKey));
		const dataUpdatedAt = Number(query.state.dataUpdatedAt ?? 0);
		if (!force && emittedQueries.get(queryHash) === dataUpdatedAt) return;

		try {
			const data = JSON.parse(JSON.stringify(query.state.data));
			document.dispatchEvent(
				new CustomEvent(dataEvent, {
					detail: JSON.stringify({ type, queryHash, queryKey: query.queryKey, dataUpdatedAt, data }),
				})
			);
			emittedQueries.set(queryHash, dataUpdatedAt);
		} catch (error) {
			if (isDev) console.debug('[BetterFloat] Failed to serialize Lis-Skins query data:', error);
		}
	}

	function publishActiveQueries(force = false) {
		for (const query of queryCache?.getAll?.() ?? []) publishQuery(query, force);
	}

	function publishCartItems() {
		if (!cartStore) return;
		try {
			document.dispatchEvent(
				new CustomEvent(cartDataEvent, {
					detail: JSON.stringify(cartStore.$state?.cartItems ?? cartStore.cartItems ?? []),
				})
			);
		} catch (error) {
			if (isDev) console.debug('[BetterFloat] Failed to serialize Lis-Skins cart data:', error);
		}
	}

	function connectQueryCache() {
		const nuxtRoot = document.querySelector<HTMLElement>('#__nuxt') as any;
		if (!nuxtRoot?._vnode?.component?.isMounted) return false;
		const queryClient = nuxtRoot?.__vue_app__?._context?.provides?.VUE_QUERY_CLIENT;
		const cache = queryClient?.getQueryCache?.();
		if (!cache) return false;

		queryCache = cache;
		cartStore = nuxtRoot.__vue_app__?._context?.config?.globalProperties?.$pinia?._s?.get('cart');
		document.documentElement.setAttribute('data-betterfloat-lis-hydrated', 'true');
		queryCache.subscribe((event: any) => {
			publishQuery(event?.query, event?.type === 'observerAdded');
		});
		cartStore?.$subscribe?.(() => publishCartItems(), { detached: true });
		publishActiveQueries(true);
		publishCartItems();
		return true;
	}

	document.addEventListener(requestEvent, () => {
		publishActiveQueries(true);
		publishCartItems();
	});

	if (connectQueryCache()) return;
	const startedAt = Date.now();
	const interval = window.setInterval(() => {
		if (connectQueryCache() || Date.now() - startedAt >= 15_000) {
			window.clearInterval(interval);
			if (!queryCache && isDev) console.debug('[BetterFloat] Lis-Skins Vue Query cache was not available; using request interception fallback.');
		}
	}, 100);
}
