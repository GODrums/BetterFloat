import { CrimsonKimonoMapping, CyanbitKarambitMapping, OverprintMapping, PhoenixMapping } from 'cs-tierlist';
import { AcidFadeCalculator, AmberFadeCalculator } from 'csgo-fade-percentage-calculator';
import getSymbolFromCurrency from 'currency-symbol-map';
import iconArrowup from 'data-base64:/assets/icons/arrow-up-right-from-square-solid.svg';
import iconCameraFlipped from 'data-base64:/assets/icons/camera-flipped.svg';
import iconCsgostash from 'data-base64:/assets/icons/icon-csgostash.png';
import iconPricempire from 'data-base64:/assets/icons/icon-pricempire.png';
import iconSteam from 'data-base64:/assets/icons/icon-steam.svg';
import Decimal from 'decimal.js';
import type { PlasmoCSConfig } from 'plasmo';

import { CSFloatHelpers } from '~lib/helpers/csfloat_helpers';
import {
	ICON_ARROWUP,
	ICON_BAN,
	ICON_BUFF,
	ICON_CLOCK,
	ICON_CRIMSON,
	ICON_CSFLOAT,
	ICON_EXCLAMATION,
	ICON_GEM_CYAN,
	ICON_OVERPRINT_ARROW,
	ICON_OVERPRINT_FLOWER,
	ICON_OVERPRINT_MIXED,
	ICON_OVERPRINT_POLYGON,
	ICON_PHOENIX,
	ICON_SPIDER_WEB,
} from '~lib/util/globals';
import { getAllSettings, getSetting, type IStorage } from '~lib/util/storage';

import type { BlueGem, Extension, FadePercentage } from '../lib/@typings/ExtensionTypes';
import type { CSFloat, ItemCondition, ItemStyle } from '../lib/@typings/FloatTypes';
import { activateHandler } from '../lib/handlers/eventhandler';
import {
	getBuffMapping,
	getCrimsonWebMapping,
	getCSFCurrencyRate,
	getCSFPopupItem,
	getFirstCSFItem,
	getFirstHistorySale,
	getItemPrice,
	getStallData,
	getWholeHistory,
	loadBuffMapping,
	loadMapping,
} from '../lib/handlers/mappinghandler';
import { fetchCSBlueGem, isApiStatusOK } from '../lib/handlers/networkhandler';
import { calculateTime, getBuffPrice, getFloatColoring, getSPBackgroundColor, handleSpecialStickerNames, toTruncatedString, USDollar, waitForElement } from '../lib/util/helperfunctions';
import { genGemContainer, genRefreshButton } from '../lib/util/uigeneration';

export const config: PlasmoCSConfig = {
	matches: ['https://*.csfloat.com/*'],
	run_at: 'document_end',
	css: ['../css/csfloat_styles.css'],
};

init();

async function init() {
	console.time('[BetterFloat] CSFloat init timer');

	if (location.host !== 'csfloat.com') {
		return;
	}
	// catch the events thrown by the script
	// this has to be done as first thing to not miss timed events
	activateHandler();

	const apiStatus = await isApiStatusOK();
	if (apiStatus.statusCode != 200 && apiStatus.sites.includes('csfloat')) {
		console.error('[BetterFloat] API status is not OK:', apiStatus);
		const bannerPlaceholder = document.querySelector('MAT-TOOLBAR')?.parentElement?.childNodes[2];
		if (bannerPlaceholder) {
			bannerPlaceholder.replaceWith(CSFloatHelpers.generateWarningText(apiStatus.message));
		}
		return;
	}

	extensionSettings = await getAllSettings();

	if (!extensionSettings['csf-enable']) return;

	console.group('[BetterFloat] Loading mappings...');
	await loadMapping();
	await loadBuffMapping();
	console.groupEnd();
	console.timeEnd('[BetterFloat] CSFloat init timer');

	if (extensionSettings['csf-topbutton']) {
		CSFloatHelpers.createTopButton();
	}

	//check if url is in supported subpages
	if (location.pathname == '/') {
		await firstLaunch();
	} else {
		for (let i = 0; i < supportedSubPages.length; i++) {
			if (location.pathname.includes(supportedSubPages[i])) {
				await firstLaunch();
				break;
			}
		}
	}

	// mutation observer is only needed once
	if (!isObserverActive) {
		isObserverActive = true;
		applyMutation();
		console.log('[BetterFloat] Mutation observer started');
	}
}

// required as mutation does not detect initial DOM
async function firstLaunch() {
	const items = document.querySelectorAll('item-card');

	for (let i = 0; i < items.length; i++) {
		await adjustItem(items[i], items[i].getAttribute('width')?.includes('100%') ? POPOUT_ITEM.PAGE : POPOUT_ITEM.NONE);
	}

	if (location.pathname == '/profile/offers') {
		const matActionList = document.querySelector('.mat-action-list')?.children;
		if (!matActionList) return;
		for (let i = 0; i < matActionList.length; i++) {
			const child = matActionList[i];
			if (child?.className.includes('mat-list-item')) {
				offerItemClickListener(child);
			}
		}

		await waitForElement('.betterfloat-buffprice');
		const offerBubbles = document.querySelectorAll('.offer-bubble');
		for (let i = 0; i < offerBubbles.length; i++) {
			adjustItemBubble(offerBubbles[i]);
		}
	} else if (location.pathname.includes('/stall/')) {
		// await customStall(location.pathname.split('/').pop() ?? '');
	} else if (location.pathname === '/checkout') {
		adjustCheckout(document.querySelector('app-checkout')!);
	}
}

