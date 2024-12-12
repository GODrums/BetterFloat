import type { CSMoney } from '~lib/@typings/CsmoneyTypes';

// csmoney: cached items from api
let csmoneyItems: CSMoney.Item[] = [];
const csmoneyItemMapping: { [itemId: number]: CSMoney.Item } = {};
let csmoneyUserInventory: CSMoney.InventoryItem[] = [];
let csmoneyBotInventory: CSMoney.InventoryItem[] = [];

export function cacheCSMoneyItems(data: CSMoney.Item[]) {
	if (!csmoneyItems || csmoneyItems.length > 0) {
		csmoneyItems = [];
	}
	data.forEach((item) => {
		csmoneyItemMapping[item.id] = item;
	});
	csmoneyItems = Object.assign([], data);
}

export function cacheCSMoneyUserInventory(data: CSMoney.InventoryItem[]) {
	if (csmoneyUserInventory.length > 0) {
		csmoneyUserInventory.push(...data);
	} else {
		csmoneyUserInventory = Object.assign(csmoneyUserInventory, data);
	}
}

export function cacheCSMoneyBotInventory(data: CSMoney.InventoryItem[]) {
	if (csmoneyBotInventory.length > 0) {
		csmoneyBotInventory.push(...data);
	} else {
		csmoneyBotInventory = Object.assign(csmoneyBotInventory, data);
	}
}

export function getFirstCSMoneyUserInventoryItem() {
	return csmoneyUserInventory?.shift();
}

export function isCSMoneyUserInventoryEmpty() {
	return csmoneyUserInventory.length === 0;
}

export function getFirstCSMoneyBotInventoryItem() {
	return csmoneyBotInventory?.shift();
}

export function isCSMoneyBotInventoryEmpty() {
	return csmoneyBotInventory.length === 0;
}

export function getFirstCSMoneyItem() {
	if (!csmoneyItems) {
		csmoneyItems = [];
		return null;
	}
	if (csmoneyItems.length > 0) {
		const item = csmoneyItems.shift();
		return item;
	} else {
		return null;
	}
}

export function getSpecificCSMoneyItem(itemId: number) {
	return csmoneyItemMapping[itemId];
}
