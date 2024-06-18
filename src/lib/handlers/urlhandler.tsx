import globalStyle from 'url:~/style.css';
import { createIsolatedElement } from '@webext-core/isolated-element';

import { createRoot } from 'react-dom/client';

import type { Extension } from '~lib/@typings/ExtensionTypes';
import { CSFloatHelpers } from '~lib/helpers/csfloat_helpers';
import { createLiveLink, filterDisplay } from '~lib/helpers/skinport_helpers';
import CSFAutorefresh from '~lib/inline/CSFAutorefresh';
import CSFQuickMenu from '~lib/inline/CSFQuickMenu';
import LiveFilter from '~lib/inline/LiveFilter';
import CSFMenuControl from '~lib/inline/MenuControl';
import SPBuffContainer from '~lib/inline/SpBuffContainer';
import { createUrlListener, waitForElement } from '~lib/util/helperfunctions';
import { getSetting } from '~lib/util/storage';

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
			waitForElement('.CatalogHeader-tooltipLive').then(async (success) => {
				if (success && !document.querySelector('betterfloat-live-filter')) {
					const root = await mountShadowRoot(<LiveFilter />, {
						tagName: 'betterfloat-live-filter',
						parent: document.querySelector('.CatalogHeader-tooltipLive'),
						position: 'before',
					});
					// unmount on url change
					const interval = createUrlListener((newUrl) => {
						const url = new URL(newUrl);
						if (url.pathname !== '/market' || !url.search.includes('sort=date&order=desc')) {
							root.unmount();
							document.querySelector('betterfloat-live-filter')?.remove();
							clearInterval(interval);
						}
					}, 1000);
				}
			});
		}
	} else if (state.site === 'csfloat.com') {
		const sideMenu = document.querySelector<HTMLElement>('app-advanced-search');
		if (sideMenu?.offsetWidth && sideMenu.offsetWidth > 0 && !document.querySelector('betterfloat-menucontrol')) {
			const root = await mountShadowRoot(<CSFMenuControl />, {
				tagName: 'betterfloat-menucontrol',
				parent: document.querySelector('.search-bar .drill-down'),
				position: 'before',
			});
			if (Array.from(document.querySelectorAll('betterfloat-menucontrol')).length > 1) {
				root.unmount();
				document.querySelector('betterfloat-menucontrol')?.remove();
			}
		}

		if (state.path === '/search' && state.search.includes('sort_by=most_recent')) {
			const csfAutorefresh = await getSetting('csf-autorefresh');
			if (csfAutorefresh) {
				waitForElement('.refresh > button').then(async (success) => {
					if (success && !document.querySelector('betterfloat-autorefresh')) {
						const root = await mountShadowRoot(<CSFAutorefresh />, {
							tagName: 'betterfloat-autorefresh',
							parent: document.querySelector('.refresh'),
							position: 'before',
						});
						// unmount on url change
						const interval = createUrlListener(() => {
							if (!document.querySelector('.sort span.mat-mdc-select-min-line')?.textContent?.includes('Newest')) {
								root.unmount();
								document.querySelector('betterfloat-autorefresh')?.remove();
								clearInterval(interval);
							}
						}, 1000);
					}
				});
			}
		}

		const isLoggedIn = !!document.querySelector('app-header .avatar');
		const csfShowQuickMenu = await getSetting<boolean>('csf-quickmenu');
		if (isLoggedIn && csfShowQuickMenu && !document.querySelector('betterfloat-quick-menu')) {
			await mountShadowRoot(<CSFQuickMenu />, {
				tagName: 'betterfloat-quick-menu',
				parent: document.querySelector('app-header .balance-container')?.parentElement,
				position: 'before',
			});
		}
	}
}

export async function mountSpItemPageBuffContainer() {
	await mountShadowRoot(<SPBuffContainer />, {
		tagName: 'betterfloat-buff-container',
		parent: document.querySelector('.ItemPage-notListed') ?? document.querySelector('.ItemPage-btns'),
		position: 'before',
	});
}

/**
 * Mounts a React component inside a shadow root as child of the given parent element
 * @param component React component to mount
 * @param options mounting options, defaults to appending to document.body
 */
async function mountShadowRoot(component: JSX.Element, options: { tagName: string; parent?: Element | null; position?: 'before' | 'after' }) {
	const { parentElement, isolatedElement } = await createIsolatedElement({
		name: options.tagName,
		css: {
			url: globalStyle,
		},
		isolateEvents: true,
	});

	// Mount our UI inside the isolated element
	const domRoot = document.createElement('div');
	const root = createRoot(domRoot);
	root.render(component);
	isolatedElement.appendChild(domRoot);

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
