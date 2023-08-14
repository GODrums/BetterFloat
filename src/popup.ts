let featureBuffPrice = <HTMLInputElement>document.getElementById('InputBuffPrice');
let featureAutorefresh = <HTMLInputElement>document.getElementById('InputAutorefresh');
let priceReference = <HTMLSelectElement>document.getElementById('DropDownPriceReference');
let refreshInterval = <HTMLSelectElement>document.getElementById('DropDownInterval');
let showSteamPrice = <HTMLInputElement>document.getElementById('InputSteamPrice');
let permissionsButton = <HTMLButtonElement>document.getElementsByClassName('PermissionsButton')[0];

document.getElementById('version').textContent = 'Version: ' + chrome.runtime.getManifest().version;

const host_permissions = chrome.runtime.getManifest().host_permissions;

chrome.permissions
    .contains({
        origins: host_permissions,
    })
    .then((result) => {
        if (result) {
            permissionsButton.style.display = 'none';
        } else {
            permissionsButton.style.display = 'absolute';
            permissionsButton.addEventListener('click', () => {
                chrome.permissions
                    .request({
                        origins: host_permissions,
                    })
                    .then((granted) => {
                        if (granted) {
                            permissionsButton.style.display = 'none';
                            console.log('[BetterFloat] Host Permission granted.');
                        } else {
                            console.log('[BetterFloat] Host Permission denied. Please enable manually in the extension settings.');
                        }
                    });
            });
        }
    });

chrome.storage.local.get((data) => {
    if (data.buffprice) {
        featureBuffPrice.checked = true;
    } else {
        featureBuffPrice.checked = false;
    }
    if (data.autorefresh) {
        featureAutorefresh.checked = true;
    } else {
        featureAutorefresh.checked = false;
    }
    if (data.priceReference) {
        priceReference.value = data.priceReference;
    }
    if (data.refreshInterval) {
        refreshInterval.value = data.refreshInterval.toString();
    }
    if (data.showSteamPrice) {
        showSteamPrice.checked = true;
    }
});

featureBuffPrice.addEventListener('change', (e) => {
    chrome.storage.local.set({ buffprice: (<HTMLInputElement>e.target).checked });
});
featureAutorefresh.addEventListener('change', (e) => {
    chrome.storage.local.set({ autorefresh: (<HTMLInputElement>e.target).checked });
});
priceReference.addEventListener('change', (e) => {
    chrome.storage.local.set({ priceReference: (<HTMLSelectElement>e.target).value });
});
refreshInterval.addEventListener('change', (e) => {
    chrome.storage.local.set({ refreshInterval: (<HTMLSelectElement>e.target).value });
});
showSteamPrice.addEventListener('change', (e) => {
    chrome.storage.local.set({ showSteamPrice: (<HTMLInputElement>e.target).checked });
});
