import type { Waxpeer } from '~lib/@typings/WaxpeerTypes';

const waxpeerItems: { [id: string]: Waxpeer.Item } = {};

export function cacheWaxpeerItems(data: Waxpeer.Item[]) {
	data.forEach((item) => {
		waxpeerItems[item.item_id] = { ...item };
	});
}

export function getSpecificWaxpeerItem(id: string) {
	return waxpeerItems[id];
}
