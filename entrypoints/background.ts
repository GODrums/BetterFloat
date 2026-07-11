export default defineBackground(async () => {
	await import('../src/background/index');
	const { registerMessageHandlers } = await import('../src/lib/util/messaging-compat');
	const handlers = await Promise.all([
		import('../src/background/messages/createNotification'),
		import('../src/background/messages/getBluePercent'),
		import('../src/background/messages/getBlueSales'),
		import('../src/background/messages/getMarketComparison'),
		import('../src/background/messages/openTab'),
		import('../src/background/messages/refreshPrices'),
		import('../src/background/messages/requestEcbRates'),
		import('../src/background/messages/requestRates'),
	]);
	const names = ['createNotification', 'getBluePercent', 'getBlueSales', 'getMarketComparison', 'openTab', 'refreshPrices', 'requestEcbRates', 'requestRates'];
	registerMessageHandlers(Object.fromEntries(names.map((name, index) => [name, handlers[index].default])));
});
