// Define color gradients for each charm as [pattern, color] stops
export const CHARM_GRADIENTS: Record<string, Array<[number, string]>> = {
    'Die-cast AK': [
        [0, '#ffdf00'], // GoldenYellow
        [1000, '#d4af37'], // MetallicGold
        [15000, '#ffa500'], // Orange
        [20000, '#cd1c18'], // ChiliRed
        [22500, '#ff00ff'], // Fuchisa
        [50000, '#fd3db5'], // Magenta
        [60000, '#7f00ff'], // Violet
        [83000, '#305cde'], // RoyalBlue
        [93000, '#305cde'], // BabyBlue
        [100000, '#305cde'], // BabyBlue
    ],
    'Baby Karat T': [
        [0, '#c68346'], // Copper
        [61000, '#efbf04'], // Gold
        [100000, '#efbf04'],
    ],
    'Baby Karat CT': [
        [0, '#c68346'], // Copper
        [61000, '#efbf04'], // Gold
        [100000, '#efbf04'],
    ],
    'Semi-Precious': [
        [0, '#98fbcb'], // MintGreen
        [38000, '#305cde'], // BabyBlue
        [75000, '#6c3baa'], // RoyalPurple
        [100000, '#6c3baa'],
    ],
    "Lil' Squirt": [
        [0, '#008000'], // Green
        [28000, '#0047ab'], // PurpleBlue
        [57000, '#6c3baa'], // RoyalPurple
        [75000, '#ff00ff'], // Fuchisa
        [100000, '#ff00ff'],
    ],
    'Titeenium AWP': [
        [0, '#ccff00'], // YellowGreen
        [18000, '#008000'], // Green
        [70000, '#305cde'], // RoyalBlue
        [80000, '#6c3baa'], // RoyalPurple
        [100000, '#6c3baa'],
    ],
    'Hot Hands': [
        [0, '#fd3db5'], // Magenta
        [55000, '#cd1c18'], // ChiliRed
        [77000, '#ffa500'], // Orange
        [100000, '#ffa500'],
    ],
    'Disco MAC': [
        [0, '#6c3baa'], // RoyalPurple
        [27000, '#ff00ff'], // Fuchisa
        [40000, '#ffde21'], // Yellow
        [55000, '#98fbcb'], // MintGreen
        [85000, '#305cde'], // RoyalBlue
        [100000, '#305cde'],
    ],
    'Glamour Shot': [
        [0, '#cd1c18'], // ChiliRed
        [5000, '#ff00ff'], // Fuchisa
        [35000, '#ffde21'], // Yellow
        [55000, '#0047ab'], // PurpleBlue
        [75000, '#305cde'], // RoyalBlue
        [100000, '#305cde'],
    ],
    'Hot Howl': [
        [0, '#cd1c18'], // ChiliRed
        [31500, '#ffa500'], // Orange
        [67000, '#d4af37'], // MetallicGold
        [100000, '#d4af37'],
    ],
    "Lil' Monster": [
        [0, '#cd1c18'], // ChiliRed
        [400, '#ffde21'], // Yellow
        [42000, '#98fbcb'], // MintGreen
        [90000, '#00ffff'], // Cyan
        [100000, '#00ffff'],
    ],
    "Lil' Squatch": [
        [0, '#ffa500'], // Orange
        [5000, '#ffde21'], // Yellow
        [25000, '#008000'], // Green
        [45000, '#305cde'], // RoyalBlue
        [72000, '#6c3baa'], // RoyalPurple
        [100000, '#6c3baa'],
    ],
    "Lil' Sandy": [
        [0, '#942222'], // RedBrown
        [2000, '#6d3b07'], // Mocha
        [20000, '#008000'], // Green
        [45000, '#305cde'], // RoyalBlue
        [80000, '#6c3baa'], // RoyalPurple
        [100000, '#6c3baa'],
    ],
    "Lil' Whiskers": [
        [0, '#0047ab'], // PurpleBlue
        [5000, '#6c3baa'], // RoyalPurple
        [27000, '#ff00ff'], // Fuchisa
        [47000, '#ba8e23'], // DarkYellow
        [55000, '#ffde21'], // Yellow
        [63000, '#98fbcb'], // MintGreen
        [85000, '#00ffff'], // Cyan
        [100000, '#00ffff'],
    ],
    "That's Bananas": [
        [0, '#6d3b07'], // Mocha
        [8000, '#ffde21'], // Yellow
        [92000, '#008000'], // Green
        [100000, '#008000'],
    ],
    "Chicken Lil'": [
        [0, '#305cde'], // RoyalBlue
        [5000, '#6c3baa'], // RoyalPurple
        [40000, '#ff00ff'], // Fuchisa
        [50000, '#ffde21'], // Yellow
        [75000, '#008000'], // Green
        [100000, '#008000'],
    ],
    'Big Kev': [
        [0, '#ff00ff'], // Fuchisa
        [40000, '#6c3baa'], // RoyalPurple
        [45000, '#305cde'], // RoyalBlue
        [100000, '#305cde'],
    ],
    "Lil' Crass": [
        [0, '#942222'], // RedBrown
        [30000, '#ffa500'], // Orange
        [55000, '#ffde21'], // Yellow
        [75000, '#008000'], // Green
        [94000, '#305cde'], // RoyalBlue
        [100000, '#305cde'],
    ],
    "Lil' SAS": [
        [0, '#cd1c18'], // ChiliRed
        [2000, '#ffa500'], // Orange
        [12000, '#ffde21'], // Yellow
        [22000, '#008000'], // Green
        [60000, '#305cde'], // RoyalBlue
        [80000, '#6c3baa'], // RoyalPurple
        [100000, '#6c3baa'],
    ],
    'Hot Sauce': [
        [0, '#cd1c18'], // ChiliRed
        [10000, '#c68346'], // Copper
        [15000, '#942222'], // RedBrown
        [38000, '#ffa500'], // Orange
        [62000, '#6d3b07'], // Mocha
        [85000, '#ffde21'], // Yellow
        [100000, '#ffde21'],
    ],
    "Pinch O' Salt": [
        [0, '#305cde'], // RoyalBlue
        [3000, '#6c3baa'], // RoyalPurple
        [30000, '#ff00ff'], // Fuchisa
        [39000, '#942222'], // RedBrown
        [42000, '#6d3b07'], // Mocha
        [48000, '#ffde21'], // Yellow
        [61000, '#008000'], // Green
        [92000, '#00ffff'], // Cyan
        [100000, '#00ffff'],
    ],
    "Lil' Ava": [
        [0, '#008000'], // Green
        [30000, '#6d3b07'], // Mocha
        [55000, '#942222'], // RedBrown
        [73000, '#6c3baa'], // RoyalPurple
        [100000, '#6c3baa'],
    ],
    "Butane Buddy": [
        [0, '#cd1c18'], // ChiliRed
        [10000, '#E4D00A'], // Citrine
        [20000, '#ccff00'], // Chartreuse
        [30000, '#00FF7F'], // SpringGreen
        [40000, '#2cff05'], // NeonGreen
        [50000, '#98fbcb'], // MintGreen
        [60000, '#00cec8'], // BlueGreen
        [70000, '#2D68C4'], // TrueBlue
        [80000, '#7f00ff'], // Violet
        [90000, '#8a00c4'], // NeonPurple
        [100000, '#fd3db5'], // Magenta
    ],
    "Dr. Brian": [
        [0, '#90d5ff'], // LightBlue
        [100000, '#fd3db5'], // Magenta
    ],
    "Lil' Ferno": [
        [0, '#efbf04'], // Gold
        [40000, '#d20a2e'], // Cherry
        [60000, '#ed80e9'], // Orchid
        [80000, '#7f00ff'], // Violet
        [100000, '#2D68C4'], // TrueBlue
    ],
    "Flash Bomb": [
        [0, '#FBEC5D'], // Maize
        [100000, '#ff00ff'], // Fuchisa
    ],
    "Lil' Yeti": [
        [0, '#00cec8'], // BlueGreen
        [50000, '#0000CD'], // MediumBlue
        [70000, '#7f00ff'], // Violet
        [100000, '#FF1DCE'], // HotPink
    ],
    "Eye of Ball": [
        [0, '#00cec8'], // BlueGreen
        [50000, '#0000CD'], // MediumBlue
        [70000, '#7f00ff'], // Violet
        [100000, '#FF1DCE'], // HotPink
    ],
    "Hungry Eyes": [
        [0, '#c11c84'], // DarkPink
        [50000, '#efbf04'], // Gold
        [70000, '#0BDA51'], // Malachite
        [100000, '#FF1DCE'], // HotPink
    ],
    "Lil' Eco": [
        [0, '#50C878'], // Green
        [70000, '#00cec8'], // BlueGreen
        [100000, '#305cde'], // RoyalBlue
    ],
    "Glitter Bomb": [
        [0, '#d20a2e'], // Chery
        [50000, '#8B008B'], // DarkMagenta
        [100000, '#00cec8'], // BlueGreen
    ],
    "Bomb Tag": [
        [0, '#d20a2e'], // Cherry
        [50000, '#f2b949'], // Mimosa
        [60000, '#c04657'], // BrickRed
        [100000, '#50C878'], // Emerald
    ],
    "Lil' Freezy": [
        [0, '#00cec8'], // BlueGreen
        [50000, '#0000CD'], // MediumBlue
        [100000, '#FF1DCE'], // HotPink
    ],
    "Lil' Dumplin'": [
        [0, '#DE5D83'], // Blush
        [50000, '#FBEC5D'], // Maize
        [100000, '#00cec8'], // BlueGreen
    ],
    "Lil' Bloody": [
        [0, '#FF00FF'], // Magenta
        [60000, '#FBEC5D'], // Maize
        [100000, '#00FF7F'], // SpringGreen
    ],
    "Lil' Chomper": [
        [0, '#ffa500'], // Orange
        [50000, '#FBEC5D'], // Maize
        [70000, '#008000'], // Green
        [80000, '#0000CD'], // MediumBlue
        [100000, '#8a00c4'], // NeonPurple
    ],
    "Lil' Facelift": [
        [0, '#ffa500'], // Orange
        [40000, '#ff4500'], // LightRed
        [50000, '#ff13f0'], // NeonPink
        [70000, '#8a00c4'], // NeonPurple
        [80000, '#0000CD'], // MediumBlue
        [100000, '#00cec8'], // BlueGreen
    ],
    "Lil' Zen": [
        [0, '#ffa500'], // Orange
        [40000, '#ff4500'], // LightRed
        [30000, '#ff13f0'], // NeonPink
        [60000, '#8a00c4'], // NeonPurple
        [70000, '#0000CD'], // MediumBlue
        [100000, '#00cec8'], // BlueGreen
    ],
    "Whittle Guy": [
        [0, '#808080'], // Grey
        [50000, '#008000'], // Green
        [70000, '#008000'], // DarkGreen
        [100000, '#8e4585'], // Plum
    ],
    "Fluffy": [
        [0, '#efbf04'], // Gold
        [50000, '#EAA221'], // Yellow
        [70000, '#008000'], // Green
        [100000, '#00cec8'], // BlueGreen
    ],
    "Biomech": [
        [0, '#d20a2e'], // cherry
        [50000, '#ff13f0'], // NeonPink
        [80000, '#ffa500'], // Orange
        [100000, '#89f336'], // LimeGreen
    ],
    "Big Brain": [
        [0, '#ff00ff'], // Fuchisa
        [60000, '#ff13f0'], // NeonPink
        [100000, '#7f00ff'], // Violet
    ],
    "Lil' Chirp": [
        [0, '#ff5c00'], // NeonOrange
        [50000, '#ffde21'], // Yellow
        [70000, '#008000'], // Green
        [80000, '#00cec8'], // BlueGreen
        [100000, '#305cde'], // RoyalBlue
    ],
    "Lil' Goop": [
        [0, '#00ff00'], // NeonGreen
        [50000, '#00bfff'], // SkyBlue
        [100000, '#7f00ff'], // Violet
    ],
    "Lil' Tusk": [
        [0, '#305cde'], // SkyBlue
        [50000, '#c11c84'], // DarkPink
        [75000, '#ffa500'], // Orange
        [100000, '#808000'], // OliveGreen
    ],
    "Lil' Hero": [
        [0, '#d20a2e'], // cherry
        [20000, '#ffa500'], // Orange
        [30000, '#ffde21'], // Yellow
        [50000, '#008000'], // Green
        [75000, '#0000CD'], // MediumBlue
        [100000, '#FF1DCE'], // HotPink
    ],
    "Pocket Pop": [
        [0, '#0000CD'], // MediumBlue
        [40000, '#00bfff'], // SkyBlue
        [100000, '#008000'], // Green
    ],
    "Piñatita": [
        [0, '#0000CD'], // MediumBlue
        [50000, '#7f00ff'], // Violet
        [100000, '#FF1DCE'], // HotPink
    ],
    "Quick Silver": [
        [0, '#FF1DCE'], // HotPink
        [30000, '#7f00ff'], // Violet
        [60000, '#00cec8'], // BlueGreen
        [80000, '#008000'], // Green
        [100000, '#ba8e23'], // DarkYellow
    ],
    "Magmatude": [
        [0, '#ed2100'], // scarlet
        [100000, '#FFEF00'], // Canary Yellow
    ],
    "Lil' Happy": [
        [0, '#FF1DCE'], // HotPink
        [50000, '#ffde21'], // Yellow
        [75000, '#008000'], // Green
        [100000, '#0000CD'], // MediumBlue
    ],
    "Lil' Chilly": [
        // blue, green, yellow, orange, red
        [0, '#0000CD'], // MediumBlue
    ]
};