import type { PlasmoCSConfig } from 'plasmo';
import { getAllSettings, type IStorage } from '~lib/util/storage';

export const config: PlasmoCSConfig = {
	matches: ['*://*.youpin898.com/*'],
	run_at: 'document_end',
	css: ['../css/hint.min.css', '../css/common_styles.css', '../css/youpin_styles.css'],
};

async function init() {
	console.time('[BetterFloat] Youpin init timer');

	if (location.host !== 'youpin898.com') {
		return;
	}

	extensionSettings = await getAllSettings();

	if (!extensionSettings['uu-enable']) return;
}

let extensionSettings: IStorage;

init();
