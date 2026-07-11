import pageStyle1 from '../src/css/common_styles.css?inline';
import pageStyle2 from '../src/css/csfloat_styles.css?inline';
import pageStyle0 from '../src/css/hint.min.css?inline';
import { injectPageStyles } from '../src/lib/util/content-styles';

export default defineContentScript({
	matches: ['https://*.csfloat.com/*'],
	runAt: 'document_end',
	async main() {
		injectPageStyles('csfloat', [pageStyle0, pageStyle1, pageStyle2]);
		await import('../src/contents/csfloat/index');
	},
});
