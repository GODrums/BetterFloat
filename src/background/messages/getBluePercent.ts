import type { PlasmoMessaging } from '@plasmohq/messaging';
import BluepercentJson from '~/../assets/bluepercent.json';

type GetBlueBody = {
	type: string;
	pattern: number;
};

type GetBlueResponse = {
	playside?: number;
	backside?: number;
	double_sided?: number;
};

const handler: PlasmoMessaging.MessageHandler<GetBlueBody, GetBlueResponse> = async (req, res) => {
	const body = req.body;
	if (!body) {
		res.send({});
		return;
	}
	const { type, pattern } = body;

	res.send({
		playside: BluepercentJson[body.type].playside[pattern],
		backside: BluepercentJson[type].backside[pattern],
		double_sided: BluepercentJson[type].double_sided[pattern],
	});
	return;
};

export default handler;
