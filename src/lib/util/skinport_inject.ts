import { io } from 'socket.io-client/build/esm';
import socketParser from 'socket.io-msgpack-parser';

/**
 * This script runs in the MAIN world (page context) to establish
 * the Skinport websocket connection. This is necessary because
 * Firefox does not properly support WebSocket connections from
 * the isolated content script world.
 *
 * Communication with the content script is done via CustomEvents
 * on the document object, which are visible across worlds.
 */
const userCurrency = async (): Promise<string | null> => {
	const localuserData = localStorage.getItem('userData');
	if (localuserData) {
		const userData = JSON.parse(localuserData);
		return userData.currency || null;
	}

	try {
		const response = await fetch('https://skinport.com/api/data/');
		if (!response.ok) {
			console.warn('[BetterFloat - MAIN world] Failed to fetch user currency:', response.status);
			return null;
		}
		const data = await response.json();
		return data.currency || null;
	} catch (error) {
		console.error('[BetterFloat - MAIN world] Error fetching user currency:', error);
		return null;
	}
};

function startSkinportSocket() {
	console.log('[BetterFloat - MAIN world] Connecting to Skinport Socket...');

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

	const joinSaleFeed = async () => {
		const currency = await userCurrency();
		socket.emit('saleFeedJoin', { appid: 730, currency: currency || 'USD', locale: 'en' });
	};

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
		console.debug('[BetterFloat - MAIN world] Successfully connected to Skinport websocket.');
		await joinSaleFeed();
	});

	socket.on('disconnect', () => {
		console.warn('[BetterFloat - MAIN world] Disconnected from websocket.');
	});
}

startSkinportSocket();
