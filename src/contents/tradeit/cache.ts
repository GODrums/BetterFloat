import type { Tradeit } from '~lib/@typings/TradeitTypes';

// tradeit: cached items from bots
let tradeitBotItems: Tradeit.Item[] = [];
// tradeit: cached items from own inventory
const tradeitOwnItems: { [steamImg: string]: Tradeit.Item[] } = {};
const tradeitOwnItemsByName: { [name: string]: Tradeit.Item } = {};

// expanded need to be reversed to match the MutationObserver order
export function cacheTradeitBotItems(data: Tradeit.Item[], isExpanded: boolean) {
	if (tradeitBotItems.length > 0) {
		console.debug('[BetterFloat] Items already cached, deleting items: ', tradeitBotItems);
		tradeitBotItems = [];
	}
	const items = isExpanded ? data.reverse() : data;
	tradeitBotItems = items;
}

export function cacheTradeitOwnItems(data: { [assetId: number]: Tradeit.Item[] }) {
	for (const [_key, value] of Object.entries(data)) {
		for (const item of value) {
			tradeitOwnItems[item.imgURL] = [item];
			tradeitOwnItemsByName[item.name] = item;
		}
	}
}

export function getTradeitOwnItemByName(name: string) {
	return tradeitOwnItemsByName[name];
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
