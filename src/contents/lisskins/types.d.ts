export namespace LisSkins {
	export type QueryType = 'skins' | 'obtained-skins' | 'skin' | 'inventory';

	export type QueryPayload = {
		type: QueryType;
		queryHash: string;
		queryKey: unknown[];
		dataUpdatedAt: number;
		data: unknown;
	};

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

	export type Skin = {
		id: number;
		name: string;
		name_short?: string;
		url: string;
		image_url_small?: string;
		image_url_big?: string;
	};

	export type SkinApiResponse = {
		data?: {
			skin?: Skin;
		};
	};

	export type CartItem = {
		id: number;
		current_price: number;
		is_available: boolean;
		markedForRemoval?: boolean;
		skin: Skin & NonNullable<MarketItem['skin']>;
		obtained_skin?: MarketItem;
	};

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
