import type { PlasmoMessaging } from '@plasmohq/messaging';
import type { BlueGem } from '~lib/@typings/ExtensionTypes';

export type GetBlueBody = {
	type: string;
	pattern: number;
};

const BLUEGEM_CDN_URL = 'https://cdn.bluegem.app';

const jsonCache: {
	[type: string]: {
		[pattern: string]: BlueGem.PatternData;
	};
} = {};

const handler: PlasmoMessaging.MessageHandler<GetBlueBody, Partial<BlueGem.PatternData>> = async (req, res) => {
	const body = req.body;
	if (!body) {
		res.send({});
		return;
	}
	const { type, pattern } = body;

	if (jsonCache[type]) {
		res.send(jsonCache[type][pattern]);
		return;
	}

	// get type data from storage
	const storageKey = `blugem-${type}.json`;
	const typeData = await chrome.storage.local.get(storageKey);
	if (typeData[storageKey]) {
		jsonCache[type] = typeData[storageKey];
		return res.send(jsonCache[type][pattern]);
	}

	// fetch from API
	const responseData = await fetch(`${BLUEGEM_CDN_URL}/patterns/${type}.json`)
		.then((res) => res.json())
		.catch(() => null);
	if (responseData) {
		jsonCache[type] = responseData;
		// cache in local storage
		await chrome.storage.local.set({ [storageKey]: responseData });
		return res.send(jsonCache[type][pattern]);
	}

	// data unavailable
	return res.send({});
};

export default handler;
