import type { EventData } from '~lib/@typings/FloatTypes';
import { addMessageRelays, RELAY_GET_MARKET_COMPARISON } from './relay';

export type SiteEventProcessor = (eventData: EventData<unknown>) => void;

export function activateSiteEventHandler(processEvent: SiteEventProcessor) {
	document.addEventListener('BetterFloat_INTERCEPTED_REQUEST', (event: CustomEvent<EventData<unknown>>) => {
		processEvent(event.detail);
	});
	addMessageRelays(RELAY_GET_MARKET_COMPARISON);
}

export function activateSiteCustomEventHandler<T>(eventName: string, processEvent: (detail: T) => void | Promise<void>) {
	document.addEventListener(eventName, (event: CustomEvent<T>) => {
		void processEvent(event.detail);
	});
}
