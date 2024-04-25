import { ExtensionStorage } from '~lib/util/storage';
import { cacheRealCurrencyRates } from './mappinghandler';

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
	let currencyRates = await ExtensionStorage.local.getItem<typeof DEFAULT_CURRENCY_RATES>('currencyrates');
	if (currencyRates && currencyRates.lastUpdate > Date.now() - 1000 * 60 * 60 * 24) {
		cacheRealCurrencyRates(currencyRates.rates);
	} else {
		await fetch('https://api.rums.dev/v1/currencyrates')
			.then((response) => response.json())
			.then(async (data) => {
				console.debug('[BetterFloat] Received currency rates from Freecurrencyapi: ', data);
				cacheRealCurrencyRates(data.rates);
				await ExtensionStorage.local.setItem('currencyrates', data);
			})
			.catch(async (err) => {
				console.error(err);
				cacheRealCurrencyRates(DEFAULT_CURRENCY_RATES.rates);
				await ExtensionStorage.local.setItem('currencyrates', DEFAULT_CURRENCY_RATES);
			});
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

export async function saveOCOPurchase(item: Skinport.Listing) {
	return fetch('https://api.rums.dev/v1/oco/store', {
		method: 'POST',
		headers: {
			'Content-Type': 'application/json',
		},
		body: JSON.stringify({ item }),
	});
}

const DEFAULT_CURRENCY_RATES = {
	lastUpdate: 1713917552461,
	rates: {
		AUD: 1.5409801753,
		BGN: 1.8289202638,
		BRL: 5.1251105193,
		CAD: 1.3663001508,
		CHF: 0.9115601391,
		CNY: 7.2448209701,
		CZK: 23.5352333339,
		DKK: 6.9687812119,
		EUR: 0.9343201754,
		GBP: 0.8031000829,
		HKD: 7.8333912204,
		HRK: 6.7986111138,
		HUF: 367.0088540273,
		IDR: 16201.675843992,
		ILS: 3.7683504605,
		INR: 83.2409888758,
		ISK: 140.5941520971,
		JPY: 154.7728206946,
		KRW: 1368.8624808612,
		MXN: 16.9569920318,
		MYR: 4.7793307397,
		NOK: 10.9041315469,
		NZD: 1.6847302585,
		PHP: 57.5485587784,
		PLN: 4.0244405164,
		RON: 4.6487708452,
		RUB: 93.2202718493,
		SEK: 10.8054320917,
		SGD: 1.3608101572,
		THB: 36.9173148108,
		TRY: 32.5224564512,
		USD: 1,
		ZAR: 19.1043926724,
	},
};
