import { html } from 'common-tags';
import { CrimsonKimonoMapping, OverprintMapping, PhoenixMapping } from 'cs-tierlist';
import Decimal from 'decimal.js';

import type { Extension } from '~lib/@typings/ExtensionTypes';
import type { CSFloat } from '~lib/@typings/FloatTypes';
import { getCrimsonWebMapping } from '~lib/handlers/mappinghandler';
import {
	ICON_ARROWUP_SMALL,
	ICON_BIG_SWELL_1,
	ICON_BIG_SWELL_2,
	ICON_BUFF,
	ICON_CAMERA_FLIPPED,
	ICON_CLOUD_CHASERS_1,
	ICON_CLOUD_CHASERS_2,
	ICON_CRIMSON,
	ICON_CSFLOAT,
	ICON_DIAMOND_GEM_1,
	ICON_DIAMOND_GEM_2,
	ICON_DIAMOND_GEM_3,
	ICON_EMERALD_1,
	ICON_EMERALD_2,
	ICON_EMERALD_3,
	ICON_NOCTS_1,
	ICON_NOCTS_2,
	ICON_NOCTS_3,
	ICON_OVERPRINT_ARROW,
	ICON_OVERPRINT_FLOWER,
	ICON_OVERPRINT_MIXED,
	ICON_OVERPRINT_POLYGON,
	ICON_PHOENIX,
	ICON_PINK_GALAXY_1,
	ICON_PINK_GALAXY_2,
	ICON_PINK_GALAXY_3,
	ICON_RUBY_1,
	ICON_RUBY_2,
	ICON_RUBY_3,
	ICON_SAPPHIRE_1,
	ICON_SAPPHIRE_2,
	ICON_SAPPHIRE_3,
	ICON_SPIDER_WEB,
} from '~lib/util/globals';
import { getBlueGemName, getCharmColoring } from '~lib/util/helperfunctions';
import { generateAphroditeIcon, generateMixPatternIcon, svgtoBase64Encode } from '~lib/util/icon_generation';
import { fetchBlueGemPastSales } from '~lib/util/messaging';
import {
	AphroditeMapping,
	BigSwellMapping,
	ButterflyGemMapping,
	CloudChasersMapping,
	DiamonGemMapping,
	KarambitGemMapping,
	NoctsMapping,
	PillowPunchersMapping,
	PinkGalaxyMapping,
	UltraViolentMapping,
} from '~lib/util/patterns';

import { getCSFloatSettings } from '../runtime';
import { addPatternBadge, addSvgPatternBadge } from './patternBadges';
import { getCurrencyRate } from './pricing';

export async function patternDetections(container: Element, listing: CSFloat.ListingData, isPopout: boolean) {
	const extensionSettings = getCSFloatSettings();
	const item = listing.item;
	if (item.item_name.includes('Case Hardened') || item.item_name.includes('Heat Treated')) {
		if (extensionSettings['csf-csbluegem'] && isPopout) {
			await addCaseHardenedSales(item);
		}
	} else if (item.item_name.includes('Fade')) {
		return;
	} else if ((item.item_name.includes('Crimson Web') || item.item_name.includes('Emerald Web')) && item.item_name.startsWith('★')) {
		await webDetection(container, item);
	} else if (item.item_name.includes('Specialist Gloves | Crimson Kimono')) {
		await badgeCKimono(container, item);
	} else if (item.item_name.includes('Phoenix Blacklight')) {
		await badgePhoenix(container, item);
	} else if (item.item_name.includes('Overprint')) {
		await badgeOverprint(container, item);
	} else if (item.phase) {
		if (item.phase === 'Ruby' || item.phase === 'Sapphire' || item.phase === 'Emerald') {
			await badgeChromaGems(container, item);
		} else if (item.def_index in PinkGalaxyMapping && [419, 618].includes(item.paint_index!)) {
			await badgePinkGalaxy(container, item);
		} else if (item.item_name.includes('Karambit | Gamma Doppler') && item.phase === 'Phase 1') {
			await badgeDiamondGem(container, item);
		}
	} else if (item.item_name.includes('Nocts')) {
		await badgeNocts(container, item);
	} else if (item.type === 'charm') {
		badgeCharm(container, item);
	} else if (item.def_index === 7 && item.paint_index === 1397) {
		await badgeAphrodite(container, item);
	} else if (item.def_index === 5030 && item.paint_index === 1410) {
		await badgeUltraViolent(container, item);
	} else if (item.def_index === 5034 && item.paint_index === 1440) {
		await badgeCloudChasers(container, item);
	} else if (item.def_index === 5034 && item.paint_index === 1438 && item.float_value! > 0.15 && item.float_value! < 0.38) {
		await badgePillowPunchers(container, item);
	} else if (item.def_index === 5034 && item.paint_index === 1437) {
		await badgeBigSwell(container, item);
	}
}

async function badgePillowPunchers(container: Element, item: CSFloat.Item) {
	const pillow_data = PillowPunchersMapping[item.paint_seed!];
	if (!pillow_data) return;

	const icon = generateMixPatternIcon('#F6F7F9', 30);
	const base64 = svgtoBase64Encode(icon);

	const badgeStyle = 'color: white; font-size: 18px; font-weight: 500; position: absolute; top: 6px; text-shadow: -1px 0 #444, 0 1px #444, 1px 0 #444, 0 -1px #444;';
	addPatternBadge({
		container,
		svgfile: base64,
		svgStyle: 'height: 30px;',
		tooltipText: [`Tier ${pillow_data}`],
		tooltipStyle: 'translate: -20px 15px; width: 50px;',
		badgeText: String(pillow_data),
		badgeStyle,
	});
}

async function badgeBigSwell(container: Element, item: CSFloat.Item) {
	const big_swell_data = BigSwellMapping[item.paint_seed!];
	if (!big_swell_data) return;

	const iconMapping = {
		1: ICON_BIG_SWELL_1,
		2: ICON_BIG_SWELL_2,
	};

	addPatternBadge({
		container,
		svgfile: iconMapping[big_swell_data],
		svgStyle: 'height: 30px;',
		tooltipText: ['Centered Waves', `Tier ${big_swell_data}`],
		tooltipStyle: 'translate: -40px 15px; width: 100px;',
	});
}

async function badgeCloudChasers(container: Element, item: CSFloat.Item) {
	const cloud_data = CloudChasersMapping[item.paint_seed!];
	if (!cloud_data) return;

	const iconMapping = {
		1: ICON_CLOUD_CHASERS_1,
		2: ICON_CLOUD_CHASERS_2,
	};

	addPatternBadge({
		container,
		svgfile: iconMapping[cloud_data],
		svgStyle: 'height: 30px;',
		tooltipText: ['Double Centered Dragons', `Tier ${cloud_data}`],
		tooltipStyle: 'translate: -40px 15px; width: 100px;',
	});
}

async function badgeUltraViolent(container: Element, item: CSFloat.Item) {
	const mix_data = UltraViolentMapping[item.paint_seed!];
	if (!mix_data) return;

	const icon = generateMixPatternIcon(mix_data.type === 'blue' ? '#00BCFF' : '#6155F5', 30);
	const base64 = svgtoBase64Encode(icon);

	const badgeStyle = 'color: lightgrey; font-size: 18px; font-weight: 500; position: absolute; top: 6px;';
	addPatternBadge({
		container,
		svgfile: base64,
		svgStyle: 'height: 30px;',
		tooltipText: [`Max ${mix_data.type.charAt(0).toUpperCase() + mix_data.type.slice(1)} Tier ${mix_data.tier}`],
		tooltipStyle: 'translate: -27px 15px; width: 70px;',
		badgeText: String(mix_data.tier),
		badgeStyle,
	});
}

