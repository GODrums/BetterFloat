import { getSetting } from '~lib/util/storage';
import { addBlueBadge, webDetection } from '../../contents/skinport_script';
import type { Skinport } from '../@typings/SkinportTypes';
import iconBan from 'data-base64:~/../assets/icons/ban-solid.svg';
import { addPattern } from './skinport_helpers';

export async function handleListed(data: Skinport.Item[]) {
	setTimeout(async () => {
		for (const item of data) {
			const element = document.querySelector(`.sale-${item.saleId}`);
			if (element) {
				// console.debug('[BetterFloat] Found listed item:', item);
				if (item.pattern) {
					addPattern(element, item);
				}

				if (item.marketHashName.includes('Case Hardened') && item.category === 'Knife' && (await getSetting('sp-csbluegem'))) {
					await addBlueBadge(element, item);
				} else if ((item.marketHashName.includes('Crimson Web') || item.marketHashName.includes('Emerald Web')) && item.category === 'Gloves') {
					await webDetection(element, item);
				}
			}
		}
	}, 2000);
}

export async function handleSold(data: Skinport.Item[]) {
	for (const item of data) {
		const element = document.querySelector(`.sale-${item.saleId}`);
		if (element) {
			// console.debug('[BetterFloat] Found sold item:', item);
			element.querySelector('.ItemPreview-itemImage')?.appendChild(createSoldOverlay());
			if (element.firstElementChild) {
				element.firstElementChild.className += ' ItemPreview--inCart';
			}
		}
	}
}

function createSoldOverlay() {
	const soldElement = document.createElement('div');
	soldElement.className = 'ItemPreview-status';
	soldElement.style.background = 'rgb(69, 10, 10)';
	const banIcon = document.createElement('img');
	banIcon.src = iconBan;
	banIcon.setAttribute('style', 'height: auto; width: 30px; filter: brightness(0) saturate(100%) invert(100%) sepia(100%) saturate(1%) hue-rotate(233deg) brightness(103%) contrast(101%);');
	soldElement.appendChild(banIcon);
	return soldElement;
}
