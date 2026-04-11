import Decimal from 'decimal.js';

import type { CSFloat } from '~lib/@typings/FloatTypes';

import { getCSFloatSettings } from './runtime';
import type { DOMBuffData } from './types';

export async function adjustSellDialog(addedNode: Element) {
	const marketLink = addedNode.querySelector<HTMLAnchorElement>('a[href^="/search"]');
	if (!marketLink) return;

	const marketURL = new URL(marketLink.href);
	marketURL.searchParams.set('sort_by', 'lowest_price');
	marketLink.addEventListener('click', (event) => {
		event.preventDefault();
		event.stopPropagation();
		window.open(marketURL.toString(), '_blank');
	});
}

export function addSaleListListener(container: Element) {
	const extensionSettings = getCSFloatSettings();
	if (extensionSettings['user']?.plan?.type !== 'pro') return;

	const sellSettings = localStorage.getItem('betterfloat-sell-settings');
	if (!sellSettings) return;
	const { active, displayBuff, percentage } = JSON.parse(sellSettings) as CSFloat.SellSettings;

	const saleButton = container.querySelector('div.action > button');
	if (saleButton) {
		saleButton.addEventListener('click', () => {
			void adjustSaleListItem(container, active, displayBuff, percentage);
		});
	}
}

export async function adjustSaleListItem(container: Element, active: boolean, displayBuff: boolean, percentage: number) {
	const listItem = Array.from(document.querySelectorAll('app-sell-queue-item')).pop();
	if (!listItem) return;

	const buffA = container.querySelector('a.betterfloat-buff-a')?.cloneNode(true) as HTMLElement;
	const buffData = JSON.parse(buffA?.getAttribute('data-betterfloat') ?? '{}') as DOMBuffData;
	if (!buffA || !buffData) return;

	if (displayBuff) {
		const sliderWrapper = listItem.querySelector('div.slider-wrapper');
		if (!sliderWrapper) return;

		buffA.style.justifyContent = 'center';
		buffA.style.width = '100%';
		buffA.style.marginTop = '5px';
		sliderWrapper.before(buffA);
	}

	const priceInput = listItem.querySelector<HTMLInputElement>('input[formcontrolname="price"]');
	const priceLabel = listItem.querySelector<HTMLElement>('.price .name');
	if (!priceInput) return;

	priceInput.addEventListener('input', (event) => {
		if (!(event.target instanceof HTMLInputElement) || !priceLabel) return;
		const price = new Decimal(event.target.value).toDP(2);
		const labelPercentage = new Decimal(price).div(buffData.priceFromReference).mul(100).toDP(2);

		priceLabel.textContent = `Price (${labelPercentage.toFixed(2)}%)`;
	});

	if (active && !Number.isNaN(percentage) && percentage > 0 && buffData.priceFromReference) {
		const targetPrice = new Decimal(Number(buffData.priceFromReference)).mul(percentage).div(100).toDP(2);
		priceInput.value = targetPrice.toString();
		priceInput.dispatchEvent(new Event('input', { bubbles: true }));

		priceInput.closest('div.mat-mdc-text-field-wrapper')?.setAttribute('style', 'border: 1px solid rgb(107 33 168);');
	}
}
