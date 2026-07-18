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
				const refreshButton = document.querySelector<HTMLElement>(CSMONEY_SELECTORS.market.reloadButton);
				const refreshButtonContainer = refreshButton?.parentElement;
				if (!refreshButtonContainer) return;

				const { root, parentElement } = await mountShadowRoot(<CSMAutorefresh />, {
					tagName: 'betterfloat-csm-autorefresh',
					parent: refreshButtonContainer,
					position: 'after',
				});
				// Astro's refresh control lives in a fixed 38x38 cell. Mounting inside
				// that cell makes both controls overflow and overlap the toolbar.
				parentElement.style.display = 'block';
				parentElement.style.flex = '0 0 auto';
				parentElement.style.height = '38px';
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
