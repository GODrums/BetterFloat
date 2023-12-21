export namespace Extension {
    export type Settings = {
        runtimePublicURL: string;
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
        csfRemoveClustering: boolean;
        enableSkinport: boolean;
        spCheckBoxes: boolean;
        spStickerPrices: boolean;
        spBlueGem: boolean;
        ocoAPIKey: string;
        spPriceReference: 0 | 1;
        spSteamPrice: boolean;
        spBuffDifference: boolean;
        skinportRates: 'skinport' | 'real';
        spBuffLink: 'action' | 'text';
        spAutoclosePopup: boolean;
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
        floatColoring: IFloatColoringSites;
        colors: IColorsSites;
    };

    export type IColors = {
        profit: string;
        loss: string;
        neutral: string;
    };

    export type IColorsSites = {
        csfloat: IColors;
        skinport: IColors;
        skinbid: IColors;
    };

    export type IFloatColoringSites = {
        csfloat: boolean;
        skinport: boolean;
        skinbid: boolean;
    };

    export type CustomPriceMapping = {
        [name: string]: {
            bid: number; // 105
            ask: number; // 167
            avg30: number; // 175
            liquidity: number; // 78.14
        };
    };

    export type ApiBuffResponse = {
        data: CustomPriceMapping;
        time: number;
    };

    /**
     * Mapping corresponding to the response from https://prices.csgotrader.app/latest/buff163.json
     */
    export type CSGOTraderBuffMapping = {
        [name: string]: {
            starting_at: {
                price: number;
                doppler?: DopplerPrices;
            };
            highest_order: {
                price: number;
                doppler?: DopplerPrices;
            };
        };
    };

    /**
     * Mapping corresponding to the response from https://prices.csgotrader.app/latest/prices_v6.json
     * @deprecated use CSGOTraderBuffMapping instead
     */
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
                    doppler?: DopplerPrices;
                };
                highest_order: {
                    price: number;
                    doppler?: DopplerPrices;
                };
            };
        };
    };

    /**
     * @see CSGOTraderBuffMapping
     */
    type DopplerPrices = {
        Sapphire: number;
        Ruby: number;
        'Black Pearl': number;
        Emerald: number;
        'Phase 1': number;
        'Phase 2': number;
        'Phase 3': number;
        'Phase 4': number;
    };

    export type CrimsonWebMapping = {
        [weapon in CWWeaponTypes]: {
            [paint_seed: string]: {
                img?: string;
                type: CWKnifeTypes | CWGloveTypes;
                tier: 1 | 2 | 3;
            };
        };
    };

    export type CWWeaponTypes = 'gloves' | 'm9' | 'karambit' | 'nomad';

    type CWGloveTypes = 'Left Hand' | 'Right Hand' | 'Double Web' | 'Triple Web';

    // only m9 can have 3 webs
    type CWKnifeTypes = 'Single Web' | 'Double Web' | 'Triple Web';

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

    export type ApiStatusResponse = {
        sites: [string];
        message: string;
        statusCode: number;
    };
}

// reponse from https://csbluegem.com/api
export namespace BlueGem {
    export type PatternElement = {
        backside: number;
        double_sided: number;
        playside: number;
        screenshot: string;
    };
    export type PastSale = {
        csfloat: string; // csfloat db link
        date: string;
        float: number;
        isStattrak: boolean;
        origin: 'CSFloat' | 'BroSkins' | 'Buff';
        pattern: number;
        price: number;
        url: string;
    };

    export type Response = [PatternElement, PastSale[]] | [PastSale[]];
}

export interface FadePercentage {
    seed: number;
    percentage: number;
    ranking: number;
}