async function badgeAphrodite(container: Element, item: CSFloat.Item) {
	const gem_data = AphroditeMapping[item.paint_seed!];
	if (!gem_data) return;

	const { type, tier } = gem_data;
	const icon = generateAphroditeIcon(type, tier, 30);

	addSvgPatternBadge({
		container,
		svg: icon,
		tooltipText: [`${type.charAt(0).toUpperCase() + type.slice(1)} Gem`].concat(tier ? [`Tier ${tier}`] : []),
		tooltipStyle: 'translate: -20px 15px; width: 60px;',
	});
}

async function badgeChromaGems(container: Element, item: CSFloat.Item) {
	let gem_data: number | undefined;
	if (item.item_name.includes('Karambit')) {
		gem_data = KarambitGemMapping[item.paint_seed!];
	} else if (item.item_name.includes('Butterfly Knife')) {
		gem_data = ButterflyGemMapping[item.paint_seed!];
	}
	if (!gem_data) return;

	const iconMapping = {
		Sapphire: {
			1: ICON_SAPPHIRE_1,
			2: ICON_SAPPHIRE_2,
			3: ICON_SAPPHIRE_3,
		},
		Ruby: {
			1: ICON_RUBY_1,
			2: ICON_RUBY_2,
			3: ICON_RUBY_3,
		},
		Emerald: {
			1: ICON_EMERALD_1,
			2: ICON_EMERALD_2,
			3: ICON_EMERALD_3,
		},
	};

	addPatternBadge({
		container,
		svgfile: iconMapping[item.phase as 'Sapphire' | 'Ruby' | 'Emerald'][gem_data],
		svgStyle: 'height: 30px;',
		tooltipText: [`Max ${item.phase}`, `Rank ${gem_data}`],
		tooltipStyle: 'translate: -25px 15px; width: 60px;',
	});
}

async function badgeNocts(container: Element, item: CSFloat.Item) {
	const nocts_data = NoctsMapping[item.paint_seed!];
	if (!nocts_data) return;

	const iconMapping = {
		1: ICON_NOCTS_1,
		2: ICON_NOCTS_2,
		3: ICON_NOCTS_3,
	};

	addPatternBadge({
		container,
		svgfile: iconMapping[nocts_data],
		svgStyle: 'height: 30px;',
		tooltipText: ['Max Black', `Tier ${nocts_data}`],
		tooltipStyle: 'translate: -25px 15px; width: 60px;',
	});
}

function badgeCharm(container: Element, item: CSFloat.Item) {
	const pattern = item.keychain_pattern;
	if (!pattern) return;

	const badgeProps = getCharmColoring(pattern, item.item_name);

	const badgeContainer = container.querySelector<HTMLDivElement>('.keychain-pattern');
	if (!badgeContainer) return;

	badgeContainer.style.backgroundColor = badgeProps[0] + '80';
	(badgeContainer.firstElementChild as HTMLSpanElement).style.color = badgeProps[1];
}

async function badgeDiamondGem(container: Element, item: CSFloat.Item) {
	const diamondGem_data = DiamonGemMapping[item.paint_seed!];
	if (!diamondGem_data) return;

	const iconMapping = {
		1: ICON_DIAMOND_GEM_1,
		2: ICON_DIAMOND_GEM_2,
		3: ICON_DIAMOND_GEM_3,
	};

	addPatternBadge({
		container,
		svgfile: iconMapping[diamondGem_data.tier],
		svgStyle: 'height: 30px;',
		tooltipText: ['Diamond Gem', `Rank ${diamondGem_data.rank} (T${diamondGem_data.tier})`, `Blue: ${diamondGem_data.blue}%`],
		tooltipStyle: 'translate: -40px 15px; width: 110px;',
	});
}

