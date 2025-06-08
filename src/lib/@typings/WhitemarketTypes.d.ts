export namespace WhiteMarket {
	export type MarketListResponse = {
		market_list: {
			edges: { node: Listing }[];
		};
	};

	export type InventoryMyResponse = {
		inventory_my: {
			edges: { node: Item }[];
			pageInfo: {
				endCursor: string;
				hasNextPage: boolean;
			};
			totalCount: number;
		};
	};

	export type InstantSellListResponse = {
		instant_sell_list: {
			items: {
				edges: {
					node: Partial<Listing>;
				}[];
			};
		};
	};

	export type MarketMyResponse = {
		market_my: {
			edges: { node: Listing }[];
		};
	};

	export type Listing = {
		id: string;
		isSuperDeal: boolean;
		item: Item;
		offerType: null;
		price: Price;
		promo: unknown;
		similarQty: number;
		slug: string;
		store: {
			avatar: string;
			customAvatar: string;
			isStoreNamePublic: boolean;
			isTopSeller: boolean;
			slug: string;
			steamAvatar: string;
			storeName: string;
		};
		storeSimilarQty: number;
	};

	export type Price = {
		value: string; // e.g. "379.91"
		currency: string; // e.g. "USD"
	};

	export type Collection = {
		key: string;
		value: string;
	};

	export type Rarity = {
		value: string;
		key: string;
	};

	export type Exterior = {
		value: string;
		key: string;
	};

	export type Sticker = {
		// Define sticker properties if available, otherwise use 'unknown' or 'any'
		[key: string]: unknown; // Placeholder, update if sticker structure is known
	};

	export type Description = {
		steamPrice: Price;
		description: string;
		icon: string;
		iconLarge: string;
		name: string;
		nameHash: string;
		isTradeable: boolean;
		isStatTrak: boolean;
		isSouvenir: boolean;
		charmImage: string; // Assuming string, could be null
		charmTitle: string; // Assuming string, could be null
		charmMinPrice: Price | null;
		short: string;
		shortEn: string;
		skin: string;
		skinEn: string;
		collection: Collection;
		categoryEnum: string;
		categoryTitle: string;
		subcategoryEnum: string;
		subcategoryTitle: string;
		rarity: Rarity;
		exterior: Exterior;
		containsRare: unknown[]; // Update if structure is known
		contains: unknown[]; // Update if structure is known
	};

	export type Item = {
		maxPriceForSell: Price;
		link: string;
		paintSeed: string; // Assuming string, could be number
		paintIndex: string; // Assuming string, could be number
		phase: null; // Or specific type if known
		float: string; // Assuming string, could be number
		stickers: Sticker[];
		isAdditionalDataMissed: boolean;
		appId: string; // Assuming string, could be number
		id: string;
		description: Description;
	};
}
