import type { PlasmoMessaging } from '@plasmohq/messaging';

type OCORequestBody = {
	saleId: string;
	oco_key: string;
};

type OCOResponseBody = {
	status: number;
	data: any;
};

const handler: PlasmoMessaging.MessageHandler<OCORequestBody, OCOResponseBody> = async (req, res) => {
	if (!req.body?.saleId || !req.body?.oco_key) {
		res.send({
			status: 400,
			data: 'Missing saleId or oco_key',
		});
		return;
	}
	const captchaAPIUrl = 'https://api.gamingtechinsider.com/api/v2/captcha/betterfloat/';
	const response = await fetch(captchaAPIUrl + req.body.saleId, {
		method: 'GET',
		headers: {
			Authorization: req.body.oco_key,
			'Content-Type': 'application/json',
		},
	});
	const responseJson = await response.json();
	console.log(response, responseJson);

	res.send({
		status: response.status,
		data: responseJson,
	});
};

export default handler;
