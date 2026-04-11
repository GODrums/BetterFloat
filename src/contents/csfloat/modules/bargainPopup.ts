import { html } from 'common-tags';
import getSymbolFromCurrency from 'currency-symbol-map';
import Decimal from 'decimal.js';

import type { CSFloat } from '~lib/@typings/FloatTypes';
import { getJSONAttribute, getSPBackgroundColor } from '~lib/util/helperfunctions';

import { mountCSFBargainButtons } from '../url';
import { storeApiItem } from './dom';
import { adjustItem } from './item';
import { getCSFloatSettings } from './runtime';
import { INSERT_TYPE } from './types';

type CSFBargainPopupData = {
	item: CSFloat.ListingData;
	buffData: { priceFromReference: number; userCurrency: string };
	stickerData: { priceSum?: number; spPercentage?: number } | null;
};

function getBargainPopupData(itemContainer: Element): CSFBargainPopupData | null {
	const item = getJSONAttribute<CSFloat.ListingData>(itemContainer.getAttribute('data-betterfloat'));
	const buffData = getJSONAttribute<{ priceFromReference: number; userCurrency: string }>(itemContainer.querySelector('.betterfloat-buff-a')?.getAttribute('data-betterfloat'));
	const stickerData = getJSONAttribute<{ priceSum?: number; spPercentage?: number }>(itemContainer.querySelector('.sticker-percentage')?.getAttribute('data-betterfloat'));

	if (!item || !buffData?.priceFromReference || buffData.priceFromReference <= 0) {
		return null;
	}

	return { item, buffData, stickerData };
}

async function waitForBargainPopupData(itemContainer: Element) {
	let popupData = getBargainPopupData(itemContainer);
	let tries = 20;
	while (!popupData && tries-- > 0) {
		await new Promise((resolve) => setTimeout(resolve, 100));
		popupData = getBargainPopupData(itemContainer);
	}
	return popupData;
}

function formatSignedCurrencyDifference(diff: Decimal, currency: string) {
	return `${diff.isNegative() ? '-' : '+'}${currency}${diff.absoluteValue().toDP(2).toNumber()}`;
}

function getBargainDiffColor(negativeIsProfit: boolean) {
	const extensionSettings = getCSFloatSettings();
	return negativeIsProfit ? extensionSettings['csf-color-profit'] : extensionSettings['csf-color-loss'];
}

function getBargainPopupStyles(showSP: boolean, spPercentage: number, diffColor: string) {
	return {
		spStyle: `display: ${showSP ? 'block' : 'none'}; background-color: ${getSPBackgroundColor(spPercentage)}`,
		diffStyle: `background-color: ${diffColor}`,
	};
}

function renderBargainMinOfferSummary(popupContainer: Element, currency: string, minOffer: Decimal, minPercentage: number, showSP: boolean, styles: { spStyle: string; diffStyle: string }) {
	popupContainer.querySelector('.betterfloat-bargain-summary')?.remove();

	const summaryMarkup = html`
		<div class="betterfloat-bargain-summary" style="display: inline-flex; align-items: center; gap: 8px; font-size: 15px; margin-left: 10px;">
			<span class="betterfloat-bargain-text" style="${styles.diffStyle}">
				${formatSignedCurrencyDifference(minOffer, currency)}
			</span>
			${showSP ? `<span class="betterfloat-sticker-percentage" style="${styles.spStyle}">${minPercentage}% SP</span>` : ''}
		</div>
	`;

	popupContainer.querySelector('.minimum-offer')?.insertAdjacentHTML('beforeend', summaryMarkup);
}

function renderBargainInputMeta(popupContainer: Element, inputField: HTMLInputElement, showSP: boolean, styles: { spStyle: string; diffStyle: string }) {
	const extensionSettings = getCSFloatSettings();
	inputField.parentElement?.classList.add('betterfloat-bargain-input-row');
	popupContainer.querySelector('.betterfloat-bargain-meta')?.remove();

	inputField.insertAdjacentHTML(
		'afterend',
		html`
			<div class="betterfloat-bargain-meta">
				<span
					class="betterfloat-bargain-text betterfloat-bargain-diff"
					style="${styles.diffStyle}; cursor: pointer; background-color: ${extensionSettings['csf-color-neutral']};"
				>
					Enter offer
				</span>
				${showSP ? `<span class="betterfloat-sticker-percentage betterfloat-bargain-sp" style="${styles.spStyle}; display: none;"></span>` : ''}
			</div>
		`
	);

	return {
		diffElement: popupContainer.querySelector<HTMLElement>('.betterfloat-bargain-diff'),
		spElement: popupContainer.querySelector<HTMLElement>('.betterfloat-bargain-sp'),
	};
}

