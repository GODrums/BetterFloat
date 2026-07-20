import { resolve } from 'node:path';
import { defineConfig } from 'wxt';
import { escapeChromiumRejectedCharacters, validateChromiumManifestScripts } from './scripts/chromiumUtf8';

const hostPermissions = [
	'*://*.csfloat.com/*',
	'*://*.skinport.com/*',
	'*://*.skinbid.com/*',
	'*://*.avan.market/*',
	'*://*.bitskins.com/*',
	'*://*.cs.money/*',
	'*://*.dmarket.com/*',
	'*://*.steamcommunity.com/*',
	'*://*.steampowered.com/*',
	'*://*.gamerpay.gg/*',
	'*://*.haloskins.com/*',
	'*://*.lis-skins.com/*',
	'*://*.market.csgo.com/*',
	'*://*.rapidskins.com/*',
	'*://*.shadowpay.com/*',
	'*://*.skinbaron.de/*',
	'*://*.skinflow.gg/*',
	'*://*.skinout.com/*',
	'*://*.skin.place/*',
	'*://*.skinsmonkey.com/*',
	'*://*.skinswap.com/*',
	'*://*.swap.gg/*',
	'*://*.tradeit.gg/*',
	'*://*.waxpeer.com/*',
	'*://*.whitemarket.com/*',
	'*://*.youpin898.com/*',
];

export default defineConfig({
	modules: ['@wxt-dev/module-react'],
	publicDir: 'public',
	webExt: { disabled: true },
	zip: {
		excludeSources: ['build/**'],
	},
	hooks: {
		'build:publicAssets': (_wxt, files) => {
			files.push({ absoluteSrc: resolve('assets/icon.png'), relativeDest: 'icon.png' }, { absoluteSrc: resolve('assets/marketids.json'), relativeDest: 'marketids.json' });
		},
		'build:done': async (wxt, output) => {
			await validateChromiumManifestScripts(wxt.config.outDir, output.manifest);
		},
	},
	vite: () => ({
		// Chromium rejects literal Unicode noncharacters such as Dexie's U+FFFF
		// sentinel, so keep their JavaScript values while escaping their source bytes.
		plugins: [
			{
				name: 'chromium-compatible-utf8',
				generateBundle(_options, bundle) {
					for (const output of Object.values(bundle)) {
						if (output.type === 'chunk') output.code = escapeChromiumRejectedCharacters(output.code);
					}
				},
			},
		],
		define: Object.fromEntries(
			['PLASMO_PUBLIC_PRICINGAPI', 'PLASMO_PUBLIC_BETTERFLOATAPI', 'PLASMO_PUBLIC_BETTERFLOATCDN', 'PLASMO_PUBLIC_CRYPTO'].map((name) => [
				`process.env.${name}`,
				JSON.stringify(process.env[name] ?? ''),
			])
		),
	}),
	alias: {
		'~style.css': resolve('src/style.css'),
		'~lib': resolve('src/lib'),
		'~contents': resolve('src/contents'),
		'~background': resolve('src/background'),
		'~popup': resolve('src/popup'),
	},
	manifest: ({ browser, mode }) => ({
		name: mode === 'development' ? 'DEV - BetterFloat' : 'BetterFloat',
		author: 'Rums',
		description: 'Enhance your website experience on 15+ CS2 skin markets!',
		homepage_url: 'https://betterfloat.com',
		version: '3.6.5',
		permissions: ['unlimitedStorage', 'storage', 'scripting', 'activeTab', ...(browser === 'firefox' ? [] : ['omnibox' as const]), 'notifications'],
		host_permissions: hostPermissions,
		optional_host_permissions: ['https://*/*', 'http://*/*', '*://*.buff.market/*'],
		externally_connectable: { matches: ['https://*.rums.dev/*'] },
		omnibox: { keyword: 'bf' },
		icons: {
			16: 'icon.png',
			32: 'icon.png',
			48: 'icon.png',
			64: 'icon.png',
			128: 'icon.png',
		},
		action: {
			default_icon: {
				16: 'icon.png',
				32: 'icon.png',
				48: 'icon.png',
				64: 'icon.png',
				128: 'icon.png',
			},
		},
		web_accessible_resources: [
			{
				resources: ['betterfloat-main.js', 'skinport-main.js', 'marketids.json'],
				matches: [
					'*://*.avan.market/*',
					'*://*.bitskins.com/*',
					'https://*.buff.market/*',
					'https://*.csfloat.com/*',
					'https://*.cs.money/*',
					'*://*.dmarket.com/*',
					'*://*.gamerpay.gg/*',
					'*://*.haloskins.com/*',
					'https://lis-skins.com/*',
					'*://*.market.csgo.com/*',
					'*://*.rapidskins.com/*',
					'*://*.shadowpay.com/*',
					'*://*.skinbaron.de/*',
					'https://*.skinbid.com/*',
					'*://*.skinflow.gg/*',
					'*://*.skinout.gg/*',
					'*://*.skin.place/*',
					'https://*.skinport.com/*',
					'*://*.skinsmonkey.com/*',
					'*://*.skinswap.com/*',
					'*://*.swap.gg/*',
					'https://*.tradeit.gg/*',
					'*://*.waxpeer.com/*',
					'https://*.white.market/*',
				],
			},
		],
		...(browser === 'chrome' ? { key: process.env.CRX_PUBLIC_KEY } : {}),
		...(browser === 'firefox'
			? {
					browser_specific_settings: {
						gecko: { id: process.env.FIREFOX_EXT_ID || 'betterfloat@rums.dev', strict_min_version: '128.0' },
					},
				}
			: {}),
	}),
});
