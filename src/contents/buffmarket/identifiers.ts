export function parseBuffMarketGoodsIdentifier(href: string, origin: string): number | string | null {
	let pathSegment: string | undefined;
	try {
		pathSegment = new URL(href, origin).pathname.split('/').filter(Boolean).at(-1);
	} catch {
		return null;
	}
	if (!pathSegment) return null;

	let identifier = pathSegment;
	try {
		identifier = decodeURIComponent(pathSegment);
	} catch {
		// Use the original segment if a malformed escape sequence appears.
	}

	const numericIdentifier = Number(identifier);
	return Number.isSafeInteger(numericIdentifier) && numericIdentifier > 0 ? numericIdentifier : identifier || null;
}
