import { ItemStyle } from "../@typings/FloatTypes";
import { getPriceMapping } from "../mappinghandler";

// return if element has been successfully waited for, else limit has been reached
export async function waitForElement(selector: string, interval = 200, maxTries = 10) {
    let tries = 0;
    while (!document.querySelector(selector) && tries < maxTries) {
        tries++;
        await new Promise((r) => setTimeout(r, interval));
    }
    return tries < maxTries;
}

export async function getBuffPrice(buff_name: string, itemStyle: ItemStyle): Promise<{ priceListing: number; priceOrder: number }> {
    const priceMapping = await getPriceMapping();
    let helperPrice: number | null = null;

    if (!priceMapping[buff_name] || !priceMapping[buff_name]['buff163'] || !priceMapping[buff_name]['buff163']['starting_at'] || !priceMapping[buff_name]['buff163']['highest_order']) {
        console.debug(`[BetterFloat] No price mapping found for ${buff_name}`);
        helperPrice = 0;
    }

    // we cannot use the getItemPrice function here as it does not return the correct price for doppler skins
    let priceListing = 0;
    let priceOrder = 0;
    if (typeof helperPrice == 'number') {
        priceListing = helperPrice;
        priceOrder = helperPrice;
    } else if (priceMapping[buff_name]) {
        if (itemStyle!= '' && itemStyle != 'Vanilla') {
            priceListing = priceMapping[buff_name]['buff163']['starting_at']['doppler']![itemStyle] ?? 0;
            priceOrder = priceMapping[buff_name]['buff163']['highest_order']['doppler']![itemStyle] ?? 0;
        } else {
            priceListing = priceMapping[buff_name]['buff163']['starting_at']['price'];
            priceOrder = priceMapping[buff_name]['buff163']['highest_order']['price'];
        }
    }
    if (priceListing == undefined) {
        priceListing = 0;
    }
    if (priceOrder == undefined) {
        priceOrder = 0;
    }

    return { priceListing, priceOrder };
}

// truncats a number to a given amount of digits
export function toTruncatedString(num: number, digits: number) {
    const regex = num.toString().match(new RegExp(`^-?\\d+(?:\\.\\d{0,${digits}})?`));
    return regex ? regex[0] : '';
}

/**
 * Cut a substring from a string
 * @param text original string
 * @param startChar last character before the substring
 * @param endChar first character after the substring
 * @returns
 */
export function cutSubstring(text: string, startChar: string, endChar: string) {
    const start = text.indexOf(startChar);
    const end = text.indexOf(endChar);
    return text.substring(start + 1, end);
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

/**
 * Get a coloring for the float value of an item
 * @param w wear value
 * @param l low: lower float bound
 * @param h high: upper float bound
 * @param colors color values for good, bad, perfect and worst
 * @returns
 */
export function getFloatColoring(
    w: number,
    l = 0,
    h = 1,
    colors = {
        good: 'turquoise',
        bad: 'indianred',
        perfect: 'springgreen',
        worst: 'orangered',
    }
): string {
    // use relative deviation to determine color. 0.2% / 1.3% are used as thresholds
    if (l > 0) {
        const deviation = Math.abs((l - w) / l);
        if (deviation < 0.002) {
            return colors.perfect;
        } else if (deviation < 0.013) {
            return colors.good;
        }
    }
    if (h < 1) {
        const deviation = (h - w) / h;
        if (deviation < 0.002) {
            return colors.worst;
        } else if (deviation < 0.013) {
            return colors.bad;
        }
    }
    if (w < 0.01 || (w > 0.07 && w < 0.08) || (w > 0.15 && w < 0.18) || (w > 0.38 && w < 0.39)) {
        return w === 0 ? colors.perfect : colors.good;
    } else if ((w < 0.07 && w > 0.06) || (w > 0.14 && w < 0.15) || (w > 0.32 && w < 0.38) || w > 0.9) {
        return w === 0.999 ? colors.worst : colors.bad;
    }
    return '';
}

export const USDollar = new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
});

export const Euro = new Intl.NumberFormat('en-DE', {
    style: 'currency',
    currency: 'EUR',
});
