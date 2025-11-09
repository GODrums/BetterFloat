export type Prettify<T> = {
	[P in keyof T]: T[P];
};

export type ItemType = 'Container' | 'Sticker' | 'Weapon' | 'Knife' | 'Gloves';

export type ItemQuality = '' | 'Souvenir' | 'StatTrak™' | 'Base Grade Container' | 'Remarkable Sticker' | 'Exotic Sticker' | 'Extraordinary Sticker' | 'High Grade Sticker';

export type ItemStyle = '' | 'Vanilla' | DopplerPhase;

export type DopplerPhase = 'Sapphire' | 'Ruby' | 'Black Pearl' | 'Emerald' | 'Phase 1' | 'Phase 2' | 'Phase 3' | 'Phase 4';

export type ItemCondition = 'Factory New' | 'Minimal Wear' | 'Field-Tested' | 'Well-Worn' | 'Battle-Scarred';

export interface EventData<T> {
	status: number;
	url: string;
	headers: string[];
	data: T;
}

export namespace CSFloat {
	export interface SellSettings {
		active: boolean;
		displayBuff: boolean;
		percentage: number;
	}

	export interface BFNotification {
		name: string;
		percentage: number;
		active: boolean;
		floatRanges: number[];
		browser: boolean;
	}

	export type ListingsResponse = {
		cursor: string;
		data: ListingData[];
	};
	export type Me = {
		actionable_trades: number;
		pending_offers: number;
		has_unread_notifications: boolean;
		user: {
			api_key?: string;
			avatar: string;
			away: boolean;
			background_url: string;
			balance: number;
			email: string;
			extension_setup_at: string;
			fee: number;
			firebase_messaging: {
				last_updated: string;
				platform: number;
			};
			flags: number;
			has_2fa: boolean;
			has_valid_steam_api_key: boolean;
			know_your_customer: string;
			obfuscated_id: string;
			online: boolean;
			pending_balance: number;
			preferences: {
				max_offer_discount: number;
				offers_enabled: boolean;
			};
			stall_public: boolean;
			statistics: {
				median_trade_time: number;
				total_avoided_trades: number;
				total_failed_trades: number;
				total_purchases: number;
				total_sales: number;
				total_trades: number;
				total_verified_trades: number;
			};
			steam_api_key: string;
			steam_id: string;
			subscriptions: string[];
			trade_token: string;
			username: string;
			verification_mode: string;
			withdraw_fee: number;
		};
	};
	export namespace ItemSchema {
		export type ItemType = 'agents' | 'collections' | 'containers' | 'custom_stickers' | 'rarities' | 'stickers' | 'weapons';

		export type TypeSchema = {
			[key in ItemType]: {
				[key2: string]: WeaponSchema;
			};
		};

		export type WeaponSchema = {
			name: string;
			paints: {
				[key: string]: SingleSchema;
			};
			sticker_amount: number;
			type: string;
		};

		export type SingleSchema = {
			collection: string;
			image: string;
			index: number;
			max: number;
			min: number;
			rarity: number;
			name: string;
			normal_prices: number[];
			normal_volume: number[];
			souvenir: boolean;
		};
	}

	export type InventoryReponse = Item[];

	export type FloatItem = {
		name: string;
		quality: string;
		style: ItemStyle;
		float: number | undefined;
		condition: ItemCondition | undefined;
		price: number;
		isStatTrak: boolean;
		isSouvenir: boolean;
		isHighlight: boolean;
	};

	export type ListingData = {
		auction_details?: {
			expires_at: string;
			min_next_bid: number;
			reserve_price: number;
			top_bid: {
				contract_id: string;
				created_at: string;
				id: string;
				obfuscated_buyer_id: string;
				price: number;
				state: string;
			};
		};
		created_at: string;
		id: string;
		is_seller: boolean;
		is_watchlisted: boolean;
		item: Item;
		max_offer_discount?: number;
		min_offer_price?: number;
		price: number;
		reference?: ReferenceData;
		seller?: SellerData;
		sold_at?: string;
		state: 'listed' | 'delisted' | 'sold';
		type: 'buy_now' | 'auction';
		watchers: number;
	};

