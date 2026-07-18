import pageStyle1 from '../src/css/bitskins_styles.css?inline';
import pageStyle0 from '../src/css/common_styles.css?inline';
import { injectPageStyles } from '../src/lib/util/content-styles';

export default defineContentScript({
	matches: ['*://*.bitskins.com/*'],
	runAt: 'document_end',
	async main() {
		injectPageStyles('bitskins', [pageStyle0, pageStyle1]);
		await import('../src/contents/bitskins/index');
	},
});
