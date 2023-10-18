export namespace Extension {
    export type Settings = {
        enableCSFloat: boolean;
        autorefresh: boolean;
        stickerPrices: boolean;
        csBlueGem: boolean;
        priceReference: 0 | 1;
        refreshInterval: 10 | 30 | 60 | 120 | 300;
        showSteamPrice: boolean;
        listingAge: 0 | 1 | 2;
        showBuffDifference: boolean;
        showBuffPercentageDifference: boolean;
        showTopButton: boolean;
        useTabStates: boolean;
        enableSkinport: boolean;
        spCheckBoxes: boolean;
        spStickerPrices: boolean;
        spPriceReference: 0 | 1;
        spSteamPrice: boolean;
        spBuffDifference: boolean;
        skinportRates: 'skinport' | 'real';
        spBuffLink: 'action' | 'text';
        spFloatColoring: boolean;
        spFilter: {
            priceLow: number;
            priceHigh: number;
            name: string;
            types: string[];
        };
        enableSkinbid: boolean;
        skbPriceReference: 0 | 1;
        skbBuffDifference: boolean;
        skbListingAge: boolean;
        skbStickerPrices: boolean;
    };

    export type CSGOTraderMapping = {
        [name: string]: {
            steam: {
                last_24h: number;
                last_7d: number;
                last_30d: number;
                last_90d: number;
            };
            bitskins: {
                price: string;
                instant_sale_price: string | null;
            };
            lootfarm: number;
            csgotm: string;
            csmoney: {
                price: number;
            };
            skinport: {
                suggested_price: number;
                starting_at: number;
            };
            csgotrader: {
                price: number;
            };
            swapgg: number;
            csgoexo: number;
            cstrade: {
                price: number;
            };
            skinwallet: string | number | null;
            buff163: {
                starting_at: {
                    price: number;
                };
                highest_order: {
                    price: number;
                };
            };
        };
    };

    // response from api.rums.dev/v1/csfloatstalls/:id
    export type CustomStallData = {
        status: 'OK' | 'ERROR';
        data: {
            id: number;
            stall_id: string;
            created_at: string;
            roles: ('Developer' | 'Contributor' | 'Supporter' | 'Enjoyer')[];
            options: {
                video: {
                    mp4: string;
                    webm: string;
                    poster: string;
                };
                transparent_elements: boolean;
                'background-color': string;
            };
        };
    };

    // reponse from https://csbluegem.com/api
}
export namespace BlueGem {
    export type PatternElement = {
        backside: number;
        double_sided: number;
        playside: number;
        screenshot: string;
    };
    export type PastSale = {
        date: string;
        float: number;
        pattern: number;
        price: number;
        url: string;
    };

    export type Response = [PatternElement, PastSale[]] | [PastSale[]];
}
