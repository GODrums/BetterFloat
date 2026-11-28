// Legacy: api/market/get_items, api/market/guest/get_items
// Current: api/frontend/market/items?... (not market/items/<id> or market/items/<id>/screenshots)
export function isMarketItemsUrl(url: string) {
	return /api\/market\/(guest\/)?get_items/.test(url) || /api\/frontend\/market\/items(\?|$)/.test(url);
}

// Legacy: api/market/items/offers?, current: api/frontend/market/offers? (not offers/stats)
export function isMarketOffersUrl(url: string) {
	return url.includes('api/market/items/offers?') || /api\/frontend\/market\/offers(\?|$)/.test(url);
}
