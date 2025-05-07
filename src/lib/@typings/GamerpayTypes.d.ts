export namespace Gamerpay {
	export type Item = {
		id: number;
		createdAt: number;
		modifiedAt: number;
		gameId: number;
		name: string;
		price: number;
		forSale: boolean;
		delisted: boolean;
		privateSale: boolean;
		sellerId: number;
		favorite: boolean;
		bargainEnabled: boolean;
		royaltyPercentage: number | null;
		purchasePrice: number | null;
		collecting: boolean;
		userGenerated: boolean;
		appId: number;
		contextId: number;
		assetId: number;
		classId: number;
		instanceId: number;
		imageUrl: string;
		imageUrlLarge: string | null;
		images: any | null;
		tradable: boolean;
		type: string;
		stickers: any[];
		inspectLink: string | null;
		floatValue: number | null;
		wearName: string | null;
		paintseed: number | null;
		paintindex: number | null;
		defindex: number | null;
		phase: string | null;
		synchronizedWithCSGoFloat: boolean;
		synchronizedWithCSGOFloatAt: number;
		synchronizedWithSteam: boolean;
		synchronizedWithSwapGGAt: number | null;
		rarityName: string;
		rarityColor: string;
		itemSet: string | null;
		quote: string | null;
		buffPrice: number;
		buffPriceRatio: number | null;
		steamPrice: number;
		steamPriceRatio: number | null;
		view3D: string | null;
		shareImageId: string | null;
		dirty: boolean;
		followBuff: boolean;
		followBuffPercentage: number;
		tradeLockExpiresAt: number | null;
		tradeLockExpiredAt: number | null;
		gem: any | null; // Consider defining a more specific type if the structure is known
		itemSubtype: string;
		highStickerValue: boolean;
		fadePercentage: number;
		marketHashName: string | null;
		listedAt: number;
		isCs2InspectImagesRequested: boolean;
		isCs2InspectImagesProcessed: boolean;
		subtype: string | null;
		inspectLinkValid: boolean;
		floatApplicable: boolean;
	};

	export type ReactItem = {
		item: Item;
		from: string; // e.g., "shop"
		price: number; // e.g. 4930
	};
}
