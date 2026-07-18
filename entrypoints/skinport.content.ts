import pageStyle0 from '../src/css/common_styles.css?inline';
import pageStyle1 from '../src/css/skinport_styles.css?inline';
import { injectPageStyles } from '../src/lib/util/content-styles';

export default defineContentScript({
	matches: ['https://*.skinport.com/*'],
	runAt: 'document_idle',
	async main() {
		injectPageStyles('skinport', [pageStyle0, pageStyle1]);
		await import('../src/contents/skinport/index');
	},
});
