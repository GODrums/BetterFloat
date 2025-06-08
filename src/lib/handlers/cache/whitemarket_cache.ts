import type { WhiteMarket } from '~lib/@typings/WhitemarketTypes';

const whiteMarketItems: { [slug: string]: WhiteMarket.Listing } = {};
const whiteMarketPersistentInventory: { [steamImg: string]: WhiteMarket.Item } = {};
let whiteMarketInventory: WhiteMarket.Item[] = [];

export function cacheWhiteMarketItems(data: WhiteMarket.Listing[]) {
	for (const item of data) {
		whiteMarketItems[item.slug] = item;
	}
}

export function cacheWhiteMarketInventory(data: WhiteMarket.Item[]) {
	whiteMarketInventory = data;
	for (const item of data) {
		whiteMarketPersistentInventory[item.description.iconLarge] = { ...item };
	}
}

export function getWhiteMarketItem(slug: string) {
	return whiteMarketItems[slug];
}

export function getFirstWhiteMarketInventoryItem() {
	return whiteMarketInventory.shift();
}
