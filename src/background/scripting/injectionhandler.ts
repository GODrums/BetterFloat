import { addScript } from '~lib/util/inject';

/**
 * Trading sites that support BetterFloat injection
 * These domains are used by the background script to determine when to inject this script
 */
export const INJECTION_DOMAINS = [
	'csfloat.com',
	'skinport.com',
	'skinbid.com',
	'buff.market',
	'cs.money',
	'dmarket.com',
	'skinbaron.de',
	'bitskins.com',
	'shadowpay.com',
	'waxpeer.com',
	'swap.gg',
	'white.market',
	'tradeit.gg',
];

/**
 * Main injection logic that will be executed in the page context
 * This function is called when the script is injected via chrome.scripting.executeScript
 */
export function executeInjection(tabId: number) {
	// Don't inject into blog pages
	if (location.hostname.includes('blog.')) {
		console.log('[BetterFloat] Skipping injection for blog page');
		return;
	}

	// Inject the main script immediately
	chrome.scripting
		.executeScript({
			target: { tabId },
			func: addScript,
			injectImmediately: true,
			world: 'MAIN', // Inject into the main world for better timing
		})
		.catch((error) => {
			console.debug('[BetterFloat] Injection error (expected for some pages):', error);
		});
}
