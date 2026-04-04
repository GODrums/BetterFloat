import globalStyle from 'url:~/style.css';
import { relayMessage } from '@plasmohq/messaging';
import { createIsolatedElement } from '@webext-core/isolated-element';
import type { JSX } from 'react';
import { createRoot } from 'react-dom/client';
import type { Extension } from '~lib/@typings/ExtensionTypes';
import { EVENT_URL_CHANGED } from '~lib/util/globals';
import { createUrlListener } from '~lib/util/helperfunctions';
import { ExtensionStorage } from '~lib/util/storage';

export type UrlStateHandler = (state: Extension.URLState) => void | Promise<void>;

export function toUrlState(url: URL): Extension.URLState {
	return {
		site: url.hostname,
		path: url.pathname,
		search: url.search,
		hash: url.hash,
	};
}

export function getCurrentUrlState() {
	return toUrlState(new URL(location.href));
}

export function registerRuntimeUrlHandler(handleChange: UrlStateHandler) {
	chrome.runtime.onMessage.addListener((message) => {
		if (message.type === EVENT_URL_CHANGED) {
			void handleChange(message.state);
		}
	});
}

export function watchUrlStateChanges(handleChange: UrlStateHandler, interval = 1500) {
	return createUrlListener((url) => {
		void handleChange(toUrlState(url));
	}, interval);
}

export function addMessageRelays(names: Array<'createNotification' | 'getMarketComparison'> = ['createNotification', 'getMarketComparison']) {
	for (const name of names) {
		relayMessage({ name });
	}
}

export function scheduleVersionedPopup(render: () => JSX.Element, version: string, delayMs = 3000) {
	setTimeout(async () => {
		const extensionVersion = chrome.runtime.getManifest().version;
		if (extensionVersion !== version) {
			return;
		}

		const storageKey = `show-update-popup-${version}`;
		const showUpdate = await ExtensionStorage.sync.get<boolean>(storageKey);
		if (showUpdate !== false) {
			await mountShadowRoot(render(), {
				tagName: 'betterfloat-update-popup',
				parent: document.body,
			});
			await ExtensionStorage.sync.set(storageKey, false);
		}
	}, delayMs);
}

export async function mountShadowRoot(component: JSX.Element, options: { tagName: string; parent?: Element | null; position?: 'before' | 'after' }) {
	const { parentElement, isolatedElement } = await createIsolatedElement({
		name: options.tagName,
		css: {
			url: globalStyle,
		},
		isolateEvents: true,
	});

	const domRoot = document.createElement('div');
	const root = createRoot(domRoot);
	root.render(component);
	isolatedElement.appendChild(domRoot);

	const parent = options.parent || document.getElementById('root') || document.body;
	if (options.position === 'before') {
		parent.before(parentElement);
	} else if (options.position === 'after') {
		parent.after(parentElement);
	} else {
		parent.appendChild(parentElement);
	}

	if (parentElement) {
		const observer = new MutationObserver((mutationsList, obs) => {
			for (const mutation of mutationsList) {
				if (mutation.removedNodes) {
					mutation.removedNodes.forEach((node) => {
						if (node === parentElement) {
							try {
								root.unmount();
							} catch (error) {
								console.warn('[BetterFloat] Error unmounting shadow root:', error);
							}
							obs.disconnect();
						}
					});
				}
			}
		});

		if (parentElement.parentNode) {
			observer.observe(parentElement.parentNode, { childList: true });
		}
	}

	return { root, parentElement, isolatedElement };
}
