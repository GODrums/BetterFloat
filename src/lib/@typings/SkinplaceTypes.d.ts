export namespace Skinplace {
	export type InventoryResponse = {
		daily_withdraw_limit: number;
		instant_item_count_limit: number;
		instant_limit: number;
		inv: InventoryItem[];
		max_deposit_sum: number;
		status: string;
	};

	export type GetItemsResponse = {
		items: GetItem[];
		status: string;
	};

	export type GetItem = {
		item_amount: number;
		id: number;
		item_id: number;
		user_id: number;
		state: string;
		price: number;
		price_market: number;
		price_real: number;
		price_usd: number;
		price_market_usd: number;
		steam_market_hash_name: string;
		project: string;
		floatvalue: number | null;
		paintindex: number | null;
		paintseed: number | null;
		time_created: string;
		time_finished: string | null;
		price_rate: number;
		inspect_url: string;
		discount: number;
		hot_deal: number;
		shorten_exterior: string;
		steam_icon_url: string;
		steam_short_name: string;
		steam_icon_url_large: string;
		cdn_icon_url: string;
		steam_exterior: string;
		steam_itemtype: string;
		steam_rarity: string;
		steam_rarity_color: string;
		steam_is_souvenir: number;
		steam_price_en: number;
		collection: string | null;
		subcategory_name: string;
		phase: string | null;
		is_stattrak: number;
		description: string;
		url_name: string;
		is_charity: boolean;
		is_my_item: boolean;
		steam_asset_id: number;
		count_stickers: number;
		stickers: unknown[];
		is_external: boolean;
		is_favorite: boolean;
		is_hold: number;
		time_unhold: string | null;
		delivery_type: number;
		delivery_time: number;
		merchant_id: number;
		steam_url_name: string;
		seller_stats: {
			finished_seconds_seven_days: number | null;
			finished_seconds_fifteen_days: number | null;
			finished_percent_seven_days: number | null;
			finished_percent_fifteen_days: number | null;
			finished_count_seven_days: number | null;
			finished_count_fifteen_days: number | null;
		};
		is_popular: boolean;
		is_best_price: boolean;
	};

	export type MarketItem = {
		exterior: string;
		float: number;
		fullName: string;
		id: number;
		image: string;
		isSouvenir: boolean;
		isStatTrak: boolean;
		name: string;
		phase: string;
		priceReal: number;
		project: string;
		rarity: string;
		shortenExterior: string;
		stickers: {
			id: number;
			name: string;
			image: string;
			priceReal: number;
			type: 'sticker';
		}[];
		subcategory: string;
		type: string;
		urlName: string;
	};

	export type InventoryItem = {
		appid: number;
		assetid: string;
		cdn_icon_url: string;
		descriptions: {
			type: string;
			value: string;
			color?: string;
			name: string;
		}[];
		exterior: string;
		floatvalue: number | null;
		is_stattrak: number;
		is_souvenir: number;
		market_name: string;
		market_hash_name: string;
		steam_market_hash_name: string;
		project: string;
		skip_reason: null;
		untouchable: boolean;
		item_id: number;
		steam_short_name: string;
		rarity: string;
		rarity_color: string;
		steam_itemtype: string;
		shorten_exterior: string;
		phase: string | null;
		price: number;
		price_original: number;
		price_real: number;
		inspect_url: string;
		icon_url: string;
		tags: string[];
		stickers: any[];
	};
}
