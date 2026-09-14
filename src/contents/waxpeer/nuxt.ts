import type { Waxpeer } from '~lib/@typings/WaxpeerTypes';

type SerializedRecord = Record<string, unknown>;

/**
 * Nuxt serializes its SSR payload as a devalue-style array graph: object
 * properties contain indexes pointing at the real scalar/object values in the
 * top-level array. We only need a small listing subset, so walking the graph
 * and resolving those scalar references is safer and considerably smaller
 * than a full devalue deserializer.
 */
export function parseWaxpeerNuxtItems(serializedPayload: string | null | undefined): Waxpeer.Listing[] {
	if (!serializedPayload) return [];

	try {
		const payload = JSON.parse(serializedPayload) as unknown;
		const graph = Array.isArray(payload) ? payload : undefined;
		const records = graph ? graph.filter(isRecord) : collectRecords(payload);
		const items = new Map<string, Waxpeer.Listing>();

		for (const record of records) {
			const id = resolveScalar(record.item_id ?? record.itemId ?? record.listing_id ?? record.listingId ?? record.id, graph);
			const name = resolveScalar(record.market_hash_name ?? record.marketHashName ?? record.name, graph);
			const price = resolvePrice(record.price ?? record.price_value ?? record.priceValue, graph);
			const rawPhase = resolveScalar(record.phase ?? record.doppler_phase ?? record.dopplerPhase, graph);
			if ((typeof id !== 'string' && typeof id !== 'number') || typeof name !== 'string' || name.length < 3 || !Number.isFinite(price)) continue;

			const itemId = String(id);
			const phase = typeof rawPhase === 'string' ? rawPhase : undefined;
			items.set(itemId, { item_id: itemId, name, price, phase });
		}

		return Array.from(items.values());
	} catch (error) {
		console.debug('[BetterFloat] Failed to parse Waxpeer Nuxt payload:', error);
		return [];
	}
}

function isRecord(value: unknown): value is SerializedRecord {
	return !!value && typeof value === 'object' && !Array.isArray(value);
}

function resolveReference(value: unknown, graph: unknown[] | undefined) {
	if (graph && typeof value === 'number' && Number.isInteger(value) && value >= 0 && value < graph.length) return graph[value];
	return value;
}

function resolveScalar(value: unknown, graph: unknown[] | undefined) {
	return resolveReference(value, graph);
}

function resolvePrice(value: unknown, graph: unknown[] | undefined) {
	const resolved = resolveScalar(value, graph);
	if (typeof resolved === 'number' || typeof resolved === 'string') return Number(resolved);
	if (!isRecord(resolved)) return Number.NaN;
	return Number(resolveScalar(resolved.USD ?? resolved.usd ?? resolved.amount ?? resolved.value, graph));
}

function collectRecords(root: unknown) {
	const records: SerializedRecord[] = [];
	const seen = new WeakSet<object>();

	function visit(value: unknown) {
		if (!value || typeof value !== 'object' || seen.has(value)) return;
		seen.add(value);
		if (isRecord(value)) records.push(value);
		for (const child of Array.isArray(value) ? value : Object.values(value)) visit(child);
	}

	visit(root);
	return records;
}
