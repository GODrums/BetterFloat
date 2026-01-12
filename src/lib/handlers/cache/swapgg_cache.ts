import type { Swapgg } from '~lib/@typings/SwapggTypes';

const swapggInventoryUser: Record<string, Swapgg.Item> = {};
const swapggInventorySite: Record<string, Swapgg.Item> = {};

export function cacheSwapggInventoryUser(inventory: Swapgg.InventoryResponse) {
	console.debug('[BetterFloat] Caching swapgg inventory user:', inventory);
	inventory.data.items.forEach((item) => {
		swapggInventoryUser[item.product.image] = item;
	});
}

export function cacheSwapggInventorySite(inventory: Swapgg.InventoryResponse) {
	console.debug('[BetterFloat] Caching swapgg inventory site:', inventory);
	inventory.data.items.forEach((item) => {
		swapggInventorySite[item.product.image] = item;
	});
}

export function getSwapggInventoryUser(image: string) {
	return swapggInventoryUser[image];
}

export function getSwapggInventorySite(image: string) {
	return swapggInventorySite[image];
}
