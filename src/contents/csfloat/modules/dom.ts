import { html } from 'common-tags';

import type { CSFloat } from '~lib/@typings/FloatTypes';
import { ICON_EXCLAMATION } from '~lib/util/globals';

export function storeApiItem(container: Element, item: CSFloat.ListingData) {
	container.classList.add('item-' + item.id);
	container.setAttribute('data-betterfloat', JSON.stringify(item));
}

export function getApiItem(container: Element | null): CSFloat.ListingData | null {
	const data = container?.getAttribute('data-betterfloat');
	return data ? (JSON.parse(data) as CSFloat.ListingData) : null;
}

export function addItemScreenshot(container: Element, item: CSFloat.Item) {
	if (!item.cs2_screenshot_id) return;

	const imgContainer = container.querySelector<HTMLImageElement>('app-item-image-actions img.item-img');
	if (!imgContainer) return;

	imgContainer.src = `https://csfloat.pics/m/${item.cs2_screenshot_id}/playside.png?v=3`;
	imgContainer.style.objectFit = 'contain';
}

export function adjustCurrencyChangeNotice(container: Element) {
	if (!container.querySelector('.title')?.textContent?.includes('Currencies on CSFloat')) {
		return;
	}

	const warningDiv = html`
		<div style="display: flex; align-items: center; background-color: #7f101080; border-radius: 18px;">
			<img src="${ICON_EXCLAMATION}" style="height: 30px; margin: 0 10px; filter: brightness(0) saturate(100%) invert(19%) sepia(64%) saturate(3289%) hue-rotate(212deg) brightness(89%) contrast(98%);">
			<p>Please note that BetterFloat requires a page refresh after changing the currency.</p>
		</div>
		<div style="display: flex; align-items: center; justify-content: center; margin-top: 15px;">
			<button class="bf-reload mat-mdc-tooltip-trigger mdc-button mdc-button--raised mat-mdc-raised-button mat-primary mat-mdc-button-base" color="primary">
				<span class="mat-mdc-button-persistent-ripple mdc-button__ripple"></span>
				<span class="mdc-button__label"><span class="mdc-button__label"><span class="text">Refresh</span></span>
			</button>
		</div>
	`;
	container.children[0].insertAdjacentHTML('beforeend', warningDiv);
	container.children[0].querySelector('button.bf-reload')?.addEventListener('click', () => {
		location.reload();
	});
}

export function copyNameOnClick(container: Element, item: CSFloat.Item) {
	const itemName = container.querySelector('app-item-name');
	if (!itemName) return;

	itemName.setAttribute('style', 'cursor: pointer;');
	itemName.setAttribute('title', 'Click to copy item name');
	itemName.addEventListener('click', () => {
		if (!item.market_hash_name) {
			return;
		}

		navigator.clipboard.writeText(item.market_hash_name);
		itemName.setAttribute('title', 'Copied!');
		itemName.setAttribute('style', 'cursor: default;');
		setTimeout(() => {
			itemName.setAttribute('title', 'Click to copy item name');
			itemName.setAttribute('style', 'cursor: pointer;');
		}, 2000);
	});
}

export function removeClustering(container: Element) {
	const sellerDetails = container.querySelector('div.seller-details-wrapper');
	if (sellerDetails) {
		sellerDetails.setAttribute('style', 'display: none;');
	}
}
