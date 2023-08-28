export type FloatItem = {
    name: string;
    quality: string;
    style: ItemStyle;
    condition: ItemCondition;
    float: number;
    price: number;
    bargain: false | number;
};

export type ItemType = 'Container' | 'Sticker' | 'Weapon' | 'Knife' | 'Gloves';

export type ItemQuality = '' | 'Souvenir' | 'StatTrak™' | 'Base Grade Container' | 'Remarkable Sticker' | 'Exotic Sticker' | 'Extraordinary Sticker' | 'High Grade Sticker';

export type ItemStyle = '' | 'Vanilla' | 'Sapphire' | 'Ruby' | 'Black Pearl' | 'Emerald' | 'Phase 1' | 'Phase 2' | 'Phase 3' | 'Phase 4';

export type ItemCondition = '' | 'Factory New' | 'Minimal Wear' | 'Field-Tested' | 'Well-Worn' | 'Battle-Scarred';

export type ExtensionSettings = {
    buffprice: boolean;
    autorefresh: boolean;
    stickerPrices: boolean;
    priceReference: 0 | 1;
    refreshInterval: 10 | 30 | 60 | 120 | 300;
    showSteamPrice: boolean;
    listingAge: 0 | 1 | 2;
    showBuffDifference: boolean;
    showTopButton: boolean;
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

export module Skinport {
    export type MarketData = {
        filter: {
            components: {
                appid: number;
                data: any;
                name: string;
                type: string;
            }[];
            total: number;
        };
        items: Item[];
        message: string | null;
        requestId: string;
        success: boolean;
    }

    // https://skinport.com/api/home
    export type HomeData = {
        message: string | null;
        requestId: string;
        success: boolean;
        adverts: {
            bgColor: string;
            button: {
                text: string;
                link: string;
            };
            id: number;
            img: string;
            img2x: string;
            text: string;
            title: string;
        }[];
        blog: {
            img: string;
            published_at: string;
            slug: string;
            title: string;
        }[];
        sales: {
            appid: number;
            items: Item[];
            total: number;
        }[]; // the four sale rows
        score: {
            count: number;
            rating: number;
        }; // Trustpilot score
    };

    // https://skinport.com/api/cart
    export type CartData = {
        message: string | null;
        requestId: string;
        success: boolean;
        result: {
            cart: Item[];
            openOrders: any[]; // what is this?
        };
    }

    export type Listing = {
        name: string;
        type: string;
        text: string;
        price: number;
        stickers: {
            name: string;
        }[];
        style: ItemStyle;
        wear: number;
        wear_name: string;
    }

    export type Item = {
        appid: number;
        assetId: number;
        assetid: string; // those are not the same!
        bgColor: string | null;
        canHaveScreenshots: boolean;
        category: string;
        category_localized: string;
        collection: string | null;
        collection_localized: string | null;
        color: string;
        currency: string;
        customName: string | null;
        exterior: string;
        family: string;
        family_localized: string;
        finish: number;
        id: number;
        image: string;
        itemId: number;
        link: string;
        lock: any | null;
        marketHashName: string;
        marketName: string;
        name: string;
        ownItem: boolean;
        pattern: number;
        productId: number;
        quality: string; // e.g. "★"
        rarity: string; // e.g. "Covert"
        rarityColor: string; // in hex
        rarity_localized: string;
        saleId: number;
        salePrice: number; // e.g. 148936 for 1,489.36€
        saleStatus: string;
        saleType: string;
        screenshots: string[] | null;
        shortId: string;
        souvenir: boolean;
        stackAble: boolean;
        stattrak: boolean;
        steamid: string;
        stickers: StickerData[];
        subCategory: string;
        subCategory_localized: string;
        suggestedPrice: number;
        tags: [{
            name: string;
            name_localized: string;
        }];
        text: string;
        title: string;
        type: string;
        url: string;
        version: string;
        versionType: string;
        wear: number;
    };

    export type StickerData = {
        color: string | null;
        img: string;
        name: string;
        name_localized: string;
        slot: number;
        slug: any | null;
        sticker_id: number | null;
        type: string | null;
        type_localized: string | null;
        value: number | null;
        wear: number | null;
    };
}

export interface EventData<T> {
    status: string;
    url: string;
    data: T;
}

export type ListingData = {
    created_at: string;
    id: string;
    is_seller: boolean;
    is_watchlisted: boolean;
    item: {
        asset_id: string;
        collection: string;
        d_param: string;
        def_index: number;
        description: string;
        float_value: number;
        has_screenshot: boolean;
        icon_url: string;
        inspect_link: string;
        is_commodity: boolean;
        is_souvenir: boolean;
        is_stattrak: boolean;
        item_name: string;
        market_hash_name: string;
        paint_index: number;
        paint_seed: number;
        quality: number;
        rarity: number;
        rarity_name: string;
        scm: SCMType;
        stickers: StickerData[];
        tradable: boolean;
        type: 'skin' | 'sticker';
        type_name: 'Skin' | 'Sticker';
        wear_name: 'Factory New' | 'Minimal Wear' | 'Field-Tested' | 'Well-Worn' | 'Battle-Scarred';
    };
    max_offer_discount: number;
    max_offer_price: number;
    price: number;
    seller: SellerData;
    state: 'listed' | 'delisted';
    type: 'buy now' | 'auction';
    watchers: number;
};

export type SellerData = {
    avatar: string;
    away: boolean;
    flags: number;
    has_valid_steam_api_key: boolean;
    online: boolean;
    stall_public: boolean;
    statistics: {
        median_trade_time: number;
        total_avoided_trades: number;
        total_failed_trades: number;
        total_trades: number;
        total_verified_trades: number;
    };
    steam_id: string;
    username: string;
    verification_mode: string;
};

export type StickerData = {
    icon_url: string;
    name: string;
    scm: SCMType;
    slot: number;
    stickerId: number;
    wear: number;
};

export type HistoryData = {
    avg_price: number;
    count: number;
    day: string;
};

export type SCMType = {
    price: number;
    volume: number;
};
