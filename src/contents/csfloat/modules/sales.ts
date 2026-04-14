import { html } from 'common-tags';
import Decimal from 'decimal.js';

import { ICON_ARROWDOWN, ICON_ARROWUP2 } from '~lib/util/globals';
import { getCharmColoring, getJSONAttribute } from '~lib/util/helperfunctions';

import { getCSFHistoryGraph, getFirstHistorySale } from '../cache';
import { getCSFloatUserCurrency } from './currency';
import { getCurrencyRate } from './item/pricing';
import { getRankedFloatColoring, getSkinSchema } from './item/schema';
import { changeSpContainer } from './item/stickers';
import { getCSFloatSettings } from './runtime';

export async function adjustLatestSales(addedNode: Element) {
	const rowSelector = 'tbody tr.mdc-data-table__row';
	let rows = addedNode.querySelectorAll(rowSelector);
	let tries = 20;
	while (rows.length === 0 && tries-- > 0) {
		await new Promise((resolve) => setTimeout(resolve, 100));
		rows = addedNode.querySelectorAll(rowSelector);
	}
	for (const row of rows) {
		await adjustSalesTableRow(row);
	}
}

export async function adjustSalesTableRow(container: Element) {
	const extensionSettings = getCSFloatSettings();
	const cachedSale = getFirstHistorySale();
	if (!cachedSale) {
		return;
	}
	const item = cachedSale.item;

	const priceData = getJSONAttribute<{ priceFromReference?: number; userCurrency?: string }>(document.querySelector('.betterfloat-big-price')?.getAttribute('data-betterfloat'));
	if (!priceData?.priceFromReference) return;
	const { currencyRate } = await getCurrencyRate();
	const priceDiff = new Decimal(cachedSale.price).mul(currencyRate).div(100).minus(priceData.priceFromReference);

	const priceContainer = container.querySelector('.price-wrapper');
	if (priceContainer && extensionSettings['csf-buffdifference']) {
		priceContainer.querySelector('app-reference-widget')?.remove();
		const priceDiffElement = html`
			<div
				class="betterfloat-table-item-sp"
				style="font-size: 14px; padding: 2px 5px; border-radius: 7px; color: white; background-color: ${priceDiff.isNegative() ? extensionSettings['csf-color-profit'] : extensionSettings['csf-color-loss']}"
				data-betterfloat="${priceDiff.toDP(2).toNumber()}"
			>
				${priceDiff.isNegative() ? '-' : '+'}${Intl.NumberFormat('en-US', { style: 'currency', currency: priceData.userCurrency }).format(priceDiff.absoluteValue().toDP(2).toNumber())}
			</div>
		`;
		priceContainer.insertAdjacentHTML('beforeend', priceDiffElement);
	}

	const appStickerView = container.querySelector<HTMLElement>('app-sticker-view');
	const stickerData = item.stickers;
	if (appStickerView && stickerData && item.quality !== 12 && extensionSettings['csf-stickerprices']) {
		appStickerView.style.justifyContent = 'center';
		if (stickerData.length > 0) {
			const stickerContainer = document.createElement('div');
			stickerContainer.className = 'betterfloat-table-sp';
			appStickerView.style.display = 'flex';
			appStickerView.style.alignItems = 'center';

			const doChange = await changeSpContainer(stickerContainer, stickerData, priceDiff.toNumber());
			if (doChange) {
				appStickerView.appendChild(stickerContainer);
			}
		}
	}

	const patternContainer = container.querySelector('.cdk-column-pattern')?.firstElementChild;
	if (patternContainer && item.keychain_pattern) {
		const pattern = item.keychain_pattern;
		const badgeProps = getCharmColoring(pattern, item.item_name);

		const patternCell = html`
			<div style="display: flex; align-items: center; justify-content: center;">
				<div style="background-color: ${badgeProps[0]}80; padding: 5px; border-radius: 7px;">
					<span style="color: ${badgeProps[1]}">#${pattern}</span>
				</div>
			</div>
		`;
		patternContainer.outerHTML = patternCell;
	}

	const itemSchema = getSkinSchema(cachedSale.item);
	if (itemSchema && cachedSale.item.float_value && extensionSettings['csf-floatcoloring']) {
		const floatContainer = container.querySelector('td.mat-column-wear')?.firstElementChild;
		if (floatContainer) {
			const lowestRank = Math.min(cachedSale.item.low_rank || 99, cachedSale.item.high_rank || 99);
			const floatColoring = getRankedFloatColoring(cachedSale.item.float_value, itemSchema.min, itemSchema.max, cachedSale.item.paint_index === 0, lowestRank);
			if (floatColoring !== '') {
				floatContainer.setAttribute('style', `color: ${floatColoring}`);
			}
		}
	}

	const itemWear = document.querySelector('item-detail .wear')?.textContent?.trim();
	if (itemWear && cachedSale.item.float_value && new Decimal(itemWear).toDP(10).equals(cachedSale.item.float_value.toFixed(10))) {
		container.setAttribute('style', 'background-color: #0b255d;');
	}
}

export async function adjustChartContainer(container: Element) {
	let chartData = getCSFHistoryGraph();

	let tries = 10;
	while (!chartData && tries-- > 0) {
		await new Promise((resolve) => setTimeout(resolve, 200));
		chartData = getCSFHistoryGraph();
	}

	if (!chartData) return;

	const rangeSelectorDiv = container.querySelector<HTMLElement>('.range-selector');
	if (!rangeSelectorDiv) return;

	const userCurrency = getCSFloatUserCurrency();
	const chartPrices = chartData.map((x) => x.avg_price);
	const chartMax = Math.max(...chartPrices);
	const chartMin = Math.min(...chartPrices);

	const maxMinContainer = html`
		<div style="height: 100%; display: flex; gap: 12px; align-items: center; padding: 0 12px; background: var(--highlight-background-minimal); border-radius: 7px;">
			<span style="color: var(--subtext-color); font-weight: 500; letter-spacing: .03em; display: flex; align-items: center; gap: 4px; font-size: 14px; line-height: 24px;">
				<img src="${ICON_ARROWDOWN}" style="width: 16px; height: 16px; filter: invert(1);" alt="Min" />
				${Intl.NumberFormat(undefined, { style: 'currency', currency: userCurrency, currencyDisplay: 'narrowSymbol', minimumFractionDigits: 0, maximumFractionDigits: 2 }).format(chartMin)}
			</span>
			<span style="color: var(--subtext-color); font-weight: 500; letter-spacing: .03em; display: flex; align-items: center; gap: 4px; font-size: 14px; line-height: 24px;">
				<img src="${ICON_ARROWUP2}" style="width: 16px; height: 16px; filter: invert(1);" alt="Max" />
				${Intl.NumberFormat(undefined, { style: 'currency', currency: userCurrency, currencyDisplay: 'narrowSymbol', minimumFractionDigits: 0, maximumFractionDigits: 2 }).format(chartMax)}
			</span>
		</div>
	`;
	rangeSelectorDiv.insertAdjacentHTML('afterbegin', maxMinContainer);
	rangeSelectorDiv.setAttribute('style', 'width: 100%; display: flex; justify-content: space-between; align-items: center;');
}
