import type { CSMoney } from '~lib/@typings/CsmoneyTypes';
import type { EventData } from '~lib/@typings/FloatTypes';
import { activateSiteEventHandler } from '~lib/shared/events';
import { parseCSMoneyAstroItems } from './astro';
import { cacheCSMoneyBotInventory, cacheCSMoneyItems, cacheCSMoneyPopupItem, cacheCSMoneyUserInventory } from './cache';

const processedAstroPageParams = new WeakSet<HTMLScriptElement>();

export function cacheCSMoneyAstroPageParams() {
	const pageParams = document.querySelector<HTMLScriptElement>('script#__page-params');
	if (!pageParams || processedAstroPageParams.has(pageParams)) return false;

	const items = parseCSMoneyAstroItems(pageParams.textContent);
	if (items.length === 0) return false;

	processedAstroPageParams.add(pageParams);
	cacheCSMoneyItems(items);
	return true;
}

function processCSMoneyEvent(eventData: EventData<unknown>) {
	if (!eventData.data || (typeof eventData.data !== 'object' && !Object.hasOwn(eventData.data, 'error'))) {
		console.error('[BetterFloat] Error:', eventData.data);
		return;
	}

	if (eventData.url.includes('1.0/market/sell-orders/')) {
		cacheCSMoneyPopupItem((eventData.data as CSMoney.SingleSellOrderResponse).item);
	} else if (eventData.url.includes('1.0/market/sell-orders')) {
		cacheCSMoneyItems((eventData.data as CSMoney.SellOrderResponse).items);
	} else if (eventData.url.includes('2.0/market/sell-orders')) {
		cacheCSMoneyItems((eventData.data as CSMoney.SellOrderResponse).items);
	} else if (eventData.url.includes('market/user-inventory')) {
		if (eventData.url.includes('user-inventory/')) {
			cacheCSMoneyPopupItem((eventData.data as CSMoney.UserInventoryPopupResponse).item);
		} else {
			cacheCSMoneyItems((eventData.data as CSMoney.UserInventoryResponse).items);
		}
	} else if (eventData.url.includes('/load_user_inventory/730')) {
		cacheCSMoneyUserInventory((eventData.data as CSMoney.UserInventoryResponse).items);
	} else if (eventData.url.includes('/load_bots_inventory/730')) {
		cacheCSMoneyBotInventory((eventData.data as CSMoney.UserInventoryResponse).items);
	}
}

export function activateCSMoneyEventHandler() {
	activateSiteEventHandler(processCSMoneyEvent);

	// Astro server-renders the initial inventory instead of requesting it from
	// the browser. Cache it immediately and again after Astro page transitions.
	const hasAstroPageParams = cacheCSMoneyAstroPageParams();
	document.addEventListener('astro:page-load', cacheCSMoneyAstroPageParams);
	document.addEventListener('astro:after-swap', cacheCSMoneyAstroPageParams);
	return hasAstroPageParams;
}
