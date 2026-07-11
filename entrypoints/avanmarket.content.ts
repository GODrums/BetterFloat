import pageStyle1 from '../src/css/avan_styles.css?inline';
import pageStyle0 from '../src/css/common_styles.css?inline';
import { injectPageStyles } from '../src/lib/util/content-styles';

export default defineContentScript({
	matches: ['*://*.avan.market/*'],
	runAt: 'document_end',
	async main() {
		injectPageStyles('avanmarket', [pageStyle0, pageStyle1]);
		await import('../src/contents/avanmarket/index');
	},
});
