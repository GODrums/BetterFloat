#!/usr/bin/env bun
/**
 * This script checks for permission increases in the manifest.json file.
 *
 * Usage: bun run scripts/checkPermissionIncrease.ts <old-manifest-path> <new-manifest-path> [--json]
 */

import { readFile } from 'node:fs/promises';
import path from 'node:path';

export type WarningCategory =
	| 'accessibility_modify'
	| 'accessibility_read'
	| 'bookmarks'
	| 'clipboard_read'
	| 'clipboard_write'
	| 'content_settings'
	| 'debugger_backend'
	| 'all_sites_data'
	| 'block_content'
	| 'browsing_history'
	| 'screen_capture'
	| 'downloads'
	| 'favicon'
	| 'geolocation'
	| 'signed_in_history_read_change'
	| 'email_address'
	| 'management'
	| 'native_messaging'
	| 'display_notifications'
	| 'privacy_settings'
	| 'reading_list'
	| 'signed_in_history_read'
	| 'storage_devices'
	| 'tab_groups'
	| 'top_sites'
	| 'tts_engine'
	| 'web_navigation_history';

export type ParsedManifest = {
	path: string;
	manifestVersion: number;
	permissions: string[];
	hostPermissions: string[];
	optionalPermissions: string[];
	optionalHostPermissions: string[];
	contentScriptMatches: string[];
};

export type EffectivePermissionSurface = {
	requiredPermissions: Set<string>;
	requiredHostPatterns: Set<string>;
	optionalPermissions: Set<string>;
	optionalHostPatterns: Set<string>;
	warningCategories: Set<WarningCategory>;
};

export type DetectionReason = {
	kind: 'permission' | 'host';
	source: 'permissions' | 'host_permissions' | 'content_scripts.matches';
	value: string;
	warningCategory: WarningCategory | 'host_access';
};

export type CheckResult = {
	requiresReacceptance: boolean;
	oldManifestPath: string;
	newManifestPath: string;
	addedWarningCategories: string[];
	addedRequiredPermissions: string[];
	addedRequiredHostPatterns: string[];
	ignoredOptionalPermissionChanges: {
		permissions: string[];
		hostPermissions: string[];
	};
	reasons: DetectionReason[];
};

type ManifestLike = {
	manifest_version?: unknown;
	permissions?: unknown;
	host_permissions?: unknown;
	optional_permissions?: unknown;
	optional_host_permissions?: unknown;
	content_scripts?: unknown;
};

type HostPatternEntry = {
	normalized: string;
	original: string;
	source: DetectionReason['source'];
};

type SurfaceDetails = {
	surface: EffectivePermissionSurface;
	requiredPermissionEntries: Map<string, string>;
	requiredHostEntries: Map<string, HostPatternEntry>;
	optionalPermissionEntries: Map<string, string>;
	optionalHostEntries: Map<string, HostPatternEntry>;
	warningReasonMap: Map<WarningCategory, DetectionReason[]>;
};

type MatchScheme = '*' | 'http' | 'https' | 'file' | 'ftp' | 'ws' | 'wss';

type ParsedPattern =
	| {
			kind: 'all_urls';
	  }
	| {
			kind: 'match';
			scheme: MatchScheme;
			hostKind: 'any' | 'wildcard' | 'exact' | 'file';
			hostValue: string;
	  };

