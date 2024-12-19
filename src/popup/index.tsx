import '~style.css';
import buffmarketLogo from 'data-base64:~/../assets/buffmarket.ico';
import csfloatLogo from 'data-base64:~/../assets/csfloat.png';
import csmoneyLogo from 'data-base64:~/../assets/csmoney.ico';
import lisskinsLogo from 'data-base64:~/../assets/lisskins.svg';
import skinbaronLogo from 'data-base64:~/../assets/skinbaron.svg';
import skinportLogo from 'data-base64:~/../assets/skinport.ico';
import { useEffect } from 'react';
import { SkinBidIcon, SolarDocumentTextLinear, SolarInfoSquareLinear } from '~popup/components/Icons';
import { Tabs, TabsList, TabsTrigger } from '~popup/components/Shadcn';
import { SparklesCore } from '~popup/components/Sparkles';
import { Toaster } from '~popup/components/Toaster';
import { About } from '~popup/tabs/About';
import { BuffMarketSettings } from '~popup/tabs/Buffmarket';
import { Changelogs } from '~popup/tabs/Changelog';
import { CSFloatSettings } from '~popup/tabs/Csfloat';
import { CSMoneySettings } from '~popup/tabs/Csmoney';
import { LisSkinsSettings } from '~popup/tabs/Lisskins';
import { SkinbaronSettings } from '~popup/tabs/Skinbaron';
import { SkinbidSettings } from '~popup/tabs/Skinbid';
import { SkinportSettings } from '~popup/tabs/Skinport';
import { DEFAULT_SETTINGS } from '~lib/util/storage';
import Header from './layout/header';

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
							<img className="h-10 w-10 rounded-lg" src={csfloatLogo} />
						</TabsTrigger>
						<TabsTrigger value="skinport">
							<img className="h-10 w-10 rounded-lg" src={skinportLogo} />
						</TabsTrigger>
						<TabsTrigger value="skinbid">
							<SkinBidIcon height={40} width={40} />
						</TabsTrigger>
						<TabsTrigger value="csmoney">
							<img className="h-10 w-10 rounded-lg" src={csmoneyLogo} />
						</TabsTrigger>
						<TabsTrigger value="buffmarket">
							<img className="h-10 w-10 rounded-lg" src={buffmarketLogo} />
						</TabsTrigger>
						<TabsTrigger value="lisskins">
							<img className="h-10 w-10 rounded-lg" src={lisskinsLogo} />
						</TabsTrigger>
						<TabsTrigger value="skinbaron">
							<img className="h-10 w-10 rounded-lg" src={skinbaronLogo} />
						</TabsTrigger>
						<div className="flex flex-1"></div>
						<TabsTrigger value="changelog">
							<SolarDocumentTextLinear className="h-10 w-10" />
						</TabsTrigger>
						<TabsTrigger value="about">
							<SolarInfoSquareLinear className="h-10 w-10" />
						</TabsTrigger>
					</TabsList>
					<CSFloatSettings />
					<SkinportSettings />
					<SkinbidSettings />
					<CSMoneySettings />
					<BuffMarketSettings />
					<LisSkinsSettings />
					<SkinbaronSettings />
					<Changelogs />
					<About />
				</Tabs>
				<Toaster />
			</div>
		</div>
	);
}
