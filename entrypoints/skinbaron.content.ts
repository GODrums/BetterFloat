import pageStyle0 from '../src/css/common_styles.css?inline';
import pageStyle1 from '../src/css/skinbaron_styles.css?inline';
import { injectPageStyles } from '../src/lib/util/content-styles';

export default defineContentScript({
	matches: ['*://*.skinbaron.de/*'],
	runAt: 'document_end',
	async main() {
		injectPageStyles('skinbaron', [pageStyle0, pageStyle1]);
		await import('../src/contents/skinbaron/index');
	},
});
