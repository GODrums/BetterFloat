import { createIsolatedElement } from '@webext-core/isolated-element';
import globalStyle from 'url:~/style.css';

import { createRoot } from "react-dom/client";

import type { Extension } from '~lib/@typings/ExtensionTypes';
import { CSFloatHelpers } from '~lib/helpers/csfloat_helpers';
import { createLiveLink, filterDisplay } from '~lib/helpers/skinport_helpers';
import LiveFilter from '~lib/pages/LiveFilter';
import { createUrlListener, waitForElement } from '~lib/util/helperfunctions';
import CSFAutorefresh from '~lib/pages/Autorefresh';
import { getSetting } from '~lib/util/storage';
import CSFMenuControl from '~lib/inline/MenuControl';

export function urlHandler() {
	// To be improved: sometimes the page is not fully loaded yet when the initial URL state is sent
	chrome.runtime.onMessage.addListener((message) => {
		if (message.type === 'BetterFloat_URL_CHANGED') {
			const state: Extension.URLState = message.state;

			console.debug('[BetterFloat] URLHandler - changed to: ', state);

			if (state.site === 'csfloat.com') {
				CSFloatHelpers.adjustCSFTitle(state);
			} else if (state.site === 'skinport.com') {
				createLiveLink();
				if (state.path === '/market' && state.search.includes('sort=date&order=desc')) {
					filterDisplay();
				}
			}
		}
	});
}

export function dynamicUIHandler() {
	//listener for messages from background
	chrome.runtime.onMessage.addListener(async (message) => {
		if (message.type === 'BetterFloat_URL_CHANGED') {
			const state: Extension.URLState = message.state;

			await handleChange(state);
		}
	});

	setTimeout(async () => {
		const state: Extension.URLState = {
			site: location.hostname,
			path: location.pathname,
			search: location.search,
			hash: location.hash,
		};
		await handleChange(state);
	}, 1500);
}

async function handleChange(state: Extension.URLState) {
	console.debug('[BetterFloat] DynamicUIHandler - changed to: ', state);

	if (state.site === 'skinport.com') {
		if (state.path === '/market' && state.search.includes('sort=date&order=desc')) {
			waitForElement('.CatalogHeader-tooltipLive', 100, 10).then(async (success) => {
				if (success) {
					await mountShadowRoot(<LiveFilter />, {
						tagName: 'betterfloat-live-filter',
						parent: document.querySelector('.CatalogHeader-tooltipLive'),
						position: 'before'
					});
				}
			});
		}
	} else if (state.site === 'csfloat.com') {
		const sideMenu = document.querySelector<HTMLElement>('app-advanced-search');
		if (sideMenu?.offsetWidth > 0 && !document.querySelector('betterfloat-menucontrol')) {
			await mountShadowRoot(<CSFMenuControl />, {
				tagName: 'betterfloat-menucontrol',
				parent: document.querySelector('.search-bar .drill-down'),
				position: 'before'
			});
		}

		if (state.path === '/search' && state.search === '?sort_by=most_recent') {
			const csfAutorefresh = await getSetting('csf-autorefresh');
			if (csfAutorefresh) {
				waitForElement('.refresh > button', 100, 10).then(async (success) => {
					if (success && !document.querySelector('betterfloat-autorefresh')) {
						const root = await mountShadowRoot(<CSFAutorefresh />, {
							tagName: 'betterfloat-autorefresh',
							parent: document.querySelector('.refresh'),
							position: 'before'
						});
						// unmount on url change
						const interval = createUrlListener(() => {
							if (!document.querySelector('.sort span.mat-mdc-select-min-line')?.textContent.includes('Newest')){
								root.unmount();
								clearInterval(interval);
							}
						}, 1000);
					}
				});
			}
		}
	}
}

/**
 * Mounts a React component inside a shadow root as child of the given parent element
 * @param component React component to mount
 * @param options mounting options, defaults to appending to document.body
 */
async function mountShadowRoot(component: JSX.Element, options: { tagName: string; parent?: HTMLElement, position?: 'before' | 'after' }) {
	const { parentElement, isolatedElement } = await createIsolatedElement({
		name: options.tagName,
		css: {
			url: globalStyle,
		},
		isolateEvents: true,
	});

	// Mount our UI inside the isolated element
	const root = createRoot(isolatedElement);
	root.render(component);

	const parent = options.parent || document.getElementById('root') || document.body;
	// Mount the UI to the DOM
	if (options.position === 'before') {
		parent.before(parentElement);
	} else if (options.position === 'after') {
		parent.after(parentElement);
	} else {
		parent.appendChild(parentElement);
	}

	// Handle unmounting if the parent element is removed
	parentElement.addEventListener('remove', () => {
		root.unmount();
	});

	return root;
}
