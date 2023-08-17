<p align="center">
  <a href="https://chrome.google.com/webstore/detail/bphfhlfhnohppnleaehnlfigkkccpglk">
    <img width="128" src="https://raw.githubusercontent.com/GODrums/BetterFloat/main/public/betterfloat_logo128.png"/>
  </a>
  <h1 align="center">BetterFloat</h1>
</p>

![GitHub manifest version (path)](https://img.shields.io/github/manifest-json/v/GODrums/betterfloat)
![GitHub code size in bytes](https://img.shields.io/github/languages/code-size/GODrums/betterfloat)
![GitHub repo size](https://img.shields.io/github/repo-size/GODrums/betterfloat)
![GitHub commit activity (branch)](https://img.shields.io/github/commit-activity/w/GODrums/BetterFloat)
[![GitHub license](https://img.shields.io/badge/license-MIT-blue.svg)](https://raw.githubusercontent.com/GODrums/BetterEsportal/LICENSE)

## Downloads

[![Chrome Web Store](https://img.shields.io/chrome-web-store/v/bphfhlfhnohppnleaehnlfigkkccpglk.svg?label=Chrome%20Web%20Store)](https://chrome.google.com/webstore/detail/bphfhlfhnohppnleaehnlfigkkccpglk)
[![Mozilla Add-on](https://img.shields.io/amo/v/betterfloat.svg?label=Mozilla%20Add-on)](https://addons.mozilla.org/en-US/firefox/addon/betterfloat/)

## Highlights

-   Display Buff prices (buy order + listings) for every item
-   Auto-refresh in the "Newest Items"
-   More coming soon!

## Services

### Chrome Web Store

[![Chrome Web Store Version](https://img.shields.io/chrome-web-store/v/bphfhlfhnohppnleaehnlfigkkccpglk.svg)](https://chrome.google.com/webstore/detail/bphfhlfhnohppnleaehnlfigkkccpglk)
[![Chrome Web Store Price](https://img.shields.io/chrome-web-store/price/bphfhlfhnohppnleaehnlfigkkccpglk.svg)](https://chrome.google.com/webstore/detail/bphfhlfhnohppnleaehnlfigkkccpglk)
[![Chrome Web Store Users](https://img.shields.io/chrome-web-store/users/bphfhlfhnohppnleaehnlfigkkccpglk.svg)](https://chrome.google.com/webstore/detail/bphfhlfhnohppnleaehnlfigkkccpglk)
[![Chrome Web Store](https://img.shields.io/chrome-web-store/stars/bphfhlfhnohppnleaehnlfigkkccpglk.svg)](https://chrome.google.com/webstore/detail/bphfhlfhnohppnleaehnlfigkkccpglk)
[![Chrome Web Store](https://img.shields.io/chrome-web-store/rating-count/bphfhlfhnohppnleaehnlfigkkccpglk.svg)](https://chrome.google.com/webstore/detail/bphfhlfhnohppnleaehnlfigkkccpglk)

### Mozillla Add-on

![Mozilla Add-on Version](https://img.shields.io/amo/v/betterfloat)
![Mozilla Add-on Downloads](https://img.shields.io/amo/dw/betterfloat)
![Mozilla Add-on Users](https://img.shields.io/amo/users/betterfloat)

### APIs

![Rums.dev Status](https://img.shields.io/endpoint?url=https%3A%2F%2Fapi.rums.dev%2Fstatus)

### Troubleshooting on Mozilla Firefox

In some cases, Firefox does not grant extensions necessary permissions automatically. This can be fixed by following these steps:

1. Open the Add-ons Manager page: [about:addons](about:addons)
2. Click on the BetterFloat extension -> "Permissions"
3. Check all of the required AND optional "Access your data for ..." checkboxes
4. Reload the CSFloat page

## Development

### Installation

Prerequisites:

-   Node.js `>=18.16.0`
-   npm `>=9.5.0`
-   tsc `>=4.7.0`

Prepare your local build via the commands below:

```bash
npm install
npm start
```

In case of a runtime error, delete the following line located at the end of the code from your compiled `dist/content-script.js` file:

```js
export {};
```

Load the project folder as unpacked extension in your browser.

### Contributing

To contribute to this project, create your own fork of the repository and submit a pull request.
Please follow the [conventional commits](https://www.conventionalcommits.org/en/v1.0.0/) specification (or an equivalent one) and make sure to format your code with [Prettier](https://prettier.io/). Make sure to test your changes extensively and include relevant results in your pull request.

## Disclaimer

BetterFloat is developed independently, and is not officially endorsed by or affiliated with CSFloat in any way. If you are a legal representative of CSFloat and would like this project to be taken down, please contact me.

Built with 🖤 in Munich
