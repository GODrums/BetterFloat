import type { Extension } from '~lib/@typings/ExtensionTypes';
import SkbAutorefresh from '~lib/inline/SkbAutorefresh';
import SkbBargainButtons from '~lib/inline/SkbBargainButtons';
import { scheduleUpdatePopup } from '~lib/inline/update_popup';
import { getCurrentUrlState, mountShadowRoot, registerRuntimeUrlHandler } from '~lib/shared/url';
import { createUrlListener, waitForElement } from '~lib/util/helperfunctions';
import { getSetting } from '~lib/util/storage';

export function activateSkinbidUrlHandler() {
	registerRuntimeUrlHandler(handleSkinbidChange);
	void handleSkinbidChange(getCurrentUrlState());
	scheduleUpdatePopup();
}

async function handleSkinbidChange(state: Extension.URLState) {
	if (state.path.startsWith('/market')) {
		const skbAutorefresh = await getSetting('skb-autorefresh');
		if (skbAutorefresh) {
			const success = await waitForElement('.items-header > app-sort-single-select');
			if (success && !document.querySelector('betterfloat-skb-autorefresh')) {
				const parent = document.querySelector<HTMLElement>('.items-header > app-sort-single-select')!;
				const { root, parentElement } = await mountShadowRoot(<SkbAutorefresh />, {
					tagName: 'betterfloat-skb-autorefresh',
					parent,
					position: 'before',
				});
				if (parentElement.previousElementSibling?.tagName === 'BETTERFLOAT-SKB-AUTOREFRESH') {
					parentElement.previousElementSibling.remove();
				}
				const interval = createUrlListener((url) => {
					if (!url.pathname.startsWith('/market')) {
						root.unmount();
						document.querySelector('betterfloat-skb-autorefresh')?.remove();
						clearInterval(interval);
					}
				}, 1000);
			}
		}
	}
}

export async function mountSkbBargainButtons() {
	await mountShadowRoot(<SkbBargainButtons />, {
		tagName: 'betterfloat-skb-bargain-buttons',
		parent: document.querySelector('app-make-offer-modal .offer'),
	});
}
