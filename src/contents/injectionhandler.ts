import { io } from 'socket.io-client/build/esm';
import socketParser from 'socket.io-msgpack-parser';

import type { PlasmoCSConfig } from 'plasmo';

import inject from 'url:~lib/util/inject.ts';

export const config: PlasmoCSConfig = {
	matches: ['https://*.csfloat.com/*', '*://*.skinport.com/*', '*://*.skinbid.com/*', '*://buff.market/*', '*://*.cs.money/*', '*://*.dmarket.com/*', '*://*.skinbaron.de/*', '*://*.bitskins.com/*'],
	run_at: 'document_start',
};

// we do not want to inject the script into blog pages
if (!location.hostname.includes('blog.')) {
	injectScript();
}
// some markets like skinport use websockets to update the page
if (location.hostname === 'skinport.com') {
	const interval = setInterval(() => {
		if (document.querySelector('.LiveBtn--isActive')) {
			startSocket();
			clearInterval(interval);
		}
	}, 10000);
}

// inject script into page
function injectScript() {
	const script = document.createElement('script');
	script.type = 'module';
	script.src = inject;
	script.onload = function () {
		(<typeof script>this).remove();
	};
	(document.head || document.documentElement).appendChild(script);
}

// get the user's currency. needed for the websocket connection init.
const userCurrency = async () => {
	const response = await fetch('https://skinport.com/api/data/');
	const data = await response.json();
	return data.currency;
};

function startSocket() {
	console.log('[BetterFloat] Connecting to Skinport Socket...');

	const socket = io('https://skinport.com', {
		transports: ['websocket'],
		autoConnect: true,
		reconnection: true,
		reconnectionAttempts: 5,
		reconnectionDelay: 1000,
		parser: socketParser,
	});

	//Types of events that can be received from the websocket:
	// 1. saleFeed - Sale Feed
	// 2. steamStatusUpdated - Steam Status
	// 3. maintenanceUpdated - Maintenance status
	// 4. sid - session ID
	// 5. unreadNotificationCountUpdated - Unread Notification Count: [{count: 1}]

	// Listen to the Sale Feed
	socket.on('saleFeed', (data) => {
		document.dispatchEvent(
			new CustomEvent('BetterFloat_WEBSOCKET_EVENT', {
				detail: {
					eventType: data.eventType,
					data: data.sales,
				},
			})
		);
	});

	socket.on('connect', async () => {
		console.debug('[BetterFloat] Successfully connected to Skinport websocket.');
		// Join Sale Feed with parameters.
		const currency = await userCurrency();
		if (currency) {
			socket.emit('saleFeedJoin', { appid: 730, currency: currency, locale: 'en' });
		} else {
			socket.emit('saleFeedJoin', { appid: 730, currency: 'USD', locale: 'en' });
		}
	});

	// Socket should automatically reconnect, but if it doesn't, log the error.
	socket.on('disconnect', () => {
		console.warn('[BetterFloat] Disconnected from websocket.');
	});
}
