import type { Extension } from '~lib/@typings/ExtensionTypes';
import GPAutorefresh from '~lib/inline/GPAutorefresh';
import { scheduleUpdatePopup } from '~lib/inline/update_popup';
import { getCurrentUrlState, mountShadowRoot, registerRuntimeUrlHandler } from '~lib/shared/url';
import { createUrlListener, waitForElement } from '~lib/util/helperfunctions';
import { getSetting } from '~lib/util/storage';

export function activateGamerpayUrlHandler() {
	registerRuntimeUrlHandler(handleGamerpayChange);
	void handleGamerpayChange(getCurrentUrlState());
	scheduleUpdatePopup();
}

async function handleGamerpayChange(state: Extension.URLState) {
	if (!state.path.includes('/item/')) {
		const gpAutorefresh = await getSetting('gp-autorefresh');
		if (gpAutorefresh) {
			const success = await waitForElement('div[class*="Index_typeBar__"]');
			if (success && !document.querySelector('betterfloat-gp-autorefresh')) {
				const parent = document.querySelector<HTMLElement>('div[class*="Index_typeBar__"]')!;
				const { root } = await mountShadowRoot(<GPAutorefresh />, {
					tagName: 'betterfloat-gp-autorefresh',
					parent: parent,
				});
				parent.style.alignItems = 'center';
				const interval = createUrlListener((url) => {
					if (url.pathname.includes('/item/')) {
						root.unmount();
						document.querySelector('betterfloat-gp-autorefresh')?.remove();
						clearInterval(interval);
					}
				}, 1000);
			}
		}
	}
}
