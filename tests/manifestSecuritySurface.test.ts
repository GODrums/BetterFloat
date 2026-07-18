import { describe, expect, test } from 'bun:test';
import { securitySurface } from '../scripts/manifestSecuritySurface';

describe('securitySurface', () => {
	test('normalizes set-like fields without broadening them', () => {
		const surface = securitySurface({
			permissions: ['storage', 'notifications', 'storage'],
			host_permissions: ['https://*.example.com/*'],
			content_scripts: [{ matches: ['https://*.example.com/*'], run_at: 'document_end' }],
			web_accessible_resources: [{ resources: ['main.js'], matches: ['https://*.example.com/*'] }],
		});
		expect(surface.permissions).toEqual(['notifications', 'storage']);
		expect(surface.host_permissions).toEqual(['https://*.example.com/*']);
		expect(surface.content_scripts).toEqual([{ matches: ['https://*.example.com/*'], run_at: 'document_end' }]);
		expect(surface.war_matches).toEqual(['https://*.example.com/*']);
	});
});
