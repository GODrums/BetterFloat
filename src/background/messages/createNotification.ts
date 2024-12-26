import type { PlasmoMessaging } from '@plasmohq/messaging';
import { ICON_CSFLOAT, ICON_SKINPORT } from '~lib/util/globals';

type CreateNotificationBody = {
	id: string;
	title: string;
	message: string;
	site: string;
};

type CreateNotificationResponse = {
	success: boolean;
};

let isListenerActive = false;

const handler: PlasmoMessaging.MessageHandler<CreateNotificationBody, CreateNotificationResponse> = async (req, res) => {
	const id = req.body?.id;
	if (!req.body) {
		res.send({
			success: false,
		});
		return;
	}
	if (!isListenerActive) {
		const granted = await chrome.permissions.contains({ permissions: ['notifications'] });
		if (!granted) {
			res.send({
				success: false,
			});
			return;
		}
		isListenerActive = true;
		chrome.notifications.onClicked.addListener(onClickNotification);
	}

	chrome.notifications.create(`betterfloat.${req.body.site}.${id}`, {
		type: 'basic',
		title: req.body.title,
		message: req.body.message,
		iconUrl: getSiteIcon(req.body.site),
		isClickable: true,
	});

	res.send({
		success: true,
	});
	return;
};

async function onClickNotification(notificationId: string) {
	// format: betterfloat.site.id
	if (notificationId.startsWith('betterfloat.')) {
		const parts = notificationId.split('.');
		const url = getSiteURL(parts[1]) + parts[2];
		await chrome.tabs.create({ url });
	}
}

function getSiteURL(site: string) {
	switch (site) {
		case 'csfloat':
			return 'https://csfloat.com/item/';
		case 'skinport':
			return 'https://skinport.com/item/';
		default:
			return '';
	}
}

function getSiteIcon(site: string) {
	switch (site) {
		case 'csfloat':
			return ICON_CSFLOAT;
		case 'skinport':
			return ICON_SKINPORT;
		default:
			return '';
	}
}

export default handler;
