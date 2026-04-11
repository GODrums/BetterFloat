import { isProduction } from '~lib/util/globals';
import { getSetting } from '~lib/util/storage';

import { addBuyOrderPercentage, adjustUserBuyOrderRow } from './buyOrders';
import { adjustCurrencyChangeNotice } from './dom';
import { adjustItem, getInsertTypeForItemCard } from './item';
import { adjustOfferContainer } from './offers';
import { adjustChartContainer, adjustLatestSales } from './sales';
import { adjustSellDialog } from './sell';
import { INSERT_TYPE } from './types';

const unsupportedSubPages = ['blog.csfloat', '/db'];

function offerItemClickListener(listItem: Element) {
	listItem.addEventListener('click', () => {
		setTimeout(() => {
			const itemCard = document.querySelector('item-card');
			if (itemCard) {
				void adjustItem(itemCard);
			}
		}, 100);
	});
}

async function handleAddedNode(addedNode: HTMLElement) {
	if (addedNode.tagName.toLowerCase() === 'item-detail') {
		await adjustItem(addedNode, INSERT_TYPE.PAGE);
		return;
	}

	if (addedNode.tagName === 'ITEM-CARD') {
		await adjustItem(addedNode, getInsertTypeForItemCard(addedNode));
		return;
	}

	if (addedNode.tagName === 'ITEM-LATEST-SALES') {
		await adjustLatestSales(addedNode);
		return;
	}

	if (addedNode.className.toString().includes('chart-container')) {
		await adjustChartContainer(addedNode);
		return;
	}

	if (location.pathname === '/profile/offers' && addedNode.className.startsWith('container')) {
		await adjustOfferContainer(addedNode);
		return;
	}

	if (location.pathname === '/profile/offers' && addedNode.className.toString().includes('mat-list-item')) {
		offerItemClickListener(addedNode);
		return;
	}

	if (addedNode.tagName.toLowerCase() === 'app-markdown-dialog') {
		adjustCurrencyChangeNotice(addedNode);
		return;
	}

	if (location.pathname.includes('/item/') && addedNode.id?.length > 0) {
		if (addedNode.hasAttribute('title') && addedNode.hasAttribute('id') && addedNode.hasAttribute('style') && isProduction) {
			addedNode.remove();
		}
		return;
	}

	if (addedNode.tagName.toLowerCase() === 'tbody' && addedNode.closest('app-order-table')) {
		await addBuyOrderPercentage(addedNode);
		return;
	}

	if (addedNode.tagName === 'APP-SELL-DIALOG') {
		await adjustSellDialog(addedNode);
		return;
	}

	if (addedNode.classList.contains('mdc-data-table__row') && addedNode.closest('app-user-orders')) {
		await adjustUserBuyOrderRow(addedNode);
	}
}

export function startMutationObserver() {
	const observer = new MutationObserver(async (mutations) => {
		if (!(await getSetting('csf-enable'))) {
			return;
		}

		for (const unsupportedSubPage of unsupportedSubPages) {
			if (location.href.includes(unsupportedSubPage)) {
				console.debug('[BetterFloat] Current page is currently NOT supported');
				return;
			}
		}

		for (const mutation of mutations) {
			for (let i = 0; i < mutation.addedNodes.length; i++) {
				const addedNode = mutation.addedNodes[i];
				if (!(addedNode instanceof HTMLElement)) continue;
				await handleAddedNode(addedNode);
			}
		}
	});

	observer.observe(document, { childList: true, subtree: true });
}
