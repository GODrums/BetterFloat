import iconGemshop from 'data-base64:/assets/icons/gem-shop.svg';
import { html } from 'common-tags';
import type Decimal from 'decimal.js';
import type { DopplerPhase } from '~lib/@typings/FloatTypes';
import type { BlueGem } from '../@typings/ExtensionTypes';
import { ICON_BUFF, ICON_C5GAME, ICON_CSFLOAT, ICON_EXCLAMATION, ICON_STEAM, ICON_YOUPIN, MarketSource } from './globals';
import { getMarketURL } from './helperfunctions';

export function generatePriceLine({
	source,
	market_id,
	buff_name,
	priceOrder,
	priceListing,
	priceFromReference,
	userCurrency,
	itemStyle,
	CurrencyFormatter,
	isDoppler,
	isPopout,
	iconHeight,
	priceClass: containerClass,
	addSpaceBetweenPrices = true,
	showPrefix = true,
}: {
	source: MarketSource;
	market_id: number | string | undefined;
	buff_name: string;
	priceOrder: Decimal | undefined;
	priceListing: Decimal | undefined;
	priceFromReference: Decimal | undefined;
	userCurrency: string;
	itemStyle: DopplerPhase;
	CurrencyFormatter: Intl.NumberFormat;
	isDoppler: boolean;
	isPopout: boolean;
	iconHeight?: string;
	priceClass?: string;
	addSpaceBetweenPrices?: boolean;
	showPrefix?: boolean;
}) {
	const href = getMarketURL({ source, market_id, buff_name, phase: isDoppler ? itemStyle : undefined });
	let icon = '';
	let iconStyle = `height: ${iconHeight ?? '15px'}; margin-right: 5px;`;
	switch (source) {
		case MarketSource.Buff:
			icon = ICON_BUFF;
			iconStyle += ' border: 1px solid dimgray; border-radius: 4px;';
			break;
		case MarketSource.Steam:
			icon = ICON_STEAM;
			break;
		case MarketSource.C5Game:
			icon = ICON_C5GAME;
			iconStyle += ' border: 1px solid black; border-radius: 4px;';
			break;
		case MarketSource.YouPin:
			icon = ICON_YOUPIN;
			iconStyle += ' border: 1px solid black; border-radius: 4px;';
			break;
		case MarketSource.CSFloat:
			icon = ICON_CSFLOAT;
			iconStyle += ' border: 1px solid black; border-radius: 4px;';
			break;
	}
	const isWarning = priceOrder?.gt(priceListing ?? 0);
	const extendedDisplay = showPrefix && priceOrder?.lt(100) && priceListing?.lt(100) && !isWarning;
	const bfDataAttribute = JSON.stringify({ buff_name, priceFromReference, userCurrency, source }).replace(/'/g, '&#39;');
	const buffContainer = html`
		<a class="betterfloat-buff-a ${isPopout ? 'betterfloat-big-a' : ''}" href="${href}" target="_blank">
			<img src="${icon}" style="${iconStyle}" />
			<div 
				class="${containerClass ?? ''} betterfloat-buffprice ${isPopout ? 'betterfloat-big-price' : ''} hint--bottom hint--rounded hint--no-arrow" 
				data-betterfloat='${bfDataAttribute}'
				aria-label="Bid: Highest buy order price\nAsk: Lowest listing price"
			>
				${
					[MarketSource.Buff, MarketSource.Steam].includes(source)
						? html`
							<span style="color: orange;"> ${extendedDisplay ? 'Bid ' : ''}${CurrencyFormatter.format(priceOrder?.toNumber() ?? 0)} </span>
							<span style="color: gray;${addSpaceBetweenPrices ? 'margin: 0 3px 0 3px;' : ''}">|</span>
							<span style="color: greenyellow;"> ${extendedDisplay ? 'Ask ' : ''}${CurrencyFormatter.format(priceListing?.toNumber() ?? 0)} </span>
					  `
						: html` <span style="color: white;"> ${CurrencyFormatter.format(priceListing?.toNumber() ?? 0)} </span> `
				}
			</div>
			${
				(source === MarketSource.Buff || source === MarketSource.Steam) && isWarning
					? html`
						<img
							src="${ICON_EXCLAMATION}"
							style="height: 20px; margin-left: 5px; filter: brightness(0) saturate(100%) invert(28%) sepia(95%) saturate(4997%) hue-rotate(3deg) brightness(103%) contrast(104%);"
						/>
				  `
					: ''
			}
		</a>
	`;
	return buffContainer;
}

export function genGemContainer({ patternElement, site, large = false }: { patternElement: BlueGem.PatternData | null; site: 'CSF' | 'SP'; large?: boolean }) {
	if (!patternElement?.playside_blue && !patternElement?.backside_blue) {
		return null;
	}
	const gemContainer = document.createElement('div');
	gemContainer.className = 'betterfloat-gem-container';
	gemContainer.title = 'playside blue% / backside blue%';
	if (!large) {
		gemContainer.style.height = '18px';
	}
	gemContainer.style.display = 'flex';
	gemContainer.style.alignItems = 'center';
	if (site === 'SP' && !large) {
		gemContainer.style.flexDirection = 'row-reverse';
	}
	const gemImage = document.createElement('img');
	gemImage.setAttribute('src', iconGemshop);
	gemImage.setAttribute(
		'style',
		`height: ${site === 'SP' ? (large ? '25' : '18') : large ? '20' : '16'}px; margin-${
			site === 'SP' && !large ? 'left' : 'right'
		}: 5px; filter: brightness(0) saturate(100%) invert(57%) sepia(46%) saturate(3174%) hue-rotate(160deg) brightness(102%) contrast(105%);`
	);
	gemContainer.appendChild(gemImage);
	const gemValue = document.createElement('span');
	gemValue.setAttribute('style', 'color: deepskyblue;' + (site === 'CSF' ? (large ? 'font-size: 14px; font-weight: 500;' : 'font-size: 13px;') : 'font-weight: 600;'));
	gemValue.textContent = `${patternElement.playside_blue?.toFixed(0) ?? 0}% / ${patternElement.backside_blue?.toFixed(0) ?? 0}%`;
	gemContainer.appendChild(gemValue);
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
