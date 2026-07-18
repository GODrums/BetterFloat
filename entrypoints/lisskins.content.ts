import pageStyle0 from '../src/css/common_styles.css?inline';
import pageStyle1 from '../src/css/lisskins_styles.css?inline';
import { injectPageStyles } from '../src/lib/util/content-styles';

export default defineContentScript({
	matches: ['https://lis-skins.com/*'],
	runAt: 'document_end',
	async main() {
		injectPageStyles('lisskins', [pageStyle0, pageStyle1]);
		await import('../src/contents/lisskins/index');
	},
});
