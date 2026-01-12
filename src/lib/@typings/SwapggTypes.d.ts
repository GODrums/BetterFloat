export namespace Swapgg {
	// https://swap.gg/api/inventory/user
	// https://swap.gg/api/inventory/site
	export type InventoryResponse = {
		data: {
			items: Item[];
		};
	};

	export type CurrencyResponse = {
		data: {
			rates: {
				[currency: string]: number; // e.g. "USD": 1.0
			};
		};
	};

	// https://api.swap.gg/v2/user/me
	export type UserResponse = {
		status: string; // "OK"
		result: {
			steamId: string;
			username: string;
			avatar: string;
			emailAddress: string;
			emailAddressVerified: boolean;
			affiliate: string;
			tosAccepted: {
				ipAddress: string;
				userAgent: string;
				date: string;
			};
			tradeLink: string;
			localization: {
				currency: string;
				language: string;
			};
			status: {
				api: boolean;
				twoFactor: boolean;
			};
		};
	};

	export type Item = {
		stack: string;
		product: {
			_id: string;
			name: string;
			category: string;
			subCategory: string;
			platform: string;
			conditions: string[];
			stock: number;
			maxStock: number;
			image: string;
			colors: string[];
			commodity: boolean;
			metadata: {
				itemName: string;
				CS_CATEGORY: string;
				exterior: string;
				CS_RARITY: string;
				skinName: string;
				exteriorShort: string;
			};
		};
		count: number;
		itemIds: string[];
		price: number;
		metadata: {
			CS_INSPECT_LINK: string;
			CS_FLOAT: number;
			CS_PAINT_INDEX: number;
			CS_PAINT_SEED: number;
		};
		available: boolean;
	};
}
