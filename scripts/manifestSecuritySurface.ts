#!/usr/bin/env bun
import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { dirname, resolve } from 'node:path';

type Manifest = Record<string, any>;

const targets = {
	chrome: {
		baseline: 'tests/fixtures/manifests/chrome-mv3-security-surface.json',
		plasmo: 'build/chrome-mv3-prod/manifest.json',
		wxt: '.output/chrome-mv3/manifest.json',
	},
	firefox: {
		baseline: 'tests/fixtures/manifests/firefox-mv3-security-surface.json',
		plasmo: 'build/firefox-mv3-prod/manifest.json',
		wxt: '.output/firefox-mv3/manifest.json',
	},
};

const sorted = (values: unknown): string[] => [...new Set(Array.isArray(values) ? values : [])].sort();

export function securitySurface(manifest: Manifest) {
	return {
		content_scripts: (manifest.content_scripts ?? [])
			.map((script: Manifest) => ({ matches: sorted(script.matches), run_at: script.run_at ?? null }))
			.sort((a: Manifest, b: Manifest) => (a.matches[0] ?? '').localeCompare(b.matches[0] ?? '')),
		externally_connectable: sorted(manifest.externally_connectable?.matches),
		gecko: manifest.browser_specific_settings?.gecko ?? null,
		host_permissions: sorted(manifest.host_permissions),
		key: manifest.key ?? null,
		optional_host_permissions: sorted(manifest.optional_host_permissions),
		optional_permissions: sorted(manifest.optional_permissions),
		permissions: sorted(manifest.permissions),
		war_matches: sorted((manifest.web_accessible_resources ?? []).flatMap((resource: Manifest) => resource.matches ?? [])),
	};
}

function plasmoBaselineSecuritySurface(browser: string, manifest: Manifest) {
	const surface = securitySurface(manifest);
	// Firefox enables the omnibox API through the top-level manifest key;
	// listing "omnibox" as an API permission is invalid and only retained by Chrome.
	if (browser === 'firefox') surface.permissions = surface.permissions.filter((permission) => permission !== 'omnibox');
	return surface;
}

async function readJson(path: string) {
	return JSON.parse(await readFile(resolve(path), 'utf8'));
}

async function main() {
	const command = process.argv[2];
	if (command === 'baseline') {
		if (!process.argv.includes('--update')) throw new Error('Refusing to overwrite manifest fixtures without --update');
		for (const [browser, paths] of Object.entries(targets)) {
			const output = `${JSON.stringify(plasmoBaselineSecuritySurface(browser, await readJson(paths.plasmo)), null, 2)}\n`;
			await mkdir(dirname(paths.baseline), { recursive: true });
			await writeFile(paths.baseline, output);
			console.log(`Updated ${browser} security fixture`);
		}
		return;
	}
	if (command !== 'check') throw new Error('Usage: manifestSecuritySurface.ts baseline --update | check');

	let failed = false;
	for (const [browser, paths] of Object.entries(targets)) {
		const expected = await readJson(paths.baseline);
		const actual = securitySurface(await readJson(paths.wxt));
		if (JSON.stringify(expected) !== JSON.stringify(actual)) {
			failed = true;
			console.error(`${browser} compiled security surface differs from the Plasmo baseline`);
			console.error(JSON.stringify({ expected, actual }, null, 2));
		} else {
			console.log(`✓ ${browser} compiled security surface matches the Plasmo baseline`);
		}
	}
	if (failed) process.exit(1);
}

if (import.meta.main) await main();