// eslint-disable-next-line @typescript-eslint/no-unused-vars
async function customStall(stall_id: string) {
	if (stall_id == 'me') {
		const popupOuter = document.createElement('div');
		const settingsPopup = document.createElement('div');
		settingsPopup.setAttribute('class', 'betterfloat-customstall-popup');
		settingsPopup.setAttribute('style', 'display: none;');

		const popupHeader = document.createElement('h3');
		popupHeader.textContent = 'CUSTOM STALL';
		popupHeader.setAttribute('style', 'font-weight: 600; font-size: 24px; line-height: 0; margin-top: 20px;');
		const popupSubHeader = document.createElement('h4');
		popupSubHeader.textContent = 'by BetterFloat';
		popupSubHeader.setAttribute('style', 'font-size: 18px; color: rgb(130, 130, 130); line-height: 0;');
		const popupCloseButton = document.createElement('button');
		popupCloseButton.type = 'button';
		popupCloseButton.className = 'betterfloat-customstall-close';
		popupCloseButton.textContent = 'x';
		popupCloseButton.onclick = () => {
			settingsPopup.style.display = 'none';
		};
		settingsPopup.appendChild(popupHeader);
		settingsPopup.appendChild(popupSubHeader);
		settingsPopup.appendChild(popupCloseButton);

		const popupBackground = document.createElement('div');
		popupBackground.className = 'betterfloat-customstall-popup-content';
		const backgroundText = document.createElement('p');
		backgroundText.setAttribute('style', 'font-weight: 600; margin: 5px 0;');
		backgroundText.textContent = 'BACKGROUND';
		popupBackground.appendChild(backgroundText);

		const inputField = {
			img: {
				placeholder: 'Image URL',
				text: 'IMG:',
			},
			webm: {
				placeholder: 'Webm URL',
				text: 'WEBM:',
			},
			mp4: {
				placeholder: 'Mp4 URL',
				text: 'MP4:',
			},
		};
		for (const key in inputField) {
			const div = document.createElement('div');
			div.setAttribute('style', 'display: flex; justify-content: space-between; width: 100%');
			const label = document.createElement('label');
			label.textContent = inputField[key as keyof typeof inputField].text;
			const input = document.createElement('input');
			input.className = 'w-2/4';
			input.type = 'url';
			input.placeholder = inputField[key as keyof typeof inputField].placeholder;
			input.id = 'betterfloat-customstall-' + key;
			div.appendChild(label);
			div.appendChild(input);
			popupBackground.appendChild(div);
		}
		const colorDiv = document.createElement('div');
		colorDiv.setAttribute('style', 'display: flex; justify-content: space-between; width: 100%');
		const colorLabel = document.createElement('label');
		colorLabel.textContent = 'Color:';
		const colorInput = document.createElement('input');
		colorInput.type = 'color';
		colorInput.id = 'betterfloat-customstall-color';
		colorDiv.appendChild(colorLabel);
		colorDiv.appendChild(colorInput);
		const transparentDiv = document.createElement('div');
		transparentDiv.setAttribute('style', 'display: flex; justify-content: space-between; width: 100%');
		const transparentLabel = document.createElement('label');
		transparentLabel.textContent = 'Transparent Elements:';
		const transparentInput = document.createElement('input');
		transparentInput.setAttribute('style', 'height: 24px; width: 24px; accent-color: #ff5722;');
		transparentInput.type = 'checkbox';
		transparentInput.id = 'betterfloat-customstall-transparent';
		transparentDiv.appendChild(transparentLabel);
		transparentDiv.appendChild(transparentInput);

		const popupSaveButton = document.createElement('button');
		popupSaveButton.className = 'mat-raised-button mat-warn betterfloat-customstall-buttondiv';
		popupSaveButton.style.marginTop = '15px';
		popupSaveButton.type = 'button';
		const saveButtonTextNode = document.createElement('span');
		saveButtonTextNode.textContent = 'Save';
		popupSaveButton.onclick = async () => {
			const stall_id = (<HTMLInputElement>document.getElementById('mat-input-1')).value.split('/').pop();
			if (isNaN(Number(stall_id)) || location.pathname != '/stall/me') {
				console.debug('[BetterFloat] Invalid stall id');
				return;
			}
			// send get to /api/v1/me to get obfuscated user id
			const obfuscated_id: string = await fetch('https://csfloat.com/api/v1/me')
				.then((res) => res.json())
				.then((data) => data?.user?.obfuscated_id);
			if (!obfuscated_id) {
				console.debug('[BetterFloat] Could not get obfuscated user id');
				return;
			}
			const stallData = {
				stall_id: stall_id,
				options: {
					video: {
						poster: (<HTMLInputElement>document.getElementById('betterfloat-customstall-img')).value,
						webm: (<HTMLInputElement>document.getElementById('betterfloat-customstall-webm')).value,
						mp4: (<HTMLInputElement>document.getElementById('betterfloat-customstall-mp4')).value,
					},
					'background-color': (<HTMLInputElement>document.getElementById('betterfloat-customstall-color')).value,
					transparent_elements: (<HTMLInputElement>document.getElementById('betterfloat-customstall-transparent')).checked,
				},
			};
			console.debug('[BetterFloat] New stall settings: ', stallData);

			// send post to /api/v1/stall/{id} to update stall
			await fetch('https://api.rums.dev/v1/csfloatstalls/store', {
				method: 'POST',
				headers: {
					Accept: '*/*',
					'Content-Type': 'application/json',
				},
				body: JSON.stringify({
					stall_id: stallData.stall_id,
					// token: obfuscated_id,
					token: 'testtoken',
					data: stallData.options,
				}),
			})
				.then((res) => res.json())
				.then((data) => console.debug('[BetterFloat] Stall update - success response from api.rums.dev: ', data))
				.catch((err) => console.debug('[BetterFloat] Stall update - error: ', err));

			settingsPopup.style.display = 'none';
		};
		popupSaveButton.appendChild(saveButtonTextNode);

		popupBackground.appendChild(colorDiv);
		popupBackground.appendChild(transparentDiv);
		settingsPopup.appendChild(popupBackground);
		settingsPopup.appendChild(popupSaveButton);

		const settingsButton = document.createElement('button');
		settingsButton.setAttribute('style', 'background: none; border: none; margin-left: 60px');
		const settingsIcon = document.createElement('img');
		// settingsIcon.setAttribute('src', extensionSettings["runtimePublicURL"] + '/gear-solid.svg');
		settingsIcon.style.height = '64px';
		settingsIcon.style.filter = 'brightness(0) saturate(100%) invert(59%) sepia(55%) saturate(3028%) hue-rotate(340deg) brightness(101%) contrast(101%)';
		settingsButton.onclick = () => {
			settingsPopup.style.display = 'block';
		};
		settingsButton.appendChild(settingsIcon);
		popupOuter.appendChild(settingsPopup);
		popupOuter.appendChild(settingsButton);

		const container = document.querySelector('.settings')?.parentElement;
		if (container) {
			container.after(popupOuter);
			(<HTMLElement>container.parentElement).style.alignItems = 'center';
		}

		// get stall id from input field to still load custom stall
		const newID = (<HTMLInputElement>document.getElementById('mat-input-1')).value.split('/').pop();
		if (newID) {
			stall_id = newID;
		} else {
			console.log('[BetterFloat] Could not load stall data');
			return;
		}
	}
	const stallData = await getStallData(stall_id);
	if (!stallData || !stall_id.includes(stallData.stall_id)) {
		console.log('[BetterFloat] Could not load stall data');
		return;
	}
	// user has not set a customer stall yet
	if (stallData.roles.length == 0) {
		console.debug(`[BetterFloat] User ${stall_id} has not set a custom stall yet`);
		return;
	}

	document.body.classList.add('betterfloat-custom-stall');

	const backgroundVideo = document.createElement('video');
	backgroundVideo.setAttribute('playsinline', '');
	backgroundVideo.setAttribute('autoplay', '');
	backgroundVideo.setAttribute('muted', '');
	backgroundVideo.setAttribute('loop', '');
	backgroundVideo.setAttribute('poster', stallData.options.video.poster);
	backgroundVideo.setAttribute(
		'style',
		`position: absolute; width: 100%; height: 100%; z-index: -100; background-size: cover; background-position: center center; object-fit: cover; background-color: ${stallData.options['background-color']}`
	);
	const sourceWebm = document.createElement('source');
	sourceWebm.setAttribute('src', stallData.options.video.webm);
	sourceWebm.setAttribute('type', 'video/webm');
	const sourceMp4 = document.createElement('source');
	sourceMp4.setAttribute('src', stallData.options.video.mp4);
	sourceMp4.setAttribute('type', 'video/mp4');

	backgroundVideo.appendChild(sourceWebm);
	backgroundVideo.appendChild(sourceMp4);
	document.body.firstChild?.before(backgroundVideo);

	// start video after it is loaded
	backgroundVideo.addEventListener('canplay', async () => {
		backgroundVideo.muted = true;
		await backgroundVideo.play();
	});

	if (stallData.options.transparent_elements) {
		const stallHeader = document.querySelector('.betterfloat-custom-stall .mat-card.header');
		if (stallHeader) {
			(<HTMLElement>stallHeader).style.backgroundColor = 'transparent';
		}
		const stallFooter = document.querySelector('.betterfloat-custom-stall > app-root > div > div.footer');
		if (stallFooter) {
			(<HTMLElement>stallFooter).style.backgroundColor = 'transparent';
		}
	}

	const matChipWrapper = document.querySelector('.mat-chip-list-wrapper');
	if (matChipWrapper?.firstElementChild) {
		const bfChip = <HTMLElement>matChipWrapper.firstElementChild.cloneNode(true);
		bfChip.style.backgroundColor = 'purple';
		bfChip.textContent = 'BetterFloat ' + stallData.roles[0];
		matChipWrapper.appendChild(bfChip);
	}

	const interval = setInterval(() => {
		if (!location.href.includes('/stall/') && !location.href.includes('/item/')) {
			document.querySelector('.betterfloat-custom-stall')?.classList.remove('betterfloat-custom-stall');
			document.querySelector('video')?.remove();

			clearInterval(interval);
		}
	}, 200);
}

function offerItemClickListener(listItem: Element) {
	listItem.addEventListener('click', async () => {
		await new Promise((r) => setTimeout(r, 100));
		const itemCard = document.querySelector('item-card');
		if (itemCard) {
			await adjustItem(itemCard);
		}
	});
}

async function refreshButton() {
	const matChipList = document.querySelector('.mat-chip-list-wrapper');
	const refreshInterval = CSFloatHelpers.intervalMapping(extensionSettings['csf-refreshinterval']);

	const refreshChip = document.createElement('div');
	refreshChip.classList.add('betterfloat-refresh');
	refreshChip.setAttribute('style', 'display: inline-flex; margin-left: 20px;');

	const refreshContainer = document.createElement('div');
	const autorefreshContainer = document.createElement('span');
	const refreshText = document.createElement('span');
	const intervalContainer = document.createElement('span');
	refreshContainer.classList.add('betterfloat-refreshContainer');
	autorefreshContainer.textContent = 'Auto-Refresh: ';
	refreshText.classList.add('betterfloat-refreshText');
	refreshText.setAttribute('style', 'color: #ce0000;');
	refreshText.textContent = 'inactive';
	intervalContainer.setAttribute('style', 'color: gray;');
	intervalContainer.textContent = `Interval: ${refreshInterval}s`;

	refreshContainer.appendChild(autorefreshContainer);
	refreshContainer.appendChild(refreshText);
	refreshContainer.appendChild(intervalContainer);
	refreshChip.appendChild(refreshContainer);

	const startStopContainer = document.createElement('div');
	const startElement = genRefreshButton('Start');
	const stopElement = genRefreshButton('Stop');
	startStopContainer.style.display = 'flex';
	startStopContainer.style.flexDirection = 'row';
	startStopContainer.appendChild(startElement);
	startStopContainer.appendChild(stopElement);

	if (matChipList) {
		if (!matChipList.innerHTML.includes('betterfloat-refresh')) {
			matChipList.appendChild(refreshChip);
			refreshChip.after(startStopContainer);
		}
		//while (!document.getElementsByClassName('betterfloat-refresh')[0]) await new Promise((r) => setTimeout(r, 100));

		startElement.addEventListener('click', () => {
			// somehow Angular calls the eventlistener multiple times, this prevents side effects
			if (refreshThreads.length > 1) {
				console.debug('[BetterFloat] Auto-refresh already active');
				return;
			}
			console.log('[BetterFloat] Starting auto-refresh, interval: 30s, current time: ' + Date.now());

			const refreshDelay = refreshInterval * 1000;
			const refreshText = document.querySelector('.betterfloat-refreshText');

			if (!refreshText) return;
			refreshText.textContent = 'active';
			refreshText.setAttribute('style', 'color: greenyellow;');

			// save timer to avoid uncoordinated executions
			refreshThreads.push(
				setInterval(() => {
					const refreshButton = document.querySelector('.mat-chip-list-wrapper')?.querySelector('.mat-tooltip-trigger')?.children[0] as HTMLElement;
					// time should be lower than interval due to inconsistencies
					if (refreshButton && lastRefresh + refreshDelay * 0.9 < Date.now()) {
						lastRefresh = Date.now();
						refreshButton.click();
					}
				}, refreshDelay)
			);
		});
		stopElement.addEventListener('click', () => {
			// gets called multiple times, maybe needs additional handling in the future
			console.log('[BetterFloat] Stopping auto-refresh, current time: ' + Date.now(), ', #active threads: ' + refreshThreads.length);

			const refreshText = document.querySelector('.betterfloat-refreshText');
			if (!refreshText) return;
			refreshText.textContent = 'inactive';
			refreshText.setAttribute('style', 'color: #ce0000;');

			//clearinterval for every entry in refreshInterval
			for (let i = 0; i < refreshThreads.length; i++) {
				clearInterval(refreshThreads[i] ?? 0);
				refreshThreads.splice(i, 1);
			}
			setTimeout(() => {
				//for some weird reason one element stays in the array
				if (refreshThreads.length > 0) {
					clearInterval(refreshThreads[0] ?? 0);
					refreshThreads.splice(0, 1);
				}
			}, 1000);
		});
	}
}

