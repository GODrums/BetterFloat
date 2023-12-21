import { Extension } from '../@typings/ExtensionTypes';

let settings: Extension.Settings;

export async function getAllSettings() {
    if (!settings) {
        settings = await initSettings();
    }
    return settings;
}

export async function getSetting<Key extends keyof Extension.Settings>(key: Key): Promise<Extension.Settings[Key]> {
    if (!settings) {
        settings = await initSettings();
    }
    return settings[key];
}

export async function initSettings(): Promise<Extension.Settings> {
    settings = <Extension.Settings>{};
    chrome.storage.local.get((data) => {
        if (data.runtimePublicURL) {
            settings.runtimePublicURL = data.runtimePublicURL as Extension.Settings['runtimePublicURL'];
        }
        if (data.enableCSFloat) {
            settings.enableCSFloat = Boolean(data.enableCSFloat);
        }
        if (data.autorefresh) {
            settings.autorefresh = Boolean(data.autorefresh);
        }
        if (data.priceReference !== undefined) {
            settings.priceReference = data.priceReference as Extension.Settings['priceReference'];
        }
        if (data.refreshInterval) {
            settings.refreshInterval = data.refreshInterval as Extension.Settings['refreshInterval'];
        }
        if (data.showSteamPrice) {
            settings.showSteamPrice = Boolean(data.showSteamPrice);
        }
        if (data.stickerPrices) {
            settings.stickerPrices = Boolean(data.stickerPrices);
        }
        if (data.csBlueGem) {
            settings.csBlueGem = Boolean(data.csBlueGem);
        }
        if (data.listingAge !== undefined) {
            settings.listingAge = data.listingAge as Extension.Settings['listingAge'];
        }
        if (data.showBuffDifference) {
            settings.showBuffDifference = Boolean(data.showBuffDifference);
        }
        if (data.showBuffPercentageDifference) {
            settings.showBuffPercentageDifference = Boolean(data.showBuffPercentageDifference);
        }
        if (data.showTopButton) {
            settings.showTopButton = Boolean(data.showTopButton);
        }
        if (data.useTabStates) {
            settings.useTabStates = Boolean(data.useTabStates);
        }
        if (data.csfRemoveClustering) {
            settings.csfRemoveClustering = Boolean(data.csfRemoveClustering);
        }
        if (data.enableSkinport) {
            settings.enableSkinport = Boolean(data.enableSkinport);
        }
        if (data.spCheckBoxes) {
            settings.spCheckBoxes = Boolean(data.spCheckBoxes);
        }
        if (data.spStickerPrices) {
            settings.spStickerPrices = Boolean(data.spStickerPrices);
        }
        if (data.spBlueGem) {
            settings.spBlueGem = Boolean(data.spBlueGem);
        }
        if (data.ocoAPIKey) {
            settings.ocoAPIKey = String(data.ocoAPIKey);
        }
        if (data.skinportRates) {
            settings.skinportRates = data.skinportRates as Extension.Settings['skinportRates'];
        }
        if (data.spPriceReference !== undefined) {
            settings.spPriceReference = data.spPriceReference as Extension.Settings['spPriceReference'];
        }
        if (data.spSteamPrice) {
            settings.spSteamPrice = Boolean(data.spSteamPrice);
        }
        if (data.spBuffDifference) {
            settings.spBuffDifference = Boolean(data.spBuffDifference);
        }
        if (data.spBuffLink) {
            settings.spBuffLink = data.spBuffLink as Extension.Settings['spBuffLink'];
        }
        if (data.spFilter) {
            settings.spFilter = data.spFilter as Extension.Settings['spFilter'];
        }
        if (data.enableSkinbid) {
            settings.enableSkinbid = Boolean(data.enableSkinbid);
        }
        if (data.skbPriceReference !== undefined) {
            settings.skbPriceReference = data.skbPriceReference as Extension.Settings['skbPriceReference'];
        }
        if (data.skbBuffDifference) {
            settings.skbBuffDifference = Boolean(data.skbBuffDifference);
        }
        if (data.skbListingAge) {
            settings.skbListingAge = Boolean(data.skbListingAge);
        }
        if (data.skbStickerPrices) {
            settings.skbStickerPrices = Boolean(data.skbStickerPrices);
        }
        if (data.spAutoclosePopup) {
            settings.spAutoclosePopup = Boolean(data.spAutoclosePopup);
        }
        if (data.floatColoring) {
            settings.floatColoring = data.floatColoring as Extension.Settings['floatColoring'];
        }
        if (data.colors) {
            settings.colors = data.colors as Extension.Settings['colors'];
        }
    });

    // wait for settings to be loaded, takes about 1.5 seconds
    await new Promise<void>((resolve) => {
        setTimeout(() => {
            resolve();
        }, 1500);
    });

    return settings;
}
