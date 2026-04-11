export function getCSFloatUserCurrency() {
	const userCurrencyRaw = document.querySelector('mat-select-trigger')?.textContent?.trim() ?? 'USD';
	const symbolToCurrencyCodeMap: Record<string, string> = {
		C$: 'CAD',
		AED: 'AED',
		A$: 'AUD',
		R$: 'BRL',
		CHF: 'CHF',
		'¥': 'CNY',
		Kč: 'CZK',
		kr: 'DKK',
		'£': 'GBP',
		PLN: 'PLN',
		SAR: 'SAR',
		SEK: 'SEK',
		S$: 'SGD',
	};
	const currencyCodeFromSymbol = symbolToCurrencyCodeMap[userCurrencyRaw];
	if (currencyCodeFromSymbol) {
		return currencyCodeFromSymbol;
	}

	return /^[A-Z]{3}$/.test(userCurrencyRaw) ? userCurrencyRaw : 'USD';
}
