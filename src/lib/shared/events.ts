import type { EventData } from '~lib/@typings/FloatTypes';
import { enablePageMessaging } from '~lib/messaging/page-bridge';

export type SiteEventProcessor = (eventData: EventData<unknown>) => void;

export function activateSiteEventHandler(processEvent: SiteEventProcessor) {
	document.addEventListener('BetterFloat_INTERCEPTED_REQUEST', (event) => {
		processEvent((event as CustomEvent<EventData<unknown>>).detail);
	});
	enablePageMessaging('getMarketComparison');
}

export function activateSiteCustomEventHandler<T>(eventName: string, processEvent: (detail: T) => void | Promise<void>) {
	document.addEventListener(eventName, (event) => {
		void processEvent((event as CustomEvent<T>).detail);
	});
}
