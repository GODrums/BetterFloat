import pageStyle0 from '../src/css/common_styles.css?inline';
import pageStyle1 from '../src/css/skinflow_styles.css?inline';
import { injectPageStyles } from '../src/lib/util/content-styles';

export default defineContentScript({
	matches: ['*://*.skinflow.gg/*'],
	runAt: 'document_end',
	async main() {
		injectPageStyles('skinflow', [pageStyle0, pageStyle1]);
		await import('../src/contents/skinflow/index');
	},
});
