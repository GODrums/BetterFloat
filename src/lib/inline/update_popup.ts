import betterfloatLogo from 'data-base64:/assets/icon.png';
import { ICON_SKINPLACE_FULL } from '~lib/util/globals';
import { ExtensionStorage } from '~lib/util/storage';

const SKINPLACE_URL = 'https://skin.place?utm_campaign=IiV5cv0kjHjDlFR';
const UPDATE_POPUP_VERSION = '3.5.0';
const UPDATE_POPUP_DELAY_MS = 3000;

function renderUpdatePopupMarkup() {
	return `
		<style>
			@import url('https://fonts.googleapis.com/css2?family=Inter:wght@500;600;700&display=swap');

			betterfloat-update-popup {
				position: fixed;
				right: 24px;
				bottom: 24px;
				z-index: 2147483647;
				font-family: 'Inter', ui-sans-serif, system-ui, -apple-system, 'Segoe UI', sans-serif;
				animation: bf-popup-enter 320ms cubic-bezier(.2, .9, .3, 1.05) both;
			}

			@keyframes bf-popup-enter {
				from { transform: translate3d(0, 16px, 0); opacity: 0; }
				to   { transform: translate3d(0, 0, 0); opacity: 1; }
			}

			betterfloat-update-popup *,
			betterfloat-update-popup *::before,
			betterfloat-update-popup *::after {
				box-sizing: border-box;
			}

			betterfloat-update-popup .bf-shell {
				position: relative;
				width: 380px;
				max-width: calc(100vw - 48px);
				border-radius: 12px;
				overflow: hidden;
				background: hsl(240 10% 3.9%);
				border: 1px solid hsl(240 3.7% 15.9%);
				box-shadow:
					0 20px 60px -20px rgba(0, 0, 0, .6),
					0 6px 20px -10px rgba(0, 0, 0, .4);
			}

			betterfloat-update-popup .bf-spotlight {
				position: absolute;
				inset: 0;
				background:
					radial-gradient(60% 55% at 50% 18%,
						rgba(167, 139, 250, .22) 0%,
						rgba(167, 139, 250, .10) 30%,
						transparent 65%);
				filter: blur(4px);
				pointer-events: none;
			}

			betterfloat-update-popup .bf-sparkles {
				position: absolute;
				inset: 0;
				width: 100%;
				height: 100%;
				pointer-events: none;
				overflow: hidden;
			}

			betterfloat-update-popup .bf-sparkles circle {
				fill: rgba(255, 255, 255, .75);
				transform-origin: center;
				animation: bf-twinkle 3.2s ease-in-out infinite;
			}

			betterfloat-update-popup .bf-sparkles circle:nth-child(1) { animation-delay: 0s;    animation-duration: 3.4s; }
			betterfloat-update-popup .bf-sparkles circle:nth-child(2) { animation-delay: .45s;  animation-duration: 2.8s; }
			betterfloat-update-popup .bf-sparkles circle:nth-child(3) { animation-delay: 1.1s;  animation-duration: 3.6s; }
			betterfloat-update-popup .bf-sparkles circle:nth-child(4) { animation-delay: 1.7s;  animation-duration: 3.1s; }
			betterfloat-update-popup .bf-sparkles circle:nth-child(5) { animation-delay: .8s;   animation-duration: 2.6s; }
			betterfloat-update-popup .bf-sparkles circle:nth-child(6) { animation-delay: 2.0s;  animation-duration: 3.8s; }
			betterfloat-update-popup .bf-sparkles circle:nth-child(7) { animation-delay: .25s;  animation-duration: 2.9s; }

			@keyframes bf-twinkle {
				0%, 100% { opacity: .15; transform: translateY(0); }
				50%      { opacity: .9;  transform: translateY(-3px); }
			}

			betterfloat-update-popup .bf-content {
				position: relative;
				z-index: 2;
				padding: 14px 18px 18px;
			}

			betterfloat-update-popup .bf-chrome {
				display: flex;
				align-items: center;
				justify-content: space-between;
				margin-bottom: 14px;
			}

			betterfloat-update-popup .bf-brand {
				display: inline-flex;
				align-items: center;
				gap: 8px;
			}

			betterfloat-update-popup .bf-logo {
				width: 20px;
				height: 20px;
				border-radius: 4px;
				display: block;
			}

			betterfloat-update-popup .bf-brand-name {
				font-size: 13px;
				font-weight: 600;
				color: #fafafa;
				letter-spacing: -.01em;
			}

			betterfloat-update-popup .bf-badge-new {
				background: #6b21a8;
				color: #ffffff;
				font-size: 10px;
				font-weight: 600;
				letter-spacing: .08em;
				padding: 2px 8px;
				border-radius: 6px;
				text-transform: uppercase;
			}

			betterfloat-update-popup .bf-chrome-right {
				display: inline-flex;
				align-items: center;
				gap: 6px;
			}

			betterfloat-update-popup .bf-badge-version {
				border: 1px solid hsl(240 3.7% 15.9%);
				color: #a1a1aa;
				font-size: 10px;
				font-weight: 500;
				letter-spacing: .04em;
				padding: 2px 8px;
				border-radius: 6px;
			}

			betterfloat-update-popup .bf-close {
				width: 28px;
				height: 28px;
				display: inline-flex;
				align-items: center;
				justify-content: center;
				border: 0;
				border-radius: 6px;
				background: transparent;
				color: #a1a1aa;
				font-family: inherit;
				font-size: 16px;
				line-height: 1;
				cursor: pointer;
				padding: 0;
				transition: color 150ms ease, background 150ms ease;
			}

			betterfloat-update-popup .bf-close:hover {
				color: #fafafa;
				background: rgba(255, 255, 255, .06);
			}

			betterfloat-update-popup .bf-hero {
				display: flex;
				align-items: center;
				justify-content: center;
				padding: 18px 0 20px;
			}

			betterfloat-update-popup .bf-hero-logo {
				height: 28px;
				width: auto;
				filter: drop-shadow(0 0 18px rgba(167, 139, 250, .35));
			}

			betterfloat-update-popup .bf-headline {
				margin: 0 0 6px;
				text-align: center;
				font-size: 26px;
				font-weight: 700;
				letter-spacing: -.02em;
				line-height: 1.1;
				background: linear-gradient(180deg, #fafafa 0%, #a1a1aa 100%);
				-webkit-background-clip: text;
				background-clip: text;
				color: transparent;
			}

			betterfloat-update-popup .bf-sub {
				margin: 0 0 18px;
				text-align: center;
				font-size: 14px;
				font-weight: 500;
				color: #a1a1aa;
			}

			betterfloat-update-popup .bf-sub-accent {
				color: #a78bfa;
				font-weight: 600;
			}

			betterfloat-update-popup .bf-meta {
				margin: 0 0 14px;
				text-align: center;
				font-size: 11px;
				font-weight: 500;
				letter-spacing: .12em;
				text-transform: uppercase;
				color: #a1a1aa;
			}

			betterfloat-update-popup .bf-cta {
				display: flex;
				align-items: center;
				justify-content: center;
				gap: 8px;
				width: 100%;
				padding: 10px 16px;
				border-radius: 8px;
				background: linear-gradient(135deg, #7c3aed 0%, #a78bfa 100%);
				color: #ffffff;
				font-family: inherit;
				font-size: 13px;
				font-weight: 600;
				letter-spacing: .01em;
				text-decoration: none;
				box-shadow: 0 10px 24px -8px rgba(124, 58, 237, .5);
				transition: filter 200ms ease, transform 200ms ease, box-shadow 200ms ease;
			}

			betterfloat-update-popup .bf-cta:hover {
				filter: brightness(1.08);
				transform: translateY(-1px);
				box-shadow: 0 14px 28px -10px rgba(124, 58, 237, .6);
			}

			betterfloat-update-popup .bf-cta svg {
				width: 12px;
				height: 12px;
				transition: transform 220ms ease;
			}

			betterfloat-update-popup .bf-cta:hover svg {
				transform: translateX(3px);
			}
		</style>

		<div class="bf-shell">
			<div class="bf-spotlight"></div>
			<svg class="bf-sparkles" viewBox="0 0 380 340" preserveAspectRatio="none" aria-hidden="true">
				<circle cx="72"  cy="92"  r="1.2"/>
				<circle cx="128" cy="64"  r="1.0"/>
				<circle cx="196" cy="108" r="1.5"/>
				<circle cx="248" cy="58"  r="1.1"/>
				<circle cx="296" cy="96"  r="1.3"/>
				<circle cx="336" cy="140" r="1.0"/>
				<circle cx="52"  cy="148" r="1.2"/>
			</svg>
			<div class="bf-content">
				<div class="bf-chrome">
					<span class="bf-brand">
						<img class="bf-logo" src="${betterfloatLogo}" alt="BetterFloat" />
						<span class="bf-brand-name">BetterFloat</span>
						<span class="bf-badge-new">New</span>
					</span>
					<span class="bf-chrome-right">
						<span class="bf-badge-version">v${UPDATE_POPUP_VERSION}</span>
						<button type="button" class="bf-close-button bf-close" aria-label="Close">×</button>
					</span>
				</div>

				<div class="bf-hero">
					<img class="bf-hero-logo" src="${ICON_SKINPLACE_FULL}" alt="Skinplace" />
				</div>

				<h1 class="bf-headline">New <span class="bf-sub-accent">Free</span> Marketplace.</h1>

				<p class="bf-sub">Prices & Site Integration Now Live!</p>

				<div class="bf-meta">Replaces Skinbid — v${UPDATE_POPUP_VERSION}</div>

				<a class="bf-cta" href="${SKINPLACE_URL}" target="_blank" rel="noreferrer">
					Check it out
					<svg viewBox="0 0 12 12" fill="none" aria-hidden="true">
						<path d="M2 6h8m0 0L6.5 2.5M10 6l-3.5 3.5" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"/>
					</svg>
				</a>
			</div>
		</div>
	`;
}

