// return if element has been successfully waited for, else limit has been reached
export async function waitForElement(selector: string, interval = 200, maxTries = 10) {
    let tries = 0;
    while (!document.querySelector(selector) && tries < maxTries) {
        tries++;
        await new Promise((r) => setTimeout(r, interval));
    }
    return tries < maxTries;
}

/**
 * get the time difference between now and the creation of the listing
 * @param created_at example format: "2023-10-12T11:06:15"
 */
export function calculateTime(created_at: string) {
    const timeDiff = (strDate: string) => {
        const now = new Date();
        const diff = now.getTime() - Date.parse(strDate);
        return Math.floor(diff / 60_000);
    };
    const timeMin = timeDiff(created_at);
    const timeHours = Math.floor(timeMin / 60);
    let textTime = '';
    if (timeHours < 49) {
        if (timeMin < 120) {
            textTime = `${timeMin} minute${timeMin == 1 ? '' : 's'} ago`;
        } else {
            textTime = `${timeHours} hour${timeHours == 1 ? '' : 's'} ago`;
        }
    } else {
        textTime = `${Math.floor(timeHours / 24)} day${Math.floor(timeHours / 24) == 1 ? '' : 's'} ago`;
    }
    return textTime;
}

export function getSPBackgroundColor(spPercentage: number) {
    if (spPercentage < 0.005 || spPercentage > 2) {
        return '#0003';
    } else if (spPercentage >= 1) {
        return 'rgb(245 0 0 / 40%)';
    } else if (spPercentage > 0.5) {
        return 'rgb(245 164 0 / 40%)';
    } else if (spPercentage > 0.25) {
        return 'rgb(244 245 0 / 40%)';
    } else {
        return 'rgb(83 245 0 / 40%)';
    }
}

export function parseHTMLString(htmlString: string, container: HTMLElement) {
    const parser = new DOMParser();
    const doc = parser.parseFromString(htmlString, 'text/html');
    const tags = doc.getElementsByTagName(`body`)[0];

    for (const tag of Array.from(tags.children)) {
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
    } else if (name.includes('Michael Syfers | FBI Sniper')) {
        return 'Michael Syfers  | FBI Sniper';
    } else if (name.indexOf('niko') > -1) {
        return name.substring(0, name.lastIndexOf('|')) + ' ' + name.substring(name.lastIndexOf('|'), name.length);
    }
    return name;
}
