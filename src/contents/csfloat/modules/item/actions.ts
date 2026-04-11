import { html } from 'common-tags';

import type { CSFloat } from '~lib/@typings/FloatTypes';
import { ICON_CSGOSKINS, ICON_PRICEMPIRE, ICON_PRICEMPIRE_APP, ICON_STEAM, ICON_STEAMANALYST } from '~lib/util/globals';
import { getCollectionLink, isUserPro, waitForElement } from '~lib/util/helperfunctions';

import { getCSFloatSettings } from '../runtime';
import { createBuffName, getFloatItem } from './pricing';
import { getSkinSchema, getWeaponSchemaIndex, initItemSchema } from './schema';

type QuickLink = {
	icon: string;
	tooltip: string;
	link: string;
};

export function addScreenshotListener(container: Element, item: CSFloat.Item) {
	const screenshotButton = container.querySelector('.detail-buttons mat-icon.mat-ligature-font');
	if (!screenshotButton?.textContent?.includes('photo_camera') || !item.cs2_screenshot_at) {
		return;
	}

	screenshotButton.parentElement?.addEventListener('click', () => {
		waitForElement('app-screenshot-dialog').then((screenshotDialog) => {
			if (!screenshotDialog || !item.cs2_screenshot_at) return;
			const screenshotContainer = document.querySelector('app-screenshot-dialog');
			if (!screenshotContainer) return;

			const date = new Date(item.cs2_screenshot_at).toLocaleDateString('en-US');
			const inspectedAt = html`
				<div
					class="betterfloat-screenshot-date"
					style="position: absolute;left: 0;bottom: 25px;background-color: var(--dialog-background);-webkit-backdrop-filter: blur(var(--highlight-blur));backdrop-filter: blur(var(--highlight-blur));padding: 5px 10px;font-size: 14px;border-top-right-radius: 6px;color: var(--subtext-color);z-index: 2;"
				>
					<span>Inspected at ${date}</span>
				</div>
			`;

			screenshotContainer.querySelector('.mat-mdc-tab-body-wrapper')?.insertAdjacentHTML('beforeend', inspectedAt);
		});
	});
}

export function adjustActionButtons(container: Element, item: CSFloat.Item) {
	const extensionSettings = getCSFloatSettings();
	if (!isUserPro(extensionSettings['user'])) return;

	const actionSettings = extensionSettings['csf-actions'];
	const actionContainer = container.querySelector('.detail-buttons');
	if (!actionContainer || !actionSettings) return;

	const inspectLink = actionContainer.querySelector<HTMLAnchorElement>('a.inspect-link');
	if (inspectLink && !actionSettings['inspect-in-game']) {
		inspectLink.style.display = 'none';
	}

	const screenshotDiv = actionContainer.querySelector<HTMLDivElement>('mat-icon[data-mat-icon-type="font"]')?.parentElement;
	if (screenshotDiv && !actionSettings['in-game-screenshot']) {
		screenshotDiv.style.display = 'none';
	}

	const testServerDiv = actionContainer.querySelector<HTMLDivElement>('mat-icon[data-mat-icon-name="gs-inspect"]')?.parentElement;
	if (testServerDiv && !actionSettings['test-in-server']) {
		testServerDiv.style.display = 'none';
	}

	const descriptionDiv = actionContainer.querySelector<HTMLDivElement>('div.description-button');
	if (descriptionDiv && !actionSettings['description']) {
		descriptionDiv.style.display = 'none';
	}

	if (actionSettings['gen-code'] && item.type === 'skin') {
		initItemSchema();
		const weaponSchemaIndex = getWeaponSchemaIndex(item);
		const skinSchema = getSkinSchema(item);

		const genCodeIcon = html`
			<svg xmlns="http://www.w3.org/2000/svg" height="20px" viewBox="0 0 24 24" width="20px" fill="#9EA7B1">
				<path d="M0 0h24v24H0z" fill="none"/>
				<path d="M16 1H4c-1.1 0-2 .9-2 2v14h2V3h12V1zm3 4H8c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h11c1.1 0 2-.9 2-2V7c0-1.1-.9-2-2-2zm0 16H8V7h11v14z"/>
			</svg>
		`;
		if (weaponSchemaIndex && skinSchema) {
			const genCodeButton = document.createElement('div');
			genCodeButton.className = 'betterfloat-gen-code-button';
			genCodeButton.innerHTML = genCodeIcon;
			genCodeButton.addEventListener('click', (event) => {
				event.preventDefault();
				event.stopPropagation();

				const genCode = `!gen ${weaponSchemaIndex} ${skinSchema.index} ${item.paint_seed} ${item.float_value}`;
				navigator.clipboard.writeText(genCode);

				genCodeButton.innerHTML = html`
					<svg xmlns="http://www.w3.org/2000/svg" width="1.2em" height="1.2em" viewBox="0 0 24 24">
						<path fill="green" d="M9 16.17L4.83 12l-1.42 1.41L9 19L21 7l-1.41-1.41L9 16.17z"></path>
					</svg>
				`;

				setTimeout(() => {
					genCodeButton.innerHTML = genCodeIcon;
				}, 1500);
			});
			actionContainer.firstElementChild?.before(genCodeButton);
		}
	}
}

