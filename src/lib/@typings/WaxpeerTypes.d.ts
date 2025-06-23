export namespace Waxpeer {
	// https://waxpeer.com/api/data/index/
	export type MarketData = {
		items: Item[];
		seller: any;
		shopStats: any;
		success: boolean;
	};

	export type Item = {
		auto: boolean;
		brand: string;
		by: string;
		exterior: string; // e.g. FN
		float: number;
		full_ex: string; // e.g. Factory New
		game: string; // e.g. csgo
		image: string;
		inspect_item: {
			back: string;
			floatvalue: number;
			full_screenshot: string;
			imageurl: string;
			origin: number;
			stickers: Sticker[];
			weapon_type: string;
		};
		item_id: string;
		market_name: string; // e.g. Vice
		name: string; // e.g. ★ Sport Gloves | Vice (Factory New)
		popular: boolean;
		price: number;
		stat_trak: boolean;
		steam_price: {
			api_count: number;
			average: number;
			ch_name: string;
			current: number;
			game_id: number;
			highest_offer: number;
			img: string;
			item_id: string;
			localized_name: string;
			lowest_price: number;
			name: string;
			popular: boolean;
			rarity: string;
			rarity_color: string;
			ru_name: string;
			type: string;
		};
		steam_price_number: number;
		type: string; // e.g. Sport Gloves
	};

	export type Sticker = {
		id: string;
		image: string;
		name: string;
		slot: number;
		steam_price: {
			average: number;
			img: string;
			localized_name: string;
			type: 'Sticker';
		};
		wear: number;
	};
}
