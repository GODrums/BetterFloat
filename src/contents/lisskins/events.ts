import type { EventData } from '~lib/@typings/FloatTypes';
import { activateSiteEventHandler } from '~lib/shared/events';

export namespace LisSkins {
	export type MarketApiResponse = {
		data?: MarketItem[];
		max_price: number;
		meta: {
			current_page: number;
			last_page: number;
			per_page: number;
			total: number;
		};
		min_price: number;
	};

	export type InventoryApiResponse = {
		data?: InventoryItem[];
		disabled_count: number;
	};

	export type Item = MarketItem | InventoryItem;

	export type MarketItem = {
		id: number;
		final_withdrawal_price: number;
		item_float?: string | number | null;
		similar_count?: number;
		skin?: {
			id?: number;
			name?: string;
			name_short?: string;
			url?: string;
			exterior?: {
				title_short?: string;
			};
			skin_type?: {
				title?: string;
				url?: string;
			};
		};
		stickers?: MarketSticker[];
		tag_manager_data?: {
			currency?: string;
			price?: number;
		};
	};

	export type InventoryItem = {
		name: string;
		name_short: string;
		price: number;
		asset_id: string;
		icon_url: string;
		stickers?: InventorySticker[];
		exterior?: {
			id?: number;
			title?: string;
			title_short?: string;
			css_color?: string;
		};
		sort_order?: number;
		skin_type?: {
			id?: number;
			title?: string;
			url?: string;
			is_popular?: boolean;
		};
		skin_rarity?: {
			id?: number;
			title?: string;
			sort_order?: number;
			color?: string;
		};
		disabled_reason?: string | null;
		item_float?: string | number | null;
	};

	export type MarketSticker = {
		wear?: number | null;
		prepared_wear?: number | null;
		skin_sticker?: {
			is_charm?: boolean;
			title?: string;
			skin?: {
				name?: string;
				name_short?: string;
				steam_price?: number | null;
			};
		};
	};

	export type InventorySticker = {
		name: string;
		image?: string;
		steam_link?: string;
	};
}

const lisItemsById = new Map<number, LisSkins.MarketItem>();
const lisItemsBySlug = new Map<string, LisSkins.MarketItem>();
const lisItemsByIcon = new Map<string, LisSkins.InventoryItem>();
let isEventHandlerActive = false;

function processLisSkinsEvent(eventData: EventData<unknown>) {
	console.debug('[BetterFloat] Received data from url: ' + eventData.url + ', data:', eventData.data);

	if (eventData.url.includes('/api/v2/obtained-skins')) {
		cacheLisSkinsMarketItems((eventData.data as LisSkins.MarketApiResponse).data ?? []);
	} else if (eventData.url.includes('/api/v2/sell-skins/inventory')) {
		cacheLisSkinsInventoryItems((eventData.data as LisSkins.InventoryApiResponse).data ?? []);
	} else {
		return;
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

export function activateLisSkinsEventHandler() {
	if (isEventHandlerActive) {
		return;
	}
	isEventHandlerActive = true;
	activateSiteEventHandler(processLisSkinsEvent);
}
