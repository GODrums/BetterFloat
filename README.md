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

<p align="center">
  </br></br>
  <a href="https://chromewebstore.google.com/detail/betterfloat/bphfhlfhnohppnleaehnlfigkkccpglk">
    <picture>
      <source srcset="https://i.imgur.com/XBIE9pk.png" media="(prefers-color-scheme: dark)">
      <img height="58" src="https://i.imgur.com/oGxig2F.png" alt="Chrome Web Store"></picture></a>
  <a href="https://addons.mozilla.org/en-US/firefox/addon/betterfloat/">
    <picture>
      <source srcset="https://i.imgur.com/ZluoP7T.png" media="(prefers-color-scheme: dark)">
      <img height="58" src="https://i.imgur.com/4PobQqE.png" alt="Firefox add-ons"></picture></a>
  </br></br>
</p>

## 🤝 Community / Support

<p>
We have used our thread <a href="https://discord.com/channels/664104795367538690/1140464870559584267">#BetterFloat</a> in the CS Market Forum Discord Server in the past. Now we also own a full server, where you can ask questions, report bugs, or suggest new features.
</p>

Click the badge below to join our server:

[![Discord](https://img.shields.io/badge/Discord-5865F2?logo=discord&logoColor=white)](https://discord.gg/VQWXp33nSW)

## 📄 Highlights

Currently supports CSFloat.com, Skinport.com and Skinbid.com, but more sites are coming soon!

-   Display Buff prices (buy order + listings) for every item
-   Price difference to Buff at first glance next to the price tag
-   Accurate sticker price calculation (%sp) with gradual coloring
-   CSFloat: Auto-refresh in the "Newest Items"
-   CSFloat: See the listing age of an item
-   Skinport: Automatically check the checkboxes in the cart for faster buying
-   Skinport: Multiple currency conversion options
-   More coming soon!

## Services

### Chrome Web Store

[![Chrome Web Store](https://img.shields.io/chrome-web-store/v/bphfhlfhnohppnleaehnlfigkkccpglk.svg?label=Chrome%20Web%20Store&logo=googlechrome)](https://chrome.google.com/webstore/detail/bphfhlfhnohppnleaehnlfigkkccpglk)
[![Chrome Web Store Users](https://img.shields.io/chrome-web-store/users/bphfhlfhnohppnleaehnlfigkkccpglk.svg)](https://chrome.google.com/webstore/detail/bphfhlfhnohppnleaehnlfigkkccpglk)
[![Chrome Web Store](https://img.shields.io/chrome-web-store/stars/bphfhlfhnohppnleaehnlfigkkccpglk.svg)](https://chrome.google.com/webstore/detail/bphfhlfhnohppnleaehnlfigkkccpglk)
[![Chrome Web Store](https://img.shields.io/chrome-web-store/rating-count/bphfhlfhnohppnleaehnlfigkkccpglk.svg)](https://chrome.google.com/webstore/detail/bphfhlfhnohppnleaehnlfigkkccpglk)
[![Chrome Web Store Price](https://img.shields.io/chrome-web-store/price/bphfhlfhnohppnleaehnlfigkkccpglk.svg)](https://chrome.google.com/webstore/detail/bphfhlfhnohppnleaehnlfigkkccpglk)

### Mozillla Add-on

[![Mozilla Add-on](https://img.shields.io/amo/v/betterfloat.svg?label=Mozilla%20Add-on&logo=firefox)](https://addons.mozilla.org/en-US/firefox/addon/betterfloat/)
![Mozilla Add-on Users](https://img.shields.io/amo/users/betterfloat)
![Mozilla Add-on Downloads](https://img.shields.io/amo/dw/betterfloat)

### Status

![Rums.dev Status](https://img.shields.io/endpoint?url=https%3A%2F%2Fapi.rums.dev%2Fstatus)


### Troubleshooting on Mozilla Firefox

In some cases, Firefox does not grant extensions necessary permissions automatically. This can be fixed by following these steps:

1. Open the Add-ons Manager page: [about:addons](about:addons)
2. Click on the BetterFloat extension -> "Permissions"
3. Check all of the required AND optional "Access your data for ..." checkboxes
4. Reload the extension by dis- and reenabling it
5. Adjust the extension settings to your liking in the extension popup
6. Refresh the website, e.g. CSFloat

## ⌨️ Development

### 💻 The Tech Stack

<div style="display: flex; flex-direction: row; align-items: center; flex-wrap: wrap; gap: 1rem;">
<img align="center" src="https://icongr.am/devicon/typescript-original.svg?size=128&color=currentColor" alt="Typescript" width="50" height="50">
<img align="center" src="https://icongr.am/devicon/webpack-original-wordmark.svg?size=128&color=currentColor" alt="Typescript" width="100">
<img align="center" src="https://cdn.jsdelivr.net/gh/devicons/devicon/icons/eslint/eslint-original-wordmark.svg" alt="Typescript" width="100">
<img align="center" src="https://raw.githubusercontent.com/prettier/prettier-logo/master/images/prettier-banner-dark.svg" alt="Typescript" width="100">
<img align="center" src="https://cdn.jsdelivr.net/gh/devicons/devicon/icons/jquery/jquery-plain-wordmark.svg" alt="Typescript" width="50" height="50">
<img align="center" src="https://cdn.jsdelivr.net/gh/devicons/devicon/icons/mocha/mocha-plain.svg" alt="Typescript" height="50" width="50">
</div>

### Installation

Prerequisites:

-   Node.js `>=18.16.0`
-   npm `>=9.5.0`
-   tsc `>=4.7.0`

Prepare your local setup via the following command:

```bash
npm install
```

### Building

Either build the extension in production mode:

```bash
npm run build
```
Or as developer version in watch mode:

```bash
npm run watch
```
In Visual Studio Code the watch mode can also be started by pressing `CTRL + Shift + B`.

When working with multiple version, the build process may benefit from clean builds. This can be achieved by running the following command before building:

```bash
npm run clean
```

### Loading

The built extension will be located in the `dist` folder. Load that folder as unpacked extension in your browser or pack it first and then load the packed version.

### Contributing

To contribute to this project, create your own fork of the repository and submit a pull request.
Please follow the [conventional commits](https://www.conventionalcommits.org/en/v1.0.0/) specification (or an equivalent one) and make sure to format your code with [Prettier](https://prettier.io/). This projects supports the following commands to control code quality:

```bash
npm run lint  # runs eslint
npm run prettier  # runs prettier
```

Make sure to test your changes extensively (the project supports [Mocha](https://mochajs.org/) as testing framework) and include relevant results in your pull request.

## ⚠️ Disclaimer

BetterFloat is developed independently, and is not officially endorsed by or affiliated with CSFloat Inc., Skinport GmbH, or SkinBid ApS in any way. If you are a legal representative of the aforementioned companies and would like this project to be taken down, please contact me directly at legal@rums.dev.

Built with 🖤 in Munich.