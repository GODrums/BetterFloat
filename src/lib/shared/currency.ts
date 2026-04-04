import { sendToBackground } from '@plasmohq/messaging';
import type { RequestEcbRatesResponse } from '~background/messages/requestEcbRates';
import type { Extension } from '~lib/@typings/ExtensionTypes';
import { ExtensionStorage } from '~lib/util/storage';

const STORAGE_KEY = 'currencyrates';
const CACHE_TTL = 1000 * 60 * 60 * 24;

let ecbUsdBasedRates: Extension.CurrencyRates['rates'] | null = null;
let ecbUsdBasedRatesPromise: Promise<Extension.CurrencyRates['rates']> | null = null;

export function getRealCurrencyRates() {
	return ecbUsdBasedRates ?? {};
}

async function persistCurrencyRates(rates: Extension.CurrencyRates['rates']) {
	ecbUsdBasedRates = rates;
	await ExtensionStorage.local.setItem(STORAGE_KEY, {
		lastUpdate: Date.now(),
		rates,
	} satisfies Extension.CurrencyRates);
}

async function loadEcbUsdBasedRates() {
	if (ecbUsdBasedRates) {
		return ecbUsdBasedRates;
	}

	if (!ecbUsdBasedRatesPromise) {
		ecbUsdBasedRatesPromise = ExtensionStorage.local
			.getItem<Extension.CurrencyRates>(STORAGE_KEY)
			.then(async (storedRates) => {
				if (storedRates?.rates && storedRates.lastUpdate > Date.now() - CACHE_TTL) {
					ecbUsdBasedRates = storedRates.rates;
					return ecbUsdBasedRates;
				}

				const response = (await sendToBackground({
					name: 'requestEcbRates',
				})) as RequestEcbRatesResponse;
				const rates = response.rates ?? storedRates?.rates ?? { USD: 1 };

				await persistCurrencyRates(rates);
				return rates;
			})
			.catch((error) => {
				console.error('[BetterFloat] Failed to load ECB currency rates:', error);
				ecbUsdBasedRates = { USD: 1 };
				return ecbUsdBasedRates;
			})
			.finally(() => {
				ecbUsdBasedRatesPromise = null;
			});
	}

	return ecbUsdBasedRatesPromise;
}

export async function fetchCurrencyRates() {
	return loadEcbUsdBasedRates();
}

// Returns how many units of the target currency equal 1 USD.
export async function getUSDToCurrencyRate(currency: string) {
	const normalizedCurrency = currency.toUpperCase();
	if (normalizedCurrency === 'USD') {
		return 1;
	}

	const rates = await loadEcbUsdBasedRates();
	return rates[normalizedCurrency] ?? 1;
}

// Returns the USD value of one unit of the target currency.
export async function getCurrencyToUsdRate(currency: string) {
	const usdToCurrencyRate = await getUSDToCurrencyRate(currency);
	if (!usdToCurrencyRate) {
		return 1;
	}
	return 1 / usdToCurrencyRate;
}
