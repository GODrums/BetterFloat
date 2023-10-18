import { refreshPrices } from './background';

const permissionsButton = <HTMLButtonElement>document.getElementsByClassName('PermissionsButton')[0];

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
        const url = e.currentTarget.getAttribute('data-page') ?? 'csfloat.html';
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
        $('.SideBar').css('height', '528px');
        $('.MainContent').css('height', '528px');
        $('.Warning').show(100);
    });
    // add listeners to all dropdowns
    $('select').on('change', function () {
        const attrName = $(this).attr('name');
        if (attrName) {
            chrome.storage.local.set({
                [attrName]: $(this).val(),
            });
        }
        $('.SideBar').css('height', '528px');
        $('.MainContent').css('height', '528px');
        $('.Warning').show(100);
    });
    // add listeners to all color pickers
    $('input[type=color]').on('change', function () {
        const attrName = $(this).attr('name');
        if (attrName) {
            chrome.storage.local.get((data) => {
                if (data.colors) {
                    data.colors[attrName] = $(this).val();
                    chrome.storage.local.set({
                        colors: data.colors,
                    });
                }
                else {
                    chrome.storage.local.set({
                        colors: {
                            [attrName]: $(this).val(),
                        },
                    });
                }
            });
        }
        $('.SideBar').css('height', '528px');
        $('.MainContent').css('height', '528px');
        $('.Warning').show(100);
    });
    // add listener to resetColors button
    $('#resetColors').on('click', function () {
        chrome.storage.local.set({
            colors: {
                profit: '#008000',
                loss: '#ce0000',
                neutral: '#708090',
            },
        });
        $('#InputProfitColor').val('#008000');
        $('#InputLossColor').val('#ce0000');
        $('#InputNeutralColor').val('#708090');
    });
}

const host_permissions = chrome.runtime.getManifest().host_permissions;

chrome.permissions.contains(
    {
        origins: host_permissions,
    },
    (result) => {
        console.debug('[BetterFloat] Host Permission: ', result);
        if (result) {
            permissionsButton.style.display = 'none';
        } else {
            permissionsButton.style.display = 'absolute';
            permissionsButton.addEventListener('click', () => {
                chrome.permissions.request(
                    {
                        origins: host_permissions,
                    },
                    (granted) => {
                        if (granted) {
                            permissionsButton.style.display = 'none';
                            console.log('[BetterFloat] Host Permission granted.');
                        } else {
                            console.log('[BetterFloat] Host Permission denied. Please enable manually in the extension settings.');
                        }
                    }
                );
            });
        }
    }
);

function loadForSettings() {
    const enableCSFloat = <HTMLInputElement>document.getElementById('InputCSFloat');
    const featureAutorefresh = <HTMLInputElement>document.getElementById('InputAutorefresh');
    const priceReference = <HTMLSelectElement>document.getElementById('DropDownPriceReference');
    const refreshInterval = <HTMLSelectElement>document.getElementById('DropDownInterval');
    const showSteamPrice = <HTMLInputElement>document.getElementById('InputSteamPrice');
    const stickerPrices = <HTMLInputElement>document.getElementById('InputStickerPrices');
    const listingAge = <HTMLSelectElement>document.getElementById('DropDownListingAge');
    const buffDifference = <HTMLInputElement>document.getElementById('InputBuffDifference');
    const showBuffPercentageDifference = <HTMLInputElement>document.getElementById('InputBuffPercentageDifference');
    const topButton = <HTMLInputElement>document.getElementById('InputTopButton');
    const useTabStates = <HTMLInputElement>document.getElementById('InputTabStates');
    const profitColor = <HTMLInputElement>document.getElementById('InputProfitColor');
    const lossColor = <HTMLInputElement>document.getElementById('InputLossColor');
    const neutralColor = <HTMLInputElement>document.getElementById('InputNeutralColor');

    chrome.storage.local.get((data) => {
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
        if (data.colors) {
            profitColor.value = data.colors.profit;
            lossColor.value = data.colors.loss;
            neutralColor.value = data.colors.neutral;
        }
    });
}

function loadForSkinport() {
    const skinportEnable = <HTMLInputElement>document.getElementById('InputSkinport');
    const checkBoxesElement = <HTMLInputElement>document.getElementById('SkinportCheckboxes');
    const stickerPriceElement = <HTMLInputElement>document.getElementById('SkinportStickerPrices');
    const skinportSteamPrice = <HTMLInputElement>document.getElementById('SkinportSteamPrice');
    const skinportInputBuffDifference = <HTMLInputElement>document.getElementById('SkinportInputBuffDifference');
    const skinportFloatColoring = <HTMLInputElement>document.getElementById('SkinportFloatColoring');

    chrome.storage.local.get((data) => {
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
            chrome.tabs.query({ currentWindow: true, active: true }, function (tabs) {
                const activeTab = tabs[0];
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

function loadForSkinbid() {
    let skinbidEnable = <HTMLInputElement>document.getElementById('InputSkinbid');
    let skinbidPriceReference = <HTMLSelectElement>document.getElementById('SkinbidPriceReference');
    let skinbidInputBuffDifference = <HTMLInputElement>document.getElementById('SkinbidInputBuffDifference');
    let skinbidListingAge = <HTMLInputElement>document.getElementById('SkinbidListingAge');
    let skinbidStickerPrices = <HTMLInputElement>document.getElementById('SkinbidStickerPrices');

    chrome.storage.local.get((data) => {
        console.log(data);
        if (data.enableSkinbid) {
            skinbidEnable.checked = true;
        } else {
            skinbidEnable.checked = false;
        }
        if (data.skbStickerPrices) {
            skinbidStickerPrices.checked = true;
        } else {
            skinbidStickerPrices.checked = false;
        }
        if (data.skbPriceReference !== undefined) {
            skinbidPriceReference.value = data.skbPriceReference;
        }
        if (data.skbBuffDifference) {
            skinbidInputBuffDifference.checked = true;
        } else {
            skinbidInputBuffDifference.checked = false;
        }
        if (data.skbListingAge) {
            skinbidListingAge.checked = true;
        } else {
            skinbidListingAge.checked = false;
        }
    });
}

function loadSettings(url: string) {
    if (url == 'csfloat.html') {
        loadForSettings();
    } else if (url == 'skinport.html') {
        loadForSkinport();
    } else if (url == 'about.html') {
        loadForAbout();
    } else if (url == 'skinbid.html') {
        loadForSkinbid();
    }
}
