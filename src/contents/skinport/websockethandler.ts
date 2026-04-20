import iconBan from 'data-base64:~/../assets/icons/ban-solid.svg';
import type { Skinport } from '../../lib/@typings/SkinportTypes';
import { addPattern } from '../../lib/helpers/skinport_helpers';

export async function handleListed(data: Skinport.Item[]) {
	setTimeout(async () => {
		for (const item of data) {
			const element = document.querySelector(`.sale-${item.saleId}`);
			if (element) {
				if (item.pattern) {
					addPattern(element, item);
				}
			}
		}
	}, 2000);
}

export async function handleSold(data: Skinport.Item[]) {
	for (const item of data) {
		const element = document.querySelector(`.sale-${item.saleId}`);
		if (element) {
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
