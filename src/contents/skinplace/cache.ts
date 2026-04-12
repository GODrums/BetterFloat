import type { Skinplace } from '~lib/@typings/SkinplaceTypes';

const userInventory: { [img: string]: Skinplace.InventoryItem } = {};

const marketItems: { [img: string]: Skinplace.GetItem } = {};
let marketOffer: Skinplace.MarketOffersResponse | null = null;

export function cacheSkinplaceMarketOffer(data: Skinplace.MarketOffersResponse) {
	marketOffer = data;
}

export function cacheSkinplaceMarketItems(data: Skinplace.GetItemsResponse) {
	data.items.forEach((item) => {
		marketItems[item.cdn_icon_url] = { ...item };
	});
}

export function cacheSkinplaceUserInventory(inventory: Skinplace.InventoryResponse) {
	inventory.inv.forEach((item) => {
		userInventory[item.cdn_icon_url] = { ...item };
	});
}

export function getSkinplaceMarketOffer() {
	return marketOffer;
}

export function getSpecificSkinplaceUserItem(imgSrc: string) {
	return userInventory[imgSrc];
}

export function getSpecificSkinplaceMarketItem(imgSrc: string) {
	return marketItems[imgSrc];
}

export function isSkinplaceMarketCacheEmpty() {
	return Object.keys(marketItems).length === 0;
}
