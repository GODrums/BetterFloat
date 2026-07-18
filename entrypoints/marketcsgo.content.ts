import pageStyle0 from '../src/css/common_styles.css?inline';
import pageStyle1 from '../src/css/marketcsgo_styles.css?inline';
import { injectPageStyles } from '../src/lib/util/content-styles';

export default defineContentScript({
	matches: ['*://*.market.csgo.com/*'],
	runAt: 'document_end',
	async main() {
		injectPageStyles('marketcsgo', [pageStyle0, pageStyle1]);
		await import('../src/contents/marketcsgo/index');
	},
});
