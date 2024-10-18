import getSymbolFromCurrency from 'currency-symbol-map';
import { getBuffItem } from '~contents/skinport_script';
import type { ItemStyle } from '~lib/@typings/FloatTypes';
import type { Skinport } from '~lib/@typings/SkinportTypes';
import { ICON_BUFF, ICON_C5GAME, ICON_STEAM, ICON_YOUPIN, MarketSource } from '~lib/util/globals';
import { getCharmColoring, waitForElement } from '~lib/util/helperfunctions';
import { getSetting } from '~lib/util/storage';

export function addPattern(container: Element, item: Skinport.Item) {
	if (!item.pattern) return;

	const itemText = container.querySelector('.ItemPreview-itemText');
	if (!itemText?.textContent) return;

	const santizeText = (text: string) => {
		let parts = text.split(' ');
		if (parts.length > 2) {
			parts = parts.slice(0, parts[0].indexOf('-') > -1 ? 1 : 2);
		}
		return parts.join(' ');
	};

	const getPatternStyle = () => {
		if (item.category === 'Charm') {
			const badgeProps = getCharmColoring(item.pattern, item.name);
			return `color: ${badgeProps[0]}; font-weight: 600; font-size: 13px;border-radius: 7px; padding: 2px 5px; margin-top: 4px`;
		}
		return 'color: mediumpurple; font-weight: 600; font-size: 13px;';
	};
	itemText.innerHTML = `${santizeText(itemText.textContent)} <br> Pattern: <span style="${getPatternStyle()}">${item.pattern}</span>`;
}

export async function addTotalInventoryPrice(data: Skinport.InventoryListed | Skinport.InventoryAccount) {
	const countContainer = document.querySelector('.InventoryPage-gameHeaderItems');
	if (!countContainer || !data.items?.[0]?.currency) return;

	const reference = Number(await getSetting('sp-pricereference'));

	let total = 0;
	const currency = getSymbolFromCurrency(data.items[0].currency);

	const getStyle: (itemName: string) => ItemStyle = (itemName) => {
		if (itemName.includes('Doppler')) {
			return itemName.split('(')[1].split(')')[0] as ItemStyle;
		}
		if (itemName.includes('Vanilla')) {
			return 'Vanilla';
		}
		return '';
	};

	const source = (await getSetting('sp-pricingsource')) as MarketSource | undefined;
	if (!source) return;

	const getSourceIcon = (source: MarketSource) => {
		switch (source) {
			case MarketSource.Buff:
				return ICON_BUFF;
			case MarketSource.Steam:
				return ICON_STEAM;
			case MarketSource.YouPin:
				return ICON_YOUPIN;
			case MarketSource.C5Game:
				return ICON_C5GAME;
		}
	};

	for (const item of data.items) {
		const buffData = await getBuffItem(item.marketHashName, getStyle(item.name));
		total += ([MarketSource.Buff, MarketSource.Steam].includes(source) && reference === 0 ? buffData.priceOrder?.toNumber() : buffData.priceListing?.toNumber()) ?? 0;
	}

	if (countContainer.querySelector('.betterfloat-totalbuffprice')) {
		const totalText = countContainer.querySelector('.betterfloat-totalbuffprice > span');
		if (totalText) {
			totalText.textContent = `${currency}${total.toFixed(2)}`;
		}
	} else {
		const totalElement = document.createElement('div');
		const icon = getSourceIcon(source);
		totalElement.classList.add('betterfloat-totalbuffprice');
		totalElement.setAttribute('style', 'display: flex; align-items: center; margin-left: 10px; gap: 5px');
		totalElement.innerHTML = `<img src=${icon} style="height: 20px;border-radius: 5px; translate: 0 -1px;" /><span style="color: mediumpurple;">${currency}${total.toFixed(2)}</span>`;
		countContainer.appendChild(totalElement);
	}
}

export function createLiveLink() {
	const marketLink = <HTMLElement>document.querySelector('.HeaderContainer-link--market');
	if (!marketLink || document.querySelector('.betterfloat-liveLink')) return;
	marketLink.style.marginRight = '30px';
	const liveLink = marketLink.cloneNode(true) as HTMLAnchorElement;
	liveLink.setAttribute('href', '/market?sort=date&order=desc&bf=live');
	liveLink.setAttribute('class', 'HeaderContainer-link HeaderContainer-link--market betterfloat-liveLink');
	liveLink.textContent = 'Live';
	marketLink.after(liveLink);
}

export function filterDisplay() {
	const filterDisplay = document.querySelector<HTMLButtonElement>('button.FilterButton-filter');
	if (!filterDisplay || location.pathname !== '/market') return;

	let filterSetting = localStorage.getItem('displayFilterMenu');
	if (filterSetting === null) {
		localStorage.setItem('displayFilterMenu', 'true');
		filterSetting = 'true';
	} else if (filterSetting === 'false') {
		waitForElement('#CatalogFilter-1').then((result) => {
			const catalogFilter = document.querySelector('#CatalogFilter-1');
			if (result && catalogFilter && catalogFilter.clientWidth > 0) {
				filterDisplay.click();
			}
		});
	}

	if (document.querySelector('#betterfloat-filter-checkbox')) return;

	filterDisplay.setAttribute('style', 'margin-right: 15px;');
	filterDisplay.parentElement?.setAttribute('style', 'justify-content: flex-start;');

	const filterState = filterSetting === 'true';

	const filterCheckbox = `<div role="presentation" class="Checkbox Checkbox--center ${
		filterState && 'Checkbox--active'
	}"><input class="Checkbox-input" type="checkbox" id="betterfloat-filter-checkbox" ${filterState && "checked=''"}><div class="Checkbox-overlay"></div></div>`;

	filterDisplay.insertAdjacentHTML('afterend', filterCheckbox);
	const filterCheckboxElement = <HTMLInputElement>document.getElementById('betterfloat-filter-checkbox');
	filterCheckboxElement.addEventListener('change', () => {
		const newCheckboxState = filterCheckboxElement.checked;
		localStorage.setItem('displayFilterMenu', newCheckboxState.toString());
		filterCheckboxElement.checked = newCheckboxState;
		filterCheckboxElement.parentElement?.classList.toggle('Checkbox--active');
		if (newCheckboxState) {
			filterCheckboxElement.setAttribute('checked', '');
		} else {
			filterCheckboxElement.removeAttribute('checked');
		}
	});
}
