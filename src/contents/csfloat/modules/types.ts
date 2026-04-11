import type Decimal from 'decimal.js';

export enum INSERT_TYPE {
	NONE = 0,
	PAGE = 1,
	BARGAIN = 2,
	SIMILAR = 3,
	CART = 4,
}

export type DOMBuffData = {
	priceOrder: number;
	priceListing: number;
	userCurrency: string;
	itemName: string;
	priceFromReference: number;
};

export type PriceResult = {
	price_difference: number;
	percentage: Decimal;
};
