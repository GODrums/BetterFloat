import '~style.css';
import buffmarketLogo from 'data-base64:~/../assets/buffmarket.ico';
import csfloatLogo from 'data-base64:~/../assets/csfloat.png';
import betterfloatLogo from 'data-base64:~/../assets/icon.png';
import lisskinsLogo from 'data-base64:~/../assets/lisskins.svg';
import skinportLogo from 'data-base64:~/../assets/skinport.ico';
import csmoneyLogo from 'data-base64:~/../assets/csmoney.ico';
import { useEffect } from 'react';
import { IcRoundWarning, MdiGithub, SkillIconsDiscord, SkinBidIcon, SolarDocumentTextLinear, SolarInfoSquareLinear } from '~lib/components/Icons';
import { Badge, Button, Tabs, TabsList, TabsTrigger } from '~lib/components/Shadcn';
import { SparklesCore } from '~lib/components/Sparkles';
import { Toaster } from '~lib/components/Toaster';
import { About } from '~lib/pages/About';
import { BuffMarketSettings } from '~lib/pages/Buffmarket';
import { Changelogs } from '~lib/pages/Changelog';
import { CSFloatSettings } from '~lib/pages/Csfloat';
import { LisSkinsSettings } from '~lib/pages/Lisskins';
import { SkinbidSettings } from '~lib/pages/Skinbid';
import { SkinportSettings } from '~lib/pages/Skinport';
import { DISCORD_URL, GITHUB_URL, WEBSITE_URL } from '~lib/util/globals';
import { DEFAULT_SETTINGS } from '~lib/util/storage';
import { CSMoneySettings } from '~lib/pages/Csmoney';

export default function IndexPopup() {
	const hostpermissions = chrome.runtime.getManifest().host_permissions as string[];

	const requestPermissions = () => {
		chrome.permissions
			.request({
				origins: hostpermissions,
			})
			.then((granted) => {
				if (!granted) {
					console.log('Permission denied');
				} else {
					document.getElementById('permissions-warning')!.classList.add('hidden');
				}
			});
	};

	useEffect(() => {
		document.getElementById('version')!.textContent = `v. ${chrome.runtime.getManifest().version}`;

		chrome.permissions
			.contains({
				origins: hostpermissions,
			})
			.then((result) => {
				const warning = document.getElementById('permissions-warning')!;
				if (result) {
					warning.classList.add('hidden');
				} else {
					warning.classList.remove('hidden');
				}
			});

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
			<header className="w-full flex align-middle justify-between px-4 py-1.5 bg-card text-card-foreground border-b border-muted shadow-sm">
				<div className="flex gap-2 align-middle items-center">
					<img className="h-[38px] cursor-pointer" src={betterfloatLogo} onClick={() => window.open(WEBSITE_URL)} />
					<Badge id="version" variant="outline" className="border-muted text-muted-foreground">
						v. 2.0.0
					</Badge>
				</div>
				<div className="flex gap-1">
					<Button variant="ghost" size="icon" className="" id="permissions-warning" onClick={requestPermissions}>
						<IcRoundWarning height={30} width={30} filter="invert(19%) sepia(98%) saturate(7473%) hue-rotate(359deg) brightness(103%) contrast(109%)" />
					</Button>

					<Button variant="ghost" size="icon" onClick={() => window.open(DISCORD_URL)} title={DISCORD_URL}>
						<SkillIconsDiscord height={30} width={30} />
					</Button>

					<Button variant="ghost" size="icon" onClick={() => window.open(GITHUB_URL)} title={GITHUB_URL}>
						<MdiGithub height={30} width={30} color="white" />
					</Button>
				</div>
			</header>
			<div className="h-[40rem] relative w-full bg-black flex flex-col items-center justify-center overflow-hidden rounded-md">
				<div className="w-full absolute inset-0 h-screen">
					<SparklesCore id="tsparticlesfullpage" background="transparent" minSize={0.6} maxSize={1.4} particleDensity={50} className="w-full h-full" particleColor="#FFFFFF" />
				</div>
				<Tabs defaultValue="csfloat" className="flex gap-2 my-2 h-full" orientation="vertical">
					<TabsList className="flex justify-between bg-background/80 text-card-foreground z-50">
						<div className="flex flex-col items-center">
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
							<TabsTrigger value="buffmarket">
								<img className="h-10 w-10 rounded-lg" src={buffmarketLogo} />
							</TabsTrigger>
							<TabsTrigger value="lisskins">
								<img className="h-10 w-10 rounded-lg" src={lisskinsLogo} />
							</TabsTrigger>
							<TabsTrigger value="csmoney">
								<img className="h-10 w-10 rounded-lg" src={csmoneyLogo} />
							</TabsTrigger>
						</div>
						<div className="flex flex-col items-center">
							<TabsTrigger value="changelog">
								<SolarDocumentTextLinear className="h-10 w-10" />
							</TabsTrigger>
							<TabsTrigger value="about">
								<SolarInfoSquareLinear className="h-10 w-10" />
							</TabsTrigger>
						</div>
					</TabsList>
					<CSFloatSettings />
					<SkinportSettings />
					<SkinbidSettings />
					<CSMoneySettings />
					<BuffMarketSettings />
					<LisSkinsSettings />
					<Changelogs />
					<About />
				</Tabs>
				<Toaster />
			</div>
		</div>
	);
}
