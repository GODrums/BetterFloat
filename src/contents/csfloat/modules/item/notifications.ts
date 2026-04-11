import Decimal from 'decimal.js';

import type { CSFloat } from '~lib/@typings/FloatTypes';
import { ICON_CSFLOAT } from '~lib/util/globals';
import { createNotificationMessage } from '~lib/util/messaging';

import { getCurrencyRate } from './pricing';

export async function liveNotifications(apiItem: CSFloat.ListingData, percentage: Decimal) {
	const notificationSettings: CSFloat.BFNotification = localStorage.getItem('betterfloat-notification')
		? JSON.parse(localStorage.getItem('betterfloat-notification') ?? '')
		: { active: false, name: '', priceBelow: 0 };

	if (!notificationSettings.active) {
		return;
	}

	const item = apiItem.item;
	if (notificationSettings.name && notificationSettings.name.trim().length > 0 && !item.market_hash_name.includes(notificationSettings.name)) {
		return;
	}

	if (percentage.gte(notificationSettings.percentage) || percentage.lt(1)) {
		return;
	}

	if (
		notificationSettings.floatRanges &&
		notificationSettings.floatRanges.length === 2 &&
		(notificationSettings.floatRanges[0] > 0 || notificationSettings.floatRanges[1] < 1) &&
		(!item.float_value || item.float_value < notificationSettings.floatRanges[0] || item.float_value > notificationSettings.floatRanges[1])
	) {
		return;
	}

	if (apiItem.type === 'auction') {
		return;
	}

	const { userCurrency, currencyRate } = await getCurrencyRate();
	const currencyFormatter = new Intl.NumberFormat(undefined, {
		style: 'currency',
		currency: userCurrency,
		currencyDisplay: 'narrowSymbol',
		minimumFractionDigits: 2,
		maximumFractionDigits: 2,
	});
	const priceText = currencyFormatter.format(new Decimal(apiItem.price).div(100).mul(currencyRate).toNumber());

	const title = 'Item Found | BetterFloat Pro';
	const body = `${percentage.toFixed(2)}% Market (${priceText}): ${item.market_hash_name}`;
	if (notificationSettings.browser) {
		const notification = new Notification(title, {
			body,
			icon: ICON_CSFLOAT,
			tag: 'betterfloat-notification-' + String(apiItem.id),
			silent: false,
		});
		notification.onclick = () => {
			window.open(`https://csfloat.com/item/${apiItem.id}`, '_blank');
		};
		notification.onerror = () => {
			console.error('[BetterFloat] Error creating notification:', notification);
		};
	} else {
		await createNotificationMessage({
			id: apiItem.id,
			site: 'csfloat',
			title,
			message: body,
		});
	}
}
