export function parseHTMLString(htmlString: string, container: HTMLElement) {
    let parser = new DOMParser();
    let doc = parser.parseFromString(htmlString, 'text/html');
    const tags = doc.getElementsByTagName(`body`)[0];

    for (const tag of tags.children) {
        container.appendChild(tag);
    }
}

export function handleSpecialStickerNames(name: string): string {
    if (name.includes('Ninjas in Pyjamas | Katowice 2015')) {
        return 'Sticker | Ninjas in Pyjamas  | Katowice 2015';
    } else if (name.includes('Vox Eminor | Katowice 2015')) {
        return 'Sticker | Vox Eminor  | Katowice 2015';
    } else if (name.includes('PENTA Sports | Katowice 2015')) {
        return 'Sticker | PENTA Sports  | Katowice 2015';
    } else if (name.includes('Ground Rebel | Elite Crew')) {
        return 'Ground Rebel  | Elite Crew';
    } else if (name.indexOf('niko') > -1) {
        return name.substring(0, name.lastIndexOf('|')) + ' ' + name.substring(name.lastIndexOf('|'), name.length);
    }
    return name;
}

export function calculateRelativePercentageDifference(a: number, b: number) {
    return  (100 * Math.abs( ( a - b ) / ( (a+b)/2 ) )).toFixed(2);
}