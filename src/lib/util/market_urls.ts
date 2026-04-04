import type { DopplerPhase } from '../@typings/FloatTypes';
import { MarketSource } from './globals';
import { phaseMapping } from './patterns';

export function getBuffLink(buff_id: number, phase?: DopplerPhase | null) {
	const baseUrl = `https://buff.163.com/goods/${buff_id}`;
	if (phase) {
		return `${baseUrl}#tag_ids=${phaseMapping[buff_id][phase]}`;
	}
	return baseUrl;
}

export function getMarketURL({ source, buff_name, market_id = 0, phase }: { source: MarketSource; buff_name: string; market_id?: number | string; phase?: DopplerPhase }) {
	switch (source) {
		case MarketSource.Buff: {
			if (Number(market_id) === 0) {
				return `https://buff.163.com/market/csgo#tab=selling&page_num=1&search=${encodeURIComponent(buff_name)}`;
			}
			return `https://buff.163.com/goods/${market_id}${phase && phaseMapping[market_id] ? `#tag_ids=${phaseMapping[market_id][phase]}` : ''}`;
		}
		case MarketSource.Steam:
			return `https://steamcommunity.com/market/listings/730/${encodeURIComponent(buff_name)}`;
		case MarketSource.YouPin:
			if (Number(market_id) > 0) {
				return `https://youpin898.com/market/goods-list?templateId=${market_id}&gameId=730`;
			}
			return `https://youpin898.com/market/csgo?gameId=730&search=${encodeURIComponent(buff_name)}`;
		case MarketSource.C5Game: {
			if (market_id && market_id !== -1) {
				return `https://www.c5game.com/en/csgo/${market_id}/${encodeURIComponent(buff_name.split(' (')[0])}/sell`;
			} else {
				return `https://www.c5game.com/en/csgo?marketKeyword=${encodeURIComponent(buff_name)}`;
			}
		}
		case MarketSource.CSFloat: {
			const extendedName = buff_name + (phase ? ` [${phase}]` : '');
			return `https://csfloat.com/search?sort_by=lowest_price&type=buy_now&market_hash_name=${encodeURIComponent(extendedName)}`;
		}
		case MarketSource.DMarket:
			return `https://dmarket.com/ingame-items/item-list/csgo-skins?title=${encodeURIComponent(buff_name)}&sort-type=5&ref=rqKYzZ36Bw&utm_source=betterfloat`;
		case MarketSource.CSMoney:
			return `https://cs.money/market/buy/?sort=price&order=asc&search=${encodeURIComponent(buff_name)}&utm_source=mediabuy&utm_medium=betterfloat&utm_campaign=regular&utm_content=link`;
		case MarketSource.Bitskins:
			return `https://bitskins.com/market/csgo?search={%22order%22:[{%22field%22:%22price%22,%22order%22:%22ASC%22}],%22where%22:{%22skin_name%22:%22${encodeURIComponent(buff_name)}%22}}&ref_alias=betterfloat`;
		case MarketSource.Lisskins:
			return `https://lis-skins.com/market/csgo/?query=${encodeURIComponent(buff_name)}&rf=130498354&utm_source=betterfloat`;
		case MarketSource.BuffMarket:
			return `https://buff.market/market/all?search=${encodeURIComponent(buff_name)}`;
		case MarketSource.Skinbid:
			return `https://skinbid.com/market?search=${encodeURIComponent(buff_name)}&sort=price%23asc&sellType=all&utm_source=betterfloat&ref=betterfloat`;
		case MarketSource.Skinport:
			return `https://skinport.com/market/730?search=${encodeURIComponent(buff_name)}&sort=price&order=asc&utm_source=betterfloat`;
		case MarketSource.Marketcsgo:
			return `https://market.csgo.com/en/?search=${encodeURIComponent(buff_name)}&utm_campaign=main&utm_source=BetterFloat&utm_medium=referral&cpid=caa655bb-8c34-4013-9427-1a5f842fc898&oid=4c69d079-ad2a-44b0-a9ac-d0afc2167ee7`;
		case MarketSource.Pricempire: {
			const extendedName = buff_name + (phase ? ` - ${phase}` : '');
			return `https://pricempire.com/item/${encodeURIComponent(extendedName)}?utm_source=betterfloat`;
		}
		case MarketSource.Gamerpay:
			return `https://gamerpay.gg/?sortBy=price&ascending=true&query=${encodeURIComponent(buff_name)}&page=1&utm_source=betterfloat`;
		case MarketSource.Waxpeer:
			return `https://waxpeer.com/?sort=ASC&order=price&all=0&exact=0&search=${encodeURIComponent(buff_name)}&utm_source=betterfloat`;
		case MarketSource.Skinbaron:
			return `https://skinbaron.de/en/csgo?str=${encodeURIComponent(buff_name)}&sort=CF&utm_source=betterfloat`;
		case MarketSource.Tradeit:
			return `https://tradeit.gg/csgo/store?aff=betterfloat&search=${encodeURIComponent(buff_name)}`;
		case MarketSource.Whitemarket:
			return `https://white.market/market?name=${encodeURIComponent(buff_name)}&sort=pr_a&utm_source=betterfloat`;
		case MarketSource.Swapgg:
			return 'https://swap.gg/?r=X4nFTDBbek';
		case MarketSource.Avanmarket:
			return `https://avan.market/en/market/cs?name=${encodeURIComponent(buff_name)}&utm_source=betterfloat&r=betterfloat&sort=1`;
		case MarketSource.Skinsmonkey:
			return `https://skinsmonkey.com/market/csgo?search=${encodeURIComponent(buff_name)}&sort=price&order=asc&utm_source=betterfloat&r=a0NNFQvBTf4s`;
		case MarketSource.Skinout:
			return `https://skinout.gg/en/market?search=${encodeURIComponent(buff_name)}&utm_source=betterfloat`;
		case MarketSource.Skinflow:
			return `https://skinflow.gg/buy?referral=BETTERFLOAT&search=${encodeURIComponent(buff_name)}`;
		case MarketSource.Shadowpay:
			return `https://shadowpay.com/csgo-items?search=${encodeURIComponent(buff_name)}&utm_campaign=j8MVU4KVXS3Liun`;
	}
	return '';
}
