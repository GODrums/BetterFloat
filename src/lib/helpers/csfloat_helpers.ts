import { html } from 'common-tags';
import Decimal from 'decimal.js';

import { adjustOfferContainer } from '~contents/csfloat_script';
import { ICON_BUFF, ICON_EXCLAMATION, ICON_STEAM } from '~lib/util/globals';
import { getSetting } from '~lib/util/storage';

import type { Extension } from '~lib/@typings/ExtensionTypes';
import type { CSFloat } from '~lib/@typings/FloatTypes';

import iconChevronUp from 'data-base64:/assets/icons/chevron-up-solid.svg';
import { toTitleCase } from '~lib/util/helperfunctions';

export async function adjustOfferBubbles(offers: CSFloat.Offer[]) {
	await new Promise((resolve) => setTimeout(resolve, 200));
	const bubbles = document.querySelectorAll('.history .offer-bubble');
	let buffA = document.querySelector('.betterfloat-buff-a');
	let buff_data = JSON.parse(buffA?.getAttribute('data-betterfloat') ?? '{}');

	// refresh buff tag when item changes
	if (
		!buff_data.itemName?.includes(document.querySelector('div.prefix')?.firstChild?.textContent?.trim()) ||
		!buff_data.itemName?.includes(document.querySelector('div.suffix')?.firstChild?.textContent?.trim())
	) {
		buffA?.remove();
		await adjustOfferContainer(document.querySelector('app-view-offers .container')!);
		buffA = document.querySelector('.betterfloat-buff-a');
		buff_data = JSON.parse(buffA?.getAttribute('data-betterfloat') ?? '{}');
	}

	if (bubbles.length > offers.length) {
		console.log('[BetterFloat] Bubbles and offers length mismatch');
		return;
	}

	for (let i = 0; i < bubbles.length; i++) {
		const bubble = bubbles[i];
		if (bubble.querySelector('.betterfloat-bubble-buff')) {
			continue;
		}

		const offer = offers[i];
		const difference = new Decimal(offer.price).div(100).minus(buff_data.priceFromReference);

		const subText = bubble.querySelector<HTMLElement>('.sub-text');
		if (subText) {
			const isSeller = subText.textContent?.includes('Buyer') && bubble.className.includes('from-other-party');
			subText.setAttribute('style', 'display: flex; align-items: center; width: 100%; justify-content: space-between;');
			subText.innerHTML = `<div style="display: inline-flex; align-items: center;">${subText.textContent}</div>`;

			if (await getSetting('csf-steamlink')) {
				const steamHTML = html`
					<a target="_blank" href="https://steamcommunity.com/profiles/${offer.buyer_id}" style="display: flex; align-items: center;">
						<img src="${ICON_STEAM}" style="height: 20px; margin-right: 5px;" />
					</a>
				`;
				if (isSeller) {
					subText.firstElementChild?.insertAdjacentHTML('afterbegin', steamHTML);
				}
			}

			const buffHTML = html`
				<div class="betterfloat-bubble-buff" style="display: inline-flex; align-items: center; justify-content: ${isSeller ? 'flex-end' : 'flex-start'};">
					<img src="${ICON_BUFF}" style="height: 20px; margin-right: 5px; border: 1px solid dimgray; border-radius: 4px;" />
					<span style="color: var(--primary-color); font-weight: 500;">
						${difference.isPositive() ? '+' : ''}${Intl.NumberFormat('en-US', { style: 'currency', currency: CSFloatHelpers.userCurrency() }).format(difference.toNumber())}
					</span>
				</div>
			`;
			subText.insertAdjacentHTML(isSeller ? 'beforeend' : 'afterbegin', buffHTML);
		}
	}
}

export namespace CSFloatHelpers {
	export function adjustCSFTitle(state: Extension.URLState) {
		let newTitle = '';
		const titleMap = {
			'/': 'Home',
			'/profile/offers': 'Offers',
			'/profile/watchlist': 'Watchlist',
			'/profile/trades': 'Trades',
			'/sell': 'Selling',
			'/profile': 'Profile',
			'/support': 'Support',
			'/profile/deposit': 'Deposit',
		};
		if (state.path === '/search') {
			const query = new URLSearchParams(location.search).get('sort_by');
			if (query) {
				newTitle = toTitleCase(query.replace(/_/g, ' '));
			} else {
				newTitle = 'Search';
			}
		} else if (state.path in titleMap) {
			newTitle = titleMap[state.path];
		} else if (location.pathname.includes('/stall/')) {
			const username = document.querySelector('.username')?.textContent;
			if (username) {
				newTitle = username + "'s Stall";
			}
		}
		if (newTitle !== '') {
			document.title = newTitle + ' - CSFloat';
		}
	}

	export function intervalMapping(setting: number) {
		switch (setting) {
			case 0:
				return 30;
			case 1:
				return 60;
			case 2:
				return 120;
			case 3:
				return 300;
			default:
				return 0;
		}
	}

