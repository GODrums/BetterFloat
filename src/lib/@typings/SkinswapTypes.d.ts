export namespace Skinswap {
	export interface InventoryResponse {
		couldRefresh: boolean;
		data: Item[];
		endOfResults: boolean;
		old: boolean;
		success: boolean;
	}

	export interface MarketItemsResponse {
		data: Item[];
		endOfResults: boolean;
		success: boolean;
	}

	export interface Item {
		accepted: boolean;
		appid: number;
		assetid: string;
		classid: string;
		id: number;
		inspect: Inspect;
		inspect_link: string;
		market_hash_name: string;
		name: string;
		overstock: Overstock;
		price: Price;
		qualities: Qualities;
		reason: null;
		stackId: string;
		stackIdWithHold: string;
		steamid: string;
		tradable: boolean;
		tradehold_days: number;
		tradehold_expires: null;
	}

	export interface Qualities {
		category: null;
		collection: null;
		commodity: boolean;
		doppler_phase: string | null;
		exterior: string;
		name_color: string;
		rarity: string;
		souvenir: boolean;
		stattrak: boolean;
		type: string;
		weapon: string;
	}

	export interface Price {
		buy: number;
		sell: number;
		trade: number;
	}

	export interface Overstock {
		count: number;
		limit: number;
	}

	export interface Inspect {
		charm: null;
		fade_percentage: null;
		fade_ranking: null;
		float: string;
		pattern: number;
		stickers: any[];
	}
}
