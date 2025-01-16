import BetterfloatLogo from 'data-base64:~/../assets/icon.png';
import DataImage from 'data-base64:~/../assets/illustrations/data-extraction-amico.svg';
import NotificationExample from 'data-base64:~/../assets/screenshots/notification-example.png';
import { motion } from 'framer-motion';
import { Highlight } from '~popup/components/Highlight';
import { Vortex } from '~popup/components/Vortex';
import '~style.css';
import IconX from 'react:/assets/icons/x.svg';
import { ArrowRight } from 'lucide-react';
import { useEffect, useState } from 'react';
import {
	DISCORD_URL,
	GITHUB_URL,
	ICON_BITSKINS_FULL,
	ICON_BUFFMARKET_FULL,
	ICON_CSFLOAT,
	ICON_CSMONEY_FULL,
	ICON_DMARKET_FULL,
	ICON_LISSKINS_FULL,
	ICON_SKINBARON_FULL,
	ICON_SKINPORT,
	TWITTER_URL,
	WEBSITE_URL,
} from '~lib/util/globals';
import { MaterialSymbolsUpdate, MdiGithub, SkillIconsDiscord } from '~popup/components/Icons';
import { AnimatedCircularProgressBar } from '~popup/components/ProgressCircle';
import { Button } from '~popup/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '~popup/ui/card';

