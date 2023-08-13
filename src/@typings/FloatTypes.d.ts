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
    priceReference: 0 | 1;
    refreshInterval: 10 | 30 | 60 | 120 | 300;
    showSteamPrice: boolean;
};
