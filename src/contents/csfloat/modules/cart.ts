import Decimal from 'decimal.js';

import type { CSFloat } from '~lib/@typings/FloatTypes';
import { CurrencyFormatter } from '~lib/util/helperfunctions';

import { getCSFloatUserCurrency } from './currency';
import { addBuffPrice, createSaleTag } from './item/pricing';
import { INSERT_TYPE } from './types';

const cartItems: CSFloat.FloatItem[] = [];

export function addCartListener(container: Element, item: CSFloat.FloatItem) {
	const cartButton = container.querySelector('button.cart-btn');
	if (cartButton) {
		cartButton.addEventListener('click', () => {
			const isInCart = cartButton.querySelector('span.text')?.textContent?.includes('Remove');
			if (isInCart) {
				const index = cartItems.findIndex((cartItem) => cartItem.name === item.name);
				if (index !== -1) {
					cartItems.splice(index, 1);
				}
			} else {
				cartItems.push(item);
			}
		});
	}
}

export function addCartButtonListener() {
	const cartButton = document
		.querySelector(
			'path[d="M11 19C11 20.1046 10.1046 21 9 21C7.89543 21 7 20.1046 7 19C7 17.8954 7.89543 17 9 17C10.1046 17 11 17.8954 11 19ZM19 19C19 20.1046 18.1046 21 17 21C15.8954 21 15 20.1046 15 19C15 17.8954 15.8954 17 17 17C18.1046 17 19 17.8954 19 19Z"]'
		)
		?.closest('a') as HTMLAnchorElement | null;
	if (cartButton) {
		cartButton.addEventListener('click', () => {
			setTimeout(() => {
				void adjustCart();
			}, 500);
		});
	}
}

export async function adjustCart() {
	const cartContainer = document.querySelector<HTMLDivElement>('.cdk-overlay-container .container');
	if (!cartContainer) return;

	let totalDifference = new Decimal(0);
	const cartDomItems = cartContainer.querySelectorAll('.content div.item');
	for (let i = 0; i < cartDomItems.length; i++) {
		const cartItem = cartDomItems[i];
		const item = cartItems[i];
		if (!item) continue;

		const priceResult = await addBuffPrice(item, cartItem, INSERT_TYPE.CART);
		totalDifference = totalDifference.plus(priceResult.price_difference);

		const removeButton = cartItem.querySelector<HTMLButtonElement>('.remove button');
		removeButton?.addEventListener('click', () => {
			cartItems.splice(i, 1);
		});
	}

	const totalContainer = cartContainer.querySelector<HTMLDivElement>('.footer .total');
	if (!totalContainer || totalDifference.isZero()) return;

	const saleTag = createSaleTag(totalDifference, new Decimal(Infinity), CurrencyFormatter(getCSFloatUserCurrency()), false, undefined);
	saleTag.style.marginRight = '10px';

	totalContainer.lastElementChild?.insertAdjacentHTML('beforebegin', '<div style="flex-grow: 1;"></div>');
	totalContainer.insertBefore(saleTag, totalContainer.lastElementChild);

	const clearButton = cartContainer.querySelector<HTMLButtonElement>('.actions button.mat-unthemed');
	clearButton?.addEventListener('click', () => {
		cartItems.splice(0, cartItems.length);
	});
}
