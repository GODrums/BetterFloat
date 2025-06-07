let currencyRates: { [currency: string]: number } = {};

export function cacheSwapggCurrencyRates(rates: { [currency: string]: number }) {
	currencyRates = rates;
}

export function getSwapggCurrencyRate(currency: string) {
	return currencyRates[currency];
}