async function badgePinkGalaxy(container: Element, item: CSFloat.Item) {
	const pinkGalaxy_data = PinkGalaxyMapping[item.def_index]?.[item.paint_seed!];
	if (!pinkGalaxy_data) return;

	const iconMapping = {
		1: ICON_PINK_GALAXY_1,
		2: ICON_PINK_GALAXY_2,
		3: ICON_PINK_GALAXY_3,
	};
	addPatternBadge({
		container,
		svgfile: iconMapping[pinkGalaxy_data],
		svgStyle: 'height: 30px;',
		tooltipText: ['Pink Galaxy', `Tier ${pinkGalaxy_data}`],
		tooltipStyle: 'translate: -25px 15px; width: 80px;',
	});
}

async function badgeOverprint(container: Element, item: CSFloat.Item) {
	const overprint_data = await OverprintMapping.getPattern(item.paint_seed!);
	if (!overprint_data) return;

	const getTooltipStyle = (type: typeof overprint_data.type) => {
		switch (type) {
			case 'Flower':
				return 'translate: -15px 15px; width: 55px;';
			case 'Arrow':
			case 'Polygon':
				return 'translate: -25px 15px; width: 100px;';
			case 'Mixed':
				return 'translate: -15px 15px; width: 55px;';
			default:
				return '';
		}
	};

	const badgeStyle = 'color: lightgrey; font-size: 18px; font-weight: 500;' + (overprint_data.type === 'Flower' ? ' margin-left: 5px;' : '');

	const iconMapping = {
		Flower: ICON_OVERPRINT_FLOWER,
		Arrow: ICON_OVERPRINT_ARROW,
		Polygon: ICON_OVERPRINT_POLYGON,
		Mixed: ICON_OVERPRINT_MIXED,
	};
	addPatternBadge({
		container,
		svgfile: iconMapping[overprint_data.type],
		svgStyle: 'height: 30px; filter: brightness(0) saturate(100%) invert(79%) sepia(65%) saturate(2680%) hue-rotate(125deg) brightness(95%) contrast(95%);',
		tooltipText: [`"${overprint_data.type}" Pattern`].concat(overprint_data.tier === 0 ? [] : [`Tier ${overprint_data.tier}`]),
		tooltipStyle: getTooltipStyle(overprint_data.type),
		badgeText: overprint_data.tier === 0 ? '' : 'T' + overprint_data.tier,
		badgeStyle,
	});
}

async function badgeCKimono(container: Element, item: CSFloat.Item) {
	const ck_data = await CrimsonKimonoMapping.getPattern(item.paint_seed!);
	if (!ck_data) return;

	const badgeStyle = 'color: lightgrey; font-size: 18px; font-weight: 500; position: absolute; top: 6px;';
	if (ck_data.tier === -1) {
		addPatternBadge({
			container,
			svgfile: ICON_CRIMSON,
			svgStyle: 'height: 30px; filter: grayscale(100%);',
			tooltipText: ['T1 GRAY PATTERN'],
			tooltipStyle: 'translate: -25px 15px; width: 80px;',
			badgeText: '1',
			badgeStyle,
		});
	} else {
		addPatternBadge({
			container,
			svgfile: ICON_CRIMSON,
			svgStyle: 'height: 30px;',
			tooltipText: [`Tier ${ck_data.tier}`],
			tooltipStyle: 'translate: -18px 15px; width: 60px;',
			badgeText: String(ck_data.tier),
			badgeStyle,
		});
	}
}

async function badgePhoenix(container: Element, item: CSFloat.Item) {
	const phoenix_data = await PhoenixMapping.getPattern(item.paint_seed!);
	if (!phoenix_data) return;

	addPatternBadge({
		container,
		svgfile: ICON_PHOENIX,
		svgStyle: 'height: 30px;',
		tooltipText: [`Position: ${phoenix_data.type}`, `Tier ${phoenix_data.tier}`].concat(phoenix_data.rank ? [`Rank #${phoenix_data.rank}`] : []),
		tooltipStyle: 'translate: -15px 15px; width: 90px;',
		badgeText: 'T' + phoenix_data.tier,
		badgeStyle: 'color: #d946ef; font-size: 18px; font-weight: 600;',
	});
}

