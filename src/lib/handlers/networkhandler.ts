import { sendToBackground } from '@plasmohq/messaging';
import { ExtensionStorage } from '~lib/util/storage';
import type { Extension } from '../@typings/ExtensionTypes';
import { cacheRealCurrencyRates } from './mappinghandler';

let isCurrencyFetched = false;
let isCurrencyFetchDone = false;

// fetches currency rates from freecurrencyapi through my api to avoid rate limits
export async function fetchCurrencyRates() {
	if (isCurrencyFetched) {
		// wait until the rates are fetched from parallel requests
		let tries = 20;
		while (!isCurrencyFetchDone && tries-- > 0) {
			await new Promise((resolve) => setTimeout(resolve, 100));
		}
		return;
	}
	isCurrencyFetched = true;
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
	isCurrencyFetchDone = true;
}

/**
 * Check if the API is up and running
 * @deprecated Not used anymore
 * @returns {Promise<Extension.ApiStatusResponse>}
 */
export async function isApiStatusOK(): Promise<Extension.ApiStatusResponse> {
	return fetch('https://api.rums.dev/v1/betterfloat/status').then((res) => res.json());
}
