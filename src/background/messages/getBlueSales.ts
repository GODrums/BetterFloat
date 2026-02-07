import type { PlasmoMessaging } from '@plasmohq/messaging';
import type { BlueGem } from '~lib/@typings/ExtensionTypes';

export type GetBlueSalesBody = {
	weapon: string;
	type: 'ch' | 'ht';
	pattern: number;
};

const handler: PlasmoMessaging.MessageHandler<GetBlueSalesBody, BlueGem.PastSale[]> = async (req, res) => {
	const body = req.body;
	if (!body) {
		res.send([]);
		return;
	}
	const { weapon, type, pattern } = body;

	const responseData = await fetch(`${process.env.PLASMO_PUBLIC_BETTERFLOATAPI}/v1/bluegem/sales?weapon=${weapon}&type=${type}&pattern=${pattern}`)
		.then((res) => res.json() as Promise<BlueGem.SearchResponse>)
		.catch(() => null);

	if (responseData) {
		return res.send(responseData);
	}

	// data unavailable
	return res.send([]);
};

export default handler;