async function webDetection(container: Element, item: CSFloat.Item) {
	const type = item.item_name.includes('Gloves') ? 'gloves' : item.item_name.split('★ ')[1].split(' ')[0].toLowerCase();
	const cw_data = await getCrimsonWebMapping(type as Extension.CWWeaponTypes, item.paint_seed!);
	if (!cw_data) return;
	if (!container.querySelector('.item-img')) return;

	const filter = item.item_name.includes('Crimson')
		? 'brightness(0) saturate(100%) invert(13%) sepia(87%) saturate(576%) hue-rotate(317deg) brightness(93%) contrast(113%)'
		: 'brightness(0) saturate(100%) invert(64%) sepia(64%) saturate(2232%) hue-rotate(43deg) brightness(84%) contrast(90%)';

	addPatternBadge({
		container,
		svgfile: ICON_SPIDER_WEB,
		svgStyle: `height: 30px; filter: ${filter};`,
		tooltipText: [cw_data.type, `Tier ${cw_data.tier}`],
		tooltipStyle: 'translate: -25px 15px; width: 80px;',
		badgeText: cw_data.type === 'Triple Web' ? '3' : cw_data.type === 'Double Web' ? '2' : '1',
		badgeStyle: `color: ${item.item_name.includes('Crimson') ? 'lightgrey' : 'white'}; font-size: 18px; font-weight: 500; position: absolute; top: 7px;`,
	});
}

