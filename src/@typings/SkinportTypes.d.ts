import { ItemStyle } from "./FloatTypes";

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

    export type UserData = {
        country: string;
        csrf: string;
        currency: string; // e.g. "EUR"
        followings: number[];
        limits: {
            kycTier1PayoutMax: number;
            kycTier2PayoutMax: number;
            maxOrderValue: number;
            minOrderValue: number;
            minPayoutValue: number;
            minSaleValue: number;
            saleFeeReduced: number;
        };
        locale: string;
        message: string | null;
        paymentMethods: string[];
        rate: 1;
        rates: { [target: string]: number }; //currency -> target
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
        // Knife, Gloves, Agent, Weapon, Collectible, Container, Sticker
        category: string;
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
        marketName: string; // localized hash name
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