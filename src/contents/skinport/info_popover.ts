import { html } from 'common-tags';
import { BETTERFLOAT_LOGO, WEBSITE_URL } from '~lib/util/globals';

const PRICE_INFO_BLOG_URL = `${WEBSITE_URL}blog/skinport-compliance`;

const SHOW_DELAY = 200;
const HIDE_GRACE = 150;
const ENTER_EASING = 'cubic-bezier(0.16, 1, 0.3, 1)';
const EXIT_EASING = 'cubic-bezier(0.4, 0, 1, 1)';

let popoverEl: HTMLDivElement | null = null;
let showTimer: ReturnType<typeof setTimeout> | null = null;
let hideTimer: ReturnType<typeof setTimeout> | null = null;

function getPopover(): HTMLDivElement {
	if (popoverEl) return popoverEl;

	popoverEl = document.createElement('div');
	popoverEl.className = 'bf-market-popover';
	popoverEl.setAttribute('popover', 'manual');
	popoverEl.innerHTML = html`
		<div class="bf-popover-header">
			<div class="bf-popover-header-brand">
				<img src="${BETTERFLOAT_LOGO}" class="bf-popover-header-logo" />
				<span>Reference Price</span>
			</div>
		</div>
		<div class="bf-popover-info">
			<p>
				Due to a new policy on Skinport, we can no longer display the market name or a direct link for this price.
			</p>
			<a class="link" href="${PRICE_INFO_BLOG_URL}" target="_blank" rel="noopener noreferrer">Learn more</a>
		</div>
	`;
	popoverEl.addEventListener('mouseenter', cancelHide);
	popoverEl.addEventListener('mouseleave', scheduleHide);
	document.body.appendChild(popoverEl);
	return popoverEl;
}

function positionPopover(trigger: HTMLElement) {
	const el = getPopover();
	const rect = trigger.getBoundingClientRect();
	const { width, height } = el.getBoundingClientRect();
	const inset = 8;
	const gap = 4;

	const spaceBelow = window.innerHeight - rect.bottom - inset;
	const flip = spaceBelow < height + gap && rect.top - inset > height + gap;

	const top = flip ? rect.top - height - gap : rect.bottom + gap;
	const left = rect.left + rect.width / 2 - width / 2;

	el.style.transformOrigin = flip ? 'bottom center' : 'top center';
	el.style.top = `${Math.min(Math.max(top, inset), window.innerHeight - height - inset)}px`;
	el.style.left = `${Math.min(Math.max(left, inset), window.innerWidth - width - inset)}px`;
}

function cancelHide() {
	if (hideTimer) {
		clearTimeout(hideTimer);
		hideTimer = null;
	}
}

function scheduleHide() {
	cancelHide();
	hideTimer = setTimeout(hide, HIDE_GRACE);
}

function show(trigger: HTMLElement) {
	const el = getPopover();
	try {
		el.showPopover();
	} catch {
		// ignore if already shown
	}
	positionPopover(trigger);
	el.animate(
		[
			{ opacity: 0, transform: 'translateY(6px) scale(0.97)' },
			{ opacity: 1, transform: 'translateY(0) scale(1)' },
		],
		{ duration: 180, easing: ENTER_EASING, fill: 'forwards' }
	);
}

async function hide() {
	const el = getPopover();
	await el.animate(
		[
			{ opacity: 1, transform: 'translateY(0) scale(1)' },
			{ opacity: 0, transform: 'translateY(6px) scale(0.97)' },
		],
		{ duration: 120, easing: EXIT_EASING, fill: 'forwards' }
	).finished;
	try {
		el.hidePopover();
	} catch {
		// ignore if already hidden
	}
}

export function attachInfoPopover(el: HTMLElement) {
	el.addEventListener('mouseenter', () => {
		cancelHide();
		showTimer = setTimeout(() => show(el), SHOW_DELAY);
	});

	el.addEventListener('mouseleave', () => {
		if (showTimer) {
			clearTimeout(showTimer);
			showTimer = null;
		}
		scheduleHide();
	});
}
