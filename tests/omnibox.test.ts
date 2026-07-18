import { describe, expect, test } from 'bun:test';

type InputChangedListener = (text: string, suggest: (suggestResults: chrome.omnibox.SuggestResult[]) => void) => void;

describe('omnibox suggestions', () => {
	test('loads the public market IDs asset and returns escaped suggestions', async () => {
		let inputChanged: InputChangedListener | undefined;
		let requestedUrl = '';

		globalThis.chrome = {
			omnibox: {
				setDefaultSuggestion: () => {},
				onInputChanged: {
					addListener: (listener: InputChangedListener) => {
						inputChanged = listener;
					},
				},
				onInputEntered: { addListener: () => {} },
			},
			runtime: {
				getURL: (path: string) => {
					requestedUrl = path;
					return `chrome-extension://betterfloat${path}`;
				},
			},
		} as unknown as typeof chrome;

		globalThis.fetch = (async () =>
			new Response(
				JSON.stringify({
					'Dreams & Nightmares "Case\'s"': { buff: 123 },
				})
			)) as unknown as typeof fetch;

		await import('../src/background/omnibox');
		expect(inputChanged).toBeDefined();

		const suggestions = await new Promise<chrome.omnibox.SuggestResult[]>((resolve) => {
			inputChanged?.('dreams nightmares', resolve);
		});

		expect(requestedUrl).toBe('/marketids.json');
		expect(suggestions).toEqual([
			{
				content: 'https://buff.163.com/goods/123',
				description: '[Buff] Dreams &amp; Nightmares &quot;Case&apos;s&quot;',
			},
		]);
	});
});
