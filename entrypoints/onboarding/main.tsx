import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import Onboarding from '../../src/tabs/onboarding';

createRoot(document.getElementById('root')!).render(
	<StrictMode>
		<Onboarding />
	</StrictMode>
);
