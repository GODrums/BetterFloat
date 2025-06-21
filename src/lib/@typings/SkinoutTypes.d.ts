export namespace Skinout {
    export type MarketItemsResponse = {
        success: boolean;
        $_LANGUAGE: string;
        items: Item[];
        cart_sum: string;
        page: number;
        page_count: number;
        currency: string;
        currency_symbol: string;
        req_id: number;
        metadata: Metadata;
    }

    export type InventoryResponse = {
        currency: string;
        currency_symbol: string;
        first_sell: boolean;
        fromcache: boolean;
        items: InventoryItem[];
        not_accept_count: number;
        success: boolean;
        time: string;
    }

    export type Item = {
        id: string;
        market_hash_name: string;
        name: string;
        name_id: string;
        float: string;
        stickers: Sticker[];
        price: string;
        img: string;
        locked: boolean;
        unlock_time: string | false;
        total_count: number;
        in_cart: boolean;
        stickers_price: string;
    }

    export type InventoryItem = {
        assetid: string;
        img: string;
        market_hash_name: string;
        price: string;
        price_sys: number;
        view: string;
        status: string;
        stickers: Sticker[];
        is_container: boolean;
        name: string;
        name_parsed: {
            name: string;
            weapon: string;
            skin: string;
            wear: string;
            wear_minify: string;
            statTrak: boolean;
            souvenir: boolean;
            knife: boolean;
            phase: boolean;
        };
    }

    export type Sticker = {
        name: string;
        img: string;
        type: "sticker" | "charm";
        price: string;
        price_sell: number;
        link: string;
        slot?: number;
        wear?: number;
    }

    export type Metadata = {
        h1: string;
        title: string;
        description: string;
        breadcrumbs: Breadcrumb[];
        canonical: string;
    }

    export type Breadcrumb = {
        link: string;
        name: string;
    }
}