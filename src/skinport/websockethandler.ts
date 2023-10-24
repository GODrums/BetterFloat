import { Skinport } from '../@typings/SkinportTypes';

// eslint-disable-next-line @typescript-eslint/no-unused-vars
export function handleListed(data: Skinport.Item[]) {
    // do stuff here
}

export function handleSold(data: Skinport.Item[]) {
    for (let item of data) {
        let element = document.querySelector('.sale-' + item.saleId);
        if (element) {
            // console.debug('[BetterFloat] Found sold item:', item);
            element.querySelector('.ItemPreview-itemImage')?.appendChild(createSoldElement());
            if (element.firstElementChild) {
                element.firstElementChild.className += ' ItemPreview--inCart';
            }
        }
    }
}

function createSoldElement() {
    let soldElement = document.createElement('div');
    soldElement.className = 'ItemPreview-status';
    soldElement.style.background = 'rgb(69, 10, 10)';
    const banIcon = document.createElement('img');
    banIcon.src = chrome.runtime.getURL('public/ban-solid.svg');
    banIcon.setAttribute('style', 'height: auto; width: 30px; filter: brightness(0) saturate(100%) invert(100%) sepia(100%) saturate(1%) hue-rotate(233deg) brightness(103%) contrast(101%);');
    soldElement.appendChild(banIcon);
    return soldElement;
}
