import { backgroundMessaging } from './background';
import { type PageMessageName, pageMessaging } from './page';

const enabledMessages = new Set<PageMessageName>();

export function enablePageMessaging(...messageNames: PageMessageName[]): void {
	for (const messageName of messageNames) {
		if (enabledMessages.has(messageName)) continue;

		switch (messageName) {
			case 'createNotification':
				pageMessaging.onMessage(messageName, ({ data }) => backgroundMessaging.sendMessage(messageName, data));
				break;
			case 'getMarketComparison':
				pageMessaging.onMessage(messageName, ({ data }) => backgroundMessaging.sendMessage(messageName, data));
				break;
		}

		enabledMessages.add(messageName);
	}
}
