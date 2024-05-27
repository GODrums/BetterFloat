import type { PlasmoMessaging } from '@plasmohq/messaging';
import type { Extension } from '~lib/@typings/ExtensionTypes';

type PriceBody = {
	source: string;
};

type PriceResponse = {
	status: number;
};

const handler: PlasmoMessaging.MessageHandler<PriceBody, PriceResponse> = async (req, res) => {
	const source = req.body.source;
	console.log('[BetterFloat] Refreshing prices from source:', source);
	const pricesURL = `prices${source !== 'buff' ? `_${source}` : ''}`;

	// for self builds, make sure to use your own API
	const response = await fetch(`${process.env.PLASMO_PUBLIC_PRICINGAPI}${pricesURL}.json`, {
		method: 'GET',
		headers: {
			'Content-Type': 'application/json',
			'x-via': `BetterFloat/${chrome.runtime.getManifest().version}`,
		},
	});

	if (response.ok) {
		const responseJson = (await response.json()) as Extension.ApiBuffResponse;
		if (responseJson?.data) {
			chrome.storage.local.set({
				[`${pricesURL}`]: JSON.stringify(responseJson.data),
				[`${source}-update`]: responseJson.time,
			});
		}
	}
	res.send({
		status: response.status,
	});
	return;
};

export default handler;
