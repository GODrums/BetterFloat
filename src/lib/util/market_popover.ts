import betterfloatLogo from 'data-base64:~/../assets/icon.png';
import { html } from 'common-tags';
import type { Extension } from '~lib/@typings/ExtensionTypes';
import { AvailableMarketSources, MarketSource, WEBSITE_URL } from './globals';
import { CurrencyFormatter, getMarketURL } from './helperfunctions';
import { fetchMarketComparisonData } from './messaging';

type CacheEntry = {
	data: Extension.APIMarketResponse;
	timestamp: number;
};

const CACHE_TTL = 15 * 60 * 1000; // 15 minutes
const SHOW_DELAY = 200;
const HIDE_GRACE = 150;

const cache = new Map<string, CacheEntry>();

let popoverEl: HTMLDivElement | null = null;
let showTimer: ReturnType<typeof setTimeout> | null = null;
let hideTimer: ReturnType<typeof setTimeout> | null = null;
let hideAnimation: Animation | null = null;
let currentTrigger: HTMLElement | null = null;

const ENTER_EASING = 'cubic-bezier(0.16, 1, 0.3, 1)';
const EXIT_EASING = 'cubic-bezier(0.4, 0, 1, 1)';

function getPopover(): HTMLDivElement {
	if (popoverEl) return popoverEl;

	popoverEl = document.createElement('div');
	popoverEl.className = 'bf-market-popover';
	popoverEl.setAttribute('popover', 'manual');
	popoverEl.addEventListener('mouseenter', () => cancelHide());
	popoverEl.addEventListener('mouseleave', () => scheduleHide());
	popoverEl.addEventListener('click', (e) => {
		const row = (e.target as HTMLElement).closest<HTMLElement>('tr[data-href]');
		if (row?.dataset.href) {
			window.open(row.dataset.href, '_blank');
		}
	});
	document.body.appendChild(popoverEl);
	return popoverEl;
}

function animateIn(el: HTMLElement) {
	// Cancel any pending exit animation
	if (hideAnimation) {
		hideAnimation.cancel();
		hideAnimation = null;
	}

	const slideY = '6px';
	el.style.transformOrigin = 'top center';

	el.animate(
		[
			{ opacity: 0, transform: `translateY(${slideY}) scale(0.97)` },
			{ opacity: 1, transform: 'translateY(0) scale(1)' },
		],
		{ duration: 180, easing: ENTER_EASING, fill: 'forwards' }
	);
}

function animateOut(el: HTMLElement): Promise<void> {
	return new Promise((resolve) => {
		const slideY = '6px';

		hideAnimation = el.animate(
			[
				{ opacity: 1, transform: 'translateY(0) scale(1)' },
				{ opacity: 0, transform: `translateY(${slideY}) scale(0.97)` },
			],
			{ duration: 120, easing: EXIT_EASING, fill: 'forwards' }
		);
		hideAnimation.onfinish = () => {
			hideAnimation = null;
			resolve();
		};
		hideAnimation.oncancel = () => {
			hideAnimation = null;
			resolve();
		};
	});
}

function animateHeight(el: HTMLElement, updateFn: () => void) {
	const startHeight = el.offsetHeight;
	updateFn();
	const endHeight = el.offsetHeight;

	if (startHeight === endHeight || startHeight === 0) return;

	el.animate(
		[
			{ height: `${startHeight}px`, overflow: 'clip' },
			{ height: `${endHeight}px`, overflow: 'clip' },
		],
		{
			duration: 250,
			easing: ENTER_EASING,
		}
	);
}

function cancelHide() {
	if (hideTimer) {
		clearTimeout(hideTimer);
		hideTimer = null;
	}
	// If exit animation is in progress, cancel it and snap back
	if (hideAnimation) {
		hideAnimation.cancel();
		hideAnimation = null;
	}
}

function cancelShow() {
	if (showTimer) {
		clearTimeout(showTimer);
		showTimer = null;
	}
}

function scheduleHide() {
	cancelHide();
	hideTimer = setTimeout(() => {
		hide();
	}, HIDE_GRACE);
}

async function hide() {
	const el = getPopover();
	currentTrigger = null;

	await animateOut(el);
	try {
		el.hidePopover();
	} catch {
		// ignore if already hidden
	}
}

function positionPopover(trigger: HTMLElement) {
	const el = getPopover();
	const rect = trigger.getBoundingClientRect();
	const popoverRect = el.getBoundingClientRect();

	let top = rect.bottom + 4;
	let left = rect.left + rect.width / 2 - popoverRect.width / 2;

	// Flip above if overflowing bottom
	if (top + popoverRect.height > window.innerHeight - 8) {
		top = rect.top - popoverRect.height - 4;
	}

	// Clamp horizontal
	if (left < 8) left = 8;
	if (left + popoverRect.width > window.innerWidth - 8) {
		left = window.innerWidth - popoverRect.width - 8;
	}

	el.style.top = `${top}px`;
	el.style.left = `${left}px`;
}

const POPOVER_HEADER = html`
	<div class="bf-popover-header">
		<img src="${betterfloatLogo}" class="bf-popover-header-logo" />
		<span>Market Comparison</span>
	</div>
`;

function renderLoading() {
	const el = getPopover();
	el.innerHTML = html`
		${POPOVER_HEADER}
		<div class="bf-popover-loading-dots">
			<span></span>
			<span></span>
			<span></span>
		</div>
	`;
}

function renderError() {
	const el = getPopover();
	el.innerHTML = html`
		${POPOVER_HEADER}
		<div class="bf-popover-error">Failed to load prices</div>
	`;
}

function buildDataHtml(data: Extension.APIMarketResponse, buffName: string, userCurrency: string, currencyRate: number, isPro: boolean): string {
	const formatter = CurrencyFormatter(userCurrency, 2, 2);

	type MarketRow = { text: string; logo: string; style: string; source: MarketSource; ask: number; bid: number | undefined };

	const PRIMARY_MARKETS = new Set([MarketSource.Buff, MarketSource.YouPin, MarketSource.CSFloat]);

	const primaryRows: MarketRow[] = [];
	const otherRows: MarketRow[] = [];
	for (const marketInfo of AvailableMarketSources) {
		const entry = data[marketInfo.source];
		if (!entry || !entry.ask) continue;
		const row: MarketRow = {
			text: marketInfo.text,
			logo: marketInfo.logo,
			style: marketInfo.style,
			source: marketInfo.source,
			ask: entry.ask,
			bid: entry.bid ? entry.bid : undefined,
		};
		if (PRIMARY_MARKETS.has(marketInfo.source)) {
			primaryRows.push(row);
		} else {
			otherRows.push(row);
		}
	}
	primaryRows.sort((a, b) => a.ask - b.ask);
	otherRows.sort((a, b) => a.ask - b.ask);

	const allRows = [...primaryRows, ...otherRows];
	if (allRows.length === 0) {
		return html`
			${POPOVER_HEADER}
			<div class="bf-popover-loading">No prices available</div>
		`;
	}

	const showBidColumn = isPro && allRows.some((r) => r.bid !== undefined);

	const renderRows = (rows: MarketRow[]) =>
		rows
			.map(
				(row) => html`
					<tr data-href="${getMarketURL({ source: row.source, buff_name: buffName })}">
						<td>
							<div class="bf-popover-market-cell">
								<img src="${row.logo}" style="${row.style}" />
								<span>${row.text}</span>
							</div>
						</td>
						${showBidColumn ? html`<td class="bf-popover-bid">${row.bid ? formatter.format(row.bid / currencyRate / 100) : '-'}</td>` : ''}
						<td class="bf-popover-ask">${formatter.format(row.ask / currencyRate / 100)}</td>
					</tr>
				`
			)
			.join('');

	const hasBothSections = primaryRows.length > 0 && otherRows.length > 0;

	return html`
		${POPOVER_HEADER}
		<table class="bf-popover-table">
			<thead>
				<tr>
					<th>Market</th>
					${showBidColumn ? html`<th style="text-align: right;">Bid</th>` : ''}
					<th style="text-align: right;">Ask</th>
				</tr>
			</thead>
			<tbody>
				${renderRows(primaryRows)}
				${hasBothSections ? html`<tr class="bf-popover-separator"><td colspan="${showBidColumn ? 3 : 2}"></td></tr>` : ''}
				${renderRows(otherRows)}
			</tbody>
		</table>
	`;
}

