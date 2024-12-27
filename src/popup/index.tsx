import '~style.css';
import bitskinsLogo from 'data-base64:~/../assets/bitskins.svg';
import buffmarketLogo from 'data-base64:~/../assets/buffmarket.ico';
import csfloatLogo from 'data-base64:~/../assets/csfloat.png';
import csmoneyLogo from 'data-base64:~/../assets/csmoney.ico';
import dmarketLogo from 'data-base64:~/../assets/dmarket.ico';
import lisskinsLogo from 'data-base64:~/../assets/lisskins.svg';
import skinbaronLogo from 'data-base64:~/../assets/skinbaron.svg';
import skinportLogo from 'data-base64:~/../assets/skinport.ico';
import { useStorage } from '@plasmohq/storage/hook';
import { CircleUserRound, Info } from 'lucide-react';
import { useEffect } from 'react';
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
import { UserProfile } from './tabs/user/UserProfile';
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

	const hasProPlan = user.plan.type === 'pro';

	return (
		<div className="dark flex flex-col bg-card justify-between h-[600px] w-[480px]">
			<Header />
			<div className="h-[40rem] relative w-full bg-black flex flex-col items-center justify-center overflow-hidden rounded-md">
				<div className="w-full absolute inset-0 h-screen">
					<SparklesCore id="tsparticlesfullpage" background="transparent" minSize={0.6} maxSize={1.4} particleDensity={50} className="w-full h-full" particleColor="#FFFFFF" />
				</div>
				<Tabs defaultValue="csfloat" className="flex gap-2 my-2 h-full" orientation="vertical">
					<TabsList className="w-[140px] flex justify-between bg-background/80 text-card-foreground z-50">
						<p className="text-md font-bold py-2 uppercase">Sites</p>
						<div className="grid grid-cols-2 gap-2">
							<TabsTrigger value="csfloat">
								<img className="h-9 w-9 rounded-lg" src={csfloatLogo} />
							</TabsTrigger>
							<TabsTrigger value="csmoney">
								<img className="h-9 w-9 rounded-lg" src={csmoneyLogo} />
							</TabsTrigger>
							<TabsTrigger value="skinport">
								<img className="h-9 w-9 rounded-lg" src={skinportLogo} />
							</TabsTrigger>
							<TabsTrigger value="buffmarket">
								<img className="h-9 w-9 rounded-lg" src={buffmarketLogo} />
							</TabsTrigger>
							<TabsTrigger value="skinbid">
								<SkinBidIcon height={40} width={40} />
							</TabsTrigger>
							<TabsTrigger value="dmarket">
								<img className="h-9 w-9 rounded-lg" src={dmarketLogo} />
							</TabsTrigger>
							<TabsTrigger value="bitskins">
								<img className="h-9 w-9 rounded-lg" src={bitskinsLogo} />
							</TabsTrigger>
							<TabsTrigger value="lisskins">
								<img className="h-9 w-9 rounded-lg" src={lisskinsLogo} />
							</TabsTrigger>
							<TabsTrigger value="skinbaron">
								<img className="h-9 w-9 rounded-lg" src={skinbaronLogo} />
							</TabsTrigger>
						</div>
						<div className="flex flex-1"></div>
						<div className="w-full flex flex-col items-stretch justify-center">
							<TabsTrigger value="about">
								<Info className="h-9 w-9 text-gray-400/60" />
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
					<About />
					<UserProfile user={user} setUser={setUser} />
				</Tabs>
				<Toaster />
			</div>
		</div>
	);
}