async function addCaseHardenedSales(item: CSFloat.Item) {
	if ((!item.item_name.includes('Case Hardened') && !item.item_name.includes('Heat Treated')) || item.item_name.includes('Gloves') || item.paint_seed === undefined) return;

	const { userCurrency, currencyRate } = await getCurrencyRate();
	const currencyFormatter = new Intl.NumberFormat(undefined, {
		style: 'currency',
		currency: userCurrency,
		currencyDisplay: 'narrowSymbol',
		minimumFractionDigits: 0,
		maximumFractionDigits: 2,
	});
	const { weapon, type } = getBlueGemName(item.item_name);

	const pastSales = await fetchBlueGemPastSales({ weapon, type, pattern: item.paint_seed });
	const gridHistory = document.querySelector('.grid-history');
	if (!gridHistory || !pastSales) return;

	const salesHeader = document.createElement('mat-button-toggle');
	salesHeader.setAttribute('role', 'presentation');
	salesHeader.className = 'mat-button-toggle mat-button-toggle-appearance-standard';
	salesHeader.innerHTML = `<button type="button" class="mat-button-toggle-button mat-focus-indicator" aria-pressed="false"><span class="mat-button-toggle-label-content" style="color: deepskyblue;">Pattern Sales (${pastSales.length})</span></button>`;
	gridHistory.querySelector('mat-button-toggle-group')?.appendChild(salesHeader);
	salesHeader.addEventListener('click', () => {
		Array.from(gridHistory.querySelectorAll('mat-button-toggle') ?? []).forEach((element) => {
			element.className = element.className.replace('mat-button-toggle-checked', '');
		});
		salesHeader.className += ' mat-button-toggle-checked';

		const tableBody = document.createElement('tbody');
		pastSales.forEach((sale) => {
			const price = currencyFormatter.format(new Decimal(sale.price).div(100).mul(currencyRate).toDP(2).toNumber());
			const saleHtml = html`
				<tr role="row" class="mat-mdc-row mdc-data-table__row cdk-row" style="${item.float_value && new Decimal(sale.float).toDP(10).equals(item.float_value.toFixed(10)) ? 'background-color: #0b255d;' : ''}">
					<td role="cell" class="mat-mdc-cell mdc-data-table__cell cdk-cell">
						<img src="${sale.source === 'csfloat' ? ICON_CSFLOAT : ICON_BUFF}" style="height: 28px; border: 1px solid dimgray; border-radius: 4px;" />
					</td>
					<td role="cell" class="mat-mdc-cell mdc-data-table__cell cdk-cell">${new Date(sale.date).toISOString().slice(0, 10)}</td>
					<td role="cell" class="mat-mdc-cell mdc-data-table__cell cdk-cell">${price}</td>
					<td role="cell" class="mat-mdc-cell mdc-data-table__cell cdk-cell">
						${sale.statTrak ? '<span style="color: rgb(255, 120, 44); margin-right: 5px;">StatTrak™</span>' : ''}
						<span>${sale.float}</span>
					</td>
					<td role="cell" class="mat-mdc-cell">
						${sale.screenshots.combined ? html`<a href="${sale.screenshots.combined}" target="_blank" title="Show Buff screenshot"><mat-icon role="img" class="mat-icon notranslate material-icons mat-ligature-font mat-icon-no-color">photo_camera</mat-icon></a>` : ''}
						${sale.screenshots.playside ? html`<a href="${sale.screenshots.playside}" target="_blank" title="Show CSFloat font screenshot"><mat-icon role="img" class="mat-icon notranslate material-icons mat-ligature-font mat-icon-no-color">photo_camera</mat-icon></a>` : ''}
						${
							sale.screenshots.backside
								? html`<a href="${sale.screenshots.backside}" target="_blank" title="Show CSFloat back screenshot"><img src="${ICON_CAMERA_FLIPPED}" style="height: 24px; translate: 7px 0; filter: brightness(0) saturate(100%) invert(39%) sepia(52%) saturate(4169%) hue-rotate(201deg) brightness(113%) contrast(101%);" /></a>`
								: ''
						}
						${
							sale.screenshots.id
								? html`
										<a href="https://csfloat.pics/m/${sale.screenshots.id}/playside.png" target="_blank" title="Show CSFloat font screenshot">
											<mat-icon role="img" class="mat-icon notranslate material-icons mat-ligature-font mat-icon-no-color">photo_camera</mat-icon>
										</a>
										<a href="https://csfloat.pics/m/${sale.screenshots.id}/backside.png" target="_blank" title="Show CSFloat back screenshot">
											<img src="${ICON_CAMERA_FLIPPED}" style="height: 24px; translate: 7px 0; filter: brightness(0) saturate(100%) invert(39%) sepia(52%) saturate(4169%) hue-rotate(201deg) brightness(113%) contrast(101%);" />
										</a>
									`
								: ''
						}
					</td>
				</tr>
			`;
			tableBody.insertAdjacentHTML('beforeend', saleHtml);
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
			const headerCellStyle = `text-align: center; color: var(--subtext-color); letter-spacing: .03em; background: rgba(193, 206, 255, .04); ${
				i === 0 ? 'border-top-left-radius: 10px; border-bottom-left-radius: 10px' : ''
			}`;
			headerCell.setAttribute('style', headerCellStyle);
			headerCell.className = 'mat-mdc-header-cell mdc-data-table__header-cell ng-star-inserted';
			headerCell.textContent = headerValues[i];
			tableTr.appendChild(headerCell);
		}
		const linkHeaderCell = document.createElement('th');
		linkHeaderCell.setAttribute('role', 'columnheader');
		linkHeaderCell.setAttribute(
			'style',
			'text-align: center; color: var(--subtext-color); letter-spacing: .03em; background: rgba(193, 206, 255, .04); border-top-right-radius: 10px; border-bottom-right-radius: 10px'
		);
		linkHeaderCell.className = 'mat-mdc-header-cell mdc-data-table__header-cell ng-star-inserted';
		const linkHeader = document.createElement('a');
		linkHeader.setAttribute('href', `https://bluegemlab.com/${item.def_index}/${item.paint_index}?pattern=${item.paint_seed}`);
		linkHeader.setAttribute('target', '_blank');
		linkHeader.innerHTML = ICON_ARROWUP_SMALL;
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
