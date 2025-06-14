import '~style.css';
import { useStorage } from '@plasmohq/storage/hook';
import { CircleUserRound, Info } from 'lucide-react';
import { useEffect } from 'react';
import {
	ICON_BITSKINS,
	ICON_BUFFMARKET,
	ICON_CSFLOAT,
	ICON_CSMONEY,
	ICON_DMARKET,
	ICON_LISSKINS,
	ICON_MARKETCSGO,
	ICON_SHADOWPAY,
	ICON_SKINBARON,
	ICON_SKINPORT,
	ICON_SWAPGG,
	ICON_WAXPEER,
	ICON_WHITEMARKET,
} from '~lib/util/globals';
import { DEFAULT_SETTINGS, type IStorage } from '~lib/util/storage';
import { SkinBidIcon } from '~popup/components/Icons';
import { SparklesCore } from '~popup/components/Sparkles';
import { Toaster } from '~popup/components/Toaster';
import { About } from '~popup/tabs/About';
import { BuffMarketSettings } from '~popup/tabs/Buffmarket';
import { CSFloatSettings } from '~popup/tabs/Csfloat';
import { CSMoneySettings } from '~popup/tabs/Csmoney';
import { LisSkinsSettings } from '~popup/tabs/Lisskins';
import { SkinbaronSettings } from '~popup/tabs/Skinbaron';
import { SkinbidSettings } from '~popup/tabs/Skinbid';
import { SkinportSettings } from '~popup/tabs/Skinport';
import { Avatar, AvatarFallback, AvatarImage } from '~popup/ui/avatar';
import Header from './layout/header';
import { BitskinsSettings } from './tabs/Bitskins';
import { DmarketSettings } from './tabs/Dmarket';
import { MarketCSGOSettings } from './tabs/Marketcsgo';
import { ShadowpaySettings } from './tabs/Shadowpay';
import { SwapggSettings } from './tabs/Swapgg';
import { WaxpeerSettings } from './tabs/Waxpeer';
import { WhiteMarketSettings } from './tabs/Whitemarket';
import { UserProfile } from './tabs/user/UserProfile';
import { Badge } from './ui/badge';
import { ScrollArea } from './ui/scroll-area';
import { Tabs, TabsList, TabsTrigger } from './ui/tabs';

