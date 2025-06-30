import type { Tradeit } from '~lib/@typings/TradeitTypes';

// tradeit: cached items from bots
let tradeitBotItems: Tradeit.Item[] = [];
// tradeit: cached items from own inventory
const tradeitOwnItems: { [steamImg: string]: Tradeit.Item[] } = {};

export function cacheTradeitBotItems(data: Tradeit.Item[]) {
	if (tradeitBotItems.length > 0) {
		console.debug('[BetterFloat] Items already cached, deleting items: ', tradeitBotItems);
		tradeitBotItems = [];
	}
	tradeitBotItems = data;
}

export function cacheTradeitOwnItems(data: { [assetId: number]: Tradeit.Item[] }) {
	for (const [_key, value] of Object.entries(data)) {
		for (const item of value) {
			tradeitOwnItems[item.imgURL] = [item];
		}
	}
}

export function getTradeitOwnItemByGridImg(name: string) {
	return Object.values(tradeitOwnItems).find((items) => items[0].imgUrls?.gridImgUrl === name)?.[0];
}

export function getFirstTradeitOwnItem(steamImg: string) {
	return tradeitOwnItems[steamImg];
}

export function getFirstTradeitBotItem() {
	if (tradeitBotItems.length > 0) {
		const item = tradeitBotItems.shift();
		return item;
	} else {
		return null;
	}
}
