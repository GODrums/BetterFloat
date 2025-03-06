export namespace Bitskins {
	export type CurrencyList = {
		crypto: {
			[currency: string]: {
				value: number;
			};
		};
		fiat: {
			[currency: string]: {
				value: number;
			};
		};
	};

	export type MarketSearch = {
		counter: {
			total: number;
			filtered: number;
		};
		list: Item[];
	};

	export type Item = {
		asset_id: string;
		bot_id: number;
		bot_steam_id: string;
		category_id: number;
		class_id: string;
		container_id?: number[];
		created_at: string; // "2016-12-22T03:08:53.000Z"
		discount: number;
		exterior_id?: number;
		float_id?: number;
		float_value?: number;
		hightier?: number; // 0 or 1
		id: string;
		name: string; // full name
		paint_index?: number;
		paint_seed?: number;
		phase_id?: number;
		price: number; // in ct
		quality_id: number;
		skin_id: number;
		skin_status: number;
		ss: number;
		status: number;
		sticker_counter: number;
		stickers: Sticker[];
		suggested_price: number;
		tradehold: number;
		type_id: number;
		typesub_id?: number;
	};

	export type Sticker = {
		class_id: string;
		name: string;
		skin_id: number;
	};

	export interface PopoutItem extends Item {
		similar: {
			category_id: number;
			exterior_id: number;
			price_minimum: number;
			skin_id: number;
			suggested_price: number;
		}[];
	}
}