function applyMutation() {
	const observer = new MutationObserver(async (mutations) => {
		if (await getSetting('csf-enable')) {
			for (let i = 0; i < unsupportedSubPages.length; i++) {
				if (location.href.includes(unsupportedSubPages[i])) {
					console.debug('[BetterFloat] Current page is currently NOT supported');
					return;
				}
			}
			for (const mutation of mutations) {
				for (let i = 0; i < mutation.addedNodes.length; i++) {
					const addedNode = mutation.addedNodes[i];
					// some nodes are not elements, so we need to check
					if (!(addedNode instanceof HTMLElement)) continue;
					// console.debug('[BetterFloat] Mutation detected:', addedNode);

					// item popout
					if (addedNode.tagName.toLowerCase() == 'item-detail') {
						await adjustItem(addedNode, POPOUT_ITEM.PAGE);
						// item from listings
					} else if (addedNode.tagName.toLowerCase() == 'app-stall-view') {
						// adjust stall
						// await customStall(location.pathname.split('/').pop() ?? '');
					} else if (addedNode.tagName.toLowerCase() == 'app-make-offer-dialog') {
						await adjustBargainPopup(addedNode);
					} else if (addedNode.className.toString().includes('flex-item')) {
						await adjustItem(addedNode);
					} else if (addedNode.className.toString().includes('mat-row cdk-row')) {
						// row from the sales table in an item popup
						await adjustSalesTableRow(addedNode);
					} else if (location.pathname == '/profile/offers' && addedNode.className.includes('reference-container')) {
						// item in the offers page when switching from another page
						const itemCard = document.querySelector('item-card');
						if (itemCard) {
							await adjustItem(itemCard);
						}
					} else if (addedNode.className.toString().includes('offer-bubble')) {
						// offer bubbles in offers page
						adjustItemBubble(addedNode);
					} else if (location.pathname == '/profile/offers' && addedNode.className.toString().includes('mat-list-item')) {
						// offer list in offers page
						offerItemClickListener(addedNode);
					} else if (addedNode.tagName.toLowerCase() == 'app-markdown-dialog') {
						adjustCurrencyChangeNotice(addedNode);
					} else if (addedNode.tagName.toLowerCase() == 'app-checkout') {
						adjustCheckout(addedNode);
					}
				}
			}
		}

		const activeTab = getTabNumber();
		if (activeTab == 4 && extensionSettings['csf-autorefresh']) {
			await refreshButton();
		}
	});
	observer.observe(document, { childList: true, subtree: true });
}

async function adjustBargainPopup(container: Element) {
	const itemCard = container.querySelector('item-card');
	if (!itemCard) return;
	await adjustItem(itemCard, POPOUT_ITEM.BARGAIN);

	// we have to wait for the sticker data to be loaded
	await new Promise((r) => setTimeout(r, 1600));

	const item = JSON.parse(itemCard.getAttribute('data-betterfloat')) as CSFloat.ListingData;
	const buff_data = JSON.parse(itemCard.querySelector('.betterfloat-buffprice')?.getAttribute('data-betterfloat') ?? '{}');
	const stickerData = JSON.parse(itemCard.querySelector('.sticker-percentage')?.getAttribute('data-betterfloat') ?? '{}');

	console.log('[BetterFloat] Bargain popup data:', item, buff_data, stickerData);
	if (buff_data.priceFromReference > 0) {
		const currency = getSymbolFromCurrency(buff_data.userCurrency);
		const minOffer = new Decimal(item.min_offer_price).div(100).minus(buff_data.priceFromReference);
		const minPercentage = minOffer.greaterThan(0) && stickerData.priceSum ? minOffer.div(stickerData.priceSum).mul(100).toDP(2).toNumber() : 0;

		const spStyle = 'border: 1px solid grey; border-radius: 7px; padding: 5px;';
		const diffStyle = `font-size: 15px; padding: 2px 5px; border-radius: 7px; cursor: pointer; background-color: ${minOffer.isNegative() ? extensionSettings['csf-color-profit'] : extensionSettings['csf-color-loss']}`;
		const bargainTags = `<div style="display: inline-flex; align-items: center; gap: 8px; font-size: 15px; margin-left: 10px;"><span style="${diffStyle}">${minOffer.isNegative() ? '-' : '+'}${currency}${minOffer.absoluteValue().toDP(2).toNumber()}</span><span style="${spStyle} display: ${stickerData.priceSum ? 'block' : 'none'}">${minPercentage} %SP</span></div>`;

		const minContainer = container.querySelector('.minimum-offer');
		if (minContainer) {
			minContainer.insertAdjacentHTML('beforeend', bargainTags);
		}

		const inputField = container.querySelector<HTMLInputElement>('input');
		if (!inputField) return;
		inputField.parentElement?.setAttribute('style', 'display: flex; align-items: center; justify-content: space-between;');
		inputField.insertAdjacentHTML(
			'afterend',
			`<div style="position: relative; display: inline-flex; align-items: center; gap: 8px; font-size: 16px;"><span class="betterfloat-bargain-diff" style="${diffStyle}"></span>` +
				(stickerData.priceSum ? `<span class="betterfloat-bargain-sp" style="${spStyle}"></span></div>` : '</div>')
		);

		const diffElement = container.querySelector<HTMLElement>('.betterfloat-bargain-diff');
		const spElement = container.querySelector<HTMLElement>('.betterfloat-bargain-sp');
		let absolute = false;

		const calculateDiff = () => {
			const inputPrice = new Decimal(inputField.value);
			if (absolute) {
				const diff = inputPrice.minus(buff_data.priceFromReference);
				if (diffElement) {
					diffElement.textContent = `${diff.isNegative() ? '-' : '+'}${currency}${diff.absoluteValue().toDP(2).toNumber()}`;
					diffElement.style.backgroundColor = `${diff.isNegative() ? extensionSettings['csf-color-profit'] : extensionSettings['csf-color-loss']}`;
				}
			} else {
				const diff = inputPrice.div(buff_data.priceFromReference).mul(100);
				const percentage = stickerData.priceSum ? inputPrice.minus(buff_data.priceFromReference).div(stickerData.priceSum).mul(100).toDP(2) : null;
				if (diffElement) {
					diffElement.textContent = `${diff.absoluteValue().toDP(2).toNumber()}%`;
					diffElement.style.backgroundColor = `${diff.lessThan(100) ? extensionSettings['csf-color-profit'] : extensionSettings['csf-color-loss']}`;
				}
				if (spElement) {
					spElement.textContent = `${percentage.lessThan(0) ? '0' : percentage.toNumber()} %SP`;
				}
			}
		};

		inputField.addEventListener('input', () => {
			calculateDiff();
		});

		diffElement?.addEventListener('click', () => {
			absolute = !absolute;
			calculateDiff();
		});
	}
}

async function adjustCheckout(container: Element) {
	await new Promise((r) => setTimeout(r, 2000));
	const priceElements = container.querySelectorAll('.betterfloat-buffprice');
	if (priceElements.length === 0) return;
	const itemData = Array.from(priceElements).map((el) => JSON.parse(el.getAttribute('data-betterfloat') ?? '{}'));
	const itemPriceSum = itemData.reduce((acc, el) => acc + el.priceFromReference, 0);
	const totalPriceElement = container.querySelector('h2');
	const totalPriceText = totalPriceElement?.textContent?.split('Price: ')[1];
	if (totalPriceElement && totalPriceText) {
		const csfPrice = Number(parsePrice(totalPriceText).price);
		console.log('[BetterFloat] Checkout price:', csfPrice, itemPriceSum);
		const priceDiff = csfPrice - itemPriceSum;

		let backgroundColor: string;
		let differenceSymbol: string;
		if (priceDiff < 0) {
			backgroundColor = extensionSettings['csf-color-profit'];
			differenceSymbol = '-';
		} else if (priceDiff > 0) {
			backgroundColor = extensionSettings['csf-color-loss'];
			differenceSymbol = '+';
		} else {
			backgroundColor = extensionSettings['csf-color-neutral'];
			differenceSymbol = '-';
		}

		const currencyFormat = Intl.NumberFormat('en-US', { style: 'currency', currency: CSFloatHelpers.userCurrency() });
		const element = `<div style="display: flex; justify-content: center; align-items: center;"><h2>Total Buff Value: ${currencyFormat.format(itemPriceSum)}</h2><span style="font-size: 15px;border-radius: 5px;padding: 5px; margin-left: 5px; font-weight: 600; background-color: ${backgroundColor};" data-betterfloat="${priceDiff}">${differenceSymbol}${currencyFormat.format(Math.abs(priceDiff))} (${new Decimal(csfPrice).div(itemPriceSum).mul(100).toDP(2).toNumber()}%)</span></div>`;
		totalPriceElement.insertAdjacentHTML('afterend', element);
		totalPriceElement.style.marginBottom = '0';
	}
}

function adjustCurrencyChangeNotice(container: Element) {
	const warningDiv = document.createElement('div');
	warningDiv.setAttribute('style', 'display: flex; align-items: center; background-color: hsl(0deg 100% 27.25% / 50%); border-radius: 18px;');
	const warningSymbol = document.createElement('img');
	warningSymbol.setAttribute('src', ICON_EXCLAMATION);
	warningSymbol.style.height = '30px';
	warningSymbol.style.margin = '0 10px';
	warningSymbol.style.filter = 'brightness(0) saturate(100%) invert(87%) sepia(66%) saturate(5511%) hue-rotate(102deg) brightness(103%) contrast(104%)';
	const warningText = document.createElement('p');
	warningText.textContent = 'Please note that BetterFloat requires a page refresh after changing the currency.';
	warningDiv.appendChild(warningSymbol);
	warningDiv.appendChild(warningText);

	const refreshContainer = document.createElement('div');
	refreshContainer.setAttribute('style', 'display: flex; align-items: center; justify-content: center;     margin-top: 15px;');
	const refreshButton = document.createElement('button');
	refreshButton.className = 'mat-raised-button mat-warn';
	refreshButton.textContent = 'Refresh';
	refreshButton.onclick = () => {
		location.reload();
	};
	refreshContainer.appendChild(refreshButton);

	container.children[0].appendChild(warningDiv);
	container.children[0].appendChild(refreshContainer);
}

function adjustItemBubble(container: Element) {
	const buffData: { buff_name: string; priceFromReference: number } = JSON.parse(document.querySelector('.betterfloat-buffprice')?.getAttribute('data-betterfloat') ?? '{}');
	const pricing = priceData(container.querySelector('b')!.textContent!);
	const difference = pricing.price - buffData.priceFromReference;
	const isSeller = container.textContent?.includes('Seller') ?? false;

	const buffContainer = document.createElement('div');
	buffContainer.setAttribute('style', `width: 80%; display: inline-flex; align-items: center; justify-content: ${isSeller ? 'flex-start' : 'flex-end'}; translate: 0 3px;`);
	const buffImage = document.createElement('img');
	buffImage.setAttribute('src', ICON_BUFF);
	buffImage.setAttribute('style', 'height: 20px; margin-right: 5px');
	buffContainer.appendChild(buffImage);

	const buffPrice = document.createElement('span');
	buffPrice.setAttribute('style', `color: ${difference < 0 ? 'greenyellow' : 'orange'};`);
	buffPrice.textContent = `${difference > 0 ? '+' : ''}${Intl.NumberFormat('en-US', { style: 'currency', currency: CSFloatHelpers.userCurrency() }).format(difference)}`;
	buffContainer.appendChild(buffPrice);

	const personDiv = container.querySelector('div > span');
	if (isSeller && personDiv) {
		personDiv.before(buffContainer);
	} else {
		container.querySelector('div')?.appendChild(buffContainer);
	}
}

