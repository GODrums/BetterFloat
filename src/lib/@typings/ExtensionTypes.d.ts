export namespace Extension {
	export type URLState = {
		site: string;
		path: string;
		search: string;
		hash: string;
	};

	export interface APIMarketResponse {
		[market: string]: Partial<MarketEntry>;
	}

	export interface AbstractPriceMapping {
		[name: string]: any;
	}

	export interface PriceMappingBuff extends AbstractPriceMapping {
		[name: string]: {
			bid: number; // 105
			ask: number; // 167
			avg30: number; // 175
			liquidity: number; // 78.14
		};
	}

	export interface PriceMappingMisc extends AbstractPriceMapping {
		[name: string]: {
			price: number;
			liquidity: number;
			count: number;
		};
	}

	export interface PriceMappingSteam extends AbstractPriceMapping {
		[name: string]: {
			bid: number;
			ask: number;
			avg30: number;
			lastsale: {
				price: number;
				date: number;
			};
			volume: number;
		};
	}

	export type ApiBuffResponse = {
		data: PriceMappingBuff;
		time: number;
	};

	export type CurrencyRates = {
		lastUpdate: number;
		rates: {
			[currency: string]: number;
		};
	};

	/**
	 * Mapping corresponding to the response from https://prices.csgotrader.app/latest/buff163.json
	 */
	export type CSGOTraderBuffMapping = {
		[name: string]: {
			starting_at: {
				price: number;
				doppler?: DopplerPrices;
			};
			highest_order: {
				price: number;
				doppler?: DopplerPrices;
			};
		};
	};

	/**
	 * Mapping corresponding to the response from https://prices.csgotrader.app/latest/prices_v6.json
	 * @deprecated use CSGOTraderBuffMapping instead
	 */
	export type CSGOTraderMapping = {
		[name: string]: {
			steam: {
				last_24h: number;
				last_7d: number;
				last_30d: number;
				last_90d: number;
			};
			bitskins: {
				price: string;
				instant_sale_price: string | null;
			};
			lootfarm: number;
			csgotm: string;
			csmoney: {
				price: number;
			};
			skinport: {
				suggested_price: number;
				starting_at: number;
			};
			csgotrader: {
				price: number;
			};
			swapgg: number;
			csgoexo: number;
			cstrade: {
				price: number;
			};
			skinwallet: string | number | null;
			buff163: {
				starting_at: {
					price: number;
					doppler?: DopplerPrices;
				};
				highest_order: {
					price: number;
					doppler?: DopplerPrices;
				};
			};
		};
	};

	/**
	 * @see CSGOTraderBuffMapping
	 */
	type DopplerPrices = {
		Sapphire: number;
		Ruby: number;
		'Black Pearl': number;
		Emerald: number;
		'Phase 1': number;
		'Phase 2': number;
		'Phase 3': number;
		'Phase 4': number;
	};

	export type CrimsonWebMapping = {
		[weapon in CWWeaponTypes]: {
			[paint_seed: string]: {
				img?: string;
				type: CWKnifeTypes | CWGloveTypes;
				tier: 1 | 2 | 3;
			};
		};
	};

	export type CWWeaponTypes = 'gloves' | 'm9' | 'karambit' | 'nomad';

	type CWGloveTypes = 'Left Hand' | 'Right Hand' | 'Double Web' | 'Triple Web';

	// only m9 can have 3 webs
	type CWKnifeTypes = 'Single Web' | 'Double Web' | 'Triple Web';

	// response from api.rums.dev/v1/csfloatstalls/:id
	export type CustomStallData = {
		status: 'OK' | 'ERROR';
		data: {
			id: number;
			stall_id: string;
			created_at: string;
			roles: ('Developer' | 'Contributor' | 'Supporter' | 'Enjoyer')[];
			options: {
				video: {
					mp4: string;
					webm: string;
					poster: string;
				};
				transparent_elements: boolean;
				'background-color': string;
			};
		};
	};

	export type ApiStatusResponse = {
		sites: [string];
		message: string;
		statusCode: number;
	};
}

export namespace BlueGem {
	export type BluePercent = {
		[type: string]: {
			playside: {
				[seed: string]: number;
			};
			backside: {
				[seed: string]: number;
			};
			double_sided: {
				[seed: string]: number;
			};
		};
	};

	export type BlueData = {
		playside: number;
		backside: number;
		double_sided: number;
	};

	export type PatternDataResponse = {
		data: PatternData[];
		meta: {
			total: number;
			size: number;
		};
	};
	export type SearchResponse = {
		data: PastSale[];
	};
	export type PatternData = {
		backside_blue: number;
		backside_contour_blue: number;
		backside_contour_purple: number;
		backside_gold: number;
		backside_purple: number;
		playside_blue: number;
		playside_contour_blue: number;
		playside_contour_purple: number;
		playside_gold: number;
		playside_purple: number;
	};

	export type PastSale = {
		buff_id: number;
		csfloat: string; //floatdb link
		date: string;
		epoch: number;
		origin: 'CSFloat' | 'BroSkins' | 'Buff' | 'c5game' | 'SkinBid' | 'Skinport';
		pattern: number;
		price: number;
		sale_id: 'string';
		screenshots: {
			inspect?: string; // only for Buff
			inspect_backside?: string | null; // only for CSFloat
			inspect_playside?: string | null; // only for CSFloat
		};
		steam_inspect_link: string;
		type: 'normal' | 'stattrak';
		wear: number;
	};
}

export interface FadePercentage {
	seed: number;
	percentage: number;
	ranking: number;
}
