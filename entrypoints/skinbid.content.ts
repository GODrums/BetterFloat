import pageStyle0 from '../src/css/common_styles.css?inline';
import pageStyle1 from '../src/css/skinbid_styles.css?inline';
import { injectPageStyles } from '../src/lib/util/content-styles';

export default defineContentScript({
	matches: ['https://*.skinbid.com/*'],
	runAt: 'document_end',
	async main() {
		injectPageStyles('skinbid', [pageStyle0, pageStyle1]);
		await import('../src/contents/skinbid/index');
	},
});
