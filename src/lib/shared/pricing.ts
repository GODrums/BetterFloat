import { sendToBackground } from '@plasmohq/messaging';
import { loadMapping } from '~lib/handlers/mappinghandler';
import { AskBidMarkets, MarketSource } from '~lib/util/globals';
import { toTitleCase } from '~lib/util/helperfunctions';
import { getSetting, type IStorage } from '~lib/util/storage';

export async function initPriceMapping(extensionSettings: IStorage, prefix: string) {
	const sources = new Set<MarketSource>();
	sources.add(extensionSettings[`${prefix}-pricingsource`] as MarketSource);
	if (
		extensionSettings[`${prefix}-altmarket`] &&
		extensionSettings[`${prefix}-altmarket`] !== 'none' &&
		AskBidMarkets.map((market) => market.source).includes(extensionSettings[`${prefix}-pricingsource`])
	) {
		sources.add(extensionSettings[`${prefix}-altmarket`] as MarketSource);
	}
	if (extensionSettings[`${prefix}-steamsupplement`]) {
		sources.add(MarketSource.Steam);
	}
	console.log('[BetterFloat] Sources:', sources);
	console.time('[BetterFloat] PriceRefresh');
	await Promise.all(Array.from(sources).map((source) => sourceRefresh(source, extensionSettings.user?.steam?.steamid)));
	await Promise.all(Array.from(sources).map((source) => loadMapping(source)));
	console.timeEnd('[BetterFloat] PriceRefresh');
}

export async function sourceRefresh(source: MarketSource, steamId: string | null = null) {
	const updateSetting = `${source}-update`;
	const storageData = await chrome.storage.local.get(updateSetting);
	const lastUpdate = storageData[updateSetting] ?? 0;
	const hasProPlan = (await getSetting<IStorage['user']>('user'))?.plan?.type === 'pro';
	const refreshIntervalPlan = hasProPlan ? 1 : 2;
	if (lastUpdate < Date.now() - 1000 * 60 * 60 * refreshIntervalPlan) {
		console.debug(`[BetterFloat] ${toTitleCase(source)} prices are older than ${refreshIntervalPlan} hour(s), last update: ${new Date(lastUpdate)}. Refreshing ${toTitleCase(source)} prices...`);

		const response: { status: number } = await sendToBackground({
			name: 'refreshPrices',
			body: {
				source: source,
				steamId: steamId,
			},
		});

		console.debug('[BetterFloat] Prices refresh result: ', response.status);
	}
}
