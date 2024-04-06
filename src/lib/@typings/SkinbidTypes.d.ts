import type { ItemStyle } from './FloatTypes';

export namespace Skinbid {
    // https://api.skinbid.com/api/search/auctions?
    export type MarketData = {
        items: Listing[];
        maximumPrice: number;
        totalItems: number;
    };

    export type ShopData = {
        countryCode: string;
        deliveryRate: number;
        deliveryRating: string;
        deliveryTimeMinutes: number;
        isEliteSeller: boolean;
        isPartner: boolean;
        name: string;
        profilePicture: string;
        steamLevel: number;
        steamMemberSince: string;
        totalTrades: number;
    };

    // https://api.skinbid.com/api/public/exchangeRates
    export type ExchangeRates = {
        currencyCode: string;
        rate: number;
        updated: string;
    }[];

    export type HTMLItem = {
        name: string;
        type: string;
        price: number;
        style: ItemStyle;
        wear: number;
        wear_name: string;
        category: string;
    };

    // https://api.skinbid.com/api/user/whoami
    export type UserData = {
        adyenBalanceAmount: number;
        adyenBalanceCurrency: string;
        avatarUrl: string;
        ban: any | null;
        bargainsEnabled: boolean;
        canInitiateKyc: boolean;
        commission: number;
        countryCode: string;
        discordConnected: boolean;
        discordId: string | null;
        email: string;
        escrowEndDate: string;
        id: number;
        isEmailConfirmed: boolean;
        isKycComplete: boolean;
        isKycEligible: boolean;
        kycBankAccountStatus: string;
        kycCompleteDate: string | null;
        kycIdentityStatus: string;
        kycPhotoIdStatus: string;
        kycStatus: string;
        kycStatusMessage: string | null;
        noFeesCampaign: {
            buyerNoFeeCampainAvailable: boolean;
            buyerNoFeeCampaignsLeft: number;
            sellerReducedFeeCampaignAuctionHash: string | null;
            sellerReducedFeeCampaignAvailable: boolean;
            sellerReducedFeeCampaignListingStatus: any | null;
            sellerReducedFeeCampaignUsedDate: string | null;
            usedBuyerCampaigns: any[];
        };
        notificationsLastSeen: string;
        overrideSteamRequirements: boolean;
        payoutTier: number;
        preferences: UserPreferences;
        processingTier: number;
        referralCode: string | null;
        refreshToken: string;
        shopCode: string | null;
        shopEnabled: boolean;
        signupDate: string;
        skbTradeLock: boolean;
        steamId: string | null;
        steamSignupDate: string | null;
        username: string;
    };

    // https://api.skinbid.com/api/user/preferences
    export type UserPreferences = {
        currency: string;
        discordNotificationSettings: number;
        discordNotificationSettingsObject: {
            goodDeals: boolean;
            news: boolean;
            tradeDeadline: boolean;
        } | null;
        emailNotificationSettings: number;
        emailNotificationSettingsObject: {
            auctionEndNoBids: boolean;
            auctionLost: boolean;
            auctionOutbid: boolean;
            auctionWon: boolean;
            bidReceived: boolean;
            itemSold: boolean;
            news: boolean;
            thingsYouMissed: boolean;
            tips: boolean;
        } | null;
        id: number;
        payoutSchedule: string;
        steamApiKey: string | null;
        steamTradeLink: string | null;
        userId: number;
        webNotificationsEnabled: boolean;
    };

    export type Listing = {
        auction: Auction;
        bids: Bid[];
        canMakeOffer: boolean;
        currentHighestBid: number;
        currentHighestBidEur: number;
        followConfig: any | null;
        isUserSeller: boolean;
        items: ListedItem[] | null;
        minimimBargainAmount: number | null;
        nextMinimumBid: number;
        nextMinimumBidEur: number;
        numberOfBids: number;
        numberOfFollowers: number;
        numberOfOffers: number;
        offers: any | null;
        offersLeft: number;
        relistOptions: any | null;
        sellerShopCode: any | null;
        trade: any | null;
        yourOffer: any | null;
    };

    export type ListedItem = {
        auctionHash: string;
        discount: number;
        isGoodDeal: boolean;
        isOnAuction: boolean;
        isTradeLocked: boolean;
        item: Item;
        itemHash: string;
        skbMeta: {
            currency: any | null;
            currentMarketPrice: any | null;
            currentSteamPrice: any | null;
            isHighStickerValue: boolean;
            isLowFloat: boolean;
            isRarePattern: boolean;
            recommendPrice: any | null;
        };
        tradeLockExpireDate: string | null;
    };

    export type Item = {
        assetId: string;
        category: string;
        classId: string;
        color: string | null;
        defIndex: number;
        dopplerPhase: any | null;
        fade: number;
        fireIce: any | null;
        float: number;
        fullName: string;
        hasFrontBackScreenShots: boolean;
        hasScreenshot: boolean;
        imageUrl: string;
        inspectLink: string;
        instanceId: string;
        isBlueGem: boolean;
        isHighStickerValue: boolean;
        isRarePattern: boolean;
        isSouvenir: boolean;
        isStatTrak: boolean;
        isTradeLocked: boolean;
        itemHash: string | null;
        itemId: number | null;
        marketInspectLink: string;
        name: string;
        paintIndex: number;
        paintSeed: number;
        quality: number;
        rarity: number;
        screenshotUrl: string | null;
        souvenirText: string | null;
        steamImageHash: string | null;
        stickers: Sticker[];
        subCategory: string; // "AWP"
        type: string; // "Weapon"
        wearName: number; // "Battle-Scarred"
    };

    export type Sticker = {
        codeName: string;
        id: number;
        imageUrl: string;
        material: string;
        name: string;
        percentage: number;
        slot: number;
        stickerId: number;
        wear: number;
    };

    export type Bid = {
        amount: number;
        bidderId: number;
        created: string;
        yourBid: boolean;
    };

    export type Auction = {
        allowOffers: boolean;
        auctionHash: string;
        auctionName: string | null;
        auctionType: "REGULAR" | "LIGHTNING";
        bargainReservePriceAmount: number | null;
        bundleId: number;
        buyNowPrice: number | null;
        buyNowPriceEur: number | null;
        campaignApplied: boolean;
        created: string;
        endDate: string;
        hasBargainReservePrice: boolean | null;
        hasBuyNowPrice: boolean | null;
        isActive: boolean;
        isBundle: boolean;
        isFixedPrice: boolean;
        isPrivate: boolean;
        numberOfOffers: number;
        partnerSteamId: string | null;
        runtime: any | null;
        sellType: 'AUCTION' | 'FIXED_PRICE';
        startBid: number;
        startBidEur: number;
    };

    // https://api.skinbid.com/api/public/price?
    export type PriceStatsData = {
        currency: string;
        currentPrice: number;
        fullName: string;
        imageUrl: string;
        periodicAveragePrice: number;
        periodicMaxPrice: number;
        periodicMinPrice: number;
        prices: {
            averagePrice: number;
            maxPrice: number;
            minPrice: number;
            seen: string;
        }[];
        steamPrices: {
            average7Days: number;
            average30Days: number;
            average60Days: number;
            currentPrice: number;
        };
    };
}
