declare global {
	interface Window {
		resq: ResqModule;
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
	function waitForResq(maxAttempts = 10, interval = 200): Promise<void> {
		return new Promise((resolve, reject) => {
			let attempts = 0;

			const checkResq = () => {
				attempts++;

				if (window.resq && typeof window.resq.resq$ === 'function') {
					console.log('[BetterFloat] Resq found and ready!');
					resolve();
					return;
				}

				if (attempts >= maxAttempts) {
					console.error(`[BetterFloat] Resq not available after ${maxAttempts} attempts`);
					reject(new Error(`Resq not available after ${maxAttempts} attempts`));
					return;
				}

				setTimeout(checkResq, interval);
			};

			checkResq();
		});
	}

	// Gamerpay-specific resq extraction
	if (location.hostname === 'gamerpay.gg') {
		// Add a fallback check to see if resq might already be available
		if (window.resq && typeof window.resq.resq$ === 'function') {
			setupGamerpayExtractor();
		} else {
			waitForResq().then(() => {
				setupGamerpayExtractor();
			});
		}
	}

	function setupGamerpayExtractor() {
		try {
			// Extract React component data from an element
			async function extractReactData(selector: string, element?: HTMLElement): Promise<any> {
				try {
					if (!window.resq || typeof window.resq.resq$ !== 'function') {
						console.warn('[BetterFloat] Resq not available for extraction');
						return null;
					}

					return window.resq.resq$(selector, element);
				} catch (error) {
					console.warn('[BetterFloat] Error extracting React data:', error);
				}
				return null;
			}

			async function processItemCard(element: HTMLElement) {
				const reactData = await extractReactData('*', element);
				const props = reactData?.children?.[0]?.props ?? reactData?.props;
				if (props) {
					// Dispatch custom event to notify content script
					element.dispatchEvent(
						new CustomEvent('betterfloat-data-ready', {
							bubbles: true,
							detail: { props: JSON.stringify(props), type: 'card' },
						})
					);
				}
			}

			async function processItemPage(element: HTMLElement) {
				const reactData = await extractReactData('z', element);
				if (reactData) {
					element.dispatchEvent(new CustomEvent('betterfloat-data-ready', { bubbles: true, detail: { props: JSON.stringify(reactData.props), type: 'page' } }));
				}
			}

			// Observer to watch for new item cards
			const observer = new MutationObserver(async (mutations) => {
				for (const mutation of mutations) {
					for (const node of mutation.addedNodes) {
						if (node.nodeType === Node.ELEMENT_NODE) {
							const element = node as HTMLElement;
							// console.log('[BetterFloat] Mutation:', element);

							// Check if it's an item card
							if (element.className?.includes('ItemCard_wrapper')) {
								await processItemCard(element);
							} else if (element.className?.includes('Item_sellerDesktop__')) {
								await processItemPage(element.parentElement!);
							}

							// Check for item cards within the added node
							if (element.querySelectorAll) {
								const itemCards = element.querySelectorAll('[class*="ItemCard_wrapper"]');
								for (const card of itemCards) {
									await processItemCard(card as HTMLElement);
								}
							}
						}
					}
				}
			});

			// Start observing
			observer.observe(document.body, {
				childList: true,
				subtree: true,
			});

			// Process existing item cards
			async function processExistingCards() {
				const existingCards = document.querySelectorAll('[class*="ItemCard_wrapper"]');
				console.log(`[BetterFloat] Found ${existingCards.length} existing item cards to process`);
				for (const card of existingCards) {
					await processItemCard(card as HTMLElement);
				}
			}

			// Wait for DOM to be ready, then process existing cards
			if (document.readyState === 'loading') {
				document.addEventListener('DOMContentLoaded', processExistingCards);
			} else {
				processExistingCards();
			}

			console.log('[BetterFloat] Gamerpay resq extractor setup complete');
		} catch (error) {
			console.error('[BetterFloat] Error in setupGamerpayExtractor:', error);
		}
	}
}
