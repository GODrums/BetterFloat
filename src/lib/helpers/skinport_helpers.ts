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
    if (!filterDisplay) return;
    
    let filterSetting = localStorage.getItem('displayFilterMenu');
    if (filterSetting === null) {
        localStorage.setItem('displayFilterMenu', 'true');
        filterSetting = 'true';
    } else if (filterSetting === 'false') {
        const sideMenu = document.querySelector("#CatalogFilter-1");
        const interval = setInterval(() => {
            if (sideMenu.clientWidth > 0) {
                filterDisplay.click();
                clearInterval(interval);
            }
        }, 100);
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
