import { readFile } from 'node:fs/promises';
import { resolve } from 'node:path';

type ManifestWithScripts = {
	background?: {
		scripts?: string[];
		service_worker?: string;
	};
	content_scripts?: Array<{
		css?: string[];
		js?: string[];
	}>;
};

export function isUnicodeNoncharacter(codePoint: number): boolean {
	return (codePoint >= 0xfdd0 && codePoint <= 0xfdef) || (codePoint & 0xfffe) === 0xfffe;
}

function escapeCodePoint(codePoint: number): string {
	if (codePoint <= 0xffff) return `\\u${codePoint.toString(16).padStart(4, '0')}`;

	const value = codePoint - 0x10000;
	const highSurrogate = 0xd800 + (value >> 10);
	const lowSurrogate = 0xdc00 + (value & 0x3ff);
	return `\\u${highSurrogate.toString(16)}\\u${lowSurrogate.toString(16)}`;
}

export function escapeChromiumRejectedCharacters(source: string): string {
	let escaped = '';
	let lastCopiedIndex = 0;

	for (let index = 0; index < source.length; ) {
		const codePoint = source.codePointAt(index)!;
		const characterLength = codePoint > 0xffff ? 2 : 1;

		if (isUnicodeNoncharacter(codePoint)) {
			escaped += source.slice(lastCopiedIndex, index) + escapeCodePoint(codePoint);
			lastCopiedIndex = index + characterLength;
		}

		index += characterLength;
	}

	return lastCopiedIndex === 0 ? source : escaped + source.slice(lastCopiedIndex);
}

async function assertChromiumCompatibleUtf8(filePath: string): Promise<void> {
	const contents = await readFile(filePath);
	let source: string;

	try {
		source = new TextDecoder('utf-8', { fatal: true }).decode(contents);
	} catch (error) {
		throw new Error(`${filePath} is not structurally valid UTF-8`, { cause: error });
	}

	for (const character of source) {
		const codePoint = character.codePointAt(0)!;
		if (isUnicodeNoncharacter(codePoint)) {
			throw new Error(`${filePath} contains Unicode noncharacter U+${codePoint.toString(16).toUpperCase()}, which Chromium rejects as invalid UTF-8`);
		}
	}
}

export async function validateChromiumManifestScripts(outputDirectory: string, manifest: ManifestWithScripts): Promise<void> {
	const files = new Set<string>();

	for (const contentScript of manifest.content_scripts ?? []) {
		for (const file of contentScript.js ?? []) files.add(file);
		for (const file of contentScript.css ?? []) files.add(file);
	}

	for (const file of manifest.background?.scripts ?? []) files.add(file);
	if (manifest.background?.service_worker) files.add(manifest.background.service_worker);

	await Promise.all([...files].map((file) => assertChromiumCompatibleUtf8(resolve(outputDirectory, file))));
}