export default function IndexPopup() {
	const [user, setUser] = useStorage<IStorage['user']>('user', DEFAULT_SETTINGS.user);

	useEffect(() => {
		chrome.storage.sync.get((data) => {
			if (!data) {
				console.log('[BetterFloat] No settings found, setting default settings.');
				chrome.storage.sync.set(DEFAULT_SETTINGS);
				return;
			}
		});
	});

	const hasProPlan = user?.plan?.type === 'pro';

	return (
		<div className="dark flex flex-col bg-card justify-between h-[600px] w-[480px]">
			<Header />
			<div className="h-[40rem] relative w-full bg-black flex flex-col items-center justify-center overflow-hidden rounded-md">
				<div className="w-full absolute inset-0 h-screen">
					<SparklesCore id="tsparticlesfullpage" background="transparent" minSize={0.6} maxSize={1.4} particleDensity={50} className="w-full h-full" particleColor="#FFFFFF" />
				</div>
				<Tabs defaultValue="csfloat" className="flex gap-2 my-2 h-full" orientation="vertical">
					<TabsList className="w-[130px] flex justify-between bg-background/80 text-card-foreground z-50">
						<p className="text-sm font-bold py-2 uppercase">Sites</p>
						<ScrollArea className="h-96" hideScrollbar fadeOut>
							<div className="flex justify-center">
								<Badge variant="secondary" className="mb-4">
									Free
								</Badge>
							</div>
							<div className="grid grid-cols-2 gap-2">
								<TabsTrigger value="csfloat">
									<img className="h-10 w-10 rounded-lg object-contain" src={ICON_CSFLOAT} />
								</TabsTrigger>
								<TabsTrigger value="skinport">
									<img className="h-10 w-10 rounded-lg object-contain" src={ICON_SKINPORT} />
								</TabsTrigger>
								<TabsTrigger value="skinbid">
									<SkinBidIcon height={40} width={40} />
								</TabsTrigger>
								<TabsTrigger value="csmoney">
									<img className="h-10 w-10 rounded-lg object-contain" src={ICON_CSMONEY} />
								</TabsTrigger>
							</div>
							<div className="flex justify-center">
								<Badge variant="purple" className="my-4">
									<a href="https://betterfloat.com/pricing" target="_blank" rel="noreferrer">
										Pro
									</a>
								</Badge>
							</div>
							<div className="grid grid-cols-2 gap-2">
								<TabsTrigger value="buffmarket">
									<img className="h-10 w-10 rounded-lg object-contain" src={ICON_BUFFMARKET} />
								</TabsTrigger>
								<TabsTrigger value="dmarket">
									<img className="h-10 w-10 rounded-lg" src={ICON_DMARKET} />
								</TabsTrigger>
								<TabsTrigger value="bitskins">
									<img className="h-10 w-10 rounded-lg object-contain" src={ICON_BITSKINS} />
								</TabsTrigger>
								<TabsTrigger value="lisskins">
									<img className="h-10 w-10 rounded-lg object-contain" src={ICON_LISSKINS} />
								</TabsTrigger>
								<TabsTrigger value="skinbaron">
									<img className="h-10 w-10 rounded-lg object-contain" src={ICON_SKINBARON} />
								</TabsTrigger>
								<TabsTrigger value="waxpeer">
									<img className="h-10 w-10 rounded-lg object-contain" src={ICON_WAXPEER} />
								</TabsTrigger>
								<TabsTrigger value="whitemarket">
									<img className="h-10 w-10 rounded-lg object-contain" src={ICON_WHITEMARKET} />
								</TabsTrigger>
								<TabsTrigger value="shadowpay">
									<img className="h-10 w-10 rounded-lg object-contain" src={ICON_SHADOWPAY} />
								</TabsTrigger>
								<TabsTrigger value="marketcsgo">
									<img className="h-10 w-10 rounded-lg object-contain" src={ICON_MARKETCSGO} />
								</TabsTrigger>
								<TabsTrigger value="swapgg">
									<img className="h-10 w-10 rounded-lg object-contain" src={ICON_SWAPGG} />
								</TabsTrigger>
							</div>
						</ScrollArea>
						<div className="flex flex-1"></div>
						<div className="w-full flex flex-col items-stretch justify-center">
							<TabsTrigger value="about">
								<Info className="h-10 w-10 text-gray-400/60" />
							</TabsTrigger>
							<TabsTrigger value="user">
								{user.steam.logged_in && user.steam.avatar_url ? (
									<Avatar className="size-10">
										<AvatarImage src={user.steam.avatar_url} />
										<AvatarFallback>{user.steam.display_name?.slice(0, 2)}</AvatarFallback>
									</Avatar>
								) : (
									<CircleUserRound className="h-10 w-10 text-gray-400/60" />
								)}
							</TabsTrigger>
						</div>
					</TabsList>
					<CSFloatSettings />
					<SkinportSettings />
					<SkinbidSettings />
					<CSMoneySettings />
					<BuffMarketSettings hasProPlan={hasProPlan} />
					<DmarketSettings hasProPlan={hasProPlan} />
					<BitskinsSettings hasProPlan={hasProPlan} />
					<LisSkinsSettings hasProPlan={hasProPlan} />
					<SkinbaronSettings hasProPlan={hasProPlan} />
					<WaxpeerSettings hasProPlan={hasProPlan} />
					<WhiteMarketSettings hasProPlan={hasProPlan} />
					<ShadowpaySettings hasProPlan={hasProPlan} />
					<MarketCSGOSettings hasProPlan={hasProPlan} />
					<SwapggSettings hasProPlan={hasProPlan} />
					<About />
					<UserProfile user={user} setUser={setUser} />
				</Tabs>
				<Toaster />
			</div>
		</div>
	);
}
