import type { BlueGem } from '../@typings/ExtensionTypes';
import iconGemshop from "data-base64:/assets/icons/gem-shop.svg";

export function genGemContainer(patternElement: BlueGem.PatternElement | undefined, mode: 'left' | 'right' = 'left') {
    const gemContainer = document.createElement('div');
    gemContainer.className = 'betterfloat-gem-container';
    gemContainer.title = 'playside blue% / backside blue%';
    gemContainer.style.display = 'flex';
    gemContainer.style.alignItems = 'center';
    if (mode === 'right') {
        gemContainer.style.flexDirection = 'row-reverse';
    }
    const gemImage = document.createElement('img');
    gemImage.setAttribute('src', iconGemshop);
    gemImage.setAttribute(
        'style',
        `height: ${mode === 'left' ? '16' : '18'}px; margin-${
            mode === 'right' ? 'left' : 'right'
        }: 5px; margin-top: 1px; filter: brightness(0) saturate(100%) invert(57%) sepia(46%) saturate(3174%) hue-rotate(160deg) brightness(102%) contrast(105%);`
    );
    gemContainer.appendChild(gemImage);
    if (patternElement) {
        const gemValue = document.createElement('span');
        gemValue.style.color = 'deepskyblue';
        if (mode === 'left' && !location.pathname.includes('/item/')) {
            gemValue.style.fontSize = '13px';
        }
        gemValue.textContent = `${patternElement.playside.toFixed(0)}% / ${patternElement.backside.toFixed(0)}%`;
        gemContainer.appendChild(gemValue);
    }
    return gemContainer;
}

/**
 * Generates a container for the Sticker Price (SP) with a background color based on the SP percentage
 * If the SP is above 200% or below 0.5% the SP is displayed in the currency, otherwise in %
 */
export function generateSpStickerContainer(priceSum: number, spPercentage: number, currency = '$', isItemPage = false) {
    const outerContainer = document.createElement('div');
    const spContainer = document.createElement('span');
    spContainer.classList.add('betterfloat-sticker-price');
    let backgroundImageColor = '';
    if (spPercentage < 0.005 || spPercentage > 2) {
        backgroundImageColor = 'black';
    } else if (spPercentage > 1) {
        backgroundImageColor = 'rgba(245,0,0,1)';
    } else if (spPercentage > 0.5) {
        backgroundImageColor = 'rgba(245,164,0,1)';
    } else if (spPercentage > 0.25) {
        backgroundImageColor = 'rgba(244,245,0,1)';
    } else {
        backgroundImageColor = 'rgba(83,245,0,1)';
    }
    spContainer.style.backgroundImage = `linear-gradient(135deg, ${backgroundImageColor}, rgb(0, 115, 213))`;
    spContainer.style.color = 'white';
    spContainer.style.fontWeight = '600';
    spContainer.style.borderRadius = '7px';
    // if SP is above 200% or below 0.5% display SP in $, otherwise in %
    if (spPercentage > 2 || spPercentage < 0.005) {
        spContainer.textContent = `SP: ${currency}${priceSum.toFixed(0)}`;
    } else {
        spContainer.textContent = `SP: ${(spPercentage > 0 ? spPercentage * 100 : 0).toFixed(1)}%`;
    }
    if (isItemPage) {
        outerContainer.style.margin = '25px 0 10px 10px';
        spContainer.style.padding = '5px 10px';
    } else {
        spContainer.style.padding = '2px 5px';
        outerContainer.style.position = 'absolute';
        outerContainer.style.top = '135px';
        outerContainer.style.left = '10px';
        outerContainer.style.margin = '0 0 10px 10px';
    }
    outerContainer.appendChild(spContainer);
    return outerContainer;
}
