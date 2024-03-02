import { ItemStyle } from './FloatTypes';

export namespace Skinport {
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
    };

    export type ItemData = {
        data: {
            history: {
                date: string;
                price: {
                    currency: string;
                    value: number;
                };
                saleId: number;
                wear: string;
            }[];
            item: Item;
            offers: {
                currency: string;
                highPrice: number;
                lowPrice: number;
                offerCount: number;
            };
            otherSales: {
                total: number;
                items: Item[];
            };
            rating: {
                value: number;
                votes: number;
            };
            recentViewed: {
                total: number;
                items: Item[];
            };
            recommendedStickers: any[];
            relatedItems: RelatedItem[];
            similarItems: Item[];
            trends: {
                data: {
                    date: number;
                    value: number;
                    volume: number;
                };
            };
        };
        message: string | null;
        requestId: string;
        success: boolean;
    };

    export type RelatedItem = {
        count: number;
        default: boolean;
        discount: number;
        exterior: string;
        price: {
            currency: string;
            value: number;
        };
        quality: string;
        type: string;
        url: string;
        versions: {
            count: number;
            discount: number;
            price: {
                currency: string;
                value: number;
            } | null;
            url: string;
            version: string;
        }[];
    };

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
    };

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
    };

    export type OrderHistoryData = {
        message: string | null;
        requestId: string;
        success: boolean;
        result: {
            counts: {
                closed: number;
                paid: number;
            };
            orders: {
                created: string;
                fee: {
                    value: number;
                    currency: string;
                };
                id: number;
                price: {
                    value: number;
                    currency: string;
                };
                sales: Item[];
                status: 'paid' | 'closed' | 'open';
                value: {
                    value: number;
                    currency: string;
                };
            }[];
            page: number;
            pages: number;
        };
    };

    export type CreateOrderResponse = {
        message: string | null;
        requestId: string;
        success: boolean;
        result: {
            id: number;
        };
    };

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
        currency: string;
        saleId: number;
    };

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
        tags: [
            {
                name: string;
                name_localized: string;
            }
        ];
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
