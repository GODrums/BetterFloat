// maps buff_name to buff_id
let buffMapping = {};
// maps buff_name to prices and more - from csgotrader
let priceMapping = {};

export async function getPriceMapping() {
    if (Object.keys(priceMapping).length == 0) {
        await loadMapping();
    }
    return priceMapping;
}

export async function getItemPrice(buff_name: string): Promise<{ starting_at: number; highest_order: number; }> {
    if (Object.keys(priceMapping).length == 0) {
        await loadMapping();
    }
    if (!priceMapping[buff_name]) {
        console.log(`[BetterFloat] No price mapping found for ${buff_name}`);
        return {
            starting_at: 0,
            highest_order: 0,
        }
    }
    return {
        starting_at: priceMapping[buff_name]['buff163']['starting_at']['price'],
        highest_order: priceMapping[buff_name]['buff163']['highest_order']['price'],
    }
}


export async function getBuffMapping(name: string) {
    if (Object.keys(buffMapping).length == 0) {
        await loadBuffMapping();
    }
    if (buffMapping[name]) {
        return buffMapping[name];
    } else {
        console.log(`[BetterFloat] No buff mapping found for ${name}`);
        return 0;
    }
}

export async function loadMapping() {
    if (Object.keys(priceMapping).length == 0) {
        console.debug('[BetterFloat] Attempting to load price mapping from local storage');

        let mapping = null;

        chrome.storage.local.get('prices', (data) => {
            if (data) {
                mapping = data.prices;
            } else {
                mapping = '';
            }
        });

        // since chrome.storage.local.get is async, we might need to wait for it to finish
        let tries = 20;
        while (mapping == null && tries-- > 0) {
            await new Promise((r) => setTimeout(r, 100));
        }

        if (tries == 0) {
            console.debug('[BetterFloat] Did not receive a response from Csgotrader.');
            mapping = {};
            priceMapping = {};
        }

        if (mapping.length > 0) {
            priceMapping = JSON.parse(mapping);
        } else {
            console.debug('[BetterFloat] Failed. Loading price mapping from file is currently disabled.');
            return false;
            // fallback to loading older prices from file currently disabled
            // console.debug('[BetterFloat] Failed. Loading price mapping from file.');
            // let response = await fetch(runtimePublicURL + '/prices_v6.json');
            // priceMapping = await response.json();
        }
        console.debug('[BetterFloat] Price mapping successfully initialized');
    }
    return true;
}

// get mapping from rums.dev
// currently has no fallback if api is down
export async function loadBuffMapping() {
    console.debug('[BetterFloat] Attempting to load buff mapping from rums.dev');
    await fetch('https://api.rums.dev/file/buff_name_to_id')
        .then((response) => response.json())
        .then((data) => {
            buffMapping = data;
            console.debug('[BetterFloat] Buff mapping successfully loaded from rums.dev');
        })
        .catch((err) => console.error(err));
}
