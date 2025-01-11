export namespace CSMoney {
	export type UserInventoryResponse = {
		cost: number;
		items: InventoryItem[];
		total: number;
	};

	export type UserInventoryPopupResponse = {
		item: MarketItem;
	};

	export type SingleSellOrderResponse = {
		item: MarketItem;
	};

	export type SellOrderResponse = {
		items: MarketItem[];
	};

	export type Item = {
		appId: number;
		id: number; // item id
	};

	export interface InventoryItem extends Item {
		'3d'?: string;
		assetId: number;
		botPrice: number;
		buyOrder: any | null;
		collection: any | null;
		comission: number;
		createdAt?: number;
		defaultPrice: number;
		float: string;
		fullName: string; //"★ Sport Gloves | Nocts (Minimal Wear)"
		hasHighDemand: boolean;
		hasTradeLock: boolean;
		img: string;
		inspect: string;
		isAClass: boolean;
		isUnavailable: boolean;
		nameId: number;
		onSale: boolean;
		overpay?: {
			// prob more here that I don't know about
			float: number;
		};
		overprice: number;
		overstockDiff: number;
		pattern: number;
		price: number; // e.g. 867.02
		quality: string; // e.g. fn
		rarity: string;
		recommendedPrice: {
			best: number;
			decreased: number;
			lowest: number;
		};
		screenshot?: string;
		sellPrice?: number; // if on sale, this is the price
		steamId: string;
		steamImg: string;
		type: number;
		wiki: string; // url to wiki
	}

	export interface MarketItem extends Item {
		asset: {
			collection: {
				image: string | null;
				name: string;
			};
			float: number;
			id: number; // asset id
			images: {
				preview: string;
				screenshot: string;
				steam: string;
			};
			inspect: string;
			isSouvenir: boolean;
			isStattrak: boolean;
			names: {
				full: string;
				identifier: string;
				short: string;
			};
			pattern: number;
			quality: string; // e.g. fn
			rank: any | null;
			rarity: string;
			type: number;
		};
		links: {
			'3d': string;
		};
		pricing: {
			computed: number;
			default: number;
			discount: number;
			extra: number | null;
			priceBeforeDiscount: number;
		};
		seller: {
			botId: any | null;
			delivery: {
				medianTime: number | null;
				speed: number | null;
				successRate: number | null;
			};
			steamId64: string;
		};
		stickers: ({
			collection: {
				name: string;
			};
			image: string;
			name: string;
			pricing: {
				default: number;
				rarity: any | null;
			};
			wear: number;
			wiki: string; // url to wiki
		} | null)[];
	}
}
