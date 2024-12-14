export namespace Skinbaron {
    export type HTMLItem = {
        name: string;
        type: string; // e.g. M4A4
        condition: string;
        price: number;
        wear: number;
        wear_name: string;
        isStatTrak: boolean;
    };

    // api/v2/PromoOffers?appId=730&language=en&sort=BP&itemsPerPage=20&country=DE
    export type PromoOffers = {
        bestDeals: {	
            aggregatedMetaOffers: SingleItem[];
            numberOfOffers: number;
        };
        promoOffers: {
            physicalArticles: any[];
        };
        specialOffers: {
            aggregatedMetaOffers: SingleItem[];
        };
    };

    // https://skinbaron.de/api/v2/Browsing/FilterOffers?appId=730&v=2827&v=2827&sort=PA&language=en
    export type FilterOffers = {
        aggregatedMetaOffers: SingleItem[];
        itemsPerPage: number;
        metaDescriptionString: string;
        numberOfOffers: number;
        numberOfPages: number;
        page: number;
        titleString: string;
    };

    // api/v2/Profile/PersonalData/Overview
    // privacy concerns! never store this data
    export type PersonalDataOverview = {
        adyenTierData: {
            processedAmountLimit: number;
            processedAmountTotal: number;
        };
        availableLanguagesResponse: {
            languagesMap: {
                phoneCode: string;
                name: string;
                value: string;
            }[];
        };
        canBeBoundToAffiliate: boolean;
        emailAddress: string;
        localizedCountry: string;
        personalDataForm: {
            addressOne: string;
            addressTwo: string;
            birthday: string;
            city: string;
            countryCode: string;
            firstName: string;
            houseNumberOrName: string;
            lastName: string;
            phone: string;
            region: string;
            stateOrProvince: string;
            zipCode: string;
        };
        tradeOfferLink: string;
        validationLevel: number;
    }

    // api/v2/Profile/Summary
    export type ProfileSummary = {
        accountBalance: number;
        avatarUrl: string;
        userName: string;
        uuid: string;
    }

    // api/v2/Account/Adyen/Balance
    export type AdyenBalance = {
        isActionFailed: boolean;
        isAdyenTaskFailed: boolean;
        isHasErrors: boolean;
        isHasObject: boolean;
        isHasStatus: boolean;
        obj: {
            balance: number;
            currency: string;
        }
    }

    export interface Item {
        appid: number; // 730
        formattedSteamMarketPrice: string; // "13.02 €"
        id: number; // "/offers/show?offerUuid=
        offerLink: string;
        steamMarketPrice: number;
    }

    export interface MassItem extends Item {
        extendedProductInformation: {
            localizedName: string;
            properties: {
                id: number;
                localizedName: string;
            }[];
        };
        formattedLowestPrice: string;
        lowestPrice?: number;
        lowestPriceTradeLocked?: number;
        numberOfOffers: number;
        numberOfOffersTradeLocked: number;
        variant: {
            externalFilters: {
                variantId: number;
                variantPropertyIds: number[];
            };
            imageUrl: string;
            localizedName: string;
            localizedRarityName: string;
            rarityClassName: string;
        }
    }

    export interface SingleItem extends Item {
        extendedProductInformation: {
            collectionName: string;
            localizedName: string;
            maxWear: number;
            minWear: number;
            properties: {
                id: number;
                localizedName: string;
            }[];
        };
        singleOffer: {
            dopplerClassName?: string;
            exteriorClassName: string; // "factory-new"
            externalVariantFilters: {
                variantId: number;
                variantPropertyIds: number[];
            };
            formattedItemPrice: string; // "10.39 €"
            historyItemId: number;
            imageUrl: string;
            inspectLink: string;
            isNew: boolean;
            isSoldAndPaid: boolean;
            isWearPrecise: boolean;
            itemPrice: number;
            localizedExteriorName: string; // "Factory New"
            localizedName: string; // "MAG-7 | Justice"
            localizedRarityName: string; // "Classified"
            localizedVariantTypeName: string; // "Shotgun"
            mosaic: {
                createdAt: string;
                fileName: string;
                id: string;
                screenshotId: string;
                status: string;
                storageZone: string;
                updatedAt: string;
            }
            mosaicId: string; // same as mosaic.id
            rarityClassName: string; // "legendary"
            screenshotId: string;
            screenshotImages: {
                createdAt: string;
                fileName: string;
                id: string;
                mimeType: string;
                storageZone: string;
                updatedAt: string;
                viewAngle: string;
            }[];
            sellerUuid: string;
            stackable: boolean;
            statTrakString?: "StatTrak™";
            souvenirString?: "Souvenir";
            stickers: {
                imageUrl: string;
                localizedName: string;
            }[];
            tradeLockHoursLeft: number;
            wearPercent: number; // 6.0331788
        };
    }
}