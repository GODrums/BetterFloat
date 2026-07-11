export function injectPageStyles(name: string, styles: string[]): void {
	const id = `bf-styles-${name}`;
	let element = document.getElementById(id) as HTMLStyleElement | null;
	if (!element) {
		element = document.createElement('style');
		element.id = id;
		element.dataset.bfStyles = name;
		(document.head || document.documentElement).appendChild(element);
	}
	const css = styles.join('\n');
	if (element.textContent !== css) element.textContent = css;
}
