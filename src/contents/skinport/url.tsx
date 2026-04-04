import { addMessageRelays, getCurrentUrlState, mountShadowRoot, registerRuntimeUrlHandler, scheduleVersionedPopup } from '~contents/shared/url';
import type { Extension } from '~lib/@typings/ExtensionTypes';
import { createLiveLink, filterDisplay } from '~lib/helpers/skinport_helpers';
import SpLiveFilter from '~lib/inline/SpLiveFilter';
import SpNotifications from '~lib/inline/SpNotifications';
import UpdatePopup from '~lib/inline/UpdatePopup';
import { createUrlListener, waitForElement } from '~lib/util/helperfunctions';

export function activateSkinportUrlHandler() {
	addMessageRelays();
	registerRuntimeUrlHandler(handleStateChange);
	void handleStateChange(getCurrentUrlState());
	scheduleVersionedPopup(() => <UpdatePopup />, '3.3.0');
}

async function handleStateChange(state: Extension.URLState) {
	if (state.path === '/market' && state.search.includes('sort=date&order=desc')) {
		createLiveLink();
		filterDisplay();
	}

	await handleSkinportChange(state);
}

async function handleSkinportChange(state: Extension.URLState) {
	if (state.path === '/market' && state.search.includes('sort=date&order=desc')) {
		waitForElement('.CatalogHeader-tooltipLive').then(async (success) => {
			if (success) {
				if (!document.querySelector('betterfloat-skinport-notifications')) {
					const { root: notifyRoot } = await mountShadowRoot(<SpNotifications />, {
						tagName: 'betterfloat-skinport-notifications',
						parent: document.querySelector('.CatalogHeader-tooltipLive'),
						position: 'before',
					});
					const notifyInterval = createUrlListener((url) => {
						if (url.pathname !== '/market' || !url.search.includes('sort=date&order=desc')) {
							notifyRoot.unmount();
							document.querySelector('betterfloat-skinport-notifications')?.remove();
							clearInterval(notifyInterval);
						}
					}, 1000);
				}

				if (!document.querySelector('betterfloat-live-filter')) {
					const { root } = await mountShadowRoot(<SpLiveFilter />, {
						tagName: 'betterfloat-live-filter',
						parent: document.querySelector('.CatalogHeader-tooltipLive'),
						position: 'before',
					});
					const interval = createUrlListener((url) => {
						if (url.pathname !== '/market' || !url.search.includes('sort=date&order=desc')) {
							root.unmount();
							document.querySelector('betterfloat-live-filter')?.remove();
							clearInterval(interval);
						}
					}, 1000);
				}
			}
		});
	}

	if (state.path === '/sell/steam') {
		removeSkinportExtensionWarning();
	}
}

function removeSkinportExtensionWarning() {
	const warning = document.querySelector<HTMLElement>('div.Warning.SellPage-extension');
	if (warning) {
		warning.style.display = 'none';
	}
}
