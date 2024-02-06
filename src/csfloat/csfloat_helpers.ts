import { CSFloat } from '../@typings/FloatTypes';

export namespace CSFloatHelpers {
    export const userCurrency = () => {
        // const localCur = localStorage.getItem('selected_currency');
        // if (localCur) {
        //     return localCur;
        // }
        const userCurrencyRaw = document.querySelector('mat-select-trigger')?.textContent?.trim() ?? 'USD';
        const symbolToCurrencyCodeMap: { [key: string]: string } = {
            'C$': 'CAD',
            'AED': 'AED',
            'A$': 'AUD',
            'R$': 'BRL',
            'CHF': 'CHF',
            '¥': 'CNY',
            'Kč': 'CZK',
            'kr': 'DKK',
            '£': 'GBP',
            'PLN': 'PLN',
            'SAR': 'SAR',
            'SEK': 'SEK',
            'S$': 'SGD',
        };
        const currencyCodeFromSymbol = symbolToCurrencyCodeMap[userCurrencyRaw];
        if (currencyCodeFromSymbol) {
            return currencyCodeFromSymbol;
        }
        const isValidCurrency: boolean = /^[A-Z]{3}$/.test(userCurrencyRaw);
        return isValidCurrency ? userCurrencyRaw : 'USD';
    }

    export function generateWarningText(text: string) {
        const warningText = document.createElement('div');
        warningText.className = 'bf-warning-text warning banner';
        warningText.textContent = text;
        warningText.setAttribute('style', 'background-color: #6d0000; color: #fff; text-align: center; line-height: 30px; cursor: pointer; z-index: 999; position: relative; padding: 0 25px;');
        return warningText;
    }

    export function storeApiItem(container: Element, item: CSFloat.ListingData) {
        // add id as class to find the element later more easily
        container.classList.add('item-' + item.id);
        container.setAttribute('data-betterfloat', JSON.stringify(item));
    }

    export function getApiItem(container: Element | null): CSFloat.ListingData | null {
        const data = container?.getAttribute('data-betterfloat');
        if (data) {
            return JSON.parse(data);
        }
        return null;
    }

    export function addPatternBadge(container: Element, svgfile: string, svgStyle: string, tooltipText: string[], tooltipStyle: string, badgeText: string, badgeStyle: string) {
        let badgeTooltip = document.createElement('div');
        badgeTooltip.className = 'bf-tooltip-inner';
        badgeTooltip.setAttribute('style', tooltipStyle);
        for (let i = 0; i < tooltipText.length; i++) {
            let badgeTooltipSpan = document.createElement('span');
            badgeTooltipSpan.textContent = tooltipText[i];
            badgeTooltip.appendChild(badgeTooltipSpan);
        }
        let badge = document.createElement('div');
        badge.className = 'bf-tooltip';
        let badgeDiv = document.createElement('div');
        badgeDiv.className = 'bf-badge-text';
        const bgImage = document.createElement('img');
        bgImage.className = 'betterfloat-cw-image';
        bgImage.setAttribute('src', svgfile);
        bgImage.setAttribute('style', svgStyle);
        badgeDiv.appendChild(bgImage);
        let badgeSpan = document.createElement('span');
        badgeSpan.textContent = badgeText;
        badgeSpan.setAttribute('style', badgeStyle);
        badgeDiv.appendChild(badgeSpan);
        badge.appendChild(badgeDiv);
        badge.appendChild(badgeTooltip);
        let badgeContainer = container.querySelector('.badge-container');
        if (!badgeContainer) {
            badgeContainer = document.createElement('div');
            badgeContainer.setAttribute('style', 'position: absolute; top: 5px; left: 5px;');
            container.querySelector('.item-img')?.after(badgeContainer);
        } else {
            badgeContainer = badgeContainer.querySelector('.container') ?? badgeContainer;
            badgeContainer.setAttribute('style', 'gap: 5px;');
        }
        badgeContainer.appendChild(badge);
    }

    export function addReplacementScreenshotButton(detailButtons: Element, color: string, href: string, runtimePublicURL?: string) {
        detailButtons.setAttribute('style', 'display: flex;');
        const outerContainer = document.createElement('div');
        outerContainer.className = 'bf-tooltip';
        const screenshotButton = document.createElement('a');
        screenshotButton.href = href;
        screenshotButton.target = '_blank';
        screenshotButton.setAttribute('style', 'vertical-align: middle; padding: 0; min-width: 0;');
        screenshotButton.addEventListener('click', (e) => {
            e.stopPropagation();
            e.preventDefault();
            window.open(href, '_blank');
        });
        const iconButton = document.createElement('button');
        iconButton.className = 'mat-focus-indicator mat-tooltip-trigger mat-icon-button mat-button-base ng-star-inserted';
        const buttonColor = color;
        iconButton.setAttribute('style', `color: ${buttonColor};`);
        const iconSpan = document.createElement('span');
        iconSpan.className = 'mat-button-wrapper';
        if (runtimePublicURL) {
            const icon = document.createElement('img');
            icon.setAttribute('style', 'width: 24px; height: 24px;');
            icon.setAttribute('src', runtimePublicURL + '/camera-add-solid.svg');
            iconSpan.appendChild(icon);
        } else {
            const icon = document.createElement('i');
            icon.className = 'material-icons';
            icon.textContent = 'camera_alt';
            iconSpan.appendChild(icon);
        }
        iconButton.appendChild(iconSpan);
        screenshotButton.appendChild(iconButton);
        let tooltip = document.createElement('div');
        tooltip.className = 'bf-tooltip-inner';
        let tooltipSpan = document.createElement('span');
        if (runtimePublicURL) {
            tooltipSpan.textContent = 'Generate Swap.gg screenshot';
        } else {
            tooltipSpan.textContent = 'Show pattern screenshot';
        }
        tooltip.appendChild(tooltipSpan);
        outerContainer.appendChild(screenshotButton);
        outerContainer.appendChild(tooltip);
        detailButtons.insertBefore(outerContainer, detailButtons.firstChild);
    }

    export function createTopButton(runtimePublicURL: string) {
        const topButton = document.createElement('button');
        topButton.classList.add('betterfloat-top-button');
        topButton.setAttribute(
            'style',
            'position: fixed; right: 2rem; bottom: 2rem; z-index: 999; width: 40px; height: 40px; border-radius: 50%; background-color: #004594; border: none; outline: none; cursor: pointer; display: none; transition: visibility 0s, opacity 0.5s linear;'
        );
        const topButtonIcon = document.createElement('img');
        topButtonIcon.setAttribute('src', runtimePublicURL + '/chevron-up-solid.svg');
        topButtonIcon.style.marginTop = '5px';
        topButtonIcon.style.filter = 'brightness(0) saturate(100%) invert(97%) sepia(0%) saturate(2009%) hue-rotate(196deg) brightness(113%) contrast(93%)';
        topButton.addEventListener('click', () => {
            window.scrollTo({ top: 0, behavior: 'smooth' });
        });
        topButton.appendChild(topButtonIcon);
        document.body.appendChild(topButton);

        document.addEventListener('scroll', () => {
            if (document.body.scrollTop > 700 || document.documentElement.scrollTop > 700) {
                topButton.style.display = 'block';
            } else {
                topButton.style.display = 'none';
            }
        });
    }
}
