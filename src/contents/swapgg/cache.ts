import type { Swapgg } from '~lib/@typings/SwapggTypes';

const swapggInventoryUser: Record<string, Swapgg.Item> = {};
const swapggInventorySite: Record<string, Swapgg.Item> = {};

export function cacheSwapggInventoryUser(inventory: Swapgg.InventoryResponse) {
	console.debug('[BetterFloat] Caching swapgg inventory user:', inventory);
	inventory.data.items.forEach((item) => {
		swapggInventoryUser[item.product.name] = item;
	});
}

export function cacheSwapggInventorySite(inventory: Swapgg.InventoryResponse) {
	console.debug('[BetterFloat] Caching swapgg inventory site:', inventory);
	inventory.data.items.forEach((item) => {
		swapggInventorySite[item.product.name] = item;
	});
}

export function getSwapggInventoryUser(name: string) {
	return swapggInventoryUser[name];
}

export function getSwapggInventorySite(name: string) {
	return swapggInventorySite[name];
}
