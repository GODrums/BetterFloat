import type { EventData } from '~lib/@typings/FloatTypes';
import type { Waxpeer } from '~lib/@typings/WaxpeerTypes';
import { activateSiteEventHandler } from '~lib/shared/events';
import { cacheWaxpeerItems, extractWaxpeerItemPageListings } from './cache';
import { parseWaxpeerNuxtItems } from './nuxt';

const WAXPEER_STATE_REQUEST_EVENT = 'BetterFloat_WAXPEER_STATE_REQUEST';
const WAXPEER_STATE_EVENT = 'BetterFloat_WAXPEER_STATE';

function cacheItems(data: unknown, onItemsCached?: () => void) {
	const items = Array.isArray(data) ? data : (data as Partial<Waxpeer.MarketData> | undefined)?.items;
	if (!Array.isArray(items) || items.length === 0) return;
	cacheWaxpeerItems(items as Waxpeer.Listing[]);
	onItemsCached?.();
}

function processWaxpeerEvent(eventData: EventData<unknown>, onItemsCached?: () => void) {
	console.debug('[BetterFloat] Received data from url: ' + eventData.url + ', data:', eventData.data);
	if (eventData.url.includes('api/data/index') || /\/api\/[^/]+\/browse(?:\?|$)/.test(eventData.url)) {
		cacheItems(eventData.data, onItemsCached);
	} else if (/\/api\/v2\/[^/]+\/item\//.test(eventData.url)) {
		cacheItems(extractWaxpeerItemPageListings(eventData.data), onItemsCached);
	} else if (eventData.url.includes('_payload.json')) {
		cacheItems(parseWaxpeerNuxtItems(JSON.stringify(eventData.data)), onItemsCached);
	}
}

export function requestWaxpeerPageItems() {
	document.dispatchEvent(new CustomEvent(WAXPEER_STATE_REQUEST_EVENT));
}

export function activateWaxpeerEventHandler(onItemsCached?: () => void) {
	activateSiteEventHandler((eventData) => processWaxpeerEvent(eventData, onItemsCached));
	document.addEventListener(WAXPEER_STATE_EVENT, (event) => {
		cacheItems((event as CustomEvent<{ items?: Waxpeer.Listing[] }>).detail, onItemsCached);
	});
	cacheItems(parseWaxpeerNuxtItems(document.querySelector<HTMLScriptElement>('script#__NUXT_DATA__')?.textContent), onItemsCached);
	requestWaxpeerPageItems();
}
