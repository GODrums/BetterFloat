import { ExtensionSettings } from "../@typings/FloatTypes";

export async function initSettings(): Promise<ExtensionSettings> {
    let extensionSettings = <ExtensionSettings>{};
    chrome.storage.local.get((data) => {
        if (data.enableCSFloat) {
            extensionSettings.enableCSFloat = Boolean(data.enableCSFloat);
        }
        if (data.autorefresh) {
            extensionSettings.autorefresh = Boolean(data.autorefresh);
        }
        if (data.priceReference !== undefined) {
            extensionSettings.priceReference = data.priceReference as ExtensionSettings['priceReference'];
        }
        if (data.refreshInterval) {
            extensionSettings.refreshInterval = data.refreshInterval as ExtensionSettings['refreshInterval'];
        }
        if (data.showSteamPrice) {
            extensionSettings.showSteamPrice = Boolean(data.showSteamPrice);
        }
        if (data.stickerPrices) {
            extensionSettings.stickerPrices = Boolean(data.stickerPrices);
        }
        if (data.listingAge !== undefined) {
            extensionSettings.listingAge = data.listingAge as ExtensionSettings['listingAge'];
        }
        if (data.showBuffDifference) {
            extensionSettings.showBuffDifference = Boolean(data.showBuffDifference);
        }
        if(data.showBuffPercentageDifference){
            extensionSettings.showBuffPercentageDifference = Boolean(data.showBuffPercentageDifference);
        }
        if (data.showTopButton) {
            extensionSettings.showTopButton = Boolean(data.showTopButton);
        }
        if (data.useTabStates) {
            extensionSettings.useTabStates = Boolean(data.useTabStates);
        }
        if (data.enableSkinport) {
            extensionSettings.enableSkinport = Boolean(data.enableSkinport);
        }
        if (data.spCheckBoxes) {
            extensionSettings.spCheckBoxes = Boolean(data.spCheckBoxes);
        }
        if (data.spStickerPrices) {
            extensionSettings.spStickerPrices = Boolean(data.spStickerPrices);
        }
        if (data.skinportRates) {
            extensionSettings.skinportRates = data.skinportRates as ExtensionSettings['skinportRates'];
        }
        if (data.spPriceReference !== undefined) {
            extensionSettings.spPriceReference = data.spPriceReference as ExtensionSettings['spPriceReference'];
        }
        if (data.spSteamPrice) {
            extensionSettings.spSteamPrice = Boolean(data.spSteamPrice);
        }
        if (data.spBuffDifference) {
            extensionSettings.spBuffDifference = Boolean(data.spBuffDifference);
        }
        if (data.spBuffLink) {
            extensionSettings.spBuffLink = data.spBuffLink as ExtensionSettings['spBuffLink'];
        }
        if (data.spFloatColoring) {
            extensionSettings.spFloatColoring = Boolean(data.spFloatColoring);
        }
    });

    // wait for settings to be loaded, takes about 1.5 seconds
    await new Promise<void>((resolve) => {
        setTimeout(() => {
            resolve();
        }, 1500);
    });

    return extensionSettings;
}