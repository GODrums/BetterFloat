export namespace Skinplace {
	export type InventoryResponse = {
		daily_withdraw_limit: number;
		instant_item_count_limit: number;
		instant_limit: number;
		inv: InventoryItem[];
		max_deposit_sum: number;
		status: string;
	};

	export type OffersResponse = {
		list: Offer[];
		status: string;
	};

	export type Offer = {
		count: number;
		deliveryTime: number;
		discount: number;
		id: number;
		isFavorite: boolean;
		isHold: boolean;
		isHotDeal: boolean;
		isMyItem: boolean;
		priceMarket: number;
		skin: MarketItem;
		timeUnhold: number;
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
		descriptions: {
			type: string;
			value: string;
			color?: string;
			name: string;
		}[];
		market_name: string;
		market_hash_name: string;
		steam_market_hash_name: string;
		project: string;
		skip_reason: null;
		untouchable: boolean;
		item_id: number;
		steam_short_name: string;
		is_stattrak: number;
		is_souvenir: number;
		rarity: string;
		rarity_color: string;
		steam_itemtype: string;
		exterior: string;
		shorten_exterior: string;
		phase: null;
		price: number;
		price_original: number;
		price_real: number;
		inspect_url: string;
		icon_url: string;
		tags: string[];
		stickers: any[];
	};
}
