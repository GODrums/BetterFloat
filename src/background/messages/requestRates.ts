import type { PlasmoMessaging } from '@plasmohq/messaging';
import type { Extension } from '~lib/@typings/ExtensionTypes';
import { ExtensionStorage } from '~lib/util/storage';

type RatesResponse = {
	status: number;
	rates: Extension.CurrenyRates['rates'];
};

const storageFallback = async () => {
	const currencyRates = await ExtensionStorage.local.getItem<Extension.CurrenyRates>('currencyrates');
	if (!currencyRates?.rates) {
		await ExtensionStorage.local.setItem('currencyrates', DEFAULT_CURRENCY_RATES);
		return DEFAULT_CURRENCY_RATES;
	}
	return currencyRates;
}

const handler: PlasmoMessaging.MessageHandler<null, RatesResponse> = async (_req, res) => {
	const response = await fetch('https://cdn.rums.dev/currencyrates.json', {
		method: 'GET',
		headers: {
			'Content-Type': 'application/json',
			'x-via': `BetterFloat/${chrome.runtime.getManifest().version}`,
		},
	});

    let currencyRates: Extension.CurrenyRates | null = null;
    if (!response.ok) {
        currencyRates = await storageFallback();
        res.send({
            status: response.status,
            rates: currencyRates.rates,
        });
        return;
    }
	const responseJson = await response.json();

	if (!responseJson?.rates) {
		currencyRates = await storageFallback();
        res.send({
            status: response.status,
            rates: currencyRates.rates,
        });
        return;
	}

    await ExtensionStorage.local.setItem('currencyrates', responseJson);

	res.send({
        status: response.status,
		rates: responseJson.rates,
	});
};

const DEFAULT_CURRENCY_RATES: Extension.CurrenyRates = {
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

export default handler;
