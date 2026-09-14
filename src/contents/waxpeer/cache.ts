import type { Waxpeer } from '~lib/@typings/WaxpeerTypes';

const waxpeerItems: { [id: string]: Waxpeer.Listing } = {};

export function cacheWaxpeerItems(data: Waxpeer.Listing[]) {
	data?.forEach((item) => {
		if (!item?.item_id || !item.name || !Number.isFinite(Number(item.price))) return;
		waxpeerItems[String(item.item_id)] = { ...item, item_id: String(item.item_id), price: Number(item.price) };
	});
}

export function extractWaxpeerItemPageListings(data: unknown): Waxpeer.Listing[] {
	if (!data || typeof data !== 'object' || Array.isArray(data)) return [];

	const response = data as Record<string, unknown>;
	const candidates = [response.item, response.similar, response.variants, response.family_skins, response.recommended_items].flatMap((value) =>
		Array.isArray(value) ? value : value ? [value] : []
	);

	return candidates.filter((candidate): candidate is Waxpeer.Listing => {
		if (!candidate || typeof candidate !== 'object' || Array.isArray(candidate)) return false;
		const item = candidate as Partial<Waxpeer.Listing> & { item_id?: string | number };
		return (typeof item.item_id === 'string' || typeof item.item_id === 'number') && typeof item.name === 'string' && Number.isFinite(Number(item.price));
	});
}

export function getSpecificWaxpeerItem(id: string) {
	return waxpeerItems[id];
}

export function getWaxpeerItems() {
	return Object.values(waxpeerItems);
}

export function findWaxpeerItemByName(value: string) {
	const normalizedValue = normalizeName(value);
	let bestMatch: { item: Waxpeer.Listing; index: number; length: number } | undefined;
	for (const item of getWaxpeerItems()) {
		const normalizedName = normalizeName(item.name);
		const index = normalizedValue.indexOf(normalizedName);
		if (index === -1) continue;
		if (!bestMatch || index < bestMatch.index || (index === bestMatch.index && normalizedName.length > bestMatch.length)) {
			bestMatch = { item, index, length: normalizedName.length };
		}
	}
	return bestMatch?.item;
}

function normalizeName(value: string) {
	return value.replace(/\s+/g, ' ').trim().toLocaleLowerCase();
}
