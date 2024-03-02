import { Storage } from "@plasmohq/storage"

export const ExtensionStorage = {
    local: new Storage({
        area: "local"
    }),
    sync: new Storage({
        area: "sync"
    })
}

export function getSetting(key: keyof IStorage) {
    return ExtensionStorage.sync.get(key);
}

export function getAllSettings() {
    return ExtensionStorage.sync.getAll() as unknown as Promise<IStorage>;
}

export const DEFAULT_SETTINGS = {
    runtimePublicURL: chrome.runtime.getURL('/public'),
    "csf-enable": true,
    "csf-autorefresh": true,
    "csf-stickerprices": true,
    "csf-csbluegem": true,
    "csf-pricereference": 0,
    "csf-refreshinterval": 0, // TODO: map to seconds
    "csf-floatappraiser": false,
    "csf-buffdifference": true,
    "csf-buffdifferencepercent": false,
    "csf-listingage": 1,
    "csf-topbutton": true,
    "csf-tabstates": true,
    "csf-floatcoloring": true,
    "csf-removeclustering": false,
    "sp-enable": true,
    "sp-autocheckboxes": true,
    "sp-stickerprices": true,
    "sp-csbluegem": true,
    "sp-ocoapikey": '',
    "sp-pricereference": 0,
    "sp-currencyrates": 0,
    "sp-steamprices": false,
    "sp-buffdifference": true,
    "sp-buffdifferencepercent": false,
    "sp-bufflink": 'action',
    "sp-autoclosepopup": true,
    "sp-floatcoloring": true,
    "spFilter": {
        priceLow: 0,
        priceHigh: 999999,
        name: '',
        types: [],
        new: false,
    },
    "skb-enable": true,
    "skb-pricereference": 0,
    "skb-buffdifference": true,
    "skb-listingage": true,
    "skb-stickerprices": true,
    "csf-colors": {
        profit: '#008000',
        loss: '#ce0000',
        neutral: '#708090',
    },
    "sp-colors": {
        profit: '#008000',
        loss: '#ce0000',
        neutral: '#000000',
    },
    "skb-colors": {
        profit: '#0cb083',
        loss: '#ce0000',
        neutral: '#FFFFFF',
    },
};

export type IStorage = typeof DEFAULT_SETTINGS;
export type EStorage = { key: keyof IStorage, value: IStorage[keyof IStorage] }[];