import { enablePageMessaging } from '~lib/messaging/page-bridge';
import type { LisSkins } from './types';

const lisItemsById = new Map<number, LisSkins.MarketItem>();
const lisItemsBySlug = new Map<string, LisSkins.MarketItem>();
const lisItemsByIcon = new Map<string, LisSkins.InventoryItem>();
const dataUpdateHandlers = new Set<() => void>();
const activeQuerySignatures = new Map<LisSkins.QueryType, string>();
let activeMarketItems: LisSkins.MarketItem[] = [];
let activeOfferItems: LisSkins.MarketItem[] = [];
let activeCartItems: LisSkins.CartItem[] = [];
let activeSkin: LisSkins.Skin | undefined;
let isEventHandlerActive = false;

const LIS_QUERY_DATA_EVENT = 'BetterFloat_LISSKINS_QUERY_DATA';
const LIS_CART_DATA_EVENT = 'BetterFloat_LISSKINS_CART_DATA';
const LIS_QUERY_DATA_REQUEST_EVENT = 'BetterFloat_REQUEST_LISSKINS_QUERY_DATA';

function notifyDataUpdate() {
	for (const handler of dataUpdateHandlers) handler();
}

function processLisSkinsQueryEvent(event: Event) {
	const detail = (event as CustomEvent<string>).detail;
	if (typeof detail !== 'string') return;

	try {
		const payload = JSON.parse(detail) as LisSkins.QueryPayload;
		if (!['skins', 'obtained-skins', 'skin', 'inventory'].includes(payload.type) || !payload.queryHash || !payload.data) return;

		const signature = `${payload.queryHash}:${payload.dataUpdatedAt}`;
		if (activeQuerySignatures.get(payload.type) === signature) return;
		activeQuerySignatures.set(payload.type, signature);

		if (payload.type === 'skins') {
			const items = (payload.data as LisSkins.MarketApiResponse).data ?? [];
			activeMarketItems = items;
			cacheLisSkinsMarketItems(items);
		} else if (payload.type === 'obtained-skins') {
			const items = (payload.data as LisSkins.MarketApiResponse).data ?? [];
			activeOfferItems = items;
			cacheLisSkinsMarketItems(items);
		} else if (payload.type === 'skin') {
			activeSkin = (payload.data as LisSkins.SkinApiResponse).data?.skin;
		} else {
			cacheLisSkinsInventoryItems((payload.data as LisSkins.InventoryApiResponse).data ?? []);
		}

		notifyDataUpdate();
	} catch (error) {
		console.debug('[BetterFloat] Ignoring malformed Lis-Skins Vue Query data:', error);
	}
}

function processLisSkinsCartEvent(event: Event) {
	const detail = (event as CustomEvent<string>).detail;
	if (typeof detail !== 'string') return;

	try {
		const items = JSON.parse(detail) as LisSkins.CartItem[];
		if (!Array.isArray(items)) return;
		activeCartItems = items;
		for (const item of items) {
			if (!item.obtained_skin) continue;
			cacheLisSkinsMarketItems([
				{
					...item.obtained_skin,
					final_withdrawal_price: item.current_price,
					skin: item.skin,
				},
			]);
		}
		notifyDataUpdate();
	} catch (error) {
		console.debug('[BetterFloat] Ignoring malformed Lis-Skins cart data:', error);
	}
}

function cacheLisSkinsMarketItems(items: LisSkins.MarketItem[]) {
	for (const item of items) {
		lisItemsById.set(item.id, item);
		if (item.skin?.url) {
			lisItemsBySlug.set(item.skin.url, item);
		}
	}
}

function cacheLisSkinsInventoryItems(items: LisSkins.InventoryItem[]) {
	for (const item of items) {
		lisItemsByIcon.set(item.icon_url, item);
	}
}

export function getLisSkinsItem(id: number) {
	return lisItemsById.get(id);
}

export function getLisSkinsItemBySlug(slug: string) {
	return lisItemsBySlug.get(slug);
}

export function getLisSkinsItemByIcon(iconUrl: string) {
	return lisItemsByIcon.get(iconUrl);
}

export function getActiveLisSkinsMarketItems() {
	return activeMarketItems;
}

export function getActiveLisSkinsOfferItems() {
	return activeOfferItems;
}

export function getActiveLisSkinsCartItems() {
	return activeCartItems;
}

export function getActiveLisSkinsSkin() {
	return activeSkin;
}

export function subscribeLisSkinsDataUpdates(handler: () => void) {
	dataUpdateHandlers.add(handler);
	return () => dataUpdateHandlers.delete(handler);
}

export function requestLisSkinsQueryData() {
	document.dispatchEvent(new CustomEvent(LIS_QUERY_DATA_REQUEST_EVENT));
}

export function activateLisSkinsEventHandler() {
	if (isEventHandlerActive) {
		return;
	}
	isEventHandlerActive = true;
	enablePageMessaging('getMarketComparison');
	document.addEventListener(LIS_QUERY_DATA_EVENT, processLisSkinsQueryEvent);
	document.addEventListener(LIS_CART_DATA_EVENT, processLisSkinsCartEvent);
}
