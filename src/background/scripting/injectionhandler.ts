import { addScript } from '~lib/util/inject';
import resqOriginal from '~lib/vendors/resq';
import { injectResq } from './resq';

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
	'avan.market',
	'skinsmonkey.com',
	'skinout.gg',
	'gamerpay.gg',
];

/**
 * Main injection logic that will be executed in the page context
 * This function is called when the script is injected via chrome.scripting.executeScript
 */
export function executeInjection(tabId: number, url: string) {
	if (url.includes('gamerpay.gg')) {
		injectResqForGamerpay(tabId);
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

async function injectResqForGamerpay(tabId: number) {
	console.log('[BetterFloat] Injecting Resq for Gamerpay...');
	try {
		// NEVER USE FILE INJECTION, IT DOESN'T WORK IN PROD AND FIREFOX
		const injectionResult = await chrome.scripting.executeScript({
			target: { tabId },
			func: resqOriginal,
			injectImmediately: true,
			world: 'MAIN',
		});
		console.log('[BetterFloat] Resq injection result:', injectionResult.pop()?.result);

		// Inject the resq extractor after the library is loaded
		await chrome.scripting.executeScript({
			target: { tabId },
			func: injectResq,
			world: 'MAIN',
		});
	} catch (error) {
		console.error('[BetterFloat] Function injection failed:', error);
	}
}