function bindUpdatePopupEvents(parentElement: HTMLElement) {
	parentElement.querySelector<HTMLButtonElement>('.bf-close-button')?.addEventListener('click', () => {
		parentElement.remove();
	});
}

function mountHtml(html: string) {
	const existingPopup = document.querySelector<HTMLElement>('betterfloat-update-popup');
	if (existingPopup) {
		return existingPopup;
	}

	const parentElement = document.createElement('betterfloat-update-popup');
	parentElement.innerHTML = html;
	document.body.appendChild(parentElement);
	return parentElement;
}

function scheduleVersionedPopup(render: () => string, version: string, delayMs = 3000, onMount?: (parentElement: HTMLElement) => void) {
	setTimeout(async () => {
		const extensionVersion = chrome.runtime.getManifest().version;
		if (extensionVersion !== version) return;

		const storageKey = `show-update-popup-${version}`;
		const showUpdate = await ExtensionStorage.sync.get<boolean>(storageKey);
		if (showUpdate !== false) {
			const popup = mountHtml(render());
			onMount?.(popup);
			await ExtensionStorage.sync.set(storageKey, false);
		}
	}, delayMs);
}

export function scheduleUpdatePopup() {
	scheduleVersionedPopup(renderUpdatePopupMarkup, UPDATE_POPUP_VERSION, UPDATE_POPUP_DELAY_MS, bindUpdatePopupEvents);
}
