import { Storage } from '@plasmohq/storage';

export const ExtensionStorage = {
	local: new Storage({
		area: 'local',
	}),
	sync: new Storage({
		area: 'sync',
	}),
};

export function getSetting(key: keyof IStorage) {
	return ExtensionStorage.sync.get(key);
}

function isNumeric(value: string) {
    return /^-?\d+$/.test(value);
}

export async function getAllSettings() {
	const settings = (await ExtensionStorage.sync.getAll()) as unknown as IStorage;
	// iterate through settings and parse JSON strings correctly
	for (const key in DEFAULT_SETTINGS) {
		if (typeof settings[key] === 'string' && (settings[key].startsWith('"') || settings[key].startsWith('{') || settings[key].startsWith('['))) {
			let result = JSON.parse(settings[key]);
			if (isNumeric(result)) {
				result = parseInt(result);
			}
			settings[key] = result;
		}
	}
	return settings;
}

export const DEFAULT_SETTINGS = {
	'csf-enable': true,
	'csf-autorefresh': true,
	'csf-stickerprices': true,
	'csf-csbluegem': true,
	'csf-pricereference': 0,
	'csf-refreshinterval': 0,
	'csf-floatappraiser': false,
	'csf-buffdifference': true,
	'csf-buffdifferencepercent': false,
	'csf-listingage': 0,
	'csf-topbutton': true,
	'csf-tabstates': true,
	'csf-floatcoloring': true,
	'csf-removeclustering': false,
	'sp-enable': true,
	'sp-autocheckboxes': true,
	'sp-stickerprices': true,
	'sp-csbluegem': true,
	'sp-ocoapikey': '',
	'sp-pricereference': 0,
	'sp-currencyrates': 0,
	'sp-steamprices': false,
	'sp-buffdifference': true,
	'sp-buffdifferencepercent': false,
	'sp-bufflink': 0,
	'sp-autoclosepopup': true,
	'sp-floatcoloring': true,
	spFilter: {
		priceLow: 0,
		priceHigh: 999999,
		name: '',
		types: [],
		new: false,
	},
	'skb-enable': true,
	'skb-pricereference': 0,
	'skb-buffdifference': true,
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
	"csf-showupdatepopup": true,
};

export type IStorage = typeof DEFAULT_SETTINGS;
export type EStorage = { key: keyof IStorage; value: IStorage[keyof IStorage] }[];
