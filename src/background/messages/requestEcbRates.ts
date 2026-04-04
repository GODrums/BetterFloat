import type { PlasmoMessaging } from '@plasmohq/messaging';
import type { Extension } from '~lib/@typings/ExtensionTypes';
import { ExtensionStorage } from '~lib/util/storage';

export type RequestEcbRatesResponse = {
	status: number;
	rates: Extension.CurrencyRates['rates'];
};

const STORAGE_KEY = 'ecb-usd-rates';
const CACHE_TTL = 1000 * 60 * 60 * 24;
const ECB_DAILY_RATES_URL = 'https://www.ecb.europa.eu/stats/eurofxref/eurofxref-daily.xml';

function parseEcbRates(xml: string) {
	const rates: Record<string, number> = {
		EUR: 1,
		USD: 1,
	};
	const regex = /currency=['"]([A-Z]{3})['"]\s+rate=['"]([0-9.]+)['"]/g;

	for (const match of xml.matchAll(regex)) {
		const code = match[1];
		const rate = Number(match[2]);
		if (!Number.isNaN(rate)) {
			rates[code] = rate;
		}
	}

	return rates;
}

function convertEuroBaseRatesToUsdBasedRates(ratesFromEur: Record<string, number>) {
	const usdPerEur = ratesFromEur.USD;
	const usdBasedRates: Extension.CurrencyRates['rates'] = {
		USD: 1,
	};

	if (!usdPerEur) {
		return usdBasedRates;
	}

	for (const [currency, rateFromEur] of Object.entries(ratesFromEur)) {
		if (!rateFromEur) {
			continue;
		}
		usdBasedRates[currency] = rateFromEur / usdPerEur;
	}

	return usdBasedRates;
}

async function getStoredRates(key: string) {
	return ExtensionStorage.local.getItem<Extension.CurrencyRates>(key);
}

const handler: PlasmoMessaging.MessageHandler<null, RequestEcbRatesResponse> = async (_req, res) => {
	const storedRates = await getStoredRates(STORAGE_KEY);
	if (storedRates?.rates && storedRates.lastUpdate > Date.now() - CACHE_TTL) {
		res.send({
			status: 200,
			rates: storedRates.rates,
		});
		return;
	}

	try {
		const response = await fetch(ECB_DAILY_RATES_URL);
		if (!response.ok) {
			throw new Error(`ECB request failed with ${response.status}`);
		}

		const xml = await response.text();
		const ecbRates = parseEcbRates(xml);
		const usdBasedRates = convertEuroBaseRatesToUsdBasedRates(ecbRates);

		if (!usdBasedRates.USD || Object.keys(usdBasedRates).length === 1) {
			throw new Error('ECB rates payload did not include usable USD data');
		}

		const storedRates: Extension.CurrencyRates = {
			lastUpdate: Date.now(),
			rates: usdBasedRates,
		};

		await ExtensionStorage.local.setItem(STORAGE_KEY, storedRates);
		await ExtensionStorage.local.setItem('currencyrates', storedRates);

		res.send({
			status: response.status,
			rates: usdBasedRates,
		});
		return;
	} catch (error) {
		console.error('[BetterFloat] Failed to fetch ECB rates:', error);
	}

	if (storedRates?.rates) {
		res.send({
			status: 200,
			rates: storedRates.rates,
		});
		return;
	}

	const fallbackRates = await getStoredRates('currencyrates');
	if (fallbackRates?.rates) {
		res.send({
			status: 200,
			rates: fallbackRates.rates,
		});
		return;
	}

	res.send({
		status: 503,
		rates: {
			USD: 1,
		},
	});
};

export default handler;
