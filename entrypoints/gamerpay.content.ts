import pageStyle0 from '../src/css/common_styles.css?inline';
import pageStyle1 from '../src/css/gamerpay_styles.css?inline';
import { injectPageStyles } from '../src/lib/util/content-styles';

export default defineContentScript({
	matches: ['*://*.gamerpay.gg/*'],
	runAt: 'document_end',
	async main() {
		injectPageStyles('gamerpay', [pageStyle0, pageStyle1]);
		await import('../src/contents/gamerpay/index');
	},
});
