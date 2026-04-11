import { sendToBackground } from '@plasmohq/messaging';
import type { RequestRatesResponse } from '~background/messages/requestRates';
import type { Extension } from '~lib/@typings/ExtensionTypes';
import { ExtensionStorage } from '~lib/util/storage';

const STORAGE_KEY = 'currencyrates';
const CACHE_TTL = 1000 * 60 * 60 * 12;

let usdBasedRates: Extension.CurrencyRates['rates'] | null = null;
let usdBasedRatesPromise: Promise<Extension.CurrencyRates['rates']> | null = null;

export function getRealCurrencyRates() {
	return usdBasedRates ?? {};
}

async function persistCurrencyRates(rates: Extension.CurrencyRates['rates']) {
	usdBasedRates = rates;
	await ExtensionStorage.local.setItem(STORAGE_KEY, {
		lastUpdate: Date.now(),
		rates,
	} satisfies Extension.CurrencyRates);
}

async function loadUsdBasedRates() {
	if (usdBasedRates) {
		return usdBasedRates;
	}

	if (!usdBasedRatesPromise) {
		usdBasedRatesPromise = ExtensionStorage.local
			.getItem<Extension.CurrencyRates>(STORAGE_KEY)
			.then(async (storedRates) => {
				if (storedRates?.rates && storedRates.lastUpdate > Date.now() - CACHE_TTL) {
					usdBasedRates = storedRates.rates;
					return usdBasedRates;
				}

				const response = (await sendToBackground({
					name: 'requestRates',
				})) as RequestRatesResponse;
				const rates = response.rates ?? storedRates?.rates ?? { USD: 1 };

				await persistCurrencyRates(rates);
				return rates;
			})
			.catch((error) => {
				console.error('[BetterFloat] Failed to load currency rates:', error);
				usdBasedRates = { USD: 1 };
				return usdBasedRates;
			})
			.finally(() => {
				usdBasedRatesPromise = null;
			});
	}

	return usdBasedRatesPromise;
}

export async function fetchCurrencyRates() {
	return loadUsdBasedRates();
}

// Returns how many units of the target currency equal 1 USD.
export async function getUSDToCurrencyRate(currency: string) {
	const normalizedCurrency = currency.toUpperCase();
	if (normalizedCurrency === 'USD') {
		return 1;
	}

	const rates = await loadUsdBasedRates();
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
