import { activateSiteCustomEventHandler, activateSiteEventHandler } from '~contents/shared/events';
import type { EventData } from '~lib/@typings/FloatTypes';
import type { Skinport } from '~lib/@typings/SkinportTypes';
import { cacheSkinportCurrencyRates, cacheSpItems, cacheSpMinOrderPrice, cacheSpPopupInventoryItem, cacheSpPopupItem } from '~lib/handlers/cache/skinport_cache';
import { addTotalInventoryPrice } from '~lib/helpers/skinport_helpers';

type SkinportWebsocketData = {
	eventType: string;
	data: Skinport.Item[];
};

async function handleSkinportWebsocket(eventData: SkinportWebsocketData) {
	const { handleListed, handleSold } = await import('~lib/helpers/websockethandler');
	if (eventData.eventType === 'listed') {
		await handleListed(eventData.data);
	} else if (eventData.eventType === 'sold') {
		await handleSold(eventData.data);
	}
}

function processSkinportEvent(eventData: EventData<unknown>) {
	console.debug('[BetterFloat] Received data from url: ' + eventData.url + ', data:', eventData.data);
	if (eventData.url.includes('api/browse/730')) {
		cacheSpItems((eventData.data as Skinport.MarketData).items);
	} else if (eventData.url.includes('api/item/inventory')) {
		cacheSpPopupInventoryItem(eventData.data as Skinport.InventoryItem);
	} else if (eventData.url.includes('api/item')) {
		cacheSpPopupItem(eventData.data as Skinport.ItemData);
	} else if (eventData.url.includes('api/home')) {
		const data = eventData.data as Skinport.HomeData;
		cacheSpItems([...data.sales[0].items]);
	} else if (eventData.url.includes('api/data/')) {
		const data = eventData.data as Skinport.UserData;
		localStorage.setItem('userData', JSON.stringify(data));
		cacheSkinportCurrencyRates(data.rates, data.currency);
		cacheSpMinOrderPrice(data.limits.minOrderValue);
	} else if (eventData.url.includes('api/inventory/listed')) {
		const listed = eventData.data as Skinport.InventoryListed;
		cacheSpItems(listed.items.map((item) => item));
		addTotalInventoryPrice(listed);
	} else if (eventData.url.includes('api/inventory/account')) {
		const account = eventData.data as Skinport.InventoryAccount;
		cacheSpItems(account.items.map((item) => item));
		addTotalInventoryPrice(account);
	} else if (eventData.url.includes('api/inventory/followed')) {
		document.querySelector('.betterfloat-totalbuffprice')?.remove();
	}
}

export function activateSkinportEventHandler() {
	activateSiteEventHandler(processSkinportEvent);
	activateSiteCustomEventHandler<SkinportWebsocketData>('BetterFloat_WEBSOCKET_EVENT', handleSkinportWebsocket);
}