const PERMISSION_WARNING_MAP: Record<string, WarningCategory[]> = {
	'accessibilityFeatures.modify': ['accessibility_modify'],
	'accessibilityFeatures.read': ['accessibility_read'],
	bookmarks: ['bookmarks'],
	clipboardRead: ['clipboard_read'],
	clipboardWrite: ['clipboard_write'],
	contentSettings: ['content_settings'],
	debugger: ['debugger_backend', 'all_sites_data'],
	declarativeNetRequest: ['block_content'],
	declarativeNetRequestFeedback: [],
	desktopCapture: ['screen_capture'],
	downloads: ['downloads'],
	'downloads.open': ['downloads'],
	'downloads.ui': ['downloads'],
	favicon: ['favicon'],
	geolocation: ['geolocation'],
	history: ['signed_in_history_read_change'],
	'identity.email': ['email_address'],
	management: ['management'],
	nativeMessaging: ['native_messaging'],
	notifications: ['display_notifications'],
	pageCapture: ['all_sites_data'],
	privacy: ['privacy_settings'],
	proxy: ['all_sites_data'],
	readingList: ['reading_list'],
	system: [],
	'system.storage': ['storage_devices'],
	tabCapture: ['all_sites_data'],
	tabGroups: ['tab_groups'],
	tabs: ['browsing_history'],
	topSites: ['top_sites'],
	ttsEngine: ['tts_engine'],
	webAuthenticationProxy: ['all_sites_data'],
	webNavigation: ['browsing_history'],
};

const SUPPORTED_MATCH_PATTERN_REGEX = /^(?<scheme>\*|http|https|file|ftp|ws|wss):\/\/(?<host>[^/]*)(?<path>\/.*)?$/;

function exitWithError(message: string): never {
	console.error(message);
	process.exit(1);
}

function getUsage(): string {
	return 'Usage: bun run scripts/checkPermissionIncrease.ts <old-manifest-path> <new-manifest-path> [--json]';
}

function assertStringArray(value: unknown, fieldName: string): string[] {
	if (value === undefined) {
		return [];
	}

	if (!Array.isArray(value) || value.some((entry) => typeof entry !== 'string')) {
		throw new Error(`Expected "${fieldName}" to be an array of strings.`);
	}

	return value.map((entry) => entry.trim()).filter(Boolean);
}

function normalizePermissionEntries(permissions: string[]): Map<string, string> {
	const normalized = new Map<string, string>();

	for (const permission of permissions) {
		if (!normalized.has(permission)) {
			normalized.set(permission, permission);
		}
	}

	return normalized;
}

function parseMatchPattern(pattern: string): ParsedPattern | null {
	const trimmed = pattern.trim();
	if (!trimmed) {
		return null;
	}

	if (trimmed === '<all_urls>') {
		return { kind: 'all_urls' };
	}

	const match = trimmed.match(SUPPORTED_MATCH_PATTERN_REGEX);
	if (!match?.groups) {
		return null;
	}

	const scheme = match.groups.scheme as MatchScheme;
	const rawHost = match.groups.host.toLowerCase();

	if (scheme === 'file') {
		return { kind: 'match', scheme, hostKind: 'file', hostValue: '' };
	}

	if (!rawHost) {
		return null;
	}

	if (rawHost === '*') {
		return { kind: 'match', scheme, hostKind: 'any', hostValue: '*' };
	}

	if (rawHost.startsWith('*.')) {
		const hostValue = rawHost.slice(2);
		if (!hostValue) {
			return null;
		}

		return { kind: 'match', scheme, hostKind: 'wildcard', hostValue };
	}

	return { kind: 'match', scheme, hostKind: 'exact', hostValue: rawHost };
}

function normalizeHostPattern(pattern: string): string {
	const parsed = parseMatchPattern(pattern);
	if (!parsed) {
		return pattern.trim();
	}

	if (parsed.kind === 'all_urls') {
		return '<all_urls>';
	}

	if (parsed.hostKind === 'file') {
		return 'file:///*';
	}

	if (parsed.hostKind === 'wildcard') {
		return `${parsed.scheme}://*.${parsed.hostValue}/*`;
	}

	return `${parsed.scheme}://${parsed.hostValue}/*`;
}

function normalizeHostEntries(patterns: HostPatternEntry[]): Map<string, HostPatternEntry> {
	const normalized = new Map<string, HostPatternEntry>();

	for (const entry of patterns) {
		const canonical = normalizeHostPattern(entry.original);
		if (!normalized.has(canonical)) {
			normalized.set(canonical, { ...entry, normalized: canonical });
		}
	}

	return normalized;
}

function parseManifestShape(value: unknown): ManifestLike {
	if (!value || typeof value !== 'object' || Array.isArray(value)) {
		throw new Error('Manifest must be a JSON object.');
	}

	return value as ManifestLike;
}

function extractContentScriptMatches(contentScripts: unknown): string[] {
	if (contentScripts === undefined) {
		return [];
	}

	if (!Array.isArray(contentScripts)) {
		throw new Error('Expected "content_scripts" to be an array.');
	}

	const matches: string[] = [];

	for (const [index, contentScript] of contentScripts.entries()) {
		if (!contentScript || typeof contentScript !== 'object' || Array.isArray(contentScript)) {
			throw new Error(`Expected "content_scripts[${index}]" to be an object.`);
		}

		const scriptMatches = assertStringArray((contentScript as { matches?: unknown }).matches, `content_scripts[${index}].matches`);

		matches.push(...scriptMatches);
	}

	return matches;
}

export async function parseManifestFile(manifestPath: string): Promise<ParsedManifest> {
	const resolvedPath = path.resolve(manifestPath);
	const fileName = path.basename(resolvedPath);

	if (fileName === 'package.json') {
		throw new Error(`Only built Chrome manifests are supported. Received "${resolvedPath}".`);
	}

	if (path.extname(resolvedPath) !== '.json' || fileName !== 'manifest.json') {
		throw new Error(`Expected a built Chrome manifest file named "manifest.json". Received "${resolvedPath}".`);
	}

	let rawText: string;
	try {
		rawText = await readFile(resolvedPath, 'utf8');
	} catch (error) {
		throw new Error(`Failed to read manifest "${resolvedPath}": ${(error as Error).message}`);
	}

	let manifestJson: unknown;
	try {
		manifestJson = JSON.parse(rawText);
	} catch (error) {
		throw new Error(`Failed to parse manifest "${resolvedPath}" as JSON: ${(error as Error).message}`);
	}

	const manifest = parseManifestShape(manifestJson);

	if (manifest.manifest_version !== 3) {
		throw new Error(`Expected "${resolvedPath}" to be a Chrome Manifest V3 file.`);
	}

	return {
		path: resolvedPath,
		manifestVersion: 3,
		permissions: [...normalizePermissionEntries(assertStringArray(manifest.permissions, 'permissions')).keys()].sort(),
		hostPermissions: [
			...normalizeHostEntries(
				assertStringArray(manifest.host_permissions, 'host_permissions').map((host) => ({
					normalized: '',
					original: host,
					source: 'host_permissions' as const,
				}))
			).keys(),
		].sort(),
		optionalPermissions: [...normalizePermissionEntries(assertStringArray(manifest.optional_permissions, 'optional_permissions')).keys()].sort(),
		optionalHostPermissions: [
			...normalizeHostEntries(
				assertStringArray(manifest.optional_host_permissions, 'optional_host_permissions').map((host) => ({
					normalized: '',
					original: host,
					source: 'host_permissions' as const,
				}))
			).keys(),
		].sort(),
		contentScriptMatches: [
			...normalizeHostEntries(
				extractContentScriptMatches(manifest.content_scripts).map((match) => ({
					normalized: '',
					original: match,
					source: 'content_scripts.matches' as const,
				}))
			).keys(),
		].sort(),
	};
}

function addReason(reasonMap: Map<WarningCategory, DetectionReason[]>, reason: DetectionReason): void {
	const existing = reasonMap.get(reason.warningCategory as WarningCategory) ?? [];
	if (!existing.some((entry) => entry.kind === reason.kind && entry.source === reason.source && entry.value === reason.value)) {
		existing.push(reason);
		reasonMap.set(reason.warningCategory as WarningCategory, existing);
	}
}

function hasAllUrlsEquivalentHostAccess(requiredHostPatterns: Set<string>): boolean {
	if (requiredHostPatterns.has('<all_urls>') || requiredHostPatterns.has('*://*/*')) {
		return true;
	}

	return requiredHostPatterns.has('http://*/*') && requiredHostPatterns.has('https://*/*');
}

function buildSurfaceDetails(manifest: ParsedManifest): SurfaceDetails {
	const requiredPermissionEntries = normalizePermissionEntries(manifest.permissions);
	const optionalPermissionEntries = normalizePermissionEntries(manifest.optionalPermissions);
	const requiredHostEntries = normalizeHostEntries([
		...manifest.hostPermissions.map((host) => ({
			normalized: '',
			original: host,
			source: 'host_permissions' as const,
		})),
		...manifest.contentScriptMatches.map((host) => ({
			normalized: '',
			original: host,
			source: 'content_scripts.matches' as const,
		})),
	]);
	const optionalHostEntries = normalizeHostEntries(
		manifest.optionalHostPermissions.map((host) => ({
			normalized: '',
			original: host,
			source: 'host_permissions' as const,
		}))
	);

	const warningCategories = new Set<WarningCategory>();
	const warningReasonMap = new Map<WarningCategory, DetectionReason[]>();
	const requiredHostPatterns = new Set(requiredHostEntries.keys());
	const requiredPermissions = new Set(requiredPermissionEntries.keys());
	const hasAllUrlsHosts = hasAllUrlsEquivalentHostAccess(requiredHostPatterns);

	for (const permission of [...requiredPermissionEntries.keys()].sort()) {
		const categories = PERMISSION_WARNING_MAP[permission] ?? [];
		for (const category of categories) {
			if (permission === 'tabs' && category === 'browsing_history' && hasAllUrlsHosts) {
				continue;
			}

			warningCategories.add(category);
			addReason(warningReasonMap, {
				kind: 'permission',
				source: 'permissions',
				value: permission,
				warningCategory: category,
			});
		}
	}

	if (requiredPermissions.has('sessions') && requiredPermissions.has('tabs') && !requiredPermissions.has('history')) {
		warningCategories.add('signed_in_history_read');
		addReason(warningReasonMap, {
			kind: 'permission',
			source: 'permissions',
			value: 'sessions',
			warningCategory: 'signed_in_history_read',
		});
		addReason(warningReasonMap, {
			kind: 'permission',
			source: 'permissions',
			value: 'tabs',
			warningCategory: 'signed_in_history_read',
		});
	}

	if (requiredPermissions.has('sessions') && requiredPermissions.has('history')) {
		warningCategories.add('signed_in_history_read_change');
		addReason(warningReasonMap, {
			kind: 'permission',
			source: 'permissions',
			value: 'sessions',
			warningCategory: 'signed_in_history_read_change',
		});
		addReason(warningReasonMap, {
			kind: 'permission',
			source: 'permissions',
			value: 'history',
			warningCategory: 'signed_in_history_read_change',
		});
	}

	return {
		surface: {
			requiredPermissions,
			requiredHostPatterns,
			optionalPermissions: new Set(optionalPermissionEntries.keys()),
			optionalHostPatterns: new Set(optionalHostEntries.keys()),
			warningCategories,
		},
		requiredPermissionEntries,
		requiredHostEntries,
		optionalPermissionEntries,
		optionalHostEntries,
		warningReasonMap,
	};
}

function schemeCovers(oldScheme: MatchScheme, newScheme: MatchScheme): boolean {
	if (oldScheme === newScheme) {
		return true;
	}

	if (oldScheme === '*') {
		return newScheme === 'http' || newScheme === 'https';
	}

	return false;
}

function hostCovers(oldPattern: Extract<ParsedPattern, { kind: 'match' }>, newPattern: Extract<ParsedPattern, { kind: 'match' }>): boolean {
	if (oldPattern.hostKind === 'any') {
		return newPattern.hostKind !== 'file';
	}

	if (oldPattern.hostKind === 'file' || newPattern.hostKind === 'file') {
		return oldPattern.hostKind === 'file' && newPattern.hostKind === 'file';
	}

	if (oldPattern.hostKind === 'exact') {
		return newPattern.hostKind === 'exact' && oldPattern.hostValue === newPattern.hostValue;
	}

	if (oldPattern.hostKind === 'wildcard') {
		if (newPattern.hostKind === 'any') {
			return false;
		}

		return newPattern.hostValue === oldPattern.hostValue || newPattern.hostValue.endsWith(`.${oldPattern.hostValue}`);
	}

	return false;
}

function buildPatternFromParsed(pattern: Extract<ParsedPattern, { kind: 'match' }>, scheme: MatchScheme): string {
	if (pattern.hostKind === 'file') {
		return 'file:///*';
	}

	if (pattern.hostKind === 'wildcard') {
		return `${scheme}://*.${pattern.hostValue}/*`;
	}

	return `${scheme}://${pattern.hostValue}/*`;
}

export function covers(oldPattern: string, newPattern: string): boolean {
	const normalizedOldPattern = normalizeHostPattern(oldPattern);
	const normalizedNewPattern = normalizeHostPattern(newPattern);

	if (normalizedOldPattern === normalizedNewPattern) {
		return true;
	}

	const parsedOldPattern = parseMatchPattern(normalizedOldPattern);
	const parsedNewPattern = parseMatchPattern(normalizedNewPattern);

	if (!parsedOldPattern || !parsedNewPattern) {
		return false;
	}

	if (parsedOldPattern.kind === 'all_urls') {
		return true;
	}

	if (parsedNewPattern.kind === 'all_urls') {
		return false;
	}

	return schemeCovers(parsedOldPattern.scheme, parsedNewPattern.scheme) && hostCovers(parsedOldPattern, parsedNewPattern);
}

function isPatternCoveredBySet(oldPatterns: string[], newPattern: string): boolean {
	if (oldPatterns.some((oldPattern) => covers(oldPattern, newPattern))) {
		return true;
	}

	const parsedNewPattern = parseMatchPattern(newPattern);
	if (!parsedNewPattern || parsedNewPattern.kind !== 'match' || parsedNewPattern.scheme !== '*') {
		return false;
	}

	const httpVariant = buildPatternFromParsed(parsedNewPattern, 'http');
	const httpsVariant = buildPatternFromParsed(parsedNewPattern, 'https');

	return oldPatterns.some((oldPattern) => covers(oldPattern, httpVariant)) && oldPatterns.some((oldPattern) => covers(oldPattern, httpsVariant));
}

function difference<T>(left: Set<T>, right: Set<T>): T[] {
	return [...left].filter((value) => !right.has(value));
}

function sortUniqueReasons(reasons: DetectionReason[]): DetectionReason[] {
	return [...new Map(reasons.map((reason) => [`${reason.kind}:${reason.source}:${reason.value}:${reason.warningCategory}`, reason])).values()].sort((left, right) => {
		if (left.kind !== right.kind) {
			return left.kind.localeCompare(right.kind);
		}

		if (left.source !== right.source) {
			return left.source.localeCompare(right.source);
		}

		if (left.value !== right.value) {
			return left.value.localeCompare(right.value);
		}

		return left.warningCategory.localeCompare(right.warningCategory);
	});
}

export async function checkPermissionIncrease(oldManifestPath: string, newManifestPath: string): Promise<CheckResult> {
	const [oldManifest, newManifest] = await Promise.all([parseManifestFile(oldManifestPath), parseManifestFile(newManifestPath)]);
	const oldDetails = buildSurfaceDetails(oldManifest);
	const newDetails = buildSurfaceDetails(newManifest);

	const addedPermissionNames = difference(newDetails.surface.requiredPermissions, oldDetails.surface.requiredPermissions).sort();
	const addedOptionalPermissions = difference(newDetails.surface.optionalPermissions, oldDetails.surface.optionalPermissions).sort();
	const addedOptionalHostPermissions = difference(newDetails.surface.optionalHostPatterns, oldDetails.surface.optionalHostPatterns).sort();

	const addedNamedWarningCategories = difference(newDetails.surface.warningCategories, oldDetails.surface.warningCategories).sort();
	const reasons: DetectionReason[] = [];

	for (const category of addedNamedWarningCategories) {
		const candidateReasons = newDetails.warningReasonMap.get(category) ?? [];
		const addedReasons = candidateReasons.filter((reason) => addedPermissionNames.includes(reason.value));
		reasons.push(...(addedReasons.length > 0 ? addedReasons : candidateReasons));
	}

	const oldRequiredHostPatterns = [...oldDetails.requiredHostEntries.keys()];
	const uncoveredHostEntries = [...newDetails.requiredHostEntries.values()]
		.filter((entry) => !isPatternCoveredBySet(oldRequiredHostPatterns, entry.normalized))
		.sort((left, right) => left.normalized.localeCompare(right.normalized));

	if (uncoveredHostEntries.length > 0) {
		for (const entry of uncoveredHostEntries) {
			reasons.push({
				kind: 'host',
				source: entry.source,
				value: entry.original,
				warningCategory: 'host_access',
			});
		}
	}

	const sortedReasons = sortUniqueReasons(reasons);
	const addedWarningCategories = [...new Set(sortedReasons.map((reason) => reason.warningCategory))].sort();
	const addedRequiredPermissions = [...new Set(sortedReasons.filter((reason) => reason.kind === 'permission').map((reason) => reason.value))].sort();
	const addedRequiredHostPatterns = [...new Set(sortedReasons.filter((reason) => reason.kind === 'host').map((reason) => reason.value))].sort();

	return {
		requiresReacceptance: sortedReasons.length > 0,
		oldManifestPath: oldManifest.path,
		newManifestPath: newManifest.path,
		addedWarningCategories,
		addedRequiredPermissions,
		addedRequiredHostPatterns,
		ignoredOptionalPermissionChanges: {
			permissions: addedOptionalPermissions,
			hostPermissions: addedOptionalHostPermissions,
		},
		reasons: sortedReasons,
	};
}

function formatHumanReadableResult(result: CheckResult): string {
	const lines = [`REQUIRES_REACCEPTANCE=${result.requiresReacceptance ? 'yes' : 'no'}`];

	if (result.requiresReacceptance) {
		lines.push(`New warning surface detected: ${result.addedWarningCategories.join(', ')}.`);
	} else {
		lines.push('No new required permission warnings detected.');
	}

	if (result.addedRequiredPermissions.length > 0) {
		lines.push(`Added required permissions: ${result.addedRequiredPermissions.join(', ')}`);
	}

	if (result.addedRequiredHostPatterns.length > 0) {
		lines.push(`Added required host access: ${result.addedRequiredHostPatterns.join(', ')}`);
	}

	if (result.ignoredOptionalPermissionChanges.permissions.length > 0 || result.ignoredOptionalPermissionChanges.hostPermissions.length > 0) {
		lines.push('Ignored optional-only additions:');
		if (result.ignoredOptionalPermissionChanges.permissions.length > 0) {
			lines.push(`optional_permissions: ${result.ignoredOptionalPermissionChanges.permissions.join(', ')}`);
		}
		if (result.ignoredOptionalPermissionChanges.hostPermissions.length > 0) {
			lines.push(`optional_host_permissions: ${result.ignoredOptionalPermissionChanges.hostPermissions.join(', ')}`);
		}
	}

	return lines.join('\n');
}

async function main(): Promise<void> {
	const args = process.argv.slice(2);
	const jsonOutput = args.includes('--json');
	const positionalArgs = args.filter((arg) => arg !== '--json');

	if (positionalArgs.length !== 2) {
		exitWithError(getUsage());
	}

	try {
		const result = await checkPermissionIncrease(positionalArgs[0], positionalArgs[1]);
		if (jsonOutput) {
			console.log(JSON.stringify(result, null, 2));
		} else {
			console.log(formatHumanReadableResult(result));
		}

		process.exit(result.requiresReacceptance ? 2 : 0);
	} catch (error) {
		exitWithError((error as Error).message);
	}
}

if (import.meta.main) {
	void main();
}