function buildFreeHtml(source: MarketSource, buffName: string, priceListing: number | undefined, priceOrder: number | undefined, userCurrency: string): string {
	const marketInfo = AvailableMarketSources.find((m) => m.source === source);
	if (!marketInfo || (!priceListing && !priceOrder)) {
		return html`
			${POPOVER_HEADER}
			<div class="bf-popover-loading">No prices available</div>
		`;
	}

	const formatter = CurrencyFormatter(userCurrency, 2, 2);
	const showBidColumn = marketInfo.hasBid && priceOrder !== undefined;

	return html`
		${POPOVER_HEADER}
		<table class="bf-popover-table">
			<thead>
				<tr>
					<th>Market</th>
					${showBidColumn ? html`<th style="text-align: right;">Bid</th>` : ''}
					<th style="text-align: right;">Ask</th>
				</tr>
			</thead>
			<tbody>
				<tr data-href="${getMarketURL({ source, buff_name: buffName })}">
					<td>
						<div class="bf-popover-market-cell">
							<img src="${marketInfo.logo}" style="${marketInfo.style}" />
							<span>${marketInfo.text}</span>
						</div>
					</td>
					${showBidColumn ? html`<td class="bf-popover-bid">${formatter.format(priceOrder)}</td>` : ''}
					<td class="bf-popover-ask">${priceListing ? formatter.format(priceListing) : '-'}</td>
				</tr>
			</tbody>
		</table>
		<div class="bf-popover-upsell"><a href="${WEBSITE_URL}pricing" target="_blank">Unlock all markets with Pro</a></div>
	`;
}

type ShowPopoverOptions = {
	trigger: HTMLElement;
	buffName: string;
	userCurrency: string;
	currencyRate: number;
	isPro: boolean;
	source?: MarketSource;
	priceListing?: number;
	priceOrder?: number;
};

async function showPopover({ trigger, buffName, userCurrency, currencyRate, isPro, source, priceListing, priceOrder }: ShowPopoverOptions) {
	const el = getPopover();
	currentTrigger = trigger;

	if (!isPro && source && (priceListing || priceOrder)) {
		el.innerHTML = buildFreeHtml(source, buffName, priceListing, priceOrder, userCurrency);
		try {
			el.showPopover();
		} catch {
			// ignore
		}
		animateIn(el);
		positionPopover(trigger);
		return;
	}

	renderLoading();

	try {
		el.showPopover();
	} catch {
		// ignore
	}
	animateIn(el);
	positionPopover(trigger);

	if (currentTrigger !== trigger) return;

	let data: Extension.APIMarketResponse | undefined;
	// Check cache
	const cached = cache.get(buffName);
	if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
		data = cached.data;
	} else {
		const response = await fetchMarketComparisonData(buffName, false);
		if (response?.data) {
			data = response.data;
			cache.set(buffName, { data: response.data, timestamp: Date.now() });
		} else {
			animateHeight(el, () => renderError());
			return;
		}
	}

	if (!data) {
		animateHeight(el, () => renderError());
		return;
	}

	try {
		const newHtml = buildDataHtml(data, buffName, userCurrency, currencyRate, isPro);
		animateHeight(el, () => {
			el.innerHTML = newHtml;
		});
		positionPopover(trigger);
	} catch {
		animateHeight(el, () => renderError());
	}
}

export function attachMarketPopover(el: HTMLElement, options: { isPro: boolean; currencyRate: number }) {
	// Strip hint.css tooltip
	const hintClasses = Array.from(el.classList).filter((c) => c.startsWith('hint--'));
	for (const cls of hintClasses) {
		el.classList.remove(cls);
	}
	el.removeAttribute('aria-label');

	el.addEventListener('mouseenter', () => {
		cancelHide();
		cancelShow();

		showTimer = setTimeout(() => {
			const bfData = el.getAttribute('data-betterfloat');
			if (!bfData) return;

			try {
				const parsed = JSON.parse(bfData);
				const buffName = parsed.buff_name;
				const userCurrency = parsed.userCurrency || 'USD';
				if (!buffName) return;

				showPopover({
					trigger: el,
					buffName,
					userCurrency,
					currencyRate: options.currencyRate,
					isPro: options.isPro,
					source: parsed.source,
					priceListing: parsed.priceListing,
					priceOrder: parsed.priceOrder,
				});
			} catch {
				// ignore parse errors
			}
		}, SHOW_DELAY);
	});

	el.addEventListener('mouseleave', () => {
		cancelShow();
		scheduleHide();
	});
}
