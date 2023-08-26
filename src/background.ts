let lastUpdate = 0;

chrome.storage.local.get('lastUpdate', (data) => {
    if (data.lastUpdate) {
        lastUpdate = data.lastUpdate;
    }
});

// Check whether new version is installed
chrome.runtime.onInstalled.addListener(function (details) {
    if (details.reason == 'install') {
        console.log('[BetterFloat] First install of BetterFloat, enjoy the extension!');
        chrome.storage.local.set({
            buffprice: true,
            autorefresh: true,
            priceReference: 1,
            refreshInterval: 30,
            showSteamPrice: false,
            stickerPrices: true,
            showBuffDifference: true,
            listingAge: 0,
            showTopButton: true,
        });
    } else if (details.reason == 'update') {
        var thisVersion = chrome.runtime.getManifest().version;
        console.log('[BetterFloat] Updated from version ' + details.previousVersion + ' to ' + thisVersion + '!');
    }
});

// update every 8 hours
if (lastUpdate < Date.now() - 1000 * 60 * 60 * 8) {
    fetch('https://prices.csgotrader.app/latest/prices_v6.json')
        .then((response) => response.json())
        .then((data) => {
            chrome.storage.local.set({ prices: JSON.stringify(data) }).then(() => {
                console.log('Prices updated. Last update: ' + lastUpdate + '. Current time: ' + Date.now());
            });
        })
        .catch((err) => console.error(err));

    lastUpdate = Date.now();
    chrome.storage.local.set({ lastUpdate: lastUpdate });
}
