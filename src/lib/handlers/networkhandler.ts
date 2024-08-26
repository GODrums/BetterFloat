import { ExtensionStorage } from '~lib/util/storage';
import { cacheRealCurrencyRates } from './mappinghandler';

import { sendToBackground } from '@plasmohq/messaging';
import type { BlueGem, Extension } from '../@typings/ExtensionTypes';
import type { Skinport } from '../@typings/SkinportTypes';

export async function fetchCSBlueGemPatternData(type: string, pattern: number) {
	return fetch(`https://csbluegem.com/api/v1/patterndata?skin=${type.replace(' ', '_')}&pattern=${pattern}`).then((res) => res.json() as Promise<BlueGem.PatternData>);
}

type CSBlueGemOptions = {
	type: string;
	paint_seed: number;
	currency?: string;
};

export async function fetchCSBlueGemPastSales({ type, paint_seed, currency = 'USD' }: CSBlueGemOptions) {
	return fetch(`https://csbluegem.com/api/v1/search?skin=${type.replace(' ', '_')}&pattern=${paint_seed}&currency=${currency}`).then((res) => res.json() as Promise<BlueGem.PastSale[]>);
}

// fetches currency rates from freecurrencyapi through my api to avoid rate limits
export async function fetchCurrencyRates() {
	const currencyRates = await ExtensionStorage.local.getItem<Extension.CurrencyRates>('currencyrates');
	if (currencyRates && currencyRates.lastUpdate > Date.now() - 1000 * 60 * 60 * 24) {
		cacheRealCurrencyRates(currencyRates.rates);
	} else {
		const response = await sendToBackground({
			name: 'requestRates',
		});
		console.debug('[BetterFloat] Received currency rates: ', response.rates);
		if (response.rates) {
			cacheRealCurrencyRates(response.rates);
		} else if (currencyRates) {
			cacheRealCurrencyRates(currencyRates.rates);
		}
	}
}

/**
 * Check if the API is up and running
 * @deprecated Not used anymore
 * @returns {Promise<Extension.ApiStatusResponse>}
 */
export async function isApiStatusOK(): Promise<Extension.ApiStatusResponse> {
	return fetch('https://api.rums.dev/v1/betterfloat/status').then((res) => res.json());
}