export function addCollectionLink(container: Element) {
	const collectionLink = container.querySelector('div.collection');
	if (collectionLink?.textContent) {
		const link = html`
			<a href="${getCollectionLink(collectionLink.textContent)}" target="_blank">
				${collectionLink.textContent}
			</a>
		`;
		collectionLink.innerHTML = link;
	}
}

export function getAlternativeItemLink(item: CSFloat.Item) {
	const replaceMap = {
		'★ ': '',
		' | ': '-',
		' ': '-',
		':': '',
		'(': '',
		')': '',
		$: '',
	};
	let link = item.item_name.toLowerCase();
	for (const [key, value] of Object.entries(replaceMap)) {
		link = link.replaceAll(key, value);
	}
	if (item.wear_name) {
		link += `/${item.is_stattrak ? 'stattrak-' : ''}${item.wear_name.toLowerCase().replaceAll(' ', '-')}`;
	}
	if (item.sticker_index) {
		link = `sticker-${link}`;
	} else if (item.keychain_index) {
		link = `charm-${link}`;
	}
	return link;
}

export function createPricempireItemLink(container: Element, item: CSFloat.Item) {
	const itemType = (currentItem: CSFloat.Item) => {
		if (currentItem.type === 'container' && !currentItem.item_name.includes('Case')) {
			return 'sticker-capsule';
		}
		return currentItem.type;
	};
	const sanitizeURL = (url: string) => {
		return url.replace(/\s\|/g, '').replace('(', '').replace(')', '').replace('™', '').replace('★ ', '').replace(/\s+/g, '-');
	};

	return `${itemType(item)}/${sanitizeURL(createBuffName(getFloatItem(container)).toLowerCase())}${item.phase ? `-${sanitizeURL(item.phase.toLowerCase())}` : ''}`;
}

export function addQuickLinks(container: Element, listing: CSFloat.ListingData) {
	const actionsContainer = document.querySelector('.item-actions');
	if (!actionsContainer) return;

	actionsContainer.setAttribute('style', 'flex-wrap: wrap;');
	const altURL = getAlternativeItemLink(listing.item);
	const pricempireURL = createPricempireItemLink(container, listing.item);
	let buff_name = listing.item.market_hash_name;
	if (listing.item.phase) {
		buff_name += ` - ${listing.item.phase}`;
	}
	const quickLinks: QuickLink[] = [
		{
			icon: ICON_CSGOSKINS,
			tooltip: 'Show CSGOSkins.gg Page',
			link: `https://csgoskins.gg/items/${altURL}?utm_source=betterfloat`,
		},
		{
			icon: ICON_STEAMANALYST,
			tooltip: 'Show SteamAnalyst Page',
			link: `https://csgo.steamanalyst.com/skin/${altURL.replace('/', '-')}?utm_source=betterfloat`,
		},
		{
			icon: ICON_PRICEMPIRE_APP,
			tooltip: 'Show Pricempire App Page',
			link: `https://app.pricempire.com/item/cs2/${pricempireURL}?utm_source=betterfloat`,
		},
		{
			icon: ICON_PRICEMPIRE,
			tooltip: 'Show Pricempire Page',
			link: `https://pricempire.com/item/${buff_name}`,
		},
	];
	if (listing.seller?.stall_public) {
		quickLinks.push({
			icon: ICON_STEAM,
			tooltip: "Show in Seller's Inventory",
			link: 'https://steamcommunity.com/profiles/' + listing.seller.steam_id + '/inventory/#730_2_' + listing.item.asset_id,
		});
	}

	const quickLinksContainer = html`
		<div class="betterfloat-quicklinks" style="flex-basis: 100%; display: flex; justify-content: space-evenly;">
			${quickLinks
				.map(
					(link) => html`
						<div class="bf-tooltip">
							<a class="mat-icon-button" href="${link.link}" target="_blank">
								<img src="${link.icon}" style="height: 24px; border-radius: 5px; vertical-align: middle;" />
							</a>
							<div class="bf-tooltip-inner" style="translate: -60px 10px; width: 140px;">
								<span>${link.tooltip}</span>
							</div>
						</div>
					`
				)
				.join('')}
		</div>
	`;

	if (!actionsContainer.querySelector('.betterfloat-quicklinks')) {
		actionsContainer.insertAdjacentHTML('beforeend', quickLinksContainer);
	}
}
