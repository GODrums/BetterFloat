import pageStyle0 from '../src/css/common_styles.css?inline';
import pageStyle1 from '../src/css/haloskins_styles.css?inline';
import { injectPageStyles } from '../src/lib/util/content-styles';

export default defineContentScript({
	matches: ['*://*.haloskins.com/*'],
	runAt: 'document_end',
	async main() {
		injectPageStyles('haloskins', [pageStyle0, pageStyle1]);
		await import('../src/contents/haloskins/index');
	},
});
