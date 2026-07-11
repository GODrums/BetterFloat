import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import Popup from '../../src/popup/index';

createRoot(document.getElementById('root')!).render(
	<StrictMode>
		<Popup />
	</StrictMode>
);