	export const userCurrency = () => {
		// const localCur = localStorage.getItem('selected_currency');
		// if (localCur) {
		//     return localCur;
		// }
		const userCurrencyRaw = document.querySelector('mat-select-trigger')?.textContent?.trim() ?? 'USD';
		const symbolToCurrencyCodeMap: { [key: string]: string } = {
			C$: 'CAD',
			AED: 'AED',
			A$: 'AUD',
			R$: 'BRL',
			CHF: 'CHF',
			'¥': 'CNY',
			Kč: 'CZK',
			kr: 'DKK',
			'£': 'GBP',
			PLN: 'PLN',
			SAR: 'SAR',
			SEK: 'SEK',
			S$: 'SGD',
		};
		const currencyCodeFromSymbol = symbolToCurrencyCodeMap[userCurrencyRaw];
		if (currencyCodeFromSymbol) {
			return currencyCodeFromSymbol;
		}
		const isValidCurrency: boolean = /^[A-Z]{3}$/.test(userCurrencyRaw);
		return isValidCurrency ? userCurrencyRaw : 'USD';
	};

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
		const badgeTooltip = document.createElement('div');
		badgeTooltip.className = 'bf-tooltip-inner';
		badgeTooltip.setAttribute('style', tooltipStyle);
		for (let i = 0; i < tooltipText.length; i++) {
			const badgeTooltipSpan = document.createElement('span');
			badgeTooltipSpan.textContent = tooltipText[i];
			badgeTooltip.appendChild(badgeTooltipSpan);
		}
		const badge = document.createElement('div');
		badge.className = 'bf-tooltip';
		const badgeDiv = document.createElement('div');
		badgeDiv.className = 'bf-badge-text';
		const bgImage = document.createElement('img');
		bgImage.className = 'betterfloat-cw-image';
		bgImage.setAttribute('src', svgfile);
		bgImage.setAttribute('style', svgStyle);
		badgeDiv.appendChild(bgImage);
		const badgeSpan = document.createElement('span');
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

	export function createTopButton() {
		const topButton = document.createElement('button');
		topButton.className = 'betterfloat-top-button';
		topButton.setAttribute(
			'style',
			'position: fixed; right: 2rem; bottom: 2rem; z-index: 999; width: 40px; height: 40px; border-radius: 50%; background-color: #1b1d2480; border: none; outline: none; cursor: pointer; display: none; backdrop-filter: blur(10px); transition: visibility 3s, opacity 2s linear;'
		);
		const topButtonIcon = document.createElement('img');
		topButtonIcon.setAttribute('src', iconChevronUp);
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

	export function addItemScreenshot(container: Element, item: CSFloat.Item) {
		if (!item.cs2_screenshot_id) return;

		const imgContainer = container.querySelector<HTMLImageElement>('app-item-image-actions img.item-img');
		if (!imgContainer) return;

		imgContainer.src = `https://s.csfloat.com/m/${item.cs2_screenshot_id}/playside.png?v=2`;
		imgContainer.style.objectFit = 'contain';
	}

	export function adjustCurrencyChangeNotice(container: Element) {
		if (!container.querySelector('.title')?.textContent?.includes('Currencies on CSFloat')) {
			return;
		}
		const warningDiv = html`
			<div style="display: flex; align-items: center; background-color: #7f101080; border-radius: 18px;">
				<img src="${ICON_EXCLAMATION}" style="height: 30px; margin: 0 10px; filter: brightness(0) saturate(100%) invert(19%) sepia(64%) saturate(3289%) hue-rotate(212deg) brightness(89%) contrast(98%);">
				<p>Please note that BetterFloat requires a page refresh after changing the currency.</p>
			</div>
			<div style="display: flex; align-items: center; justify-content: center; margin-top: 15px;">
				<button class="bf-reload mat-mdc-tooltip-trigger mdc-button mdc-button--raised mat-mdc-raised-button mat-primary mat-mdc-button-base" color="primary">
					<span class="mat-mdc-button-persistent-ripple mdc-button__ripple"></span>
					<span class="mdc-button__label"><span class="mdc-button__label"><span class="text">Refresh</span></span>
				</button>
			</div>
		`;
		container.children[0].insertAdjacentHTML('beforeend', warningDiv);
		container.children[0].querySelector('button.bf-reload')?.addEventListener('click', () => {
			location.reload();
		});
	}

	export function copyNameOnClick(container: Element) {
		const itemName = container.querySelector('app-item-name');
		if (itemName) {
			itemName.setAttribute('style', 'cursor: pointer;');
			itemName.setAttribute('title', 'Click to copy item name');
			itemName.addEventListener('click', () => {
				const name = itemName.textContent;
				if (name) {
					navigator.clipboard.writeText(name);
					itemName.setAttribute('title', 'Copied!');
					itemName.setAttribute('style', 'cursor: default;');
					setTimeout(() => {
						itemName.setAttribute('title', 'Click to copy item name');
						itemName.setAttribute('style', 'cursor: pointer;');
					}, 2000);
				}
			});
		}
	}

	export function removeClustering(container: Element) {
		const sellerDetails = container.querySelector('div.seller-details-wrapper');
		if (sellerDetails) {
			sellerDetails.setAttribute('style', 'display: none;');
		}
	}
}
