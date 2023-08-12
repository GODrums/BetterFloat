let featureBuffPrice = <HTMLInputElement>document.getElementById('InputBuffPrice')
let featureAutorefresh = <HTMLInputElement>document.getElementById('InputAutorefresh')
let priceReference = <HTMLSelectElement>document.getElementById('DropDownPriceReference')
let refreshInterval = <HTMLSelectElement>document.getElementById('DropDownInterval')

document.getElementById('version').innerHTML = 'Version: ' + chrome.runtime.getManifest().version

chrome.storage.local.get((data) => {
    if (data.buffprice) {
        featureBuffPrice.checked = true
    } else {
        featureBuffPrice.checked = false
    }
    if (data.autorefresh) {
        featureAutorefresh.checked = true
    } else {
        featureAutorefresh.checked = false
    }
    if (data.priceReference) {
        priceReference.value = data.priceReference
    }
    if (data.refreshInterval) {
        refreshInterval.value = data.refreshInterval.toString()
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