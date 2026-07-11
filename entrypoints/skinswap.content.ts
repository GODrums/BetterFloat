import pageStyle0 from '../src/css/common_styles.css?inline';
import pageStyle1 from '../src/css/skinswap_styles.css?inline';
import { injectPageStyles } from '../src/lib/util/content-styles';

export default defineContentScript({
	matches: ['*://*.skinswap.com/*'],
	runAt: 'document_end',
	async main() {
		injectPageStyles('skinswap', [pageStyle0, pageStyle1]);
		await import('../src/contents/skinswap/index');
	},
});
