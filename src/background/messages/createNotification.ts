import { defineBackgroundHandler } from '~lib/messaging/background';
import { ICON_CSFLOAT, ICON_SKINPORT } from '~lib/util/globals';

export type CreateNotificationRequest = {
	id: string;
	title: string;
	message: string;
	site: string;
};

export type CreateNotificationResponse = {
	success: boolean;
};

declare module '~lib/messaging/background' {
	interface BackgroundProtocol {
		createNotification: (data: CreateNotificationRequest) => CreateNotificationResponse;
	}
}

let isListenerActive = false;

defineBackgroundHandler('createNotification', async (data) => {
	const id = data?.id;
	if (!data || !id || !data.title || !data.message || !data.site) {
		return { success: false };
	}
	if (!isListenerActive) {
		const granted = await chrome.permissions.contains({ permissions: ['notifications'] });
		if (!granted) {
			let permission = false;
			try {
				permission = await chrome.permissions.request({ permissions: ['notifications'] });
				if (!permission) {
					return { success: false };
				}
			} catch (e) {
				console.error(e);
			}
			if (!permission) {
				return { success: false };
			}
		}
		isListenerActive = true;
		chrome.notifications.onClicked.addListener(onClickNotification);
	}

	chrome.notifications.create(`betterfloat.${data.site}.${id}`, {
		type: 'basic',
		title: data.title,
		message: data.message,
		iconUrl: getSiteIcon(data.site),
		isClickable: true,
	});

	return { success: true };
});

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
			return 'https://skinport.com';
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
