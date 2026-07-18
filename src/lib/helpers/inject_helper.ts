import { injectScript as injectMainWorldScript } from 'wxt/utils/inject-script';

// inject script into page
export function injectScript() {
	void injectMainWorldScript('/betterfloat-main.js');
}
