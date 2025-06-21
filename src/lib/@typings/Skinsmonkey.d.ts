export namespace Skinsmonkey {
	export type InventoryResponse = {
		assets: Item[];
	};

	export type Item = {
		item: {
			appId: number;
			marketName: string;
			price: number;
			details: {
				colors: string[];
				description: string | null;
				floatMin: number;
				floatMax: number;
				weapon: string;
				skin: string;
				variantName: string;
				exterior: string;
				rarity: string;
				type: string;
				statTrak: boolean;
				souvenir: boolean;
				releasedAt: string;
			};
			definitionId: string | null;
			imageUrl: string;
			hasDescription: boolean;
		};
		status: string;
		appId: number;
		assetId: string;
		amount: number;
		game730: {
			assetId: string;
			paintWear: number;
			paintIndex: number;
			paintSeed: number;
			fadePercent: number | null;
			pattern: string | null;
			bluePercent: number | null;
			nameTag: string | null;
			isScreenshotSupported: boolean;
			hasPaint: boolean;
			inspectUrl: string;
			screenshotUrl: string;
			keychains: any[];
			stickers: any[];
		};
		overstock: {
			limit: number;
			available: number;
			stock: number;
		};
		imageUrl: string;
		uniqueId: string;
		stackable: boolean;
		stackId: number;
		tradeLockTime: number;
		tradeLock: boolean;
		notAccepted: boolean;
		type: string;
		virtual: boolean;
	};
}