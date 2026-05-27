import type { Skinplace } from '~lib/@typings/SkinplaceTypes';

const userInventory: { [img: string]: Skinplace.InventoryItem } = {};

const marketItems: { [img: string]: Skinplace.GetItem } = {};
let marketOffer: Skinplace.MarketOffersResponse | null = null;

export type SkinplaceMarketItemLookup = {
	cdnIconUrl: string;
	isStatTrak: boolean;
	isSouvenir: boolean;
	exterior: string;
};

function getMarketItemCacheKey({ cdnIconUrl, isStatTrak, isSouvenir, exterior }: SkinplaceMarketItemLookup) {
	return [cdnIconUrl, isStatTrak ? 'st' : isSouvenir ? 'souv' : '', exterior].join('|');
}

export function cacheSkinplaceMarketOffer(data: Skinplace.MarketOffersResponse) {
	marketOffer = data;
}

export function cacheSkinplaceMarketItems(data: Skinplace.GetItemsResponse) {
	data.items.forEach((item) => {
		marketItems[
			getMarketItemCacheKey({
				cdnIconUrl: item.cdn_icon_url,
				isStatTrak: Boolean(item.is_stattrak),
				isSouvenir: Boolean(item.steam_is_souvenir),
				exterior: item.shorten_exterior || item.steam_exterior,
			})
		] = { ...item };
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

export function getSpecificSkinplaceMarketItem(lookup: SkinplaceMarketItemLookup) {
	return marketItems[getMarketItemCacheKey(lookup)];
}

export function isSkinplaceMarketCacheEmpty() {
	return Object.keys(marketItems).length === 0;
}
