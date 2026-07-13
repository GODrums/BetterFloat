import { defineCustomEventMessaging } from '@webext-core/messaging/page';
import type { BackgroundProtocol, BackgroundRequest, BackgroundResponse } from './background';

export type PageProtocol = Pick<BackgroundProtocol, 'createNotification' | 'getMarketComparison'>;
export type PageMessageName = keyof PageProtocol;

export const pageMessaging = defineCustomEventMessaging<PageProtocol>({
	namespace: 'betterfloat:main-world-messaging:v1',
	logger: console,
});

export function createPerKeySerializer<Key>() {
	const queues = new Map<Key, Promise<void>>();

	return function serialize<Value>(key: Key, task: () => Promise<Value>): Promise<Value> {
		const result = (queues.get(key) ?? Promise.resolve()).then(task);
		const settled = result.then(
			() => undefined,
			() => undefined
		);
		queues.set(key, settled);
		return result;
	};
}

const serializePageRequest = createPerKeySerializer<PageMessageName>();

export function requestNotification(data: BackgroundRequest<'createNotification'>): Promise<BackgroundResponse<'createNotification'>> {
	return serializePageRequest('createNotification', () => pageMessaging.sendMessage('createNotification', data));
}

export function requestMarketComparison(data: BackgroundRequest<'getMarketComparison'>): Promise<BackgroundResponse<'getMarketComparison'>> {
	return serializePageRequest('getMarketComparison', () => pageMessaging.sendMessage('getMarketComparison', data));
}
