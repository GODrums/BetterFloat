import type { Skinplace } from '~lib/@typings/SkinplaceTypes';

const userInventory: { [img: string]: Skinplace.InventoryItem } = {};

const marketItems: { [img: string]: Skinplace.GetItem } = {};

type CachedOffers = { key: string; response: Skinplace.MarketOffersResponse };
// The item page renders a "featured" offer (limit=1 request) above the main offer list.
// The list repeats the featured offer, but the page leaves that duplicate out.
let featuredOffer: CachedOffers | null = null;
let offerList: CachedOffers | null = null;

export type SkinplaceMarketItemLookup = {
	cdnIconUrl: string;
	isStatTrak: boolean;
	isSouvenir: boolean;
	exterior: string;
};

function getMarketItemCacheKey({ cdnIconUrl, isStatTrak, isSouvenir, exterior }: SkinplaceMarketItemLookup) {
	// Cards use full CDN URLs and may append /d/<size>.webp to Steam icons.
	// Preserve the rest of the path so individual screenshots remain distinct.
	const imagePath = new URL(cdnIconUrl, 'https://skin.place').pathname.replace(/^\/+/, '').replace(/\/d\/\d+x\d+\.webp$/, '');
	return [imagePath, isStatTrak ? 'st' : isSouvenir ? 'souv' : '', exterior].join('|');
}

function parseOffersUrl(url: string) {
	const params = new URL(url, 'https://skin.place').searchParams;
	const limit = Number(params.get('limit') ?? 0);
	const offset = Number(params.get('offset') ?? 0);
	for (const param of ['limit', 'offset', 'is_hold', 'is_external']) params.delete(param);
	params.sort();
	return { key: params.toString(), isFeatured: limit === 1, offset };
}

export function cacheSkinplaceMarketOffer(data: Skinplace.MarketOffersResponse, url = '') {
	if (!Array.isArray(data?.data)) return;
	const { key, isFeatured, offset } = parseOffersUrl(url);
	if (isFeatured) {
		featuredOffer = { key, response: data };
	} else if (offset > 0 && offerList?.key === key) {
		// "load more" pages are appended below the existing rows
		offerList = { key, response: { ...offerList.response, data: [...offerList.response.data, ...data.data] } };
	} else {
		offerList = { key, response: data };
	}
}

export function cacheSkinplaceMarketItems(data: Skinplace.GetItemsResponse) {
	const items = data?.items ?? data?.data;
	if (!Array.isArray(items)) return;
	items.forEach((item) => {
		const cachedItem = { ...item };
		const images = [item.cdn_icon_url, ...(item.screenshots ?? []).map((screenshot) => screenshot.icon_url)];
		for (const cdnIconUrl of images) {
			if (!cdnIconUrl) continue;
			marketItems[
				getMarketItemCacheKey({
					cdnIconUrl,
					isStatTrak: Boolean(item.is_stattrak),
					isSouvenir: Boolean(item.steam_is_souvenir ?? item.is_souvenir),
					exterior: item.shorten_exterior || item.steam_exterior,
				})
			] = cachedItem;
		}
	});
}

export function cacheSkinplaceUserInventory(inventory: Skinplace.InventoryResponse) {
	inventory.inv.forEach((item) => {
		userInventory[item.cdn_icon_url] = { ...item };
	});
}

/** Offers in the order the item page renders them: featured row first, then the list. */
export function getSkinplaceMarketOffer(): Skinplace.MarketOffersResponse | null {
	const featured = featuredOffer?.response.data[0];
	if (!offerList) return featuredOffer?.response ?? null;
	if (!featured || featuredOffer?.key !== offerList.key) return offerList.response;
	return { ...offerList.response, data: [featured, ...offerList.response.data.filter((offer) => offer.id !== featured.id)] };
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