async function adjustSalesTableRow(container: Element) {
	const cachedSale = getFirstHistorySale();
	if (!cachedSale) {
		return;
	}

	// link to item page
	const firstRow = container.firstElementChild;
	const ageSpan = firstRow?.firstElementChild;
	if (firstRow && ageSpan) {
		const aLink = document.createElement('a');
		aLink.href = 'https://csfloat.com/item/' + cachedSale.id;
		aLink.target = '_blank';
		aLink.setAttribute('style', 'display: flex; align-items: center; justify-content: center;');
		const linkIcon = document.createElement('img');
		linkIcon.setAttribute('src', iconArrowup);
		linkIcon.style.marginRight = '5px';
		linkIcon.style.filter = 'brightness(0) saturate(100%) invert(100%) sepia(0%) saturate(7461%) hue-rotate(14deg) brightness(94%) contrast(106%)';
		linkIcon.style.translate = '0 -2px';
		(<HTMLElement>ageSpan).style.color = 'white';
		aLink.appendChild(linkIcon);
		aLink.appendChild(firstRow.firstChild as Node);
		firstRow.appendChild(aLink);
	}

	const appStickerView = container.querySelector('.cdk-column-stickers')?.firstElementChild;
	if (appStickerView && appStickerView.querySelectorAll('.sticker')?.length > 0) {
		const stickerData = cachedSale.item.stickers;
		const priceData = JSON.parse(document.querySelector('.betterfloat-big-price')?.getAttribute('data-betterfloat') ?? '');
		const sellPrice = Number(container.querySelector('.mat-column-price')?.textContent?.replace(/[^0-9.]/g, ''));
		const currencyRate = await getCSFCurrencyRate(CSFloatHelpers.userCurrency());

		if (priceData && stickerData.length > 0) {
			const stickerContainer = document.createElement('div');
			stickerContainer.className = 'betterfloat-table-sp';
			(<HTMLElement>appStickerView).style.display = 'flex';
			(<HTMLElement>appStickerView).style.alignItems = 'center';
			const priceDiffUSD = (sellPrice - Number(priceData.priceFromReference)) / currencyRate;
			const doChange = await changeSpContainer(stickerContainer, stickerData, priceDiffUSD);
			if (doChange) {
				appStickerView.appendChild(stickerContainer);
				(<HTMLElement>appStickerView.parentElement).style.paddingRight = '0';
			}
		}
	}

	const seedContainer = container.querySelector('.cdk-column-seed')?.firstElementChild;
	if (cachedSale.item.fade && seedContainer) {
		const fadeData = cachedSale.item.fade;
		const fadeSpan = document.createElement('span');
		fadeSpan.textContent += ' (' + toTruncatedString(fadeData.percentage, 1) + '%' + (fadeData.rank < 10 ? ` - #${fadeData.rank}` : '') + ')';
		fadeSpan.setAttribute('style', 'background: linear-gradient(to right,#d9bba5,#e5903b,#db5977,#6775e1); -webkit-background-clip: text; -webkit-text-fill-color: transparent;');
		seedContainer.appendChild(fadeSpan);
	}
}

enum POPOUT_ITEM {
	NONE,
	PAGE,
	BARGAIN,
}

async function adjustItem(container: Element, popout = POPOUT_ITEM.NONE) {
	const item = getFloatItem(container);
	// console.log('[BetterFloat] Adjusting item:', item);
	if (Number.isNaN(item.price)) return;
	const priceResult = await addBuffPrice(item, container, popout > 0);
	// Currency up until this moment is stricly the user's local currency, however the sticker %
	// is done stricly in USD, we have to make sure the price difference reflects that
	const currencyRate = await getCSFCurrencyRate(CSFloatHelpers.userCurrency());
	const priceResultUSD = priceResult.price_difference / currencyRate;
	const cachedItem = getFirstCSFItem();
	// POPOUT_ITEM.NONE
	if (cachedItem) {
		if (item.name != cachedItem.item.item_name) {
			console.log('[BetterFloat] Item name mismatch:', item.name, cachedItem.item.item_name);
			return;
		}
		if (extensionSettings['csf-stickerprices'] && item.price > 0) {
			await addStickerInfo(container, cachedItem, priceResultUSD);
		} else {
			adjustExistingSP(container);
		}
		if (extensionSettings['csf-listingage']) {
			addListingAge(container, cachedItem);
		}
		CSFloatHelpers.storeApiItem(container, cachedItem);

		if (extensionSettings['csf-floatcoloring']) {
			await addFloatColoring(container, cachedItem);
		}
		if (extensionSettings['csf-removeclustering']) {
			removeClustering(container);
		}
		await patternDetections(container, cachedItem, false);
	} else if (popout > 0) {
		// need timeout as request is only sent after popout has been loaded
		setTimeout(async () => {
			const itemPreview = document.getElementsByClassName('item-' + location.pathname.split('/').pop())[0];

			let apiItem = CSFloatHelpers.getApiItem(itemPreview);
			// if this is the first launch, the item has to be newly retrieved by the api
			if (!apiItem) {
				apiItem = popout === POPOUT_ITEM.PAGE ? getCSFPopupItem() : JSON.parse(container.getAttribute('data-betterfloat') ?? '{}');
			}

			if (apiItem) {
				await addStickerInfo(container, apiItem, priceResultUSD);
				addListingAge(container, apiItem);
				await patternDetections(container, apiItem, true);
				await addFloatColoring(container, apiItem);
				if (popout === POPOUT_ITEM.PAGE) {
					addQuickLinks(container, apiItem);
					copyNameOnClick(container);
				}
				CSFloatHelpers.storeApiItem(container, apiItem);
			}

			// last as it has to wait for history api data
			if (popout === POPOUT_ITEM.PAGE) {
				addItemHistory(container.parentElement!.parentElement!);
			}
		}, 1500);
	}
}

