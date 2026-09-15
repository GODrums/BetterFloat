export namespace DMarket {
	export interface LatestSalesResponse {
		sales: LatestSale[];
	}

	export interface ExchangeMarketV2 {
		offers: MarketOfferV2[];
		total: {
			items: number;
		};
		pageToken: string;
	}

	export interface ExchangeUserAssets {
		assets: Asset[];
		pageToken: string;
		totalSize: number;
	}

	export interface ExchangeSelectionV2 {
		items: Asset[];
	}

	export interface ExchangeRates {
		Rates: {
			[currency: string]: number;
		};
	}

	export interface LatestSale {
		date: string;
		offerAttributes: {
			floatValue: number;
			paintSeed: number;
		};
		orderAttributes: any;
		price: string;
		txOperationType: string;
	}

	export type AssetFeeRule = {
		percentage: string;
		minFee: Price;
	};

	export type AssetFeeRuleCustom = AssetFeeRule & {
		conditions: {
			minPrice: Price;
			maxPrice: Price;
			startsAt: number;
			expiresAt: number;
		};
	};

	export type AssetFeeSell = {
		default: AssetFeeRule;
		custom?: AssetFeeRuleCustom;
	};

	export type AssetFeeChannel = {
		sell: AssetFeeSell;
		instantSell: {
			default: AssetFeeRule;
		};
		exchange: {
			default: AssetFeeRule;
		};
	};

	export type AssetFees = {
		f2f: AssetFeeChannel;
		dmarket: AssetFeeChannel;
	};

	export type AssetCs2 = {
		category: string;
		exterior: string;
		floatValue: string;
		floatPartValue: string;
		phase: string;
		paintSeed: number;
	};

	export type Asset = {
		itemId: string;
		gameId: string;
		classId: string;
		provider: string;
		title: string;
		image: string;
		slug: string;
		status: string;
		discount: number;
		price: Price;
		instantPrice: Price;
		exchangePrice: Price;
		instantTargetId: string;
		suggestedPrice: Price;
		recommendedPrice: Price;
		fees: AssetFees;
		discountPrice: Price;
		backgroundColor: string;
		tradable: boolean;
		categoryPath: string;
		isNew: boolean;
		type: string;
		unlockDate: string;
		settlementTime: string;
		withdrawOnlyEndTime: string;
		holder: string;
		saleRestricted: boolean;
		tradeProtectionRemoved: boolean;
		hasAdvanced: boolean;
		cs2: AssetCs2;
	};

	export type MarketOfferV2 = {
		offerId: string;
		assetId: string;
		priceCents: number;
		createdAt: string;
		locked: boolean;
		recommendedPrice: number;
		overpriced: boolean;
		overpricePercent: number;
		discount: number;
		title: string;
		name: string;
		image: string;
		slug: string;
		categoryPath: string;
		gameId: string;
		backgroundColor: string;
		owner: string;
		tradable: boolean;
		withdrawable: boolean;
		tradeProtectionRemoved: boolean;
		unlockDate: string;
		settlementTime: string;
		cs2: {
			exterior: string;
			category: string;
			quality: string;
			floatValue: string;
			phase?: string;
			paintSeed: number;
		};
		isNew: boolean;
		favorite: Record<string, unknown>;
	};

	export type CachedListing = Asset | MarketOfferV2;

	export type Price = {
		DMC: string;
		USD: string;
	};
}
