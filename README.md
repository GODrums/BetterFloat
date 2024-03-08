<p align="center">
  <a href="https://chrome.google.com/webstore/detail/bphfhlfhnohppnleaehnlfigkkccpglk">
    <img width="128" src="https://raw.githubusercontent.com/GODrums/BetterFloat/main/assets/icon.png"/>
  </a>
  <h1 align="center">BetterFloat</h1>
</p>

![GitHub package.json dynamic](https://img.shields.io/github/package-json/version/GODrums/BetterFloat)
[![Install and Build](https://github.com/GODrums/BetterFloat/actions/workflows/build.yml/badge.svg)](https://github.com/GODrums/BetterFloat/actions/workflows/build.yml)
![GitHub code size in bytes](https://img.shields.io/github/languages/code-size/GODrums/betterfloat)
![GitHub repo size](https://img.shields.io/github/repo-size/GODrums/betterfloat)
![GitHub commit activity (branch)](https://img.shields.io/github/commit-activity/w/GODrums/BetterFloat)
[![GitHub license](https://img.shields.io/badge/license-MIT-blue.svg)](https://raw.githubusercontent.com/GODrums/BetterEsportal/LICENSE)

<p align="center">
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
We maintain a very active Discord server, where you can share your snipes, ask questions, report bugs, or suggest new features. Join here:
</p>

<p align="center">
  <a href="https://discord.gg/VQWXp33nSW">
    <picture>
      <source srcset="https://i.postimg.cc/Fzj7T05w/discord.png" media="(prefers-color-scheme: dark)">
      <img height="58" src="https://i.postimg.cc/Fzj7T05w/discord.png" alt="Discord"></picture></a>
</p>

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

### Mozillla Add-on

[![Mozilla Add-on](https://img.shields.io/amo/v/betterfloat.svg?label=Mozilla%20Add-on&logo=firefox)](https://addons.mozilla.org/en-US/firefox/addon/betterfloat/)
![Mozilla Add-on Users](https://img.shields.io/amo/users/betterfloat)
![Mozilla Add-on Downloads](https://img.shields.io/amo/dw/betterfloat)

### Status

![Rums.dev Status](https://img.shields.io/endpoint?url=https%3A%2F%2Fapi.rums.dev%2Fstatus)
[![FOSSA Status](https://app.fossa.com/api/projects/git%2Bgithub.com%2FGODrums%2FBetterFloat.svg?type=shield)](https://app.fossa.com/projects/git%2Bgithub.com%2FGODrums%2FBetterFloat?ref=badge_shield)


### Troubleshooting on Mozilla Firefox

In some cases, Firefox does not grant extensions the necessary permissions automatically. This can be fixed by following these steps:

1. Open the BetterFloat popup by clicking on the icon in the toolbar
2. Look for a warning symbol in the top bar of the popup
3. Click on the warning symbol and grant the necessary permissions in the newly opened popup of your browser
4. Open the BetterFloat popup again and check if the warning symbol is gone
5. If the warning symbol is still there, please report this issue in our Discord server

## ⌨️ Development

### 💻 The Tech Stack

<div style="display: flex; flex-direction: row; align-items: center; flex-wrap: wrap; gap: 1rem;">
<img align="center" src="./assets/plasmo.png" alt="Plasmo" height="50">
<img align="center" src="https://api.iconify.design/logos:react.svg?color=%23888888" alt="React" height="50">
<img align="center" src="https://avatars.githubusercontent.com/u/139895814?s=48&v=4" alt="Aceternity UI" height="50">
<img align="center" src="https://ui.aceternity.com/_next/image?url=%2Flogo.png&w=64&q=75" alt="shadcn/ui" height="50">
<img align="center" src="https://icongr.am/devicon/typescript-original.svg?size=128&color=currentColor" alt="Typescript" height="50">
<img align="center" src="https://api.iconify.design/logos:eslint.svg?color=%23888888" alt="ESLint" height="50">
<img align="center" src="https://api.iconify.design/logos:prettier.svg?color=%23888888" alt="Prettier" height="50">
</div>

### Installation

Prerequisites:

-   Node.js `>=18.16.0`
-   pnpm `>=8.15.0` or npm `>=9.5.0`
-   tsc `>=4.7.0`

Prepare your local setup via the following command:

```bash
pnpm install
# copy the example env file
cp example.env .env
# fill in the required values. To exit VIM use ':wq'
vim .env
```

### Building

Build the extension in development or production mode:

```bash
# development mode (Chrome or Firefox)
pnpm dev
pnpm dev:firefox
# production mode (Chrome or Firefox)
pnpm build
pnpm build:firefox
```

When working with multiple version, the build process may benefit from clean builds. This can be achieved by running the following command before building:

```bash
# careful, this will delete the build folder
pnpm clean
```

### Loading

The built extension will be located in the `build` folder. For each created subversion (browser and manifest version), there will be a seperate subfolder. Load that folder as unpacked extension in your browser or pack it first and then load the packed version

**Chrome:**
- Go to `chrome://extensions` or `about:addons` and enable developer mode
- Click on "Load unpacked" and select the `build/{version}` folder

**Firefox:**
- Go to `about:debugging#/runtime/this-firefox`
- Click on "Load Temporary Add-on" and select the `build/{version}/manifest.json` file

### Contributing

To contribute to this project, create your own fork of the repository and submit a pull request.
Please follow the [conventional commits](https://www.conventionalcommits.org/en/v1.0.0/) specification (or an equivalent one) and make sure to format your code with [Prettier](https://prettier.io/). This projects supports the following commands to control code quality:

```bash
pnpm lint  # runs eslint
pnpm prettier  # currently not available, format with CTRL+SHIFT+F
```

Make sure to test your changes extensively on both browsers and include relevant results in your pull request.

## ⚠️ Disclaimer

BetterFloat is developed independently, and is not officially endorsed by or affiliated with CSFloat Inc., Skinport GmbH, or SkinBid ApS in any way. If you are a legal representative of the aforementioned companies and would like this project to be taken down, please contact me directly at legal@rums.dev.

Built with 🖤 in Munich.