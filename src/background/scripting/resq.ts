declare global {
	interface Window {
		resq: {
			resq$: (selector: string, element?: HTMLElement) => Resq.RESQNode;
			waitToLoadReact: (timeInMs?: number, rootElSelector?: string) => Promise<null | string>;
			resq$$: (selector: string, element?: HTMLElement) => Array<Resq.RESQNode>;
		};
	}
}

namespace Resq {
	type NotFunc<T> = Exclude<T, () => void>;

	export interface RESQNode {
		name: string;
		node: HTMLElement | null;
		isFragment: boolean;
		state: NotFunc<any>;
		props: Record<string, any>;
		children: RESQNode[];
		_nodes: Array<RESQNode>;
	}

	export declare const waitToLoadReact: (timeInMs?: number, rootElSelector?: string) => Promise<null | string>;
	export declare const resq$: (selector: string, element?: HTMLElement) => RESQNode;
	export declare const resq$$: (selector: string, element?: HTMLElement) => Array<RESQNode>;
}

// Define the type for the resq module
type ResqModule = {
	waitToLoadReact: (timeInMs?: number, rootElSelector?: string) => Promise<null | string>;
	resq$: (selector: string, element?: HTMLElement) => Resq.RESQNode;
	resq$$: (selector: string, element?: HTMLElement) => Array<Resq.RESQNode>;
};

export function injectResq() {
	console.log('[BetterFloat] Injecting Resq...');

	// Helper function to wait for resq to be available
	function waitForResq(maxAttempts = 50, interval = 100): Promise<void> {
		return new Promise((resolve, reject) => {
			let attempts = 0;

			const checkResq = () => {
				attempts++;

				if (window.resq && typeof window.resq.resq$ === 'function') {
					resolve();
					return;
				}

				if (attempts >= maxAttempts) {
					reject(new Error(`Resq not available after ${maxAttempts} attempts`));
					return;
				}

				setTimeout(checkResq, interval);
			};

			checkResq();
		});
	}

	async function observeGamerpay() {
		const observer = new MutationObserver(async (mutations) => {
			for (const mutation of mutations) {
				for (const node of mutation.addedNodes) {
					if (node instanceof HTMLElement) {
						// console.log(node);
						if (node.className.toString().startsWith('ItemCard_wrapper')) {
							annotateReactNode(node as HTMLElement);
						} else if (node.className.toString().startsWith('ItemFeed_feed')) {
							for (const item of node.children) {
								if (item instanceof HTMLElement && item.className.toString().startsWith('ItemCard_wrapper')) {
									annotateReactNode(item as HTMLElement);
								}
							}
						} else if (node.className.toString().startsWith('Page_wrapper')) {
							setTimeout(() => {
								const items = document.querySelectorAll('div[class*="FeedPreview_itemWrapper"]');
								for (const item of items) {
									annotateReactNode(item as HTMLElement);
								}
							}, 1000);
						}
					}
				}
			}
		});
		observer.observe(document, { childList: true, subtree: true });
	}

	function annotateReactNode(node: HTMLElement) {
		// Double-check that resq is available before using it
		if (!window.resq || typeof window.resq.resq$ !== 'function') {
			console.warn('[BetterFloat] Resq not available, skipping annotation');
			return;
		}

		try {
			const item = window.resq.resq$('P', node as HTMLElement);
			node.setAttribute('data-betterfloat', JSON.stringify(item.props));
		} catch (error) {
			const item = window.resq.resq$('*', node as HTMLElement);
			console.log(item);
			console.error('[BetterFloat] Error annotating React node:', error);
		}
	}

	waitForResq()
		.then(() => {
			console.log('[BetterFloat] Resq loaded');
			window.resq.waitToLoadReact(100, '#__next').then(() => {
				console.log('[BetterFloat] React loaded');
			});
			observeGamerpay();
		})
		.catch((error) => {
			console.error('[BetterFloat] Error waiting for Resq:', error);
		});
}
