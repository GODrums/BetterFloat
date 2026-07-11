import { loadMapping } from '~lib/handlers/mappinghandler';
import { AskBidMarkets, MarketSource } from '~lib/util/globals';
import { toTitleCase } from '~lib/util/helperfunctions';
import { sendToBackground } from '~lib/util/messaging-compat';
import { getSetting, type IStorage } from '~lib/util/storage';

type PricingSourceKey = Extract<keyof IStorage, `${string}-pricingsource`>;
type AltMarketKey = Extract<keyof IStorage, `${string}-altmarket`>;
type SteamSupplementKey = Extract<keyof IStorage, `${string}-steamsupplement`>;
type PrefixFor<Key> = Key extends `${infer Prefix}-pricingsource` ? Prefix : never;
type PricingPrefix = PrefixFor<PricingSourceKey>;

export async function initPriceMapping(extensionSettings: IStorage, prefix: PricingPrefix) {
	const sources = new Set<MarketSource>();
	const pricingSource = extensionSettings[`${prefix}-pricingsource` as PricingSourceKey] as MarketSource;
	const altMarket = extensionSettings[`${prefix}-altmarket` as AltMarketKey] as MarketSource | undefined;
	sources.add(pricingSource);
	if (altMarket && altMarket !== MarketSource.None && AskBidMarkets.map((market) => market.source).includes(pricingSource)) {
		sources.add(altMarket);
	}
	const steamSupplementKey = `${prefix}-steamsupplement`;
	if (steamSupplementKey in extensionSettings && extensionSettings[steamSupplementKey as SteamSupplementKey]) {
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
