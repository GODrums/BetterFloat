import type { PlasmoCSConfig } from 'plasmo';

import { injectScript } from '~lib/helpers/inject_helper';

import { initCSFloat } from './modules/bootstrap';

export const config: PlasmoCSConfig = {
	matches: ['https://*.csfloat.com/*'],
	run_at: 'document_end',
	css: ['../../css/hint.min.css', '../../css/common_styles.css', '../../css/csfloat_styles.css'],
};

if (navigator.userAgent.includes('Firefox')) {
	injectScript();
}

void initCSFloat();
