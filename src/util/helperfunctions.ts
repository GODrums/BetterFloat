export function parseHTMLString(htmlString: string, container: HTMLElement) {
    let parser = new DOMParser();
    let doc = parser.parseFromString(htmlString, 'text/html');
    const tags = doc.getElementsByTagName(`body`)[0];

    for (const tag of tags.children) {
        container.appendChild(tag);
    }
}