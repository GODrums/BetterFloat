import pageStyle0 from '../src/css/common_styles.css?inline';
import pageStyle1 from '../src/css/youpin_styles.css?inline';
import { injectPageStyles } from '../src/lib/util/content-styles';

export default defineContentScript({
	matches: ['*://*.youpin898.com/*'],
	runAt: 'document_end',
	async main() {
		injectPageStyles('youpin', [pageStyle0, pageStyle1]);
		await import('../src/contents/youpin/index');
	},
});
