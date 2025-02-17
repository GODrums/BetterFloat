import type { PlasmoMessaging } from '@plasmohq/messaging';
import type { BlueGem } from '~lib/@typings/ExtensionTypes';

export type GetBlueSalesBody = {
	type: string;
	pattern: number;
	currency: string;
};

const BLUEGEM_API_URL = 'https://api.bluegem.app';

const handler: PlasmoMessaging.MessageHandler<GetBlueSalesBody, BlueGem.PastSale[]> = async (req, res) => {
	const body = req.body;
	if (!body) {
		res.send([]);
		return;
	}
	const { type, pattern, currency } = body;

	const responseData = await fetch(`${BLUEGEM_API_URL}/v1/sales?skin=${type}&pattern=${pattern}&currency=${currency}`)
		.then((res) => res.json() as Promise<BlueGem.SearchResponse>)
		.catch(() => null);

	if (responseData?.data) {
		return res.send(responseData.data);
	}

	// data unavailable
	return res.send([]);
};

export default handler;
