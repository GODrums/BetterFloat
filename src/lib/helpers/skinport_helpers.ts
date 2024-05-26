import getSymbolFromCurrency from "currency-symbol-map";
import { getBuffItem } from "~contents/skinport_script";
import type { ItemStyle } from "~lib/@typings/FloatTypes";
import type { Skinport } from "~lib/@typings/SkinportTypes";
import { ICON_BUFF } from "~lib/util/globals";
import { waitForElement } from "~lib/util/helperfunctions";
import { getSetting } from "~lib/util/storage";

export function addPattern(container: Element, item: Skinport.Item) {
	if (!item.pattern) return;

	const itemText = container.querySelector('.ItemPreview-itemText');
	if (!itemText) return;

	const santizeText = (text: string) => {
		let parts = text.split(' ');
		if (parts.length > 2) {
			parts = parts.slice(0, parts[0].indexOf('-') > -1 ? 1 : 2);
		}
		return `${parts.join(' ')} <br> Pattern: <span style="color: mediumpurple; font-weight: 600; font-size: 13px;">${item.pattern}</span>`;
	};
	itemText.innerHTML = santizeText(itemText.textContent);
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
        } else if (itemName.includes('Vanilla')) {
            return 'Vanilla';
        } else {
            return '';
        }
    };

    for (const item of data.items) {
        const buffData = await getBuffItem(item.marketHashName, getStyle(item.name));
        total += reference === 1 ? buffData.priceListing : buffData.priceOrder;
    };

    if (countContainer.querySelector('.betterfloat-totalbuffprice')) {
        const totalText = countContainer.querySelector('.betterfloat-totalbuffprice > span');
        if (totalText) {
            totalText.textContent = `${currency}${total.toFixed(2)}`;
        }
    } else {
        const totalElement = document.createElement('div');
        totalElement.classList.add('betterfloat-totalbuffprice');
        totalElement.setAttribute('style', 'display: flex; align-items: center; margin-left: 10px; gap: 5px');
        totalElement.innerHTML = `<img src=${ICON_BUFF} style="border: 1px solid #323c47; height: 20px;border-radius: 5px; translate: 0 -1px;" /><span style="color: mediumpurple;">${currency}${total.toFixed(2)}</span>`;
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
            if (result && document.querySelector("#CatalogFilter-1")?.clientWidth > 0) {
                filterDisplay.click();
            }
        });
    }
    
    if (document.querySelector('#betterfloat-filter-checkbox')) return;

    filterDisplay.setAttribute('style', 'margin-right: 15px;');
    filterDisplay.parentElement?.setAttribute('style', 'justify-content: flex-start;');

    const filterState = filterSetting === 'true' ? true : false;

    const filterCheckbox = `<div role="presentation" class="Checkbox Checkbox--center ${filterState && 'Checkbox--active'}"><input class="Checkbox-input" type="checkbox" id="betterfloat-filter-checkbox" ${filterState && "checked=''"}><div class="Checkbox-overlay"></div></div>`;

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
