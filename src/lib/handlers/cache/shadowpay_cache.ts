import type { Shadowpay } from '~lib/@typings/ShadowpayTypes';

const shadowpayItems: { [id: string]: Shadowpay.Item } = {};
const shadowpayInventory: { [img: string]: Shadowpay.Item } = {};

export function cacheShadowpayItems(data: Shadowpay.Item[]) {
	data.forEach((item) => {
		shadowpayItems[item.id] = item;
	});
}

export function cacheShadowpayInventory(data: Shadowpay.Item[]) {
	data.forEach((item) => {
		shadowpayInventory[item.icon_url!] = item;
	});
}

export function getSpecificShadowpayItem(id: string) {
	return shadowpayItems[id];
}

export function getShadowpayInventoryItem(iconUrl: string) {
	return shadowpayInventory[iconUrl];
}
