import { Storage } from '@plasmohq/storage';

export const ExtensionStorage = {
	local: new Storage({
		area: 'local',
	}),
	sync: new Storage({
		area: 'sync',
	}),
};

export async function getSetting<T>(key: keyof IStorage) {
	const setting = await ExtensionStorage.sync.get(key);
	if (typeof setting === 'string' && (setting.startsWith('"') || setting.startsWith('{') || setting.startsWith('['))) {
		return JSON.parse(setting) as T;
	}
	return setting as T;
}

function isNumeric(value: string) {
	return /^-?\d+$/.test(value);
}

export async function getAllSettings() {
	const settings = (await ExtensionStorage.sync.getAll()) as unknown as IStorage;
	// iterate through settings and parse JSON strings correctly
	for (const key in DEFAULT_SETTINGS) {
		if (typeof settings[key] === 'string') {
			let result: string | number | boolean | null = null;
			try {
				result = JSON.parse(settings[key]);
			} catch (e) {
				result = settings[key];
			}
			if (typeof result === 'string') {
				if (isNumeric(result)) {
					// exception for csf-listingage
					if (key === 'csf-listingage') {
						result = true;
						ExtensionStorage.sync.setItem('csf-listingage', true);
					} else {
						result = Number(result);
					}
				} else if (result.startsWith('"') || result.startsWith("'")) {
					result = result.substring(1, result.length - 1);
					ExtensionStorage.sync.setItem(key, result);
				}
			}
			settings[key] = result;
		}
	}
	return settings;
}

export const DEFAULT_SETTINGS = {
	'csf-enable': true,
	'csf-altmarket': 'none',
	'csf-autorefresh': true,
	'csf-stickerprices': true,
	'csf-csbluegem': true,
	'csf-pricingsource': 'buff',
	'csf-steamsupplement': true,
	'csf-pricereference': 0,
	'csf-refreshinterval': 0,
	'csf-floatappraiser': false,
	'csf-steamlink': true,
	'csf-buffdifference': true,
	'csf-buffdifferencepercent': false,
	'csf-showingamess': false,
	'csf-listingage': true,
	'csf-topbutton': true,
	'csf-quickmenu': false,
	'csf-themetoggle': false,
	'csf-floatcoloring': true,
	'csf-removeclustering': false,
	'csf-showbargainprice': true,
	'sp-enable': true,
	'sp-stickerprices': true,
	'sp-csbluegem': true,
	'sp-pricingsource': 'buff',
	'sp-altmarket': 'none',
	'sp-pricereference': 0,
	'sp-currencyrates': 0,
	'sp-steamprices': false,
	'sp-buffdifference': true,
	'sp-buffdifferencepercent': false,
	'sp-bufflink': 0,
	'sp-autoclosepopup': true,
	'sp-floatcoloring': true,
	'skb-enable': true,
	'skb-pricingsource': 'buff',
	'skb-altmarket': 'none',
	'skb-pricereference': 0,
	'skb-buffdifference': true,
	'skb-buffdifferencepercent': false,
	'skb-listingage': true,
	'skb-stickerprices': true,
	'csf-color-profit': '#008000',
	'csf-color-loss': '#ce0000',
	'csf-color-neutral': '#708090',
	'sp-color-profit': '#008000',
	'sp-color-loss': '#ce0000',
	'sp-color-neutral': '#000000',
	'skb-color-profit': '#0cb083',
	'skb-color-loss': '#ce0000',
	'skb-color-neutral': '#FFFFFF',
	'display-updatepopup': true,
};

export const DEFAULT_FILTER = {
	priceLow: 0,
	priceHigh: 999999,
	name: '',
	types: {
		knife: true,
		gloves: true,
		agent: true,
		weapon: true,
		collectible: true,
		container: true,
		sticker: true,
		equipment: true,
		pass: true,
		charm: true,
	},
	new: false,
};

export type IStorage = typeof DEFAULT_SETTINGS;
export type EStorage = { key: keyof IStorage; value: IStorage[keyof IStorage] }[];
export type SPFilter = typeof DEFAULT_FILTER;