function copyNameOnClick(container: Element) {
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

type QuickLink = {
	icon: string;
	tooltip: string;
	link: string;
};

function addQuickLinks(container: Element, listing: CSFloat.ListingData) {
	const actionsContainer = document.querySelector('.item-actions');
	if (!actionsContainer) return;

	actionsContainer.setAttribute('style', 'flex-wrap: wrap;');
	const quickLinksContainer = document.createElement('div');
	quickLinksContainer.className = 'betterfloat-quicklinks';
	quickLinksContainer.setAttribute('style', 'flex-basis: 100%; display: flex; justify-content: space-evenly;');
	const quickLinks: QuickLink[] = [
		{
			icon: iconCsgostash,
			tooltip: 'Show CSGOStash Page',
			link: 'https://csgostash.com/markethash/' + listing.item.market_hash_name,
		},
		{
			icon: iconPricempire,
			tooltip: 'Show Pricempire Page',
			link: createPricempireURL(container, listing.item),
		},
	];
	// inventory link if seller stall is public
	if (listing.seller.stall_public) {
		quickLinks.push({
			icon: iconSteam,
			tooltip: "Show in Seller's Inventory",
			link: 'https://steamcommunity.com/profiles/' + listing.seller.steam_id + '/inventory/#730_2_' + listing.item.asset_id,
		});
	}

	for (let i = 0; i < quickLinks.length; i++) {
		const toolTip = document.createElement('div');
		toolTip.className = 'bf-tooltip-inner';
		toolTip.setAttribute('style', 'translate: -60px 10px; width: 140px;');
		const toolTipSpan = document.createElement('span');
		toolTipSpan.textContent = quickLinks[i].tooltip;
		toolTip.appendChild(toolTipSpan);
		const linkContainer = document.createElement('a');
		linkContainer.className = 'mat-icon-button';
		linkContainer.href = quickLinks[i].link;
		linkContainer.target = '_blank';
		const icon = document.createElement('img');
		icon.setAttribute('src', quickLinks[i].icon);
		icon.setAttribute('style', 'height: 24px; border-radius: 5px; vertical-align: middle;');
		linkContainer.appendChild(icon);
		const toolTipOuter = document.createElement('div');
		toolTipOuter.className = 'bf-tooltip';
		toolTipOuter.appendChild(linkContainer);
		toolTipOuter.appendChild(toolTip);
		quickLinksContainer.appendChild(toolTipOuter);
	}

	actionsContainer.appendChild(quickLinksContainer);
}

function createPricempireURL(container: Element, item: CSFloat.Item) {
	const pricempireType = (item: CSFloat.Item) => {
		if (item.type == 'container' && !item.item_name.includes('Case')) {
			return 'sticker-capsule';
		}
		return item.type;
	};
	const sanitizeURL = (url: string) => {
		return url.replace(/\s\|/g, '').replace('(', '').replace(')', '').replace('™', '').replace('★ ', '').replace(/\s+/g, '-');
	};
	return (
		'https://pricempire.com/item/cs2/' +
		pricempireType(item) +
		'/' +
		sanitizeURL(createBuffName(getFloatItem(container)).toLowerCase()) +
		(item.phase ? `-${sanitizeURL(item.phase.toLowerCase())}` : '')
	);
}

function removeClustering(container: Element) {
	const sellerDetails = container.querySelector('div.seller-details-wrapper');
	if (sellerDetails) {
		sellerDetails.setAttribute('style', 'display: none;');
	}
}

async function addFloatColoring(container: Element, listing: CSFloat.ListingData) {
	if (listing.item.type !== 'skin') {
		return;
	}

	if (!ITEM_SCHEMA) {
		ITEM_SCHEMA = JSON.parse(window.sessionStorage.ITEM_SCHEMA);
	}

	const names = listing.item.item_name.split(' | ');
	if (names[0].includes('★')) {
		names[0] = names[0].replace('★ ', '');
	}
	// // TODO: Handle Vanilla
	const schemaItem = Object.values((Object.values((<CSFloat.ItemSchema.TypeSchema>ITEM_SCHEMA).weapons).find((el) => el.name === names[0]))['paints']).find(
		(el: any) => el.name === names[1]
	) as CSFloat.ItemSchema.SingleSchema;

	const element = container.querySelector<HTMLElement>('div.wear');
	if (element && schemaItem) {
		element.style.color = getFloatColoring(listing.item.float_value, schemaItem.min, schemaItem.max);
	}
}

async function patternDetections(container: Element, listing: CSFloat.ListingData, isPopout: boolean) {
	const item = listing.item;
	if (item.item_name.includes('Case Hardened')) {
		if (extensionSettings['csf-csbluegem'] || isPopout) {
			await caseHardenedDetection(container, item, isPopout);
		}
	} else if (item.item_name.includes('Fade')) {
		await addFadePercentages(container, item);
	} else if ((item.item_name.includes('Crimson Web') || item.item_name.includes('Emerald Web')) && item.item_name.startsWith('★')) {
		await webDetection(container, item);
	} else if (item.item_name.includes('Specialist Gloves | Crimson Kimono')) {
		await badgeCKimono(container, item);
	} else if (item.item_name.includes('Phoenix Blacklight')) {
		await badgePhoenix(container, item);
	} else if (item.item_name.includes('Karambit | Gamma Doppler') && item.phase == 'Phase 3') {
		await badgeCyanbit(container, item);
	} else if (item.item_name.includes('Overprint')) {
		await badgeOverprint(container, item);
	}
}

async function badgeOverprint(container: Element, item: CSFloat.Item) {
	const overprint_data = await OverprintMapping.getPattern(item.paint_seed!);
	if (!overprint_data) return;

	const getTooltipStyle = (type: typeof overprint_data.type) => {
		switch (type) {
			case 'Flower':
				return 'translate: -15px 15px; width: 55px;';
			case 'Arrow':
				return 'translate: -25px 15px; width: 100px;';
			case 'Polygon':
				return 'translate: -25px 15px; width: 100px;';
			case 'Mixed':
				return 'translate: -15px 15px; width: 55px;';
			default:
				return '';
		}
	};

	const badgeStyle = 'color: lightgrey; font-size: 18px; font-weight: 500;' + (overprint_data.type == 'Flower' ? ' margin-left: 5px;' : '');

	const iconMapping = {
		Flower: ICON_OVERPRINT_FLOWER,
		Arrow: ICON_OVERPRINT_ARROW,
		Polygon: ICON_OVERPRINT_POLYGON,
		Mixed: ICON_OVERPRINT_MIXED,
	};
	CSFloatHelpers.addPatternBadge(
		container,
		iconMapping[overprint_data.type],
		'height: 30px; filter: brightness(0) saturate(100%) invert(79%) sepia(65%) saturate(2680%) hue-rotate(125deg) brightness(95%) contrast(95%);',
		[`"${overprint_data.type}" Pattern`].concat(overprint_data.tier == 0 ? [] : [`Tier ${overprint_data.tier}`]),
		getTooltipStyle(overprint_data.type),
		overprint_data.tier == 0 ? '' : 'T' + overprint_data.tier,
		badgeStyle
	);
}

async function badgeCKimono(container: Element, item: CSFloat.Item) {
	const ck_data = await CrimsonKimonoMapping.getPattern(item.paint_seed!);
	if (!ck_data) return;

	const badgeStyle = 'color: lightgrey; font-size: 18px; font-weight: 500; position: absolute; top: 6px;';
	if (ck_data.tier === -1) {
		CSFloatHelpers.addPatternBadge(container, ICON_CRIMSON, 'height: 30px; filter: grayscale(100%);', ['T1 GRAY PATTERN'], 'translate: -25px 15px; width: 80px;', '1', badgeStyle);
	} else {
		CSFloatHelpers.addPatternBadge(container, ICON_CRIMSON, 'height: 30px;', [`Tier ${ck_data.tier}`], 'translate: -18px 15px; width: 60px;', String(ck_data.tier), badgeStyle);
	}
}

async function badgeCyanbit(container: Element, item: CSFloat.Item) {
	const cyanbit_data = await CyanbitKarambitMapping.getPattern(item.paint_seed!);
	if (!cyanbit_data) return;

	CSFloatHelpers.addPatternBadge(
		container,
		ICON_GEM_CYAN,
		'height: 30px;',
		[`${cyanbit_data.type == '' ? 'Unclassified' : cyanbit_data.type} Pattern`, cyanbit_data.tier == 0 ? 'No Tier' : `Tier ${cyanbit_data.tier}`],
		'translate: -15px 15px; width: 90px;',
		'T' + cyanbit_data.tier,
		'color: #00ffff; font-size: 18px; font-weight: 600; margin-left: 2px;'
	);
}

async function badgePhoenix(container: Element, item: CSFloat.Item) {
	const phoenix_data = await PhoenixMapping.getPattern(item.paint_seed!);
	if (!phoenix_data) return;

	CSFloatHelpers.addPatternBadge(
		container,
		ICON_PHOENIX,
		'height: 30px;',
		[`Position: ${phoenix_data.type}`, `Tier ${phoenix_data.tier}`].concat(phoenix_data.rank ? [`Rank #${phoenix_data.rank}`] : []),
		'translate: -15px 15px; width: 90px;',
		'T' + phoenix_data.tier,
		'color: #d946ef; font-size: 18px; font-weight: 600;'
	);
}

async function webDetection(container: Element, item: CSFloat.Item) {
	let type = '';
	if (item.item_name.includes('Gloves')) {
		type = 'gloves';
	} else {
		type = item.item_name.split('★ ')[1].split(' ')[0].toLowerCase();
	}
	const cw_data = await getCrimsonWebMapping(type as Extension.CWWeaponTypes, item.paint_seed!);
	if (!cw_data) return;
	const itemImg = container.querySelector('.item-img');
	if (!itemImg) return;

	const filter = item.item_name.includes('Crimson')
		? 'brightness(0) saturate(100%) invert(13%) sepia(87%) saturate(576%) hue-rotate(317deg) brightness(93%) contrast(113%)'
		: 'brightness(0) saturate(100%) invert(64%) sepia(64%) saturate(2232%) hue-rotate(43deg) brightness(84%) contrast(90%)';

	CSFloatHelpers.addPatternBadge(
		container,
		ICON_SPIDER_WEB,
		`height: 30px; filter: ${filter};`,
		[cw_data.type, `Tier ${cw_data.tier}`],
		'translate: -25px 15px; width: 80px;',
		cw_data.type == 'Triple Web' ? '3' : cw_data.type == 'Double Web' ? '2' : '1',
		`color: ${item.item_name.includes('Crimson') ? 'lightgrey' : 'white'}; font-size: 18px; font-weight: 500; position: absolute; top: 7px;`
	);
}

async function addFadePercentages(container: Element, item: CSFloat.Item) {
	const itemName = item.item_name;
	const paintSeed = item.paint_seed;
	const weapon = itemName.split(' | ')[0];
	let fadePercentage: (FadePercentage & { background: string }) | null = null;
	if (itemName.includes('Amber Fade')) {
		fadePercentage = { ...AmberFadeCalculator.getFadePercentage(weapon, paintSeed!), background: 'linear-gradient(to right,#627d66,#896944,#3b2814)' };
	} else if (itemName.includes('Acid Fade')) {
		fadePercentage = { ...AcidFadeCalculator.getFadePercentage(weapon, paintSeed!), background: 'linear-gradient(to right,#6d5f55,#76c788, #574828)' };
	}
	if (fadePercentage != null) {
		const fadeTooltip = document.createElement('div');
		fadeTooltip.className = 'bf-tooltip-inner';
		const fadePercentageSpan = document.createElement('span');
		fadePercentageSpan.textContent = `Fade: ${toTruncatedString(fadePercentage.percentage, 5)}%`;
		const fadeRankingSpan = document.createElement('span');
		fadeRankingSpan.textContent = `Rank #${fadePercentage.ranking}`;
		fadeTooltip.appendChild(fadePercentageSpan);
		fadeTooltip.appendChild(fadeRankingSpan);
		const fadeBadge = document.createElement('div');
		fadeBadge.className = 'bf-tooltip';
		const percentageDiv = document.createElement('div');
		percentageDiv.className = 'bf-badge-text';
		percentageDiv.setAttribute('style', `background-position-x: ${fadePercentage.percentage}%; background-image: ${fadePercentage.background};`);
		const fadeBadgePercentageSpan = document.createElement('span');
		fadeBadgePercentageSpan.style.color = '#00000080';
		fadeBadgePercentageSpan.textContent = toTruncatedString(fadePercentage.percentage, 1);
		percentageDiv.appendChild(fadeBadgePercentageSpan);
		fadeBadge.appendChild(percentageDiv);
		fadeBadge.appendChild(fadeTooltip);
		let badgeContainer = container.querySelector('.badge-container');
		if (!badgeContainer) {
			badgeContainer = document.createElement('div');
			badgeContainer.setAttribute('style', 'position: absolute; top: 5px; left: 5px;');
			container.querySelector('.item-img')?.after(badgeContainer);
		} else {
			badgeContainer = badgeContainer.querySelector('.container') ?? badgeContainer;
			badgeContainer.setAttribute('style', 'gap: 5px;');
		}
		badgeContainer.appendChild(fadeBadge);
	}
}

async function caseHardenedDetection(container: Element, item: CSFloat.Item, isPopout: boolean) {
	if (!item.item_name.includes('Case Hardened')) return;
	let pastSales: BlueGem.PastSale[] = [];
	let patternElement: BlueGem.PatternElement | undefined = undefined;
	const userCurrency = CSFloatHelpers.userCurrency();
	const currencySymbol = getSymbolFromCurrency(userCurrency) ?? '$';
	let type = '';
	if (item.item_name.startsWith('★')) {
		type = item.item_name.split(' | ')[0].split('★ ')[1];
	} else {
		type = item.item_name.split(' | ')[0];
	}
	// retrieve the stored data instead of fetching newly
	if (isPopout) {
		const itemPreview = document.getElementsByClassName('item-' + location.pathname.split('/').pop())[0];
		const csbluegem = itemPreview?.getAttribute('data-csbluegem');
		if (csbluegem) {
			const csbluegemData = JSON.parse(csbluegem);
			pastSales = csbluegemData.pastSales;
			patternElement = csbluegemData.patternElement;
		}
	}
	// if there is no cached data, fetch it and store it
	if (pastSales.length == 0 && !patternElement) {
		await fetchCSBlueGem(type, item.paint_seed!, userCurrency).then((data) => {
			pastSales = data.pastSales ?? [];
			patternElement = data.patternElement;
			container.setAttribute('data-csbluegem', JSON.stringify({ pastSales, patternElement }));
		});
	}

	// add gem icon and blue gem percent if item is a knife
	let tierContainer = container.querySelector('.badge-container');
	if (!tierContainer) {
		tierContainer = document.createElement('div');
		tierContainer.setAttribute('style', 'position: absolute; top: 5px; left: 5px;');
		container.querySelector('.item-img')?.after(tierContainer);
	} else {
		tierContainer = tierContainer.querySelector('.container') ?? tierContainer;
		tierContainer.setAttribute('style', 'gap: 5px;');
	}
	const gemContainer = genGemContainer(patternElement);
	gemContainer.setAttribute('style', 'display: flex; align-items: center; justify-content: flex-end;');
	tierContainer.appendChild(gemContainer);

	// add screenshot if csfloat does not offer one
	const detailButtons = container.querySelector('.detail-buttons');
	if (detailButtons && !detailButtons.querySelector('div.action')) {
		// get closest item float-wise that has a screenshot
		const sortedSales = pastSales.filter((x) => x.url != 'No Link Available').sort((a, b) => Math.abs(a.float - item.float_value!) - Math.abs(b.float - item.float_value!));
		if (sortedSales.length > 0 || patternElement?.screenshot) {
			const closestSale = sortedSales[0];
			detailButtons.setAttribute('style', 'display: flex;');
			const outerContainer = document.createElement('div');
			outerContainer.className = 'bf-tooltip';
			const screenshotButton = document.createElement('a');
			// if closest sale is csfloat but has no screenshot, it will lead to an error page
			if (closestSale?.url) {
				if (isNaN(Number(closestSale.url))) {
					screenshotButton.href = closestSale.url;
				} else {
					screenshotButton.href = 'https://s.csgofloat.com/' + closestSale.url + '-front.png';
				}
			} else {
				screenshotButton.href = patternElement?.screenshot ?? '';
			}
			screenshotButton.target = '_blank';
			screenshotButton.setAttribute('style', 'vertical-align: middle; padding: 0; min-width: 0;');
			const iconButton = document.createElement('mat-icon');
			iconButton.className = 'mat-icon notranslate material-icons mat-ligature-font mat-icon-no-color';
			iconButton.setAttribute('style', 'color: cyan;');
			iconButton.textContent = 'photo_camera';
			screenshotButton.appendChild(iconButton);
			const tooltip = document.createElement('div');
			tooltip.className = 'bf-tooltip-inner';
			const tooltipSpan = document.createElement('span');
			tooltipSpan.textContent = 'Show Buff pattern screenshot';
			tooltip.appendChild(tooltipSpan);
			outerContainer.appendChild(screenshotButton);
			outerContainer.appendChild(tooltip);
			detailButtons.insertBefore(outerContainer, detailButtons.firstChild);
		}
	}

	// offer new table with past sales
	if (isPopout) {
		const gridHistory = document.querySelector('.grid-history');
		if (!gridHistory) return;
		const salesHeader = document.createElement('mat-button-toggle');
		salesHeader.setAttribute('role', 'presentation');
		salesHeader.className = 'mat-button-toggle mat-button-toggle-appearance-standard';
		salesHeader.innerHTML = `<button type="button" class="mat-button-toggle-button mat-focus-indicator" aria-pressed="false"><span class="mat-button-toggle-label-content" style="color: deepskyblue;">Buff Pattern Sales (${pastSales.length})</span></button>`;
		gridHistory.querySelector('mat-button-toggle-group.sort')?.appendChild(salesHeader);
		salesHeader.addEventListener('click', () => {
			Array.from(gridHistory.querySelectorAll('mat-button-toggle') ?? []).forEach((element) => {
				element.className = element.className.replace('mat-button-toggle-checked', '');
			});
			salesHeader.className += ' mat-button-toggle-checked';

			const tableBody = document.createElement('tbody');
			pastSales.forEach((sale) => {
				const newRow = document.createElement('tr');
				newRow.setAttribute('role', 'row');
				newRow.className = 'mat-mdc-row mdc-data-table__row cdk-row';
				// no real equality as broskins data is cut off
				if (Math.abs(item.float_value! - sale.float) < 0.00001) {
					newRow.style.backgroundColor = 'darkslategray';
				}
				const sourceCell = document.createElement('td');
				sourceCell.setAttribute('role', 'cell');
				sourceCell.className = 'mat-mdc-cell mdc-data-table__cell cdk-cell';
				const sourceImage = document.createElement('img');
				sourceImage.setAttribute('src', sale.origin == 'CSFloat' ? ICON_CSFLOAT : ICON_BUFF);
				sourceImage.setAttribute('style', 'height: 28px; border: 1px solid dimgray; border-radius: 4px;');
				sourceCell.appendChild(sourceImage);
				newRow.appendChild(sourceCell);
				const dateCell = document.createElement('td');
				dateCell.setAttribute('role', 'cell');
				dateCell.className = 'mat-mdc-cell mdc-data-table__cell cdk-cell';
				dateCell.textContent = sale.date;
				newRow.appendChild(dateCell);
				const priceCell = document.createElement('td');
				priceCell.setAttribute('role', 'cell');
				priceCell.className = 'mat-mdc-cell mdc-data-table__cell cdk-cell';
				priceCell.textContent = `${currencySymbol}${sale.price}`;
				newRow.appendChild(priceCell);
				const floatCell = document.createElement('td');
				floatCell.setAttribute('role', 'cell');
				floatCell.className = 'mat-mdc-cell mdc-data-table__cell cdk-cell';
				if (sale.isStattrak) {
					const stSpan = document.createElement('span');
					stSpan.textContent = 'StatTrak™ ';
					stSpan.setAttribute('style', 'color: rgb(255, 120, 44); margin-right: 5px;');
					floatCell.appendChild(stSpan);
				}
				const floatSpan = document.createElement('span');
				floatSpan.textContent = sale.float.toString();
				floatCell.appendChild(floatSpan);
				newRow.appendChild(floatCell);
				const linkCell = document.createElement('td');
				linkCell.setAttribute('role', 'cell');
				linkCell.className = 'mat-mdc-tooltip-trigger action';
				const link = document.createElement('a');
				if (sale.url === 'No Link Available') {
					link.setAttribute('style', 'pointer-events: none;cursor: default;');
					const linkImage = document.createElement('img');
					linkImage.setAttribute('src', ICON_BAN);
					linkImage.setAttribute('style', 'height: 24px;');
					link.appendChild(linkImage);
				} else {
					if (isNaN(Number(sale.url))) {
						link.href = sale.url;
						link.title = 'Show Buff screenshot';
					} else {
						link.href = 'https://s.csgofloat.com/' + sale.url + '-front.png';
						link.title = 'Show CSFloat font screenshot';
					}
					link.target = '_blank';
					const linkImage = `<mat-icon role="img" class="mat-icon notranslate material-icons mat-ligature-font mat-icon-no-color">photo_camera</mat-icon>`;
					link.innerHTML = linkImage;
				}
				linkCell.appendChild(link);

				if (!isNaN(Number(sale.url))) {
					const backLink = document.createElement('a');
					backLink.href = 'https://s.csgofloat.com/' + sale.url + '-back.png';
					backLink.target = '_blank';
					backLink.title = 'Show CSFloat back screenshot';
					const backImage = document.createElement('img');
					backImage.setAttribute('src', iconCameraFlipped);
					backImage.setAttribute(
						'style',
						'height: 24px; translate: 7px 0; filter: brightness(0) saturate(100%) invert(39%) sepia(52%) saturate(4169%) hue-rotate(201deg) brightness(113%) contrast(101%);'
					);
					backLink.appendChild(backImage);
					linkCell.appendChild(backLink);
				}

				newRow.appendChild(linkCell);
				tableBody.appendChild(newRow);
			});
			const outerContainer = document.createElement('div');
			outerContainer.setAttribute('style', 'width: 100%; height: 100%; padding: 10px; background-color: rgba(193, 206, 255, .04);border-radius: 6px; box-sizing: border-box;');
			const innerContainer = document.createElement('div');
			innerContainer.className = 'table-container slimmed-table';
			innerContainer.setAttribute('style', 'height: 100%;overflow-y: auto;overflow-x: hidden;overscroll-behavior: none;');
			const table = document.createElement('table');
			table.className = 'mat-mdc-table mdc-data-table__table cdk-table bf-table';
			table.setAttribute('role', 'table');
			table.setAttribute('style', 'width: 100%;');
			const header = document.createElement('thead');
			header.setAttribute('role', 'rowgroup');
			const tableTr = document.createElement('tr');
			tableTr.setAttribute('role', 'row');
			tableTr.className = 'mat-mdc-header-row mdc-data-table__header-row cdk-header-row ng-star-inserted';
			const headerValues = ['Source', 'Date', 'Price', 'Float Value'];
			for (let i = 0; i < headerValues.length; i++) {
				const headerCell = document.createElement('th');
				headerCell.setAttribute('role', 'columnheader');
				const headerCellStyle = `text-align: center; color: #9EA7B1; letter-spacing: .03em; background: rgba(193, 206, 255, .04); ${i === 0 ? 'border-top-left-radius: 10px; border-bottom-left-radius: 10px' : ''}`;
				headerCell.setAttribute('style', headerCellStyle);
				headerCell.className = 'mat-mdc-header-cell mdc-data-table__header-cell ng-star-inserted';
				headerCell.textContent = headerValues[i];
				tableTr.appendChild(headerCell);
			}
			const linkHeaderCell = document.createElement('th');
			linkHeaderCell.setAttribute('role', 'columnheader');
			linkHeaderCell.setAttribute(
				'style',
				'text-align: center; color: #9EA7B1; letter-spacing: .03em; background: rgba(193, 206, 255, .04); border-top-right-radius: 10px; border-bottom-right-radius: 10px'
			);
			linkHeaderCell.className = 'mat-mdc-header-cell mdc-data-table__header-cell ng-star-inserted';
			const linkHeader = document.createElement('a');
			linkHeader.setAttribute('href', `https://csbluegem.com/search?skin=${type}&pattern=${item.paint_seed}&currency=USD&filter=date&sort=descending`);
			linkHeader.setAttribute('target', '_blank');
			linkHeader.innerHTML = ICON_ARROWUP;
			linkHeaderCell.appendChild(linkHeader);
			tableTr.appendChild(linkHeaderCell);
			header.appendChild(tableTr);
			table.appendChild(header);
			table.appendChild(tableBody);
			innerContainer.appendChild(table);
			outerContainer.appendChild(innerContainer);

			const historyChild = gridHistory.querySelector('.history-component')?.firstElementChild;
			if (historyChild?.firstElementChild) {
				historyChild.removeChild(historyChild.firstElementChild);
				historyChild.appendChild(outerContainer);
			}
		});
	}
}

function adjustExistingSP(container: Element) {
	const spContainer = container.querySelector('.sticker-percentage');
	let spValue = spContainer?.textContent!.trim().split('%')[0];
	if (!spValue || !spContainer) return;
	if (spValue.startsWith('>')) {
		spValue = spValue.substring(1);
	}
	const backgroundImageColor = getSPBackgroundColor(Number(spValue) / 100);
	(<HTMLElement>spContainer).style.backgroundColor = backgroundImageColor;
}

function addItemHistory(container: Element) {
	const itemHistory = calculateHistoryValues(getWholeHistory());
	const headerContainer = <HTMLElement>container.querySelector('#header');
	if (!headerContainer || !itemHistory) {
		console.log('[BetterFloat] Could not add item history: ', itemHistory);
		return;
	}

	headerContainer.style.display = 'flex';
	headerContainer.style.justifyContent = 'space-between';
	const replacementContainer = document.createElement('div');
	while (headerContainer.firstChild) {
		replacementContainer.appendChild(headerContainer.firstChild);
	}
	headerContainer.appendChild(replacementContainer);

	const historyContainer = document.createElement('div');
	historyContainer.classList.add('betterfloat-history-container');
	historyContainer.style.display = 'flex';
	historyContainer.style.justifyContent = 'flex-end';
	historyContainer.style.color = '#a9a9a9';
	historyContainer.style.marginTop = '2px';

	const highestContainer = document.createElement('span');
	highestContainer.classList.add('betterfloat-history-highest');
	highestContainer.textContent = 'High: ' + USDollar.format(itemHistory.highest.avg_price);

	const lowestContainer = document.createElement('span');
	lowestContainer.classList.add('betterfloat-history-lowest');
	lowestContainer.textContent = 'Low: ' + USDollar.format(itemHistory.lowest.avg_price);

	const divider = document.createElement('span');
	divider.textContent = ' | ';
	divider.style.margin = '0 5px';

	historyContainer.appendChild(lowestContainer);
	historyContainer.appendChild(divider);
	historyContainer.appendChild(highestContainer);
	headerContainer.appendChild(historyContainer);
}

function calculateHistoryValues(itemHistory: CSFloat.HistoryGraphData[]) {
	if (itemHistory.length === 0) {
		return null;
	}
	const highestElement = itemHistory.reduce((prev, current) => (prev.avg_price > current.avg_price ? prev : current));
	const lowestElement = itemHistory.reduce((prev, current) => (prev.avg_price < current.avg_price ? prev : current));

	return {
		total: itemHistory,
		highest: highestElement,
		lowest: lowestElement,
	};
}

function addListingAge(container: Element, cachedItem: CSFloat.ListingData) {
	if (container.querySelector('.betterfloat-listing-age')) {
		return;
	}

	const listingAge = document.createElement('div');
	const listingAgeText = document.createElement('p');
	const listingIcon = document.createElement('img');
	listingAge.classList.add('betterfloat-listing-age');
	listingAge.style.display = 'flex';
	listingAge.style.alignItems = 'center';
	listingAgeText.style.display = 'inline';
	listingAgeText.style.margin = '0 5px 0 0';
	listingAgeText.style.fontSize = '15px';
	listingAgeText.style.color = '#9EA7B1';
	listingIcon.setAttribute('src', ICON_CLOCK);
	listingIcon.style.height = '20px';
	listingIcon.style.filter = 'brightness(0) saturate(100%) invert(59%) sepia(55%) saturate(3028%) hue-rotate(340deg) brightness(101%) contrast(101%)';

	listingAgeText.textContent = calculateTime(cachedItem.created_at);
	listingAge.appendChild(listingAgeText);
	listingAge.appendChild(listingIcon);

	const parent = container.querySelector<HTMLElement>('.top-right-container');
	if (parent) {
		parent.style.flexDirection = 'column';
		parent.insertAdjacentElement('afterbegin', listingAge);
		const action = parent.querySelector('.action');
		if (action) {
			const newParent = document.createElement('div');
			newParent.style.display = 'inline-flex';
			newParent.style.justifyContent = 'flex-end';
			newParent.appendChild(action);
			parent.appendChild(newParent);
		}
	}
}

async function addStickerInfo(container: Element, cachedItem: CSFloat.ListingData, price_difference: number) {
	// quality 12 is souvenir
	if (!cachedItem.item.stickers || cachedItem.item.quality === 12) {
		return;
	}

	const csfSP = container.querySelector('.sticker-percentage');
	if (csfSP) {
		const didChange = await changeSpContainer(csfSP, cachedItem.item.stickers, price_difference);
		if (!didChange) {
			csfSP.remove();
		}
	}
}

// returns if the SP container was created, so priceSum > 1
async function changeSpContainer(csfSP: Element, stickers: CSFloat.StickerData[], price_difference: number) {
	const stickerPrices = await Promise.all(stickers.map(async (s) => await getItemPrice(s.name)));
	const priceSum = stickerPrices.reduce((a, b) => a + b.starting_at, 0);

	const spPercentage = price_difference / priceSum;
	// don't display SP if total price is below $1
	csfSP.setAttribute('data-betterfloat', JSON.stringify({ priceSum, spPercentage }));
	if (priceSum >= 2) {
		const backgroundImageColor = getSPBackgroundColor(spPercentage);
		if (spPercentage > 2 || spPercentage < 0.005) {
			csfSP.textContent = `${USDollar.format(Number(priceSum.toFixed(0)))} SP`;
		} else {
			csfSP.textContent = (spPercentage > 0 ? spPercentage * 100 : 0).toFixed(1) + '% SP';
		}
		(<HTMLElement>csfSP).style.backgroundColor = backgroundImageColor;
		(<HTMLElement>csfSP).style.marginBottom = '5px';
		return true;
	} else {
		return false;
	}
}

function priceData(text: string) {
	const priceText = text.trim();
	let price: string;
	let currency = '$';
	if (priceText.includes('Bids')) {
		price = '0';
	} else {
		if (priceText.split(/\s/).length > 1) {
			const parts = priceText.replace(',', '').replace('.', '').split(/\s/);
			price = String(Number(parts.filter((x) => !isNaN(+x)).join('')) / 100);
			currency = parts.filter((x) => isNaN(+x))[0];
		} else {
			const firstDigit = Array.from(priceText).findIndex((x) => !isNaN(Number(x)));
			currency = priceText.substring(0, firstDigit);
			price = String(Number(priceText.substring(firstDigit).replace(',', '').replace('.', '')) / 100);
		}
	}
	return {
		price: Number(price),
		currency: currency,
	};
}

const parsePrice = (textContent: string | undefined) => {
	const regex = /([A-Za-z]+)\s+(\d+)/;
	const priceText = textContent.trim().replace(regex, '$1$2').split(/\s/);
	let price: number;
	let currency = '$';
	if (priceText.includes('Bids')) {
		price = 0;
	} else {
		let pricingText: string;
		if (location.pathname === '/sell') {
			pricingText = priceText[1].split('Price')[1];
		} else {
			pricingText = priceText[0];
		}
		if (pricingText.split(/\s/).length > 1) {
			const parts = pricingText.replace(',', '').replace('.', '').split(/\s/);
			price = Number(parts.filter((x) => !isNaN(+x)).join('')) / 100;
			currency = parts.filter((x) => isNaN(+x))[0];
		} else {
			const firstDigit = Array.from(pricingText).findIndex((x) => !isNaN(Number(x)));
			currency = pricingText.substring(0, firstDigit);
			price = Number(pricingText.substring(firstDigit).replace(',', '').replace('.', '')) / 100;
		}
	}
	return { price, currency };
};

function getFloatItem(container: Element): CSFloat.FloatItem {
	const nameContainer = container.querySelector('app-item-name');
	const floatContainer = container.querySelector('item-float-bar');
	const priceContainer = container.querySelector('.price');
	const header_details = <Element>nameContainer?.querySelector('.subtext');

	const name = nameContainer?.querySelector('.item-name')?.textContent?.replace('\n', '').trim();
	// replace potential spaces between currency characters and price
	const { price, currency } = parsePrice(priceContainer?.textContent ?? '');
	let condition: ItemCondition = '';
	let quality = '';
	let style: ItemStyle = '';

	if (header_details) {
		header_details.childNodes.forEach((node) => {
			switch (node.nodeType) {
				case Node.ELEMENT_NODE:
					const text = node.textContent?.trim();
					if (text && (text.includes('StatTrak') || text.includes('Souvenir') || text.includes('Container') || text.includes('Sticker') || text.includes('Agent'))) {
						// TODO: integrate the ItemQuality type
						// https://stackoverflow.com/questions/51528780/typescript-check-typeof-against-custom-type
						quality = text;
					} else {
						style = text?.substring(1, text.length - 1) as ItemStyle;
					}
					break;
				case Node.TEXT_NODE:
					condition = (node.textContent?.trim() ?? '') as ItemCondition;
					break;
				default:
					break;
			}
		});
	}

	if (!name?.includes('|')) {
		style = 'Vanilla';
	}
	return {
		name: name ?? '',
		quality: quality,
		style: style,
		condition: condition,
		float: Number(floatContainer?.querySelector('.ng-star-inserted')?.textContent ?? 0),
		price: price,
		bargain: false,
		currency: currency,
	};
}

async function getBuffItem(item: CSFloat.FloatItem) {
	const buff_name = handleSpecialStickerNames(createBuffName(item));
	const buff_id = await getBuffMapping(buff_name);

	const { priceListing, priceOrder } = await getBuffPrice(buff_name, item.style);

	const userCurrency = CSFloatHelpers.userCurrency();
	let currencyRate = await getCSFCurrencyRate(userCurrency);
	if (!currencyRate) {
		console.warn(`[BetterFloat] Could not get currency rate for ${userCurrency}`);
		currencyRate = 1;
	}

	const priceFromReference = extensionSettings['csf-pricereference'] == 1 ? priceListing : priceOrder;
	return {
		buff_name: buff_name,
		buff_id: buff_id,
		priceListing: priceListing * currencyRate,
		priceOrder: priceOrder * currencyRate,
		priceFromReference: priceFromReference * currencyRate,
		difference: item.price - priceFromReference * currencyRate,
	};
}

async function addBuffPrice(
	item: CSFloat.FloatItem,
	container: Element,
	isPopout = false
): Promise<{
	price_difference: number;
}> {
	const { buff_name, buff_id, priceListing, priceOrder, priceFromReference, difference } = await getBuffItem(item);

	let priceContainer = container.querySelector<HTMLElement>('.price-row');
	const showBoth = extensionSettings['csf-floatappraiser'] || isPopout;
	const userCurrency = CSFloatHelpers.userCurrency();
	const CurrencyFormatter = new Intl.NumberFormat('en-US', { style: 'currency', currency: userCurrency, minimumFractionDigits: 0, maximumFractionDigits: 2 });

	if (priceContainer && !priceContainer.querySelector('.betterfloat-buffprice')) {
		const buffContainer = document.createElement('a');
		buffContainer.setAttribute('class', 'betterfloat-buff-a');
		const buff_url = buff_id > 0 ? `https://buff.163.com/goods/${buff_id}` : `https://buff.163.com/market/csgo#tab=selling&page_num=1&search=${encodeURIComponent(buff_name)}`;
		buffContainer.setAttribute('href', buff_url);
		buffContainer.setAttribute('target', '_blank');
		buffContainer.setAttribute('style', 'display: inline-flex; align-items: center; font-size: 15px;');

		const buffImage = document.createElement('img');
		buffImage.setAttribute('src', ICON_BUFF);
		buffImage.setAttribute('style', 'height: 20px; margin-right: 5px; border: 1px solid dimgray; border-radius: 4px;');
		buffContainer.appendChild(buffImage);
		const buffPrice = document.createElement('div');
		buffPrice.setAttribute('class', `betterfloat-buffprice ${isPopout ? 'betterfloat-big-price' : ''}`);
		buffPrice.setAttribute('data-betterfloat', JSON.stringify({ buff_name, priceFromReference, userCurrency }));
		const tooltipSpan = document.createElement('span');
		tooltipSpan.setAttribute('class', 'betterfloat-buff-tooltip');
		tooltipSpan.innerHTML = 'Bid: Highest buy order price; <br /> Ask: Lowest listing price';
		buffPrice.appendChild(tooltipSpan);
		const buffPriceBid = document.createElement('span');
		buffPriceBid.setAttribute('style', 'color: orange;');
		buffPriceBid.textContent = `${priceOrder < 1000 ? 'Bid ' : ''}${CurrencyFormatter.format(priceOrder)}`;
		buffPrice.appendChild(buffPriceBid);
		const buffPriceDivider = document.createElement('span');
		buffPriceDivider.setAttribute('style', 'color: gray;margin: 0 3px 0 3px;');
		buffPriceDivider.textContent = '|';
		buffPrice.appendChild(buffPriceDivider);
		const buffPriceAsk = document.createElement('span');
		buffPriceAsk.setAttribute('style', 'color: greenyellow;');
		buffPriceAsk.textContent = `${priceOrder < 1000 ? 'Ask ' : ''}${CurrencyFormatter.format(priceListing)}`;
		buffPrice.appendChild(buffPriceAsk);
		buffContainer.appendChild(buffPrice);
		if (priceOrder > priceListing * 1.1) {
			const warningImage = document.createElement('img');
			warningImage.setAttribute('src', ICON_EXCLAMATION);
			warningImage.setAttribute(
				'style',
				'height: 20px; margin-left: 5px; filter: brightness(0) saturate(100%) invert(28%) sepia(95%) saturate(4997%) hue-rotate(3deg) brightness(103%) contrast(104%);'
			);
			buffContainer.appendChild(warningImage);
		}

		if (!container.querySelector('.betterfloat-buffprice')) {
			// if (showBoth) {
			// 	priceContainer.setAttribute('href', 'https://steamcommunity.com/market/listings/730/' + encodeURIComponent(buff_name));
			// 	const divider = document.createElement('div');
			// 	priceContainer.after(buffContainer);
			// 	priceContainer.after(divider);
			// } else {
			// 	priceContainer.replaceWith(buffContainer);
			// }
			priceContainer.after(buffContainer);
		}
	} else if (container.querySelector('.betterfloat-buff-a')) {
		const buffA = container.querySelector('.betterfloat-buff-a')!;
		const buff_url = buff_id > 0 ? `https://buff.163.com/goods/${buff_id}` : `https://buff.163.com/market/csgo#tab=selling&page_num=1&search=${encodeURIComponent(buff_name)}`;
		buffA.setAttribute('href', buff_url);
		const buffPriceDiv = buffA.querySelector('.betterfloat-buffprice')!;
		buffPriceDiv.setAttribute(
			'data-betterfloat',
			JSON.stringify({
				buff_name: buff_name,
				priceFromReference: priceFromReference,
			})
		);
		buffPriceDiv.children[1].textContent = `Bid ${USDollar.format(priceOrder)}`;
		buffPriceDiv.children[3].textContent = `Ask ${USDollar.format(priceListing)}`;
	}

	// edge case handling: reference price may be a valid 0 for some paper stickers etc.
	if (extensionSettings['csf-buffdifference'] && !container.querySelector('.betterfloat-sale-tag') && item.price != 0 && (priceFromReference > 0 || item.price < 0.06) && location.pathname !== '/sell') {
		const priceContainer = <HTMLElement>container.querySelector('.price-row');
		const priceIcon = priceContainer.querySelector('app-price-icon');
		const floatAppraiser = priceContainer.querySelector('.reference-widget-container');

		if (priceIcon) {
			priceContainer.removeChild(priceIcon);
		}
		if (floatAppraiser && !isPopout) {
			priceContainer.removeChild(floatAppraiser);
		}

		let backgroundColor: string;
		let differenceSymbol: string;
		if (difference < 0) {
			backgroundColor = extensionSettings['csf-color-profit'];
			differenceSymbol = '-';
		} else if (difference > 0) {
			backgroundColor = extensionSettings['csf-color-loss'];
			differenceSymbol = '+';
		} else {
			backgroundColor = extensionSettings['csf-color-neutral'];
			differenceSymbol = '-';
		}

		const saleTag = document.createElement('span');
		saleTag.setAttribute('class', 'betterfloat-sale-tag');
		saleTag.style.backgroundColor = backgroundColor;
		saleTag.setAttribute('data-betterfloat', String(difference));
		// tags may get too long, so we may need to break them into two lines
		const saleDiff = `<span>${differenceSymbol}${USDollar.format(Math.abs(difference))}</span>`;
		let saleTagInner = saleDiff;
		if (extensionSettings['csf-buffdifferencepercent']) {
			if (item.price > 999 && !isPopout) {
				saleTag.style.flexDirection = 'column';
			}
			const percentage = new Decimal(item.price).div(priceFromReference).times(100);
			const decimalPlaces = percentage.greaterThan(200) ? 0 : percentage.greaterThan(150) ? 1 : 2;
			saleTagInner += `<span style="${isPopout || item.price <= 999 ? 'margin-left: 5px;' : ''}">(${percentage.toDP(decimalPlaces).toNumber()}%)</span>`;
		}
		saleTag.innerHTML = saleTagInner;

		if (isPopout) {
			priceContainer.insertBefore(saleTag, floatAppraiser);
		} else {
			priceContainer.appendChild(saleTag);
		}
	}

	// add event listener to bargain button if it exists
	const bargainButton = container.querySelector<HTMLButtonElement>('button.mat-stroked-button');
	if (bargainButton && !bargainButton.disabled) {
		bargainButton.addEventListener('click', () => {
			setTimeout(() => {
				const listing = container.getAttribute('data-betterfloat');
				const bargainPopup = document.querySelector('app-make-offer-dialog');
				if (bargainPopup && listing) {
					bargainPopup.querySelector('item-card')?.setAttribute('data-betterfloat', listing);
				}
			}, 100);
		});
	}

	return {
		price_difference: difference,
	};
}

function createBuffName(item: CSFloat.FloatItem): string {
	let full_name = `${item.name}`;
	if (item.quality.includes('Sticker')) {
		full_name = 'Sticker | ' + full_name;
	} else if (!item.quality.includes('Container') && !item.quality.includes('Agent')) {
		if (item.quality.includes('StatTrak') || item.quality.includes('Souvenir')) {
			full_name = full_name.includes('★') ? `★ StatTrak™ ${full_name.split('★ ')[1]}` : `${item.quality} ${full_name}`;
		}
		if (item.style != 'Vanilla') {
			full_name += ` (${item.condition})`;
		}
	}
	return full_name
		.replace(/ +(?= )/g, '')
		.replace(/\//g, '-')
		.trim();
}

function getTabNumber() {
	return Number(document.querySelector('.mat-tab-label-active')?.getAttribute('aria-posinset') ?? 0);
}

const supportedSubPages = ['/item/', '/stall', '/profile/watchlist', '/search', '/profile/offers', '/sell', '/ref/', '/checkout'];
const unsupportedSubPages = ['blog.csfloat', '/db'];

let extensionSettings: IStorage;
let ITEM_SCHEMA: CSFloat.ItemSchema.TypeSchema | null = null;
const refreshThreads: [ReturnType<typeof setTimeout> | null] = [null];
// time of last refresh in auto-refresh functionality
let lastRefresh = 0;
// mutation observer active?
let isObserverActive = false;
