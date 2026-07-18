import pageStyle0 from '../src/css/common_styles.css?inline';
import pageStyle1 from '../src/css/whitemarket_styles.css?inline';
import { injectPageStyles } from '../src/lib/util/content-styles';

export default defineContentScript({
	matches: ['https://*.white.market/*'],
	runAt: 'document_end',
	async main() {
		injectPageStyles('whitemarket', [pageStyle0, pageStyle1]);
		await import('../src/contents/whitemarket/index');
	},
});
