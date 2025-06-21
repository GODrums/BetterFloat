export namespace Swapgg {
	// https://api.swap.gg/v2/trade/inventory/bot/730
	// https://api.swap.gg/v2/trade/inventory/user/730
	export type InventoryResponse = {
		status: string; // "OK"
		result: Item[];
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
		a: string[];
		e?: string; // e.g. "NON_TRADABLE"
		g: '730';
		i: string; // image link
		l: number;
		m: {
			0: string; // condition, e.g. "Field-Tested"
			1: number; // collection, e.g. "The Vanguard Collection"
			4?: string[]; // sticker image url array
			6: string; // type, e.g. "Sticker", "Rifle"
			7?: string; // weapon name, e.g. "M4A1-S"
			13: string; // steam inspect link
			17: string; // quality, e.g. "Remarkable"
			21: number[];
			24: string; // sticker tournament, e.g. "2020 RMR"
			26: string[]; // sticker names, e.g. ['Nemiga']
		};
		n: string; // full name, e.g. "Sticker | Nemiga | 2020 RMR"
		p: number; // price in cents, e.g. 16. 0 if not tradable
	};
}
