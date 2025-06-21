export namespace DMarket {
	export interface LatestSalesResponse {
		sales: LatestSale[];
	}
	export interface ExchangeMarket {
		cursor: string;
		objects: Item[];
		total: {
			closedTargets: number;
			completedOffers: number;
			items: number;
			offers: number;
			targets: number;
		};
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

	export type Item = {
		amount: number;
		classId: string;
		createdAt: number;
		deliveryStats: {
			rate: string;
			time: string;
		};
		description: string;
		discount: number;
		discountPrice: Price;
		exchangePrice: Price;
		extra: {
			backgroundColor: string;
			category: string;
			categoryPath: string;
			collection: string[];
			emissionSerial: string;
			exterior: string; // e.g. "factory new"
			floatPartValue: string;
			floatValue: number;
			gameId: string;
			inGameAssetID: string;
			inspectInGame: string;
			isNew: boolean;
			itemType: string;
			linkId: string;
			name: string;
			nameColor: string;
			offerId?: string;
			paintIndex?: number;
			paintSeed?: number;
			phase?: string; // e.g. "phase-1"
			phaseTitle?: string; // e.g. "Phase 1"
			quality: string; // e.g. "covert"
			sageAddress: string;
			saleRestricted: boolean;
			stickers?: Sticker[];
			tradable: boolean;
			tradeLockDuration: number;
			viewAtSteam?: string; // steam inventory link
		};
		favorite: {
			count: number;
			forUser: boolean;
		};
		favoriteFor: number;
		favoriteForUser: boolean;
		fees: any; // random nested dict of strings
		gameId: string;
		gameType: string;
		image: string;
		inMarket: boolean;
		instantPrice: Price;
		instantTargetId: string;
		itemId: string;
		lockStatus: boolean;
		owner: string;
		ownerDetails: {
			avatar: string;
			id: string;
			wallet: string;
		};
		ownersBlockchainId: string;
		price: Price;
		productId: string;
		recommendedPrice: {
			d3: Price;
			d7: Price;
			d7Plus: Price;
			offerPrice: Price;
		};
		slug: string;
		status: string;
		suggestedPrice: Price;
		title: string; // buff item name
		type: string;
	};

	export type Sticker = {
		image: string;
		name: string;
	};

	export type Price = {
		DMC: string;
		USD: string;
	};
}
