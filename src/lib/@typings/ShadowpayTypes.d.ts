export namespace Shadowpay {
	export type MarketGetItemsResponse = {
		items: Item[];
		status: string;
	};

	export type InventoryResponse = {
		inv: Item[];
		skip: number;
		status: string;
		total: number;
	};

	export interface Item {
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
		icon_url?: string;
		discount: number;
		hot_deal: number;
		shorten_exterior: string;
		steam_icon_url: string;
		steam_short_name: string;
		steam_icon_url_large: string;
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
		stickers: any[];
		is_external: boolean;
		is_favorite: boolean;
		is_hold: number;
		time_unhold: string | null;
		delivery_type: number;
		delivery_time: number;
		merchant_id: number;
		steam_url_name: string;
		seller_stats: {
			finished_seconds_seven_days: number;
			finished_seconds_fifteen_days: number;
			finished_percent_seven_days: number;
			finished_percent_fifteen_days: number;
			finished_count_seven_days: number;
			finished_count_fifteen_days: number;
		};
	}
}
