import Decimal from 'decimal.js';

import type { DopplerPhase, ItemStyle } from '~lib/@typings/FloatTypes';
import { getMarketID } from '~lib/handlers/mappinghandler';
import { AskBidMarkets, MarketSource } from '~lib/util/globals';
import { CurrencyFormatter, getBuffPrice, isUserPro } from '~lib/util/helperfunctions';
import { attachMarketPopover } from '~lib/util/market_popover';
import { generatePriceLine, getSourceIcon } from '~lib/util/uigeneration';

import { getCSFAllBuyOrders, getNextCSFMeBuyOrder } from '../cache';
import { getCSFloatUserCurrency } from './currency';
import { getCurrencyRate } from './item/pricing';
import { getCSFloatSettings } from './runtime';

export async function adjustUserBuyOrderRow(buyOrder: Element) {
	const extensionSettings = getCSFloatSettings();
	const expressionColumn = buyOrder.querySelector<HTMLTableCellElement>('td.mat-column-expression');
	if (!expressionColumn) return;

	const buyOrderData = getNextCSFMeBuyOrder();
	if (!buyOrderData?.market_hash_name) return;

	if (expressionColumn.querySelector('a')) return;

	const itemName = buyOrderData.market_hash_name;
	let itemStyle: ItemStyle = '';
	if (itemName.includes('★') && !itemName.includes('|')) {
		itemStyle = 'Vanilla';
	}
	const source = extensionSettings['csf-pricingsource'] as MarketSource;
	const buff_id = await getMarketID(itemName, source);
	const { priceListing, priceOrder } = await getBuffPrice(itemName, itemStyle, source);
	const useOrderPrice =
		priceOrder &&
		extensionSettings['csf-pricereference'] === 0 &&
		(AskBidMarkets.map((market) => market.source).includes(source) || (MarketSource.YouPin === source && isUserPro(extensionSettings['user'])));
	const priceFromReference = useOrderPrice ? priceOrder : (priceListing ?? new Decimal(0));
	const userCurrency = getCSFloatUserCurrency();

	const buffContainer = generatePriceLine({
		source: extensionSettings['csf-pricingsource'] as MarketSource,
		market_id: buff_id,
		buff_name: itemName,
		priceOrder,
		priceListing,
		priceFromReference,
		userCurrency,
		itemStyle: '' as DopplerPhase,
		CurrencyFormatter: CurrencyFormatter(getCSFloatUserCurrency()),
		isDoppler: false,
		isPopout: false,
		iconHeight: '20px',
		hasPro: isUserPro(extensionSettings['user']),
	});

	expressionColumn.insertAdjacentHTML('beforeend', buffContainer);
	expressionColumn.setAttribute('style', 'height: 52px; display: flex; align-items: center; gap: 8px;');

	const buffAnchor = expressionColumn.querySelector<HTMLAnchorElement>('.betterfloat-buff-a');
	if (buffAnchor) {
		const { currencyRate } = await getCurrencyRate();
		attachMarketPopover(buffAnchor, { isPro: isUserPro(extensionSettings['user']), currencyRate });
	}
}

export async function addBuyOrderPercentage(container: Element) {
	const extensionSettings = getCSFloatSettings();
	const sourceIcon = getSourceIcon(extensionSettings['csf-pricingsource'] as MarketSource);
	const bigPriceElement = document.querySelector<HTMLElement>('div.betterfloat-big-price');
	const referencePrice = Number(JSON.parse(bigPriceElement?.getAttribute('data-betterfloat') ?? '{}').priceFromReference ?? 0);
	if (!referencePrice) {
		return;
	}

	let buyOrderEntries = container.querySelectorAll('tr');
	let tries = 10;
	while (buyOrderEntries.length === 0 && tries-- > 0) {
		await new Promise((resolve) => setTimeout(resolve, 100));
		buyOrderEntries = container.querySelectorAll('tr');
	}
	if (buyOrderEntries.length === 0) {
		return;
	}
	const buyOrders = getCSFAllBuyOrders();

	buyOrderEntries.forEach((entry, index) => {
		const data = buyOrders[index];
		if (!data) {
			return;
		}
		const percentage = new Decimal(data.price).div(100).div(referencePrice).mul(100).toDP(2);
		const percentageText = `
			<div class="betterfloat-buyorder-percentage">
				<img src="${sourceIcon.logo}" style="${sourceIcon.style}" />
				<span>${percentage.toFixed(2)}%</span>
			</div>
		`;
		entry.querySelector('td.mat-column-price')?.insertAdjacentHTML('beforeend', percentageText);
		(entry.firstElementChild as HTMLElement).style.paddingRight = '0';
	});
}