	export type Item = {
		asset_id: string;
		collection?: string;
		cs2_screenshot_at?: string;
		cs2_screenshot_id?: string;
		d_param?: string;
		def_index: number;
		description?: string;
		fade?: {
			percentage: number;
			rank: number;
			seed: number;
		};
		float_value?: number;
		gs_sig: string;
		has_screenshot: boolean;
		low_rank?: number;
		high_rank?: number;
		icon_url: string;
		inspect_link?: string;
		is_commodity: boolean;
		is_souvenir?: boolean;
		is_stattrak?: boolean;
		item_name: string;
		keychains: StickerData[];
		keychain_index?: number;
		keychain_pattern?: number;
		market_hash_name: string;
		paint_index?: number;
		paint_seed?: number;
		phase?: DopplerPhase;
		quality?: number;
		rarity: number;
		rarity_name: string;
		scm: SCMType;
		serialized_inspect?: string;
		sticker_index?: number;
		stickers?: StickerData[];
		tradable: 0 | 1;
		type: 'skin' | 'sticker' | 'container' | 'agent' | 'patch' | 'charm';
		type_name: 'Skin' | 'Sticker' | 'Container' | 'Agent' | 'Patch' | 'Charm';
		wear_name: 'Factory New' | 'Minimal Wear' | 'Field-Tested' | 'Well-Worn' | 'Battle-Scarred';
	};

	export type SellerData = {
		avatar: string;
		away: boolean;
		flags: number;
		has_valid_steam_api_key: boolean;
		obfuscated_id: string;
		online: boolean;
		stall_public: boolean;
		statistics: {
			median_trade_time: number;
			total_avoided_trades: number;
			total_failed_trades: number;
			total_trades: number;
			total_verified_trades: number;
		};
		steam_id: string;
		username: string;
		verification_mode: string;
	};

	export type StickerData = {
		icon_url: string;
		name: string;
		offset_x?: number;
		offset_y?: number;
		offset_z?: number;
		pattern?: number; // only for charms
		reference?: {
			price: number;
			quantity: number;
			updated_at: string;
		};
		slot: number;
		stickerId: number;
		wear?: number;
	};

	// https://csfloat.com/api/v1/meta/location
	export type Location = {
		inferred_location: {
			currency: string;
			long: string; // country
			short: string; // country code
		};
	};

	export type WatchlistData = {
		data: CSFloat.ListingData[];
	};

	// https://csfloat.com/api/v1/meta/exchange-rates
	export type ExchangeRates = {
		data: {
			[key: string]: number;
		};
	};

	export type HistoryGraphData = {
		avg_price: number;
		count: number;
		day: string;
	};

	export type HistorySalesData = {
		createdAt: string;
		id: string;
		is_seller: boolean;
		item: Item;
		price: number;
		reference: ReferenceData;
		sold_at: string;
		state: string;
		type: string;
		watchers: number;
	};

	export type MeBuyOrderData = {
		count: number;
		orders: BuyOrderData[];
	};

	export type BuyOrderData = {
		market_hash_name?: string;
		expression?: string;
		price: number;
		qty: number;
	};

	export type OffersTimeline = {
		count: number;
		offers: Offer[];
	};

	export type Offer = {
		buyer: SellerData;
		buyer_id: string;
		contract: ListingData;
		contract_id: string;
		contract_price: number;
		created_at: string;
		expires_at: string;
		id: string;
		price: number;
		state: string;
		type: 'buyer_offer' | 'seller_offer';
	};

	export type OfferHistory = {
		buyer_id: string;
		contract_id: string;
		contract_price: number;
		created_at: string;
		expires_at: string;
		id: string;
		price: number;
		state: string;
		type: string;
	}[];

	export type ReferenceData = {
		base_price: number;
		float_factor: number;
		last_updated: string;
		predicted_price: number;
		quantity: number;
	};

	export type SCMType = {
		price: number;
		volume: number;
	};
}
