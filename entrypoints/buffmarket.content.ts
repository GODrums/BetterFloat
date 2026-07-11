import pageStyle2 from '../src/css/buffmarket_styles.css?inline';
import pageStyle1 from '../src/css/common_styles.css?inline';
import pageStyle0 from '../src/css/hint.min.css?inline';
import { injectPageStyles } from '../src/lib/util/content-styles';

export default defineContentScript({
	matches: ['https://*.buff.market/*'],
	runAt: 'document_end',
	async main() {
		injectPageStyles('buffmarket', [pageStyle0, pageStyle1, pageStyle2]);
		await import('../src/contents/buffmarket/index');
	},
});
