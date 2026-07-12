import type { DMarket } from '~lib/@typings/DMarketTypes';

// dmarket: cached market items and user assets from api
const dmarketItems: DMarket.CachedListing[] = [];

export function isDMarketOfferV2(listing: DMarket.CachedListing): listing is DMarket.MarketOfferV2 {
	return 'priceCents' in listing;
}

export function isDMarketAsset(listing: DMarket.CachedListing): listing is DMarket.Asset {
	return 'itemId' in listing && 'cs2' in listing;
}

export function getDMarketPhase(listing: DMarket.CachedListing): string | undefined {
	if (isDMarketOfferV2(listing)) return;
	return isDMarketAsset(listing) ? listing.cs2.phase : listing.extra.phase;
}

export function getDMarketPaintSeed(listing: DMarket.CachedListing): number | undefined {
	if (isDMarketOfferV2(listing)) return listing.cs2.paintSeed;
	return isDMarketAsset(listing) ? listing.cs2.paintSeed : listing.extra.paintSeed;
}

function getDMarketListingIds(listing: DMarket.CachedListing): string[] {
	return isDMarketOfferV2(listing) ? [listing.offerId, listing.assetId] : [listing.itemId];
}

let dmarketCurrency: string | null = null;
let dmarketExchangeRates: { [key: string]: number } = {};
let dmarketLatestSales: DMarket.LatestSale[] = [];

export function cacheDMarketLatestSales(data: DMarket.LatestSale[]) {
	dmarketLatestSales = data;
}

export function getDMarketLatestSales() {
	return dmarketLatestSales;
}

export function getDMarketCurrency() {
	if (!dmarketCurrency) {
		dmarketCurrency = JSON.parse(localStorage.getItem('dmarket/AkitaStores') || '{}').currency?.activeCurrency;
	}
	return dmarketCurrency || 'USD';
}

export function cacheDMarketItems(data: DMarket.CachedListing[]) {
	data?.forEach((item) => {
		const listingIds = getDMarketListingIds(item);
		if (!dmarketItems.some((cachedItem) => getDMarketListingIds(cachedItem).some((id) => listingIds.includes(id)))) {
			dmarketItems.push(item);
		}
	});
}

export function cacheDMarketExchangeRates(data: { [key: string]: number }) {
	dmarketExchangeRates = Object.assign(dmarketExchangeRates, data);
}

export function getSpecificDMarketItem(id: string) {
	return dmarketItems.find((item) => getDMarketListingIds(item).includes(id));
}

export function getDMarketExchangeRate(currency: string) {
	if (Object.keys(dmarketExchangeRates).length === 0) {
		const apiRates = JSON.parse(localStorage.getItem('dmarket/AkitaStores') || '{}').currency?.currencyRates;
		if (apiRates) {
			cacheDMarketExchangeRates(apiRates);
		}
	}
	return dmarketExchangeRates[currency];
}
