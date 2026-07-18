import pageStyle0 from '../src/css/common_styles.css?inline';
import pageStyle1 from '../src/css/tradeit_styles.css?inline';
import { injectPageStyles } from '../src/lib/util/content-styles';

export default defineContentScript({
	matches: ['https://*.tradeit.gg/*'],
	runAt: 'document_end',
	async main() {
		injectPageStyles('tradeit', [pageStyle0, pageStyle1]);
		await import('../src/contents/tradeit/index');
	},
});
