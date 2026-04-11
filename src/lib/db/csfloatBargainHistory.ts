import Dexie, { type Table } from 'dexie';
import type { CSFloat } from '~lib/@typings/FloatTypes';

export const CSF_BARGAIN_HISTORY_UPDATED_EVENT = 'BetterFloat_CSF_BARGAIN_HISTORY_UPDATED';

export type CSFloatOfferCreateFailure = {
	code: number;
	message: string;
};

export type CSFloatBargainHistoryEntry = {
	offerId: string;
	contractId: string;
	price: number;
	contractPrice: number;
	createdAt: string;
	expiresAt: string;
	state: string;
	type: 'buyer_offer';
	buyerId: string;
	currency: string;
	recordedAt: string;
};

type BargainHistoryUpdateDetail = {
	contractId: string;
};

class CSFloatBargainHistoryDB extends Dexie {
	bargains: Table<CSFloatBargainHistoryEntry, string>;

	constructor() {
		super('betterfloat-bargain-history');
		this.version(1).stores({
			bargains: 'offerId, contractId, [contractId+createdAt], recordedAt',
		});
	}
}

const bargainHistoryDb = new CSFloatBargainHistoryDB();

function isObject(value: unknown): value is Record<string, unknown> {
	return typeof value === 'object' && value !== null;
}

export function isCSFloatOfferCreateFailure(value: unknown): value is CSFloatOfferCreateFailure {
	return isObject(value) && typeof value.code === 'number' && typeof value.message === 'string';
}

function isCSFloatOffer(value: unknown): value is CSFloat.Offer {
	return (
		isObject(value) &&
		typeof value.id === 'string' &&
		typeof value.contract_id === 'string' &&
		typeof value.price === 'number' &&
		typeof value.type === 'string' &&
		typeof value.buyer_id === 'string'
	);
}

function getCurrentCurrency() {
	const userCurrencyRaw = document.querySelector('mat-select-trigger')?.textContent?.trim() ?? 'USD';
	const symbolToCurrencyCodeMap: { [key: string]: string } = {
		C$: 'CAD',
		AED: 'AED',
		A$: 'AUD',
		R$: 'BRL',
		CHF: 'CHF',
		'¥': 'CNY',
		Kč: 'CZK',
		kr: 'DKK',
		'£': 'GBP',
		PLN: 'PLN',
		SAR: 'SAR',
		SEK: 'SEK',
		S$: 'SGD',
	};
	const currencyCodeFromSymbol = symbolToCurrencyCodeMap[userCurrencyRaw];
	if (currencyCodeFromSymbol) {
		return currencyCodeFromSymbol;
	}
	return /^[A-Z]{3}$/.test(userCurrencyRaw) ? userCurrencyRaw : 'USD';
}

function normalizeOfferToHistoryEntry(offer: unknown): CSFloatBargainHistoryEntry | null {
	if (!isCSFloatOffer(offer) || offer.type !== 'buyer_offer' || !offer.id || !offer.contract_id) {
		return null;
	}

	const recordedAt = new Date().toISOString();
	const contractPrice = typeof offer.contract_price === 'number' ? offer.contract_price : (offer.contract?.price ?? 0);

	return {
		offerId: offer.id,
		contractId: offer.contract_id,
		price: offer.price,
		contractPrice,
		createdAt: typeof offer.created_at === 'string' ? offer.created_at : recordedAt,
		expiresAt: typeof offer.expires_at === 'string' ? offer.expires_at : '',
		state: typeof offer.state === 'string' ? offer.state : '',
		type: 'buyer_offer',
		buyerId: offer.buyer_id,
		currency: getCurrentCurrency(),
		recordedAt,
	};
}

function dispatchHistoryUpdate(contractIds: Iterable<string>) {
	for (const contractId of contractIds) {
		document.dispatchEvent(
			new CustomEvent<BargainHistoryUpdateDetail>(CSF_BARGAIN_HISTORY_UPDATED_EVENT, {
				detail: { contractId },
			})
		);
	}
}

function mergeHistoryEntry(existing: CSFloatBargainHistoryEntry | undefined, next: CSFloatBargainHistoryEntry) {
	if (!existing) {
		return next;
	}

	return {
		...existing,
		...next,
		contractPrice: next.contractPrice || existing.contractPrice,
		createdAt: next.createdAt || existing.createdAt,
		expiresAt: next.expiresAt || existing.expiresAt,
		state: next.state || existing.state,
		buyerId: next.buyerId || existing.buyerId,
		currency: next.currency || existing.currency,
		recordedAt: next.recordedAt,
	};
}

async function putHistoryEntries(entries: CSFloatBargainHistoryEntry[]) {
	if (entries.length === 0) {
		return [];
	}

	try {
		const mergedEntries = await bargainHistoryDb.transaction('rw', bargainHistoryDb.bargains, async () => {
			const existingEntries = await bargainHistoryDb.bargains.bulkGet(entries.map((entry) => entry.offerId));
			const merged = entries.map((entry, index) => mergeHistoryEntry(existingEntries[index] ?? undefined, entry));
			await bargainHistoryDb.bargains.bulkPut(merged);
			return merged;
		});
		const contractIds = [...new Set(mergedEntries.map((entry) => entry.contractId))];
		dispatchHistoryUpdate(contractIds);
		return mergedEntries;
	} catch (error) {
		console.warn('[BetterFloat] Failed to persist CSFloat bargain history:', error);
		return [];
	}
}

export async function upsertCSFBargainHistoryOffer(offer: unknown) {
	const entry = normalizeOfferToHistoryEntry(offer);
	if (!entry) {
		return null;
	}

	const savedEntries = await putHistoryEntries([entry]);
	return savedEntries[0] ?? null;
}

export async function upsertCSFBargainHistoryOffers(offers: unknown) {
	if (!Array.isArray(offers)) {
		return [];
	}

	const entries = offers.map(normalizeOfferToHistoryEntry).filter((entry): entry is CSFloatBargainHistoryEntry => entry !== null);
	return await putHistoryEntries(entries);
}

export async function upsertCSFBargainHistoryCreateResponse(response: unknown) {
	if (isCSFloatOfferCreateFailure(response)) {
		return null;
	}

	return await upsertCSFBargainHistoryOffer(response);
}

export async function getCSFBargainHistory(contractId: string, limit = 10) {
	if (!contractId) {
		return [];
	}

	try {
		const entries = await bargainHistoryDb.bargains.where('contractId').equals(contractId).toArray();
		return entries
			.sort((a, b) => {
				const createdDelta = new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
				if (createdDelta !== 0) {
					return createdDelta;
				}
				return new Date(b.recordedAt).getTime() - new Date(a.recordedAt).getTime();
			})
			.slice(0, limit);
	} catch (error) {
		console.warn('[BetterFloat] Failed to load CSFloat bargain history:', error);
		return [];
	}
}
