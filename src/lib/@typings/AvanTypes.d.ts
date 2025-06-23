export namespace Avanmarket {
	export type CatalogResponse = {
		count: number;
		data: Item[];
		limit: number;
		main: number;
		next_page: number;
		page: number;
		page_count: number;
		prev_page: number;
		rateId: number;
	};

	export type Item = {
		id: number;
		rarity: string;
		quality: string;
		phase: string;
		name: string;
		icon_url: string;
		description_en: string;
		full_image_link: string | null;
		description_ru: string;
		slot: string | null;
		type: string;
		type_ru: string;
		quality_ru: string;
		rarity_ru: string;
		hero: string | null;
		weapon: string;
		full_name: string;
		full_name_ru: string;
		slugified_name: string;
		steam_price: string;
		profit_percentage: number;
		sell_items: SellItem[];
		variants: Variant[];
	};

	export type SellItem = {
		id: number;
		inspect_in_game: string;
		created_at: string;
		float: number;
		raw_sell_price: number;
		sell_price: number;
		unhold_at: string;
		item_id: number;
		preview_link: string;
		item_stickers: unknown[]; // Array type unclear from example, using unknown[]
	};

	export type Variant = {
		id: number;
		quality: string;
		phase: string;
		sell_price: string;
		slugified_name: string;
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
