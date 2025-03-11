import type { PlasmoMessaging } from '@plasmohq/messaging';
import type { Extension } from '~lib/@typings/ExtensionTypes';

type PriceBody = {
	source: string;
	steamId?: string;
};

type PriceResponse = {
	status: number;
};

const lastRequest: Record<string, number> = {};

const handler: PlasmoMessaging.MessageHandler<PriceBody, PriceResponse> = async (req, res) => {
	const source = req.body?.source;
	if (!source) {
		res.send({
			status: 500,
		});
		return;
	}
	if (lastRequest[source] > 0 && Date.now() - lastRequest[source] < 1000 * 60 * 10) {
		console.log('[BetterFloat] Prices were requested within the last 10 minutes. Skipping refresh.');
		res.send({
			status: 200,
		});
		return;
	}
	lastRequest[source] = Date.now();
	console.log('[BetterFloat] Refreshing prices from source:', source);
	const pricesURL = `prices${source !== 'buff' ? `_${source}` : ''}`;

	// for self builds, make sure to use your own API
	const response = await fetch(`${process.env.PLASMO_PUBLIC_PRICINGAPI}${pricesURL}.json`, {
		method: 'GET',
		headers: {
			'Content-Type': 'application/json',
			'x-via': `BetterFloat/${chrome.runtime.getManifest().version}`,
			'x-id': `chrome-extension://${chrome.runtime.id}`,
			'x-steam': req.body?.steamId || '',
		},
	});

	if (response.ok) {
		const responseJson = (await response.json()) as Extension.ApiBuffResponse;
		if (responseJson?.data) {
			await chrome.storage.local.set({
				[`${pricesURL}`]: JSON.stringify(responseJson.data),
				[`${source}-update`]: Date.now(),
			});
		}
	} else if (response.status === 403) {
		await chrome.storage.local.set({
			[`${source}-update`]: Date.now(), // avoid refetches until auth is resolved
		});
	}
	res.send({
		status: response.status,
	});
	return;
};

export default handler;
