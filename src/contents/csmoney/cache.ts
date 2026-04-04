import type { CSMoney } from '~lib/@typings/CsmoneyTypes';

// csmoney: cached items from api
let csmoneyItems: CSMoney.Item[] = [];
const csmoneyItemMapping: { [itemId: number]: CSMoney.Item } = {};
// uses img and quality (fallback: "0") as keys
const csmoneyItemImgMapping: { [itemImg: string]: Record<string, CSMoney.Item> } = {};
let csmoneyUserInventory: CSMoney.InventoryItem[] = [];
let csmoneyBotInventory: CSMoney.InventoryItem[] = [];
let csmoneyPopupItem: CSMoney.MarketItem | null = null;

export function isCSMoneyInventoryItem(item: CSMoney.Item): item is CSMoney.InventoryItem {
	return 'img' in item;
}

export function cacheCSMoneyPopupItem(data: CSMoney.MarketItem) {
	csmoneyPopupItem = data;
}

export function cacheCSMoneyItems(data: CSMoney.Item[]) {
	if (!csmoneyItems) {
		csmoneyItems = [];
	}
	if (!data) {
		return;
	}
	data.forEach((item) => {
		csmoneyItemMapping[item.id] = item;
		if (isCSMoneyInventoryItem(item)) {
			let qualityKey = item.quality || '0';
			if (!csmoneyItemImgMapping[item.img]) {
				csmoneyItemImgMapping[item.img] = {};
			}
			if (qualityKey !== '0') {
				if (item.isStatTrak) {
					qualityKey = 'st-' + qualityKey;
				} else if (item.isSouvenir) {
					qualityKey = 'sv-' + qualityKey;
				}
			}
			csmoneyItemImgMapping[(item as CSMoney.InventoryItem).img][qualityKey] = { ...item };
		}
	});
	csmoneyItems.push(...data);
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

export function getCSMoneyPopupItem() {
	return csmoneyPopupItem;
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

export function getCSMoneyItemByImg(img: string, quality = '0') {
	if (!csmoneyItemImgMapping[img]) return null;

	return csmoneyItemImgMapping[img][quality];
}
