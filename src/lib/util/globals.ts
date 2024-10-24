import iconBuff from 'data-base64:/assets/buff_favicon.png';
import iconCsfloat from 'data-base64:/assets/csfloat.png';
import iconArrowdown from 'data-base64:/assets/icons/arrow-down.svg';
import iconArrowup from 'data-base64:/assets/icons/arrow-up-right-from-square-solid.svg';
import iconArrowup2 from 'data-base64:/assets/icons/arrow-up.svg';
import iconBan from 'data-base64:/assets/icons/ban-solid.svg';
import iconCameraFlipped from 'data-base64:/assets/icons/camera-flipped.svg';
import iconCamera from 'data-base64:/assets/icons/camera-solid.svg';
import iconClock from 'data-base64:/assets/icons/clock-solid.svg';
import iconC5Game from 'data-base64:/assets/icons/icon-c5game.png';
import iconCsgostash from 'data-base64:/assets/icons/icon-csgostash.png';
import iconPricempire from 'data-base64:/assets/icons/icon-pricempire.png';
import iconSteam from 'data-base64:/assets/icons/icon-steam.svg';
import iconSteamAnalyst from 'data-base64:/assets/icons/icon-steamanalyst.png';
import iconYouPin from 'data-base64:/assets/icons/icon-youpin.png';
import iconExclamation from 'data-base64:/assets/icons/triangle-exclamation-solid.svg';
import iconCrimson from 'data-base64:/assets/patterns/crimson-pattern.svg';
import iconDiamondGem1 from 'data-base64:/assets/patterns/diamond-gem-1.png';
import iconDiamondGem2 from 'data-base64:/assets/patterns/diamond-gem-2.png';
import iconDiamondGem3 from 'data-base64:/assets/patterns/diamond-gem-3.png';
import iconOverprintArrow from 'data-base64:/assets/patterns/overprint-arrow.svg';
import iconOverprintFlower from 'data-base64:/assets/patterns/overprint-flower.svg';
import iconOverprintMixed from 'data-base64:/assets/patterns/overprint-mixed.svg';
import iconOverprintPolygon from 'data-base64:/assets/patterns/overprint-polygon.svg';
import iconPhoenix from 'data-base64:/assets/patterns/phoenix-icon.svg';
import iconPinkGalaxy1 from 'data-base64:/assets/patterns/pink-galaxy-1.png';
import iconPinkGalaxy2 from 'data-base64:/assets/patterns/pink-galaxy-2.png';
import iconPinkGalaxy3 from 'data-base64:/assets/patterns/pink-galaxy-3.png';
import iconSpiderWeb from 'data-base64:/assets/patterns/spider-web.svg';
import iconArrowupSmall from 'data-text:/assets/icons/arrow-up-right-from-square-solid-small.svg';

export const DISCORD_URL = 'https://discord.gg/VQWXp33nSW';
export const GITHUB_URL = 'https://github.com/GODrums/BetterFloat';
export const WEBSITE_URL = 'https://betterfloat.com/';

export const ICON_BUFF = iconBuff;
export const ICON_STEAM = iconSteam;
export const ICON_YOUPIN = iconYouPin;
export const ICON_C5GAME = iconC5Game;
export const ICON_CSFLOAT = iconCsfloat;
export const ICON_EXCLAMATION = iconExclamation;
export const ICON_CAMERA = iconCamera;
export const ICON_CAMERA_FLIPPED = iconCameraFlipped;
export const ICON_BAN = iconBan;
export const ICON_CLOCK = iconClock;
export const ICON_ARROWUP = iconArrowup;
export const ICON_ARROWUP2 = iconArrowup2;
export const ICON_ARROWUP_SMALL = iconArrowupSmall;
export const ICON_ARROWDOWN = iconArrowdown;
export const ICON_CRIMSON = iconCrimson;
export const ICON_OVERPRINT_ARROW = iconOverprintArrow;
export const ICON_OVERPRINT_FLOWER = iconOverprintFlower;
export const ICON_OVERPRINT_MIXED = iconOverprintMixed;
export const ICON_OVERPRINT_POLYGON = iconOverprintPolygon;
export const ICON_PHOENIX = iconPhoenix;
export const ICON_SPIDER_WEB = iconSpiderWeb;
export const ICON_CSGOSTASH = iconCsgostash;
export const ICON_PRICEMPIRE = iconPricempire;
export const ICON_STEAMANALYST = iconSteamAnalyst;
export const ICON_PINK_GALAXY_1 = iconPinkGalaxy1;
export const ICON_PINK_GALAXY_2 = iconPinkGalaxy2;
export const ICON_PINK_GALAXY_3 = iconPinkGalaxy3;
export const ICON_DIAMOND_GEM_1 = iconDiamondGem1;
export const ICON_DIAMOND_GEM_2 = iconDiamondGem2;
export const ICON_DIAMOND_GEM_3 = iconDiamondGem3;

export const EVENT_URL_CHANGED = 'BetterFloat_URL_CHANGED';

export const ocoKeyRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/;

export enum MarketSource {
	None = 'none',
	Buff = 'buff',
	Steam = 'steam',
	YouPin = 'youpin',
	C5Game = 'c5game',
	CSFloat = 'csfloat',
}

export const AvailableMarketSources = [
	{ text: 'Buff163', logo: ICON_BUFF, source: MarketSource.Buff },
	{ text: 'Steam', logo: ICON_STEAM, source: MarketSource.Steam },
	{ text: 'YouPin / UU', logo: ICON_YOUPIN, source: MarketSource.YouPin },
	{ text: 'C5Game', logo: ICON_C5GAME, source: MarketSource.C5Game },
	{ text: 'CSFloat', logo: ICON_CSFLOAT, source: MarketSource.CSFloat },
];
