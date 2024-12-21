import '~style.css';
import buffmarketLogo from 'data-base64:~/../assets/buffmarket.ico';
import csfloatLogo from 'data-base64:~/../assets/csfloat.png';
import csmoneyLogo from 'data-base64:~/../assets/csmoney.ico';
import lisskinsLogo from 'data-base64:~/../assets/lisskins.svg';
import skinbaronLogo from 'data-base64:~/../assets/skinbaron.svg';
import skinportLogo from 'data-base64:~/../assets/skinport.ico';
import { CircleUserRound, Info } from 'lucide-react';
import { useEffect } from 'react';
import { DEFAULT_SETTINGS } from '~lib/util/storage';
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
import Header from './layout/header';
import { UserProfile } from './tabs/user/UserProfile';
import { Tabs, TabsList, TabsTrigger } from './ui/tabs';

export default function IndexPopup() {
	useEffect(() => {
		chrome.storage.sync.get((data) => {
			if (!data) {
				console.log('[BetterFloat] No settings found, setting default settings.');
				chrome.storage.sync.set(DEFAULT_SETTINGS);
				return;
			}
		});
	});

	return (
		<div className="dark flex flex-col bg-card justify-between h-[600px] w-[430px]">
			<Header />
			<div className="h-[40rem] relative w-full bg-black flex flex-col items-center justify-center overflow-hidden rounded-md">
				<div className="w-full absolute inset-0 h-screen">
					<SparklesCore id="tsparticlesfullpage" background="transparent" minSize={0.6} maxSize={1.4} particleDensity={50} className="w-full h-full" particleColor="#FFFFFF" />
				</div>
				<Tabs defaultValue="csfloat" className="flex gap-2 my-2 h-full" orientation="vertical">
					<TabsList className="flex justify-between bg-background/80 text-card-foreground z-50">
						<p className="text-md font-bold py-2 uppercase">Sites</p>
						<TabsTrigger value="csfloat">
							<img className="h-9 w-9 rounded-lg" src={csfloatLogo} />
						</TabsTrigger>
						<TabsTrigger value="skinport">
							<img className="h-9 w-9 rounded-lg" src={skinportLogo} />
						</TabsTrigger>
						<TabsTrigger value="skinbid">
							<SkinBidIcon height={40} width={40} />
						</TabsTrigger>
						<TabsTrigger value="csmoney">
							<img className="h-9 w-9 rounded-lg" src={csmoneyLogo} />
						</TabsTrigger>
						<TabsTrigger value="buffmarket">
							<img className="h-9 w-9 rounded-lg" src={buffmarketLogo} />
						</TabsTrigger>
						<TabsTrigger value="lisskins">
							<img className="h-9 w-9 rounded-lg" src={lisskinsLogo} />
						</TabsTrigger>
						<TabsTrigger value="skinbaron">
							<img className="h-9 w-9 rounded-lg" src={skinbaronLogo} />
						</TabsTrigger>
						<div className="flex flex-1"></div>
						<TabsTrigger value="about">
							<Info className="h-9 w-9 text-gray-400/60" />
						</TabsTrigger>
						<TabsTrigger value="user">
							<CircleUserRound className="h-10 w-10 text-gray-400/60" />
						</TabsTrigger>
					</TabsList>
					<CSFloatSettings />
					<SkinportSettings />
					<SkinbidSettings />
					<CSMoneySettings />
					<BuffMarketSettings />
					<LisSkinsSettings />
					<SkinbaronSettings />
					<About />
					<UserProfile />
				</Tabs>
				<Toaster />
			</div>
		</div>
	);
}
