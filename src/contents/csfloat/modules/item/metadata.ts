import { html } from 'common-tags';
import Decimal from 'decimal.js';

import type { CSFloat } from '~lib/@typings/FloatTypes';
import { ICON_CLOCK } from '~lib/util/globals';
import { calculateEpochFromDate, calculateTime, getSPBackgroundColor } from '~lib/util/helperfunctions';

import { getCSFCurrencyRate } from '../../cache';
import { getCSFloatUserCurrency } from '../currency';

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

function calculateShortTime(created_at: number) {
	const diffMinutes = Math.floor((Date.now() - created_at * 1000) / 60_000);
	const diffHours = Math.floor(diffMinutes / 60);
	const formatShortTime = (value: number, unit: string) => `${Math.max(0, value)}${unit}`;

	if (diffHours >= 49) {
		return formatShortTime(Math.floor(diffHours / 24), 'd');
	}

	if (diffMinutes >= 120) {
		return formatShortTime(diffHours, 'h');
	}

	return formatShortTime(diffMinutes, 'min');
}

async function getFormattedMinOfferPrice(minOfferPrice: number) {
	const userCurrency = getCSFloatUserCurrency();
	const currencyRate = (await getCSFCurrencyRate(userCurrency)) ?? 1;

	return Intl.NumberFormat(undefined, {
		style: 'currency',
		currency: userCurrency,
		currencyDisplay: 'narrowSymbol',
		minimumFractionDigits: 0,
		maximumFractionDigits: 2,
	}).format(new Decimal(minOfferPrice).mul(currencyRate).div(100).toDP(2).toNumber());
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

export function addMiniListingAge(container: Element, listing: CSFloat.ListingData) {
	if (container.querySelector('.betterfloat-listing-age')) return;

	const createdAtEpoch = calculateEpochFromDate(listing.created_at);
	const listingAge = html`
		<div class="betterfloat-listing-age hint--bottom hint--rounded hint--no-arrow" style="display: flex; align-items: center; position: absolute; top: 4px; right: 4px;" aria-label="${new Date(listing.created_at).toLocaleString()}">
			<p style="margin: 0 3px 0 0; font-size: 11px; color: var(--subtext-color);">${calculateShortTime(createdAtEpoch)}</p>
			<img src="${ICON_CLOCK}" style="height: 12px; filter: brightness(0) saturate(100%) invert(59%) sepia(55%) saturate(3028%) hue-rotate(340deg) brightness(101%) contrast(101%);" />
		</div>
	`;

	container.querySelector('.item-thumbnail')?.insertAdjacentHTML('afterbegin', listingAge);
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

export async function addMiniSellerDetails(container: HTMLElement, apiItem: CSFloat.ListingData) {
	const seller = apiItem.seller;
	if (!seller) return;

	const getColoring = (successRate: number) => {
		if (successRate > 85) return 'rgb(100, 236, 66)';
		if (successRate > 60) return '#ff8100';
		return 'rgb(255, 66, 66)';
	};

	const percentage = new Decimal(seller.statistics.total_verified_trades).div(seller.statistics.total_trades).mul(100).toDP(0);
	const statusText = `${seller.statistics.total_verified_trades} (${percentage.isNaN() ? '0' : percentage.toFixed(0)}%)`;
	const textColor = getColoring(percentage.toNumber());
	const onlineColor = seller.online ? '#64EC42' : '#9EA7B1';
	const bargainIndicator = apiItem.min_offer_price
		? html`
				<div class="betterfloat-bargain-indicator hint--left hint--rounded hint--no-arrow" style="display: inline-flex; align-items: center; gap: 2px;" aria-label="Minimum bargain price">
					<svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24">
						<path fill="darkorange" d="m21 12l-4.95 7H3V5h13.05L21 12Zm-2.45 0L15 7H5v10h10l3.55-5ZM5 12v5V7v5Zm5.525 4l1.25-2.75l2.75-1.25l-2.75-1.25L10.525 8l-1.25 2.75L6.525 12l2.75 1.25l1.25 2.75Z"/>
					</svg>
					<span style="font-size: 11px; color: var(--subtext-color);">${await getFormattedMinOfferPrice(apiItem.min_offer_price)}</span>
				</div>
			`
		: '';

	const sellerDetails = html`
		<div class="betterfloat-seller-details" style="display: flex; align-items: center;">
			<svg style="width: 10px; height: 10px;" viewBox="0 0 10 10" fill="none"><circle cx="5" cy="5" r="3" fill="${onlineColor}"></circle><circle cx="5" cy="5" r="4" stroke="${onlineColor}" stroke-opacity="0.15" stroke-width="2"></circle></svg>
			<span 
				class="hint--bottom hint--rounded hint--no-arrow" 
				style="font-size: 11px; color: ${textColor};"
				aria-label="Total verified trades: ${seller.statistics.total_verified_trades} \n Success rate: ${percentage.toFixed(0)}%"
			>
				${statusText}
			</span>
			<div style="flex: 1;"></div>
			${bargainIndicator}
		</div>
	`;

	container.querySelector('.item-details')?.insertAdjacentHTML('beforeend', sellerDetails);
	container.style.overflow = 'visible';
}
