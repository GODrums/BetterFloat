import type { PlasmoMessaging } from '@plasmohq/messaging';

type OpenTabBody = {
	url: string;
};

type OpenTabResponse = {
	success: boolean;
};

// Avoid opening the same URL multiple times
let lastOpenedURL = '';

const handler: PlasmoMessaging.MessageHandler<OpenTabBody, OpenTabResponse> = async (req, res) => {
	const url = req.body?.url;
	if (!url || url === lastOpenedURL) {
		res.send({
			success: false,
		});
		return;
	}
	lastOpenedURL = url;
	const tab = await chrome.tabs.create({ url, active: false, index: 0 });
	// close tab automatically after it's fully loaded
	chrome.tabs.onUpdated.addListener(function listener(tabId, info) {
		if (tabId === tab.id && info.status === 'complete') {
			chrome.tabs.onUpdated.removeListener(listener);
			chrome.tabs.remove(tab.id);
		}
	});

	res.send({
		success: true,
	});
	return;
};

export default handler;
