let permissionsButton = <HTMLButtonElement>document.getElementsByClassName('PermissionsButton')[0];

//executes on document.ready
$(function () {
    $('#version').text('Version: ' + chrome.runtime.getManifest().version);

    // init loading of content
    $('.MainContent').load('settings.html', function () {
        //Loading complete
        loadSettings();
    });

    //add listeners to all tabs
    $('.tabItem').on('click', function (e) {
        e.preventDefault();
        $('.MainContent').load(e.currentTarget.getAttribute('data-page'), function () {
            //Loading complete
            if (e.currentTarget.getAttribute('data-page') == 'settings.html') {
                loadSettings();
            }
        });

        e.currentTarget.classList.add('active');
        $('.tabItem').not(e.currentTarget).removeClass('active');
    });

    //add listeners to all checkboxes
    $('input[type=checkbox]').each(function () {
        $(this).on('change', function () {
            const attrName = $(this).attr('name');
            chrome.storage.local.set({
                [attrName]: $(this).prop('checked'),
            });
            $('.Warning').show(100);
        });
    });
    // add listeners to all dropdowns
    $('select').each(function () {
        $(this).on('change', function () {
            const attrName = $(this).attr('name');
            chrome.storage.local.set({
                [attrName]: $(this).val(),
            });
            $('.Warning').show(100);
        });
    });
});

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

function loadSettings() {
    let featureBuffPrice = <HTMLInputElement>document.getElementById('InputBuffPrice');
    let featureAutorefresh = <HTMLInputElement>document.getElementById('InputAutorefresh');
    let priceReference = <HTMLSelectElement>document.getElementById('DropDownPriceReference');
    let refreshInterval = <HTMLSelectElement>document.getElementById('DropDownInterval');
    let showSteamPrice = <HTMLInputElement>document.getElementById('InputSteamPrice');

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
}
