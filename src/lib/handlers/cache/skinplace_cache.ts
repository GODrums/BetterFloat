import type { Skinplace } from '~lib/@typings/SkinplaceTypes';

const userInventory: { [img: string]: Skinplace.InventoryItem } = {};

const offers: { [img: string]: Skinplace.Offer } = {};

export function cacheSkinplaceOffers(data: Skinplace.OffersResponse) {
	data.list.forEach((offer) => {
		offers[offer.skin.image] = { ...offer };
	});
}

export function cacheSkinplaceUserInventory(inventory: Skinplace.InventoryResponse) {
	inventory.inv.forEach((item) => {
		userInventory[item.icon_url] = { ...item };
	});
}

export function getSpecificSkinplaceUserItem(imgSrc: string) {
	return userInventory[imgSrc];
}

export function getSpecificSkinplaceOffer(imgSrc: string) {
	return offers[imgSrc];
}
