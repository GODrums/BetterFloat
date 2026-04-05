import betterfloatLogo from 'data-base64:/assets/icon.png';
import { ExtensionStorage } from '~lib/util/storage';

const SELL_PRICING_DOCS_URL = 'https://docs.betterfloat.com/tutorials/csfloat-sell-pricing';
const UPDATE_POPUP_VERSION = '3.3.0';
const UPDATE_POPUP_DELAY_MS = 3000;

function renderUpdatePopupMarkup() {
	return `
		<div style="position: fixed; right: 20px; bottom: 20px; z-index: 2147483647; font-family: system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;">
			<div style="position: relative; width: 550px; max-width: calc(100vw - 40px);">
				<div style="position: absolute; inset: 0; background: linear-gradient(90deg, #3b82f6, #14b8a6); transform: scale(0.8); border-radius: 9999px; filter: blur(48px); opacity: 0.9;"></div>
				<div style="position: relative; overflow: hidden; border: 1px solid #1f2937; border-radius: 16px; background: #111827; box-shadow: 0 20px 40px rgba(0, 0, 0, 0.35); padding: 16px; color: #ffffff;">
					<button type="button" class="bf-close-button" style="position: absolute; top: 12px; right: 12px; width: 40px; height: 40px; border: 0; border-radius: 8px; background: transparent; color: #ffffff; font-size: 16px; cursor: pointer;">
						X
					</button>

					<h1 style="position: relative; z-index: 1; display: flex; align-items: center; margin: 0 0 16px; padding-right: 48px; font-size: 20px; font-weight: 700; line-height: 1.2; color: #ffffff;">
						<img src="${betterfloatLogo}" alt="BetterFloat" style="width: 40px; height: 40px; margin-right: 8px;" />
						<span>Automate pricing for your sales!</span>
						<span style="display: inline-flex; align-items: center; margin-left: 8px; border-radius: 6px; background: #2563eb; padding: 2px 10px; font-size: 12px; font-weight: 700; color: #ffffff;">
							NEW
						</span>
					</h1>

					<p style="position: relative; z-index: 1; margin: 0 0 16px; color: #94a3b8; font-size: 16px; line-height: 1.5;">
						Our Pro users can now automate their pricing strategy for sales on CSFloat. Set your target percentage and let BetterFloat automatically price your items!
					</p>
					<div style="display: flex; justify-content: flex-end;">
						<a
							href="${SELL_PRICING_DOCS_URL}"
							target="_blank"
							rel="noreferrer"
							style="display: inline-flex; align-items: center; justify-content: center; border-radius: 8px; background: #6b21a8; padding: 10px 16px; color: #ffffff; font-size: 14px; font-weight: 600; text-decoration: none;"
						>
							Learn more
						</a>
					</div>
				</div>
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
		if (extensionVersion !== version) {
			return;
		}

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
