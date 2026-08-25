import type { CSMoney } from '~lib/@typings/CsmoneyTypes';

const csmoneyItemMapping: { [itemId: number]: CSMoney.Item } = {};
let csmoneyPopupItem: CSMoney.MarketItem | null = null;

export function cacheCSMoneyPopupItem(data: CSMoney.MarketItem) {
	csmoneyPopupItem = data;
}

export function cacheCSMoneyItems(data: CSMoney.Item[]) {
	if (!data) {
		return;
	}
	for (const item of data) {
		csmoneyItemMapping[item.id] = item;
		const assetId = (item as Partial<CSMoney.InventoryItem>).assetId;
		if (assetId !== undefined) {
			csmoneyItemMapping[assetId] = item;
		}
	}
}

export function getCSMoneyPopupItem() {
	return csmoneyPopupItem;
}

export function getCSMoneyItem(itemId: number) {
	return csmoneyItemMapping[itemId];
}
