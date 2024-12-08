export namespace Tradeit {
	export type BotDataResponse = {
		activeBots: number[];
		badBots: number[];
		bestAvailableBotsMax: number;
		counts: {
			[key: string]: number; // amount of items in inventory. key is buff item id
		};
		items: Item[];
	};

	export type OwnInventoryResponse = {
		assetIdsToIndex: string[];
		items: {
			[assetId: number]: Item[]; // 0 is array of all other items
		};
		success: boolean;
		timestamp: number;
	};

	export type Item = {
		assetId?: string;
		assetLength: number;
		botIndex?: number;
		botIndexes?: number[];
		classId: string;
		colors: string[]; // e.g. ["#8650AC"]
		createdAt: string;
		currentStock?: number;
		floatValue?: number;
		floatValues?: number[];
		gameId: string;
		groupId: number;
		hasStattrak?: boolean;
		hasStickers?: boolean;
		id: number | string;
		imgURL: string;
		metaMappings: {
			rarity: number;
			type: number;
			agent: boolean;
		};
		name: string; // e.g. "★ Specialist Gloves | Tiger Strike (Minimal Wear)"
		onlyStore?: boolean;
		paintIndex?: number;
		phase: any | null;
		price: number;
		priceForTrade: number;
		score: number;
		sitePrice: number; // e.g. 4004
		steamAppId: number; // 730
		steamTags?: string[];
		steamContextId?: number;
		steamId?: string;
		steamInspectLink?: string;
		steamInventoryLink?: string;
		steamMarketLink?: string;
		stickers: any[] | null;
		tradeLockDay: any[] | null;
		tradedAt: string;
		urlSlug?: string;
		wantedStock?: number;
		_id: string; // same id as above just as string
	};
}