export default function OnboardingPage() {
	const [priceProValue, setPriceProValue] = useState(0);

	useEffect(() => {
		setTimeout(() => setPriceProValue(100), 1200);
	}, []);

	return (
		<div className="size-full bg-neutral-950 justify-between overflow-hidden mx-auto h-screen">
			<div className="absolute top-5 right-5 z-20 flex items-center gap-8 px-4 py-2">
				<a href={DISCORD_URL} target="_blank" rel="noreferrer" className="z-20">
					<img src="https://i.postimg.cc/Fzj7T05w/discord.png" alt="Discord" className="h-16" />
				</a>
				<a href={WEBSITE_URL} target="_blank" rel="noreferrer" className="z-20">
					<img className="h-20 rounded-full shadow-2xl" src={BetterfloatLogo} alt="BetterFloat Logo" />
				</a>
			</div>
			<Vortex backgroundColor="black" rangeY={800} particleCount={250} rangeSpeed={0.5} baseHue={200} className="flex items-center flex-col justify-between px-2 py-8 w-full h-full">
				<motion.h1
					initial={{
						opacity: 0,
						y: 20,
					}}
					animate={{
						opacity: 1,
						y: [20, -5, 0],
					}}
					transition={{
						duration: 0.5,
						ease: [0.4, 0.0, 0.2, 1],
					}}
					className="text-2xl px-4 md:text-5xl font-bold text-neutral-100 max-w-4xl leading-relaxed lg:leading-snug text-center mx-auto "
				>
					Welcome to <Highlight className="text-neutral-100">BetterFloat</Highlight>!
				</motion.h1>
				<div className="container grid grid-cols-3 justify-items-center gap-4 mt-6">
					<div className="col-span-2">
						<Card className="shadow-md border-muted mx-1">
							<CardContent className="h-full grid grid-cols-3 gap-4">
								<p className="text-neutral-100 text-2xl font-semibold text-center col-span-3 mt-2">
									Unlock even more features with <span className="text-purple-500"> Pro</span>.
								</p>
								<div className="col-span-1">
									<Card className="shadow-md border-muted p-4">
										<CardHeader className="text-center">
											<CardTitle>5+ Exclusive Markets</CardTitle>
											<CardDescription>More opportunities to find great deals.</CardDescription>
										</CardHeader>
										<CardContent className="h-full flex flex-col justify-center gap-4">
											{[ICON_CSMONEY_FULL, ICON_BUFFMARKET_FULL, ICON_DMARKET_FULL, ICON_BITSKINS_FULL, ICON_LISSKINS_FULL, ICON_SKINBARON_FULL].map((icon, index) => (
												<img key={index} src={icon} className="h-10" />
											))}
											<p className="flex gap-1 items-center justify-center text-sm text-muted-foreground">
												with
												<MaterialSymbolsUpdate className="h-6 w-6" />
												auto refresh
											</p>
											<p className="text-sm text-muted-foreground text-center">+ more markets soon!</p>
										</CardContent>
									</Card>
								</div>

								<div className="col-span-2 flex flex-col justify-between">
									<Card className="shadow-md border-muted mx-1 p-4">
										<CardHeader className="text-center">
											<CardTitle>Price Refresh Rate</CardTitle>
											<CardDescription>Maximize profits with the most accurate prices.</CardDescription>
										</CardHeader>
										<CardContent className="flex justify-center items-center gap-8 mx-4">
											<AnimatedCircularProgressBar max={100} min={0} value={50} text="2h" gaugePrimaryColor="gray" gaugeSecondaryColor="rgba(0, 0, 0, 0.4)" disabled />
											<div className="flex flex-col items-center justify-center">
												<span className="text-muted-foreground text-xl font-semibold">2x</span>
												<ArrowRight className="h-10 fill-white stroke-[4]" />
											</div>
											<AnimatedCircularProgressBar max={100} min={0} value={priceProValue} text="1h" gaugePrimaryColor="purple" gaugeSecondaryColor="rgba(0, 0, 0, 0.1)" />
										</CardContent>
									</Card>

									<Card className="shadow-md border-muted mx-1 p-4">
										<CardHeader className="text-center">
											<CardTitle>New Listing Notifications</CardTitle>
											<CardDescription>React as fast as the Terms of Service allow.</CardDescription>
										</CardHeader>
										<CardContent className="flex justify-between gap-4 mx-4">
											<motion.img
												initial={{
													opacity: 0,
													y: 20,
												}}
												animate={{
													opacity: 1,
													y: [20, -5, 0],
												}}
												transition={{
													duration: 0.5,
													ease: [0.4, 0.0, 0.2, 1],
												}}
												className="object-contain rounded-lg"
												src={NotificationExample}
												alt="notification example"
											/>
											<div className="flex flex-col items-center justify-center gap-2">
												<p className="text-muted-foreground text-sm font-semibold">Supports</p>
												<img src={ICON_SKINPORT} className="h-10 object-contain" />
												<img src={ICON_CSFLOAT} className="h-10 object-contain" />
											</div>
										</CardContent>
									</Card>
								</div>
								<div className="col-span-3 w-full flex justify-center gap-8 my-6">
									<motion.p
										initial={{ y: -50, opacity: 0 }}
										animate={{ y: 0, opacity: 1 }}
										transition={{
											type: 'spring',
											stiffness: 100,
										}}
										className="my-0 text-3xl font-semibold text-gray-100"
									>
										<span className="text-base font-medium mr-4">Unlock all features for</span>
										<span>$10</span>
										<span className="text-sm font-medium">/month</span>
									</motion.p>
									<a className="p-[3px] relative" href={`${WEBSITE_URL}pricing`} target="_blank" rel="noreferrer">
										<div className="absolute inset-0 bg-gradient-to-r from-indigo-500 to-purple-500 rounded-lg" />
										<div className="px-8 py-2 text-sm font-medium bg-black rounded-[6px] relative group transition duration-200 text-white hover:bg-transparent">
											Subscribe to Pro
										</div>
									</a>
								</div>
							</CardContent>
						</Card>
					</div>
					<div className="space-y-8">
						<Card className="shadow-md border-muted mx-1">
							<CardContent className="h-full space-y-3 flex flex-col items-center justify-center">
								<p className="text-neutral-100 text-2xl font-semibold text-center">
									{/* Check out our <span className="text-purple-500">onboarding guide</span> to get started with BetterFloat. */}
									New here? Check out our <span className="text-purple-500">onboarding guide</span>.
								</p>
								<div className="flex flex-col sm:flex-row items-center gap-4 mt-6">
									<Button variant="outline" asChild>
										<a href={`${WEBSITE_URL}onboarding`} target="_blank" rel="noreferrer">
											Get started
										</a>
									</Button>
								</div>
							</CardContent>
						</Card>
						<Card className="shadow-md border-muted mx-1">
							<CardContent className="h-full space-y-3 flex flex-col items-center justify-center">
								<p className="text-neutral-100 text-2xl font-semibold text-center">
									{/* Check out our <span className="text-purple-500">onboarding guide</span> to get started with BetterFloat. */}
									Stay updated:
								</p>
								<div className="flex flex-col sm:flex-row items-center gap-4 mt-6">
									<Button variant="ghost" size="largeIcon" title={DISCORD_URL}>
										<a href={GITHUB_URL} target="_blank" rel="noreferrer">
											<SkillIconsDiscord height={38} width={38} />
										</a>
									</Button>
									<Button variant="ghost" size="largeIcon" asChild>
										<a href={GITHUB_URL} target="_blank" rel="noreferrer">
											<MdiGithub height={38} width={38} color="white" />
										</a>
									</Button>
									<Button variant="ghost" size="largeIcon" asChild>
										<a href={TWITTER_URL} target="_blank" rel="noreferrer">
											<IconX className="h-8 fill-white" />
										</a>
									</Button>
								</div>
							</CardContent>
						</Card>
					</div>
				</div>
			</Vortex>
		</div>
	);
}
