import { refreshPrices } from './background';

let permissionsButton = <HTMLButtonElement>document.getElementsByClassName('PermissionsButton')[0];

//executes on document.ready
$(function () {
    $('#version').text('Version: ' + chrome.runtime.getManifest().version);

    // init loading of content
    $('.MainContent').load('csfloat.html', function () {
        //Loading complete
        loadSettings('csfloat.html');
        addListeners();
    });

    //add listeners to all tabs
    $('.tabItem').on('click', function (e) {
        e.preventDefault();
        if ($(this).hasClass('active')) return;
        let url = e.currentTarget.getAttribute('data-page') ?? 'csfloat.html';
        $('.MainContent').load(url, function () {
            //Loading complete
            loadSettings(url);
            addListeners();
        });

        e.currentTarget.classList.add('active');
        $('.tabItem').not(e.currentTarget).removeClass('active');
    });
});

function addListeners() {
    //add listeners to all checkboxes
    $('input[type=checkbox]').on('change', function () {
        const attrName = $(this).attr('name');
        if (attrName) {
            chrome.storage.local.set({
                [attrName]: $(this).prop('checked'),
            });
        }
        $('.Warning').show(100);
        $('.MainContent').css('height', '470px');
    });
    // add listeners to all dropdowns
    $('select').on('change', function () {
        const attrName = $(this).attr('name');
        if (attrName) {
            chrome.storage.local.set({
                [attrName]: $(this).val(),
            });
        }
        $('.Warning').show(100);
        $('.MainContent').css('height', '470px');
    });
}

const host_permissions = chrome.runtime.getManifest().host_permissions;

chrome.permissions
    .contains({
        origins: host_permissions,
    })
    .then((result) => {
        console.debug('[BetterFloat] Host Permission: ', result);
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

function loadForSettings() {
    let enableCSFloat = <HTMLInputElement>document.getElementById('InputCSFloat');
    let featureAutorefresh = <HTMLInputElement>document.getElementById('InputAutorefresh');
    let priceReference = <HTMLSelectElement>document.getElementById('DropDownPriceReference');
    let refreshInterval = <HTMLSelectElement>document.getElementById('DropDownInterval');
    let showSteamPrice = <HTMLInputElement>document.getElementById('InputSteamPrice');
    let stickerPrices = <HTMLInputElement>document.getElementById('InputStickerPrices');
    let listingAge = <HTMLSelectElement>document.getElementById('DropDownListingAge');
    let buffDifference = <HTMLInputElement>document.getElementById('InputBuffDifference');
    let showBuffPercentageDifference = <HTMLInputElement>document.getElementById('InputBuffPercentageDifference');
    let topButton = <HTMLInputElement>document.getElementById('InputTopButton');
    let useTabStates = <HTMLInputElement>document.getElementById('InputTabStates');

    chrome.storage.local.get((data) => {
        console.debug('[BetterFloat] Loaded settings: ', data);
        if (data.enableCSFloat) {
            enableCSFloat.checked = true;
        } else {
            enableCSFloat.checked = false;
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
            refreshInterval.value = data.refreshInterval;
        }
        if (data.showSteamPrice) {
            showSteamPrice.checked = true;
        }
        if (data.stickerPrices) {
            stickerPrices.checked = true;
        } else {
            stickerPrices.checked = false;
        }
        if (data.listingAge) {
            listingAge.value = data.listingAge;
        }
        if (data.showBuffDifference) {
            buffDifference.checked = true;
        } else {
            buffDifference.checked = false;
        }
        if (data.showBuffPercentageDifference) {
            showBuffPercentageDifference.checked = true;
        } else {
            showBuffPercentageDifference.checked = false;
        }
        if (data.showTopButton) {
            topButton.checked = true;
        } else {
            topButton.checked = false;
        }
        if (data.useTabStates) {
            useTabStates.checked = true;
        } else {
            useTabStates.checked = false;
        }
    });
}

function loadForSkinport() {
    let skinportEnable = <HTMLInputElement>document.getElementById('InputSkinport');
    let checkBoxesElement = <HTMLInputElement>document.getElementById('SkinportCheckboxes');
    let stickerPriceElement = <HTMLInputElement>document.getElementById('SkinportStickerPrices');
    let skinportSteamPrice = <HTMLInputElement>document.getElementById('SkinportSteamPrice');
    let skinportInputBuffDifference = <HTMLInputElement>document.getElementById('SkinportInputBuffDifference');
    let skinportFloatColoring = <HTMLInputElement>document.getElementById('SkinportFloatColoring');

    chrome.storage.local.get((data) => {
        console.debug('[BetterFloat] Loaded settings: ', data);
        if (data.enableSkinport) {
            skinportEnable.checked = true;
        } else {
            skinportEnable.checked = false;
        }
        if (data.spCheckBoxes) {
            checkBoxesElement.checked = true;
        } else {
            checkBoxesElement.checked = false;
        }
        if (data.spStickerPrices) {
            stickerPriceElement.checked = true;
        } else {
            stickerPriceElement.checked = false;
        }
        if (data.skinportRates) {
            (<HTMLSelectElement>document.getElementById('SkinportCurrencyConversion')).value = data.skinportRates;
        }
        if (data.spPriceReference) {
            (<HTMLSelectElement>document.getElementById('SkinportPriceReference')).value = data.spPriceReference;
        }
        if (data.spSteamPrice) {
            skinportSteamPrice.checked = true;
        } else {
            skinportSteamPrice.checked = false;
        }
        if (data.spBuffDifference) {
            skinportInputBuffDifference.checked = true;
        } else {
            skinportInputBuffDifference.checked = false;
        }
        if (data.spBuffLink) {
            (<HTMLInputElement>document.getElementById('SkinportBuffLink')).value = data.spBuffLink;
        }
        if (data.spFloatColoring) {
            skinportFloatColoring.checked = true;
        } else {
            skinportFloatColoring.checked = false;
        }
    });
}

function loadForAbout() {
    (<HTMLButtonElement>document.getElementById('priceRefreshButton')).addEventListener('click', () => {
        if ($('#priceRefreshButton').hasClass('loading') || $('#priceRefreshButton').hasClass('done')) return;
        $('#priceRefreshButton').addClass('loading');
        refreshPrices().then(async (result) => {
            if (!result) return;

            console.log('Manual prices refresh done. Sending message to content script.');
            chrome.tabs.query({currentWindow: true, active: true}, function (tabs){
                var activeTab = tabs[0];
                // send message to initiate mapping reload
                chrome.tabs.sendMessage(activeTab.id!, { message: 'refreshPrices' }, (response) => {
                    if (response) {
                        console.log(response.message);
                        $('#priceRefreshButton').removeClass('loading');
                        $('#priceRefreshButton').addClass('done');
                        $('.fetchSuccessText').show(100);
                    }
                });
            });
        });
    });
}

function loadSettings(url: string) {
    if (url == 'csfloat.html') {
        loadForSettings();
    } else if (url == 'skinport.html') {
        loadForSkinport();
    } else if (url == 'about.html') {
        loadForAbout();
    }
}
