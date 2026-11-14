export namespace Avanmarket {
	export type CurrencyResponse = {
		courseToBuy: number;
		courseToUsd: number;
		createdAt: string;
		id: number;
		name: string;
		updatedAt: string;
	};

	export type InventoryResponse = InventoryItem[];

	export type InventoryItem = {
		id: number;
		name: string;
		price: number;
		realPrice: number;
		active: boolean;
		iconUrl: string;
		quality: string | null;
		backgroundColor: string;
		manualActive: boolean | null;
		additionalDiscount: number;
		tradable: number;
		appId: string;
		itemClassId: string;
		stickers: string;
		itemId: string;
		priceInUsd: string;
		assetId: string;
	};
}
