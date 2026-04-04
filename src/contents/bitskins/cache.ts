import type { Bitskins } from '~lib/@typings/BitskinsTypes';

const bitskinsItems: { [id: string]: Bitskins.Item } = {};
let bitskinsPopoutItem: Bitskins.Item | null = null;

export function cacheBitskinsItems(data: Bitskins.Item[]) {
	data.forEach((item) => {
		bitskinsItems[item.id] = item;
	});
}

export function cacheBitskinsPopoutItem(data: Bitskins.Item) {
	bitskinsPopoutItem = data;
}

export function getBitskinsPopoutItem() {
	return bitskinsPopoutItem;
}

export function getSpecificBitskinsItem(id: string) {
	return bitskinsItems[id];
}
