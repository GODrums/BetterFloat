import marketIdsUrl from 'raw:@/assets/marketids.json';
import type { Extension } from '~lib/@typings/ExtensionTypes';

type MarketIdsMap = Record<string, Partial<Extension.MarketIDEntry>>;

let marketIdsPromise: Promise<MarketIdsMap> | null = null;

export function loadMarketIds() {
	if (!marketIdsPromise) {
		marketIdsPromise = fetch(marketIdsUrl).then((response) => response.json() as Promise<MarketIdsMap>);
	}
	return marketIdsPromise;
}