function updateBargainInputMeta({
	inputField,
	diffElement,
	spElement,
	buffReferencePrice,
	currency,
	stickerData,
	absolute,
}: {
	inputField: HTMLInputElement;
	diffElement: HTMLElement | null;
	spElement: HTMLElement | null;
	buffReferencePrice: number;
	currency: string;
	stickerData: { priceSum?: number; spPercentage?: number } | null;
	absolute: boolean;
}) {
	const extensionSettings = getCSFloatSettings();
	if (!diffElement) {
		return;
	}

	const rawValue = inputField.value.trim();
	if (rawValue.length === 0) {
		diffElement.textContent = absolute ? `+${currency}0` : 'Enter offer';
		diffElement.style.backgroundColor = extensionSettings['csf-color-neutral'];
		if (spElement) {
			spElement.style.display = 'none';
		}
		return;
	}

	const inputPrice = new Decimal(rawValue);
	if (absolute) {
		const diff = inputPrice.minus(buffReferencePrice);
		diffElement.textContent = formatSignedCurrencyDifference(diff, currency);
		diffElement.style.backgroundColor = getBargainDiffColor(diff.isNegative());
		if (spElement) {
			spElement.style.display = 'none';
		}
		return;
	}

	const percentage = inputPrice.div(buffReferencePrice).mul(100);
	diffElement.textContent = `${percentage.absoluteValue().toDP(2).toNumber()}%`;
	diffElement.style.backgroundColor = getBargainDiffColor(percentage.lessThan(100));

	if (!spElement || !stickerData?.priceSum) {
		return;
	}

	const stickerPercentage = inputPrice.minus(buffReferencePrice).div(stickerData.priceSum).mul(100).toDP(2);
	if (stickerPercentage.lessThan(0)) {
		spElement.style.display = 'none';
		return;
	}

	spElement.style.display = 'block';
	spElement.textContent = `${stickerPercentage.toNumber()}% SP`;
	spElement.style.border = '1px solid grey';
}

export async function adjustBargainPopup(itemContainer: Element, popupContainer: Element) {
	const itemCard = popupContainer.querySelector('item-card');
	if (!itemCard) return;

	const popupData = await waitForBargainPopupData(itemContainer);
	if (!popupData) return;

	const { item, buffData, stickerData } = popupData;

	storeApiItem(itemCard, item);

	await adjustItem(itemCard, INSERT_TYPE.BARGAIN);
	await mountCSFBargainButtons();

	if (!item.min_offer_price) {
		return;
	}

	const currency = getSymbolFromCurrency(buffData.userCurrency);
	const minOffer = new Decimal(item.min_offer_price).div(100).minus(buffData.priceFromReference);
	const showSP = (stickerData?.priceSum ?? 0) > 0;
	const minPercentage = minOffer.greaterThan(0) && stickerData?.priceSum ? minOffer.div(stickerData.priceSum).mul(100).toDP(2).toNumber() : 0;
	const styles = getBargainPopupStyles(showSP, stickerData?.spPercentage ?? 0, getBargainDiffColor(minOffer.isNegative()));

	renderBargainMinOfferSummary(popupContainer, currency ?? '', minOffer, minPercentage, showSP, styles);

	const inputField = popupContainer.querySelector<HTMLInputElement>('input');
	if (!inputField) return;

	const { diffElement, spElement } = renderBargainInputMeta(popupContainer, inputField, showSP, styles);
	let absolute = false;

	const updateMeta = () =>
		updateBargainInputMeta({
			inputField,
			diffElement,
			spElement,
			buffReferencePrice: buffData.priceFromReference,
			currency: currency ?? '',
			stickerData,
			absolute,
		});

	updateMeta();
	inputField.addEventListener('input', updateMeta);
	diffElement?.addEventListener('click', () => {
		absolute = !absolute;
		updateMeta();
	});
}

export function addBargainListener(container: Element | null) {
	if (!container) return;
	const bargainBtn = container.querySelector('.bargain-btn > button');
	if (bargainBtn) {
		bargainBtn.addEventListener('click', () => {
			let tries = 10;
			const interval = setInterval(() => {
				if (tries-- <= 0) {
					clearInterval(interval);
					return;
				}
				const bargainPopup = document.querySelector('app-make-offer-dialog');
				if (bargainPopup) {
					clearInterval(interval);
					void adjustBargainPopup(container, bargainPopup);
				}
			}, 500);
		});
	}
}
