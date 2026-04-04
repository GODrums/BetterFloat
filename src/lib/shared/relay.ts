import { type MessagesMetadata, type PlasmoMessaging, relayMessage } from '@plasmohq/messaging';

export type MessageRelay<T = unknown> = PlasmoMessaging.Request<keyof MessagesMetadata, T>;

export const RELAY_CREATE_NOTIFICATION: MessageRelay = {
	name: 'createNotification',
};

export const RELAY_GET_MARKET_COMPARISON: MessageRelay = {
	name: 'getMarketComparison',
};

export function addMessageRelays(...relays: Array<MessageRelay>) {
	relays.forEach((relay) => {
		relayMessage(relay);
	});
}
