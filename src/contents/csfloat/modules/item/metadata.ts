import { html } from 'common-tags';
import Decimal from 'decimal.js';

import type { CSFloat } from '~lib/@typings/FloatTypes';
import { ICON_CLOCK } from '~lib/util/globals';
import { calculateEpochFromDate, calculateTime, getSPBackgroundColor } from '~lib/util/helperfunctions';

export function adjustExistingSP(container: Element) {
	const spContainer = container.querySelector('.sticker-percentage');
	let spValue = spContainer?.textContent?.trim().split('%')[0];
	if (!spValue || !spContainer) return;
	if (spValue.startsWith('>')) {
		spValue = spValue.substring(1);
	}

	const backgroundImageColor = getSPBackgroundColor(Number(spValue) / 100);
	(spContainer as HTMLElement).style.backgroundColor = backgroundImageColor;
}

export function addListingAge(container: Element, listing: CSFloat.ListingData, isPopout: boolean) {
	if ((isPopout && container.querySelector('.item-card.large .betterfloat-listing-age')) || (!isPopout && container.querySelector('.betterfloat-listing-age'))) {
		return;
	}

	const listingAge = html`
		<div class="betterfloat-listing-age hint--bottom hint--rounded hint--no-arrow" style="display: flex; align-items: flex-end;" aria-label="${new Date(listing.created_at).toLocaleString()}">
			<p style="margin: 0 5px 0 0; font-size: 13px; color: var(--subtext-color);">${calculateTime(calculateEpochFromDate(listing.created_at))}</p>
			<img src="${ICON_CLOCK}" style="height: 16px; filter: brightness(0) saturate(100%) invert(59%) sepia(55%) saturate(3028%) hue-rotate(340deg) brightness(101%) contrast(101%);" />
		</div>
	`;

	const parent = container.querySelector<HTMLElement>('.top-right-container');
	if (parent) {
		parent.style.flexDirection = 'column';
		parent.style.alignItems = 'flex-end';
		parent.insertAdjacentHTML('afterbegin', listingAge);
		const action = parent.querySelector('.action');
		if (action) {
			const newParent = document.createElement('div');
			newParent.style.display = 'inline-flex';
			newParent.style.justifyContent = 'flex-end';
			newParent.appendChild(action);
			parent.appendChild(newParent);
		}
	}

	if (listing.state === 'sold' && listing.sold_at) {
		const sellingAge = calculateTime(calculateEpochFromDate(listing.sold_at));
		const statusButton = container.querySelector<HTMLElement>('.status-button');
		if (statusButton?.hasAttribute('disabled')) {
			const buttonLabel = statusButton.querySelector('span.mdc-button__label');
			if (buttonLabel) {
				buttonLabel.textContent = `Sold ${sellingAge} (${new Date(listing.sold_at).toLocaleString()})`;
			}
		}
	}
}

export function addSellerDetails(container: Element, apiItem: CSFloat.ListingData) {
	const sellerDetails = container.querySelector('div.seller-details');
	const seller = apiItem.seller;
	if (!sellerDetails || !seller) return;

	const sellerStatusText = sellerDetails.querySelector<HTMLElement>('.text');
	if (!sellerStatusText) return;

	sellerStatusText.classList.add('hint--bottom', 'hint--rounded', 'hint--no-arrow');

	if (seller.statistics.total_trades === 0) {
		sellerStatusText.textContent = '0 (0%)';
		sellerStatusText.style.color = 'var(--subtext-color)';
		sellerStatusText.setAttribute('aria-label', 'No trades yet');
		return;
	}

	const percentage = new Decimal(seller.statistics.total_verified_trades).div(seller.statistics.total_trades).mul(100).toDP(0);
	sellerStatusText.textContent = `${seller.statistics.total_verified_trades} (${percentage.toFixed(0)}%)`;

	const getColoring = (successRate: number) => {
		if (successRate > 85) return 'rgb(100, 236, 66)';
		if (successRate > 60) return '#ff8100';
		return 'rgb(255, 66, 66)';
	};

	sellerStatusText.style.color = getColoring(percentage.toNumber());
	sellerStatusText.setAttribute('aria-label', `Total verified trades: ${seller.statistics.total_verified_trades} \n Success rate: ${percentage.toFixed(0)}%`);
}
