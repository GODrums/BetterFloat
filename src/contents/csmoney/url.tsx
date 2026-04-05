import type { Extension } from '~lib/@typings/ExtensionTypes';
import { CSMONEY_SELECTORS } from '~lib/handlers/selectors/csmoney_selectors';
import CSMAutorefresh from '~lib/inline/CSMAutorefresh';
import { scheduleUpdatePopup } from '~lib/inline/update_popup';
import { getCurrentUrlState, mountShadowRoot, registerRuntimeUrlHandler } from '~lib/shared/url';
import { createUrlListener, waitForElement } from '~lib/util/helperfunctions';
import { getSetting } from '~lib/util/storage';

export function activateCSMoneyUrlHandler() {
	registerRuntimeUrlHandler(handleCSMoneyChange);
	void handleCSMoneyChange(getCurrentUrlState());
	scheduleUpdatePopup();
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
