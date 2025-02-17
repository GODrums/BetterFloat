import { sendToBackground } from '@plasmohq/messaging';
import type { CreateNotificationBody, CreateNotificationResponse } from '~background/messages/createNotification';
import type { GetBlueBody } from '~background/messages/getBluePercent';
import type { GetBlueSalesBody } from '~background/messages/getBlueSales';
import type { BlueGem } from '~lib/@typings/ExtensionTypes';

export async function createNotificationMessage(body: CreateNotificationBody) {
	const response = await sendToBackground<CreateNotificationBody, CreateNotificationResponse>({
		name: 'createNotification',
		body,
	});
	return response;
}

type CSBlueGemOptions = {
	type: string;
	paint_seed: number;
	currency?: string;
};

export async function fetchBlueGemPastSales({ type, paint_seed: pattern, currency = 'USD' }: CSBlueGemOptions) {
	return await sendToBackground<GetBlueSalesBody, BlueGem.PastSale[]>({
		name: 'getBlueSales',
		body: {
			type,
			pattern,
			currency,
		},
	});
}

export async function fetchBlueGemPatternData(body: GetBlueBody) {
	return await sendToBackground<GetBlueBody, Partial<BlueGem.PatternData>>({
		name: 'getBluePercent',
		body,
	});
}
