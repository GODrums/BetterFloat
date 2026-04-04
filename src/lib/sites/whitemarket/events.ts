import type { EventData } from '~lib/@typings/FloatTypes';
import type { WhiteMarket } from '~lib/@typings/WhitemarketTypes';
import { cacheWhiteMarketInventory, cacheWhiteMarketItems } from '~lib/handlers/cache/whitemarket_cache';
import { activateSiteEventHandler } from '~lib/sites/shared/events';

function processWhiteMarketEvent(eventData: EventData<unknown>) {
	console.debug(`[BetterFloat] Received data from url: ${eventData.url}, data:`, eventData.data);

	if (!eventData.url.includes('graphql/api')) {
		return;
	}

	const responseData = (eventData.data as any).data;

	if (responseData.market_list) {
		const items = (responseData as WhiteMarket.MarketListResponse).market_list.edges.map((edge) => edge.node);
		cacheWhiteMarketItems(items);
	} else if (responseData.inventory_my) {
		const items = (responseData as WhiteMarket.InventoryMyResponse).inventory_my.edges.map((edge) => edge.node);
		cacheWhiteMarketInventory(items);
	} else if (responseData.market_my) {
		const items = (responseData as WhiteMarket.MarketMyResponse).market_my.edges.map((edge) => edge.node);
		cacheWhiteMarketItems(items);
	} else if (responseData.instant_sell_list) {
		const items = (responseData as WhiteMarket.InstantSellListResponse).instant_sell_list.items.edges.map((edge) => edge.node.item).filter((item) => item !== undefined);
		cacheWhiteMarketInventory(items);
	}
}

export function activateWhitemarketEventHandler() {
	activateSiteEventHandler(processWhiteMarketEvent);
}
