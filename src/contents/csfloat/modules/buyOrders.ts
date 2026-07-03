import Decimal from 'decimal.js';

import type { DopplerPhase, ItemStyle } from '~lib/@typings/FloatTypes';
import { getMarketID } from '~lib/handlers/mappinghandler';
import { AskBidMarkets, MarketSource } from '~lib/util/globals';
import { CurrencyFormatter, getBuffPrice, getDopplerPhase, isUserPro } from '~lib/util/helperfunctions';
import { attachMarketPopover } from '~lib/util/market_popover';
import { generatePriceLine, getSourceIcon } from '~lib/util/uigeneration';

import { getCSFAllBuyOrders, getNextCSFMeBuyOrder } from '../cache';
import { getCSFloatUserCurrency } from './currency';
import { createSaleTag, getCurrencyRate } from './item/pricing';
import { getCSFloatSettings } from './runtime';

export async function adjustUserBuyOrderRow(buyOrder: Element) {
	const extensionSettings = getCSFloatSettings();
	const expressionColumn = buyOrder.querySelector<HTMLTableCellElement>('td.mat-column-expression');
	if (!expressionColumn) return;

	const buyOrderData = getNextCSFMeBuyOrder();
	if (!buyOrderData?.market_hash_name) return;

	if (expressionColumn.querySelector('a.betterfloat-buff-a')) return;

	const itemName = buyOrderData.market_hash_name;
	let itemStyle: ItemStyle = '';
	if (itemName.includes('★') && !itemName.includes('|')) {
		itemStyle = 'Vanilla';
	}
	if (buyOrderData.hybrid_properties?.paint_index) {
		itemStyle = getDopplerPhase(buyOrderData.hybrid_properties.paint_index) ?? '';
	}

	const source = extensionSettings['csf-pricingsource'] as MarketSource;
	const buff_id = await getMarketID(itemName, source);
	let { priceListing, priceOrder } = await getBuffPrice(itemName, itemStyle, source);
	const useOrderPrice =
		priceOrder &&
		extensionSettings['csf-pricereference'] === 0 &&
		(AskBidMarkets.map((market) => market.source).includes(source) || (MarketSource.YouPin === source && isUserPro(extensionSettings['user'])));
	const { userCurrency, currencyRate } = await getCurrencyRate();
	if (currencyRate) {
		priceListing = priceListing?.mul(currencyRate);
		priceOrder = priceOrder?.mul(currencyRate);
	}
	const priceFromReference = useOrderPrice ? priceOrder : (priceListing ?? new Decimal(0));

	const buffContainer = generatePriceLine({
		source: extensionSettings['csf-pricingsource'] as MarketSource,
		market_id: buff_id,
		buff_name: itemName,
		priceOrder,
		priceListing,
		priceFromReference,
		userCurrency,
		itemStyle: itemStyle as DopplerPhase,
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
		attachMarketPopover(buffAnchor, { isPro: isUserPro(extensionSettings['user']), currencyRate });
	}

	if (priceFromReference?.isPositive()) {
		const buyOrderPrice = new Decimal(buyOrderData.price).mul(currencyRate).div(100);
		const difference = buyOrderPrice.minus(priceFromReference);
		const percentage = buyOrderPrice.div(priceFromReference).times(100);
		const saleTag = createSaleTag(difference, percentage, CurrencyFormatter(userCurrency), { priceFromReference, display: 'percentage', minimal: true });
		expressionColumn.appendChild(saleTag);
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
