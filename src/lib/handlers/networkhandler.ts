import { ExtensionStorage } from '~lib/util/storage';
import { cacheRealCurrencyRates } from './mappinghandler';

import { sendToBackground } from '@plasmohq/messaging';
import type { BlueGem, Extension } from '../@typings/ExtensionTypes';
import type { Skinport } from '../@typings/SkinportTypes';

export async function fetchCSBlueGem(type: string, paint_seed: number, currency = 'USD') {
	return fetch(`https://csbluegem.com/api?skin=${type}&pattern=${paint_seed}&currency=${currency}`)
		.then((res) => res.json())
		.then((data) => {
			const { pastSales, patternElement } = {
				pastSales: data.pop() as BlueGem.PastSale[] | undefined,
				patternElement: data.pop() as BlueGem.PatternElement | undefined,
			};
			return { patternElement, pastSales };
		});
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
		if (!response.rates) {
			cacheRealCurrencyRates(currencyRates.rates);
		}
		cacheRealCurrencyRates(response.rates);
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

/**
 * Saves items purchased through the OneClickBuy feature
 */
export async function saveOCOPurchase(item: Skinport.Listing) {
	return fetch(process.env.PLASMO_PUBLIC_OCO_DB_ENDPOINT, {
		method: 'POST',
		headers: {
			'Content-Type': 'application/json',
		},
		body: JSON.stringify({ item }),
	});
}
