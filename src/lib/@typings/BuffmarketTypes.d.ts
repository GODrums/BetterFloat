export namespace BuffMarket {
	export type SupportedCurrencyResponse = {
		code: string;
		data: {
			items: CurrencyItem[];
		};
		msg: string | null;
	};

	// https://api.buff.market/api/market/goods?game=csgo&page_num=1&page_size=50
	export type GoodsResponse = {
		code: string;
		data: {
			items: MarketListing[];
			page_num: number;
			page_size: number;
			total_count: number;
			total_page: number;
		};
		msg: string | null;
	};

	// https://api.buff.market/api/market/goods/info?game=csgo&goods_id=6018
	export type GoodsInfoResponse = {
		code: string;
		data: GoodsItem;
		msg: string | null;
	};

	//https://api.buff.market/api/market/goods/sell_order?game=csgo&page_num=1&page_size=10&goods_id=6018&sort_by=default
	export type SellOrderResponse = {
		code: string;
		data: {
			fop_str: string;
			goods_infos: {
				[item_id: number]: GoodsInfo;
			};
			has_market_stores: {
				[store_id: string]: boolean;
			};
			items: SellOrderListing[];
			page_num: number;
			page_size: number;
			preview_screenshots: { any: any };
			show_game_cms_icon: boolean;
			show_pay_method_icon: boolean;
			sort_by: string; // find all possible values
			src_url_background: string;
		};
		msg: string | null;
	};

	// https://api.buff.market/api/market/steam_inventory?state=cansell&game=csgo&sort_by=price.desc&page_num=1&page_size=40
	export type InventoryResponse = {
		code: string;
		data: {
			allow_bundle_inventory: boolean;
			allow_different_goods_bundle: boolean;
			brief_info: string;
			cs2_inspect_infos: any;
			currency: 'Dollar';
			currency_symbol: '$';
			depositable: boolean;
			fop_str: string;
			goods_infos: {
				[item_id: number]: GoodsInfo;
			};
			inventory_price: 'buff163';
			items: InventoryItem[];
			manual_plus_sellable: boolean;
			manual_sellable: boolean;
			page_num: number;
			page_size: number;
			preview_screenshots: any;
			progress_desc: {
				0: 'Idle';
				1: 'On sale';
				2: 'To deliver';
				3: 'Depositing';
				4: 'Not for sale';
				5: 'Supplying';
			};
			src_url_background: string;
			state_desc: {
				1: 'Not tradable';
				2: 'Not for sale';
				3: 'Tradable';
			};
			total_amount: string;
			total_amount_usd: string;
			total_count: number;
			total_page: number;
		};
		msg: string | null;
	};

	// https://api.buff.market/api/market/sell_order/preview/manual_plus/v2
	export type SellingPreviewResponse = {
		code: string;
		data: {
			add_desc_allowed: boolean;
			goods_infos: {
				[item_id: number]: GoodsInfo;
			};
			group_key_data: {
				[item_id: number]: GoodsInfo;
			};
			items: InventoryItem[];
			lowest_bargain_original_price: string;
			total_count: number;
		};
		msg: string | null;
	};

	// https://api.buff.market/api/market/sell_order/on_sale?game=csgo&page_num=1&page_size=40
	export type SellingOnSaleResponse = {
		code: string;
		data: {
			brief_info: string;
			fop_str: string;
			goods_infos: {
				[item_id: number]: GoodsInfo;
			};
			items: InventoryItem[];
			mode: any;
			page_num: number;
			page_size: number;
			total_count: number;
			user_infos: {
				[user_id: string]: {
					avatar: string;
					avatar_safe: string;
					is_auto_accept: boolean;
					is_premium_vip: boolean;
					nickname: string;
					seller_level: number;
					shop_id: string;
					user_id: string;
				};
			};
		};
		msg: string | null;
	};

	export type CurrencyItem = {
		buff_selected: boolean;
		name: string; // 'Euro'
		rate: number; // 0.0894815
		selected: boolean;
		steam_selected: boolean;
		symbol: string; // '€'
		value: string; // "EUR"
	};

	export type GoodsInfo = {
		appid: number;
		can_3d_inspect: boolean;
		can_inspect: boolean;
		description: string | null;
		game: string;
		goods_id: number;
		icon_url: string;
		item_id: number | null;
		market_hash_name: string;
		market_min_price: string;
		name: string;
		original_icon_url: string;
		short_name: string;
		steam_price: string;
		steam_price_cny: string;
		tags: {
			category: TagElement;
			category_group: TagElement;
			exterior: TagElement;
			itemset: TagElement;
			quality: TagElement;
			rarity: TagElement;
			series: TagElement;
			type: TagElement;
			weapon: TagElement;
		};
	};

	export interface Item {
		appid: number;
		can_bargain: boolean;
		game: 'csgo';
		description: string;
		bookmarked: boolean;
	}

	export interface GoodsItem extends Item {
		buy_max_price: string;
	}

	export interface InventoryItem extends Item {
		action_link: string;
		allow_bundle_inventory: boolean;
		amount: number;
		asset_info: {
			action_link: string;
			appid: number;
			assetid: string;
			classid: string;
			contextid: number;
			goods_id: number;
			id: string;
			info: {
				fraudwarnings: any | null;
				icon_url: string;
				metaphysic?: {
					data: {
						color: string;
						name: string;
					};
					title: string;
				};
				original_icon_url: string;
				paintindex: number;
				paintseed: number;
				phase_data?: {
					color: string;
					name: string;
				};
				stickers: any[];
				tournament_tags: any[];
			};
			instanceid: string;
			paintwear: string;
		};
		assetid: string;
		background_image_url: string;
		buff163_price: string;
		can_use_inspect_trn_url: boolean;
		classid: string;
		contextid: number;
		deposit_index: any;
		descriptions: any;
		equipped: boolean;
		fraudwarnings: any | null;
		game: 'csgo';
		goods_id: number;
		icon_url: string;
		img_src: string;
		instanceid: string;
		item_id: number | null;
		market_hash_name: string;
		market_min_price: string;
		name: string;
		original_icon_url: string;
		progress: number;
		progress_text: string;
		properties: any;
		punish_end_time: any;
		sell_min_price: string;
		sell_order_id: string;
		sell_order_income: string;
		sell_order_mode: number;
		sell_order_price: string;
		short_name: string;
		state: number;
		state_text: string;
		state_toast: string;
		steam_price: string;
		tags: {
			category: TagElement;
			category_group: TagElement;
			exterior: TagElement;
			itemset: TagElement;
			quality: TagElement;
			rarity: TagElement;
			series: TagElement;
			type: TagElement;
			weapon: TagElement;
		};
		tradeable: boolean;
		tradeable_text: any;
		tradeable_time: any;
	}
	export interface SellOrderListing extends Item {
		allow_bargain: boolean;
		allow_bargain_chat: boolean;
		asset_info: {
			action_link: string;
			appid: number;
			assetid: string;
			classid: string;
			contextid: number;
			goods_id: number;
			has_tradeable_cooldown: boolean;
			id: string;
			info: {
				fraudwarnings: any | null;
				icon_url: string;
				original_icon_url: string;
				paintindex: number;
				paintseed: number;
				stickers: any[];
				tournament_tags: any[];
			};
			instanceid: string;
			paintwear: string;
			tradeable_cooldown_text: string;
			tradeable_unfrozen_time: any;
		};
		background_url: string;
		can_bargain_chat: boolean;
		can_use_inspect_trn_url: boolean;
		cannot_bargain_reason: string;
		created_at: string;
		featured: number;
		fee: string;
		goods_id: number;
		id: string;
		img_src: string;
		income: string;
		lowest_bargain_price: string;
		mode: number;
		price: string;
		recent_average_duration: number;
		recent_deliver_rate: number;
		state: number;
		supported_pay_methods: number[];
		tradeable_cooldown: any | null;
		updated_at: number;
		user_id: string;
	}

	export interface MarketListing extends Item {
		appid: number;
		bookmarked: boolean;
		buy_max_price: string;
		buy_num: number;
		can_search_by_tournament: boolean;
		goods_info: {
			icon_url: string;
			info: {
				tags: {
					exterior: TagElement;
					quality: TagElement;
					rarity: TagElement;
					type: TagElement;
					weapon: TagElement;
				};
			};
			item_id: any | null;
			original_icon_url: string;
			steam_price: string;
			steam_price_cny: string;
		};
		has_buff_price_history: boolean;
		id: number;
		market_hash_name: string;
		market_min_price: string;
		name: string;
		quick_price: string;
		sell_min_price: string; // lowest listing price
		sell_num: number; // number of listings
		sell_reference_price: string;
		short_name: string;
		steam_market_url: string;
		transacted_num: number;
	}

	type TagElement = {
		category: string;
		id: number;
		internal_name: string;
		localized_name: string;
	};
}
