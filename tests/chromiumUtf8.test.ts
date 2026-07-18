import { describe, expect, test } from 'bun:test';
import { escapeChromiumRejectedCharacters, isUnicodeNoncharacter } from '../scripts/chromiumUtf8';

describe('Chromium-compatible UTF-8', () => {
	test('escapes Unicode noncharacters without changing other Unicode', () => {
		expect(escapeChromiumRejectedCharacters('a\u{ffff}b\u{10ffff}c€')).toBe('a\\uffffb\\udbff\\udfffc€');
	});

	test('recognizes every noncharacter range', () => {
		expect(isUnicodeNoncharacter(0xfdcf)).toBe(false);
		expect(isUnicodeNoncharacter(0xfdd0)).toBe(true);
		expect(isUnicodeNoncharacter(0xfdef)).toBe(true);
		expect(isUnicodeNoncharacter(0xfdf0)).toBe(false);
		expect(isUnicodeNoncharacter(0xfffe)).toBe(true);
		expect(isUnicodeNoncharacter(0x1ffff)).toBe(true);
		expect(isUnicodeNoncharacter(0x10ffff)).toBe(true);
	});
});
