import type { Extension } from '~lib/@typings/ExtensionTypes';
import GPAutorefresh from '~lib/inline/GPAutorefresh';
import UpdatePopup from '~lib/inline/UpdatePopup';
import { addMessageRelays, getCurrentUrlState, mountShadowRoot, registerRuntimeUrlHandler, scheduleVersionedPopup } from '~lib/sites/shared/url';
import { createUrlListener, waitForElement } from '~lib/util/helperfunctions';
import { getSetting } from '~lib/util/storage';

export function activateGamerpayUrlHandler() {
	addMessageRelays();
	registerRuntimeUrlHandler(handleGamerpayChange);
	void handleGamerpayChange(getCurrentUrlState());
	scheduleVersionedPopup(() => <UpdatePopup />, '3.3.0');
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
