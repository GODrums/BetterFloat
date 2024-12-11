import type { CSMoney } from "~lib/@typings/CsmoneyTypes";

// csmoney: cached items from api
let csmoneyItems: CSMoney.Item[] = [];
const csmoneyItemMapping: { [itemId: number]: CSMoney.Item } = {};
let csmoneyUserInventory: CSMoney.InventoryItem[] = [];
let csmoneyBotInventory: CSMoney.InventoryItem[] = [];


export function cacheCSMoneyItems(data: CSMoney.Item[]) {
	if (!csmoneyItems) {
		csmoneyItems = [];
	}
	if (csmoneyItems.length > 0) {
		console.debug('[Plasmo] Items already cached, deleting items: ', csmoneyItems);
		csmoneyItems = [];
	}
	data.forEach((item) => {
		csmoneyItemMapping[item.id] = item;
	});
	csmoneyItems = data;
}

export function cacheCSMoneyUserInventory(data: CSMoney.InventoryItem[]) {
	csmoneyUserInventory = data;
}

export function cacheCSMoneyBotInventory(data: CSMoney.InventoryItem[]) {
	csmoneyBotInventory = data;
}

export function getFirstCSMoneyUserInventoryItem() {
	return csmoneyUserInventory?.shift();
}

export function getFirstCSMoneyBotInventoryItem() {
	return csmoneyBotInventory?.shift();
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