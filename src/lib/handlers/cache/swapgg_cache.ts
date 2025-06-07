import type { Swapgg } from '~lib/@typings/SwapggTypes';

const swapggInventoryBot: { [image: string]: Swapgg.Item[] } = {};
const swapggInventoryUser: { [image: string]: Swapgg.Item[] } = {};
let swapggCurrency: string | null = null;
let tryOnce = false;

export async function initInventories() {
	await fetchBotInventory();
	await fetchUserInventory();
	tryOnce = true;
}

async function fetchUserInventory() {
	await fetch('https://api.swap.gg/v2/trade/inventory/user/730', {
		credentials: 'include',
	})
		.then((response) => response.json())
		.then((data: Swapgg.InventoryResponse) => {
			cacheSwapggInventoryUser(data.result);
		});
}

async function fetchBotInventory() {
	await fetch('https://api.swap.gg/v2/trade/inventory/bot/730', {
		credentials: 'include',
	})
		.then((response) => response.json())
		.then((data: Swapgg.InventoryResponse) => {
			cacheSwapggInventoryBot(data.result);
		});
}

export async function getSwapggInventoryBot(image: string) {
	if (isBotInventoryEmpty() && !tryOnce) {
		tryOnce = true;
		await fetchBotInventory();
	}
	return swapggInventoryBot[image];
}

export async function getSwapggInventoryUser(image: string) {
	if (isUserInventoryEmpty() && !tryOnce) {
		tryOnce = true;
		await fetchUserInventory();
	}
	return swapggInventoryUser[image];
}

export function getSwapggCurrency() {
	return swapggCurrency;
}

export function cacheSwapggInventoryBot(data: Swapgg.Item[]) {
	console.log('[BetterFloat] Caching bot inventory: ', data);
	data.forEach((item) => {
		if (!swapggInventoryBot[item.i]) {
			swapggInventoryBot[item.i] = [];
		}
		swapggInventoryBot[item.i].push(item);
	});
}

function isBotInventoryEmpty() {
	return Object.keys(swapggInventoryBot).length === 0;
}

export function cacheSwapggInventoryUser(data: Swapgg.Item[]) {
	console.log('[BetterFloat] Caching user inventory: ', data);
	data.forEach((item) => {
		if (!swapggInventoryUser[item.i]) {
			swapggInventoryUser[item.i] = [];
		}
		swapggInventoryUser[item.i].push(item);
	});
}

function isUserInventoryEmpty() {
	return Object.keys(swapggInventoryUser).length === 0;
}

export function cacheSwapggCurrency(currency: string) {
	swapggCurrency = currency;
}
