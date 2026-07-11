import pageStyle0 from '../src/css/common_styles.css?inline';
import pageStyle1 from '../src/css/skinsmonkey_styles.css?inline';
import { injectPageStyles } from '../src/lib/util/content-styles';

export default defineContentScript({
	matches: ['*://*.skinsmonkey.com/*'],
	runAt: 'document_end',
	async main() {
		injectPageStyles('skinsmonkey', [pageStyle0, pageStyle1]);
		await import('../src/contents/skinsmonkey/index');
	},
});
