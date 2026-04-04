import { addMessageRelays, getCurrentUrlState, mountShadowRoot, registerRuntimeUrlHandler, scheduleVersionedPopup } from '~contents/shared/url';
import type { Extension } from '~lib/@typings/ExtensionTypes';
import { CSMONEY_SELECTORS } from '~lib/handlers/selectors/csmoney_selectors';
import CSMAutorefresh from '~lib/inline/CSMAutorefresh';
import UpdatePopup from '~lib/inline/UpdatePopup';
import { createUrlListener, waitForElement } from '~lib/util/helperfunctions';
import { getSetting } from '~lib/util/storage';

export function activateCSMoneyUrlHandler() {
	addMessageRelays();
	registerRuntimeUrlHandler(handleCSMoneyChange);
	void handleCSMoneyChange(getCurrentUrlState());
	scheduleVersionedPopup(() => <UpdatePopup />, '3.3.0');
}

async function handleCSMoneyChange(state: Extension.URLState) {
	if (state.path === '/market/buy/') {
		const csmAutorefresh = await getSetting('csm-autorefresh');
		if (csmAutorefresh) {
			const success = await waitForElement(CSMONEY_SELECTORS.market.reloadButton, { maxTries: 30 });
			if (success && !document.querySelector('betterfloat-csm-autorefresh')) {
				const { root } = await mountShadowRoot(<CSMAutorefresh />, {
					tagName: 'betterfloat-csm-autorefresh',
					parent: document.querySelector(CSMONEY_SELECTORS.market.reloadButton)?.parentElement,
				});
				const interval = createUrlListener((url) => {
					if (url.pathname !== '/market/buy/') {
						root.unmount();
						document.querySelector('betterfloat-csm-autorefresh')?.remove();
						clearInterval(interval);
					}
				}, 1000);
			}
		}
	}
}
