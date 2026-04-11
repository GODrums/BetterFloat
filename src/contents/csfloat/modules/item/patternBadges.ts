export interface AddPatternBadgeOptions {
	container: Element;
	svgfile: string;
	svgStyle?: string;
	tooltipText: string[];
	tooltipStyle: string;
	badgeText?: string;
	badgeStyle?: string;
}

export function addPatternBadge({ container, svgfile, svgStyle, tooltipText, tooltipStyle, badgeText, badgeStyle }: AddPatternBadgeOptions) {
	const badgeTooltip = document.createElement('div');
	badgeTooltip.className = 'bf-tooltip-inner';
	badgeTooltip.setAttribute('style', tooltipStyle);
	for (const text of tooltipText) {
		const badgeTooltipSpan = document.createElement('span');
		badgeTooltipSpan.textContent = text;
		badgeTooltip.appendChild(badgeTooltipSpan);
	}

	const badge = document.createElement('div');
	badge.className = 'bf-tooltip';
	const badgeDiv = document.createElement('div');
	badgeDiv.className = 'bf-badge-text';
	const bgImage = document.createElement('img');
	bgImage.className = 'betterfloat-cw-image';
	bgImage.setAttribute('src', svgfile);
	if (svgStyle) {
		bgImage.setAttribute('style', svgStyle);
	}
	badgeDiv.appendChild(bgImage);

	if (badgeText) {
		const badgeSpan = document.createElement('span');
		badgeSpan.textContent = badgeText;
		if (badgeStyle) {
			badgeSpan.setAttribute('style', badgeStyle);
		}
		badgeDiv.appendChild(badgeSpan);
	}

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

export function addSvgPatternBadge({ container, svg, svgStyle, tooltipText, tooltipStyle, badgeText, badgeStyle }: Omit<AddPatternBadgeOptions, 'svgfile'> & { svg: string }) {
	const badgeTooltip = document.createElement('div');
	badgeTooltip.className = 'bf-tooltip-inner';
	badgeTooltip.setAttribute('style', tooltipStyle);
	for (const text of tooltipText) {
		const badgeTooltipSpan = document.createElement('span');
		badgeTooltipSpan.textContent = text;
		badgeTooltip.appendChild(badgeTooltipSpan);
	}

	const badge = document.createElement('div');
	badge.className = 'bf-tooltip';
	const badgeDiv = document.createElement('div');
	badgeDiv.className = 'bf-badge-text';
	badgeDiv.innerHTML = svg;
	if (svgStyle) {
		badgeDiv.setAttribute('style', svgStyle);
	}
	if (badgeText) {
		const badgeSpan = document.createElement('span');
		badgeSpan.textContent = badgeText;
		if (badgeStyle) {
			badgeSpan.setAttribute('style', badgeStyle);
		}
		badgeDiv.appendChild(badgeSpan);
	}

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
