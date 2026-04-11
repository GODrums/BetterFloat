import type { CSFloat } from '~lib/@typings/FloatTypes';
import { getFloatColoring } from '~lib/util/helperfunctions';

let itemSchema: CSFloat.ItemSchema.TypeSchema | null = null;

export function initItemSchema() {
	if (!itemSchema) {
		itemSchema = JSON.parse(window.sessionStorage.ITEM_SCHEMA_V2 || '{}').schema ?? {};
	}
}

export function getWeaponSchemaIndex(item: CSFloat.Item) {
	if (item.type !== 'skin') {
		return undefined;
	}

	initItemSchema();

	const names = item.item_name.split(' | ');
	if (names[0].includes('★')) {
		names[0] = names[0].replace('★ ', '');
	}
	if (item.paint_index === 0) {
		names[1] = 'Vanilla';
	}
	if (item.phase) {
		names[1] += ` (${item.phase})`;
	}

	return Object.entries((itemSchema as CSFloat.ItemSchema.TypeSchema).weapons).find(([_, value]) => value.name === names[0])?.[0];
}

export function getSkinSchema(item: CSFloat.Item): CSFloat.ItemSchema.SingleSchema | null {
	if (item.type !== 'skin') {
		return null;
	}

	initItemSchema();

	if (Object.keys(itemSchema ?? {}).length === 0) {
		return null;
	}

	const names = item.item_name.split(' | ');
	if (names[0].includes('★')) {
		names[0] = names[0].replace('★ ', '');
	}
	if (item.paint_index === 0) {
		names[1] = 'Vanilla';
	}
	if (item.phase) {
		names[1] += ` (${item.phase})`;
	}

	const weapon = Object.values((itemSchema as CSFloat.ItemSchema.TypeSchema).weapons).find((el) => el.name === names[0]);
	if (!weapon) return null;

	return Object.values(weapon.paints).find((el) => el.name === names[1]) as CSFloat.ItemSchema.SingleSchema;
}

export function addFloatColoring(container: Element, listing: CSFloat.ListingData) {
	if (!listing.item.float_value) return;
	const skinSchema = getSkinSchema(listing.item);

	const element = container.querySelector<HTMLElement>('div.wear');
	if (element) {
		const lowestRank = Math.min(listing.item.low_rank || 99, listing.item.high_rank || 99);
		const floatColoring = getRankedFloatColoring(listing.item.float_value, skinSchema?.min ?? 0, skinSchema?.max ?? 1, listing.item.paint_index === 0, lowestRank);
		if (floatColoring !== '') {
			element.style.color = floatColoring;
		}
	}
}

export function getRankedFloatColoring(float: number, min: number, max: number, vanilla: boolean, rank: number) {
	switch (rank) {
		case 1:
			return '#efbf04';
		case 2:
		case 3:
			return '#d9d9d9';
		case 4:
		case 5:
			return '#f5a356';
		default:
			return getFloatColoring(float, min, max, vanilla);
	}
}
