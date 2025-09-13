export namespace Skinflow {
	export type BotsItemsTradeResponse = {
		next: string | null;
		results: Item[];
		stackables: any;
		steamPrices: any;
	};

	export type InventoryResponse = {
		inventory: Item[];
	};

	export type Item = {
		id: string;
		realitem_id: string;
		app_id: string;
		date_received: string;
		float: string;
		minFloat: string;
		maxFloat: string;
		paintseed: string;
		phase: number;
		stickers: Sticker[] | null;
		charms: Charm[] | null;
		icon_url_large: string;
		market_hash_name: string;
		inspect_link: string;
		inspect_screen_img: string;
		descriptions: Description[];
		offered: number;
		tradable_date: string;
		tags: Tag[];
		bot: Bot;
	};

	export type Sticker = {
		slot: number;
		sticker_id: number;
		wear?: number;
		scale?: number;
		rotation?: number;
		name?: string;
		img?: string;
	};

	export type Charm = {
		slot: number;
		charm_id: number;
		name?: string;
		img?: string;
	};

	export type Description = {
		type: 'html' | 'text';
		value: string;
		name: 'exterior_wear' | 'blank' | 'description' | string;
	};

	export type Tag = {
		internal_name: string;
		name: string;
		category: 'Type' | 'Quality' | 'Rarity' | 'Exterior' | string;
		color: string;
		category_name: 'Type' | 'Category' | 'Quality' | 'Exterior' | string;
	};

	export type Bot = {
		bot_steam_id: string;
	};
}
