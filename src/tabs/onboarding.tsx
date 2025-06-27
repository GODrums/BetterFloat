import BetterfloatLogo from 'data-base64:~/../assets/icon.png';
import NotificationExample from 'data-base64:~/../assets/screenshots/notification-example.png';
import { motion } from 'framer-motion';
import { Highlight } from '~popup/components/Highlight';
import { Vortex } from '~popup/components/Vortex';
import '~style.css';
import { ArrowRight } from 'lucide-react';
import { useEffect, useState } from 'react';
import {
	DISCORD_URL,
	ICON_BITSKINS_FULL,
	ICON_BUFFMARKET_FULL,
	ICON_CSFLOAT,
	ICON_CSFLOAT_FULL,
	ICON_CSMONEY,
	ICON_DMARKET,
	ICON_DMARKET_FULL,
	ICON_GAMERPAY_FULL,
	ICON_LISSKINS,
	ICON_LISSKINS_FULL,
	ICON_SKINBARON_FULL,
	ICON_SKINPORT,
	ICON_SKINPORT_FULL,
	ICON_YOUPIN,
	WEBSITE_URL,
} from '~lib/util/globals';
import { MaterialSymbolsFilterAlt, MaterialSymbolsUpdate } from '~popup/components/Icons';
import { AnimatedCircularProgressBar } from '~popup/components/ProgressCircle';
import { Badge } from '~popup/ui/badge';
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
			<div className="absolute top-5 left-5 z-20 flex items-center gap-8 px-4 py-2">
				<div className="mt-2 p-3 bg-teal-500/10 border border-teal-500/20 rounded-lg">
					<p className="text-teal-300 text-sm text-center">
						🎉 New here? Check out our
						<a href="https://betterfloat.com/onboarding" target="_blank" className="z-20 ml-1 text-blue-500" rel="noreferrer">
							Onboarding Guide
						</a>
						.
					</p>
				</div>
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
				<div className="container grid grid-cols-3 justify-items-center gap-4">
					<div className="col-span-3">
						<Card className="shadow-md border-muted mx-1">
							<CardContent className="h-full grid grid-cols-4 gap-4">
								<p className="text-neutral-100 text-2xl font-semibold text-center col-span-4 mt-2">
									Unlock even more features with <span className="text-purple-500"> Pro</span>.
								</p>
								<div className="col-span-1">
									<Card className="h-full shadow-md border-muted p-4">
										<CardHeader className="text-center">
											<CardTitle>15+ Exclusive Markets</CardTitle>
											<CardDescription>More opportunities to find great deals.</CardDescription>
										</CardHeader>
										<CardContent className="flex flex-col justify-center gap-4">
											{[ICON_BUFFMARKET_FULL, ICON_DMARKET_FULL, ICON_BITSKINS_FULL, ICON_LISSKINS_FULL, ICON_GAMERPAY_FULL, ICON_SKINBARON_FULL].map((icon, index) => (
												<img key={index} src={icon} className="h-10 object-contain" />
											))}
											<p className="text-sm text-muted-foreground text-center">+ 9 other markets!</p>
										</CardContent>
									</Card>
								</div>

								<div className="col-span-2 flex flex-col justify-between">
									<Card className="shadow-md border-muted mx-1 p-4 py-2">
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

											<div className="flex flex-col items-center justify-center gap-2">
												<Badge variant="secondary"> NEW </Badge>
												<img src={ICON_YOUPIN} className="size-10 rounded-lg border border-gray-300/30" alt="Youpin" />
												<span className="text-muted-foreground text-xs font-semibold">Buy order prices</span>
											</div>
										</CardContent>
									</Card>

									<Card className="shadow-md border-muted mx-1 p-4 py-2">
										<CardHeader className="text-center">
											<CardTitle>New Listing Notifications</CardTitle>
											<CardDescription>React as fast as the Terms of Service allow.</CardDescription>
										</CardHeader>
										<CardContent className="flex justify-center gap-8 mx-4">
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
												<img src={ICON_CSFLOAT} className="h-10 object-contain" />
												<img src={ICON_SKINPORT} className="h-10 object-contain" />
											</div>
										</CardContent>
									</Card>
								</div>
								<div className="col-span-1 flex flex-col justify-between">
									<Card className="shadow-md border-muted p-4 py-2">
										<CardHeader className="text-center">
											<CardTitle>Critial Sniping Features</CardTitle>
											<CardDescription>Don't let others steal your deals.</CardDescription>
										</CardHeader>
										<CardContent className="flex flex-col justify-center gap-1">
											<p className="flex gap-1 items-center justify-center text-sm text-muted-foreground">
												Exclusive
												<MaterialSymbolsUpdate className="h-6 w-6" />
												auto refresh for
											</p>
											<div className="flex items-center justify-center gap-4">
												{[ICON_DMARKET, ICON_LISSKINS, ICON_CSMONEY].map((icon, index) => (
													<img key={index + 10} src={icon} className="h-10" />
												))}
											</div>
											<p className="flex gap-1 items-center justify-center text-sm text-muted-foreground mt-2">
												<MaterialSymbolsUpdate className="h-6 w-6" />
												20s refreshes for
											</p>
											<img key={15} src={ICON_CSFLOAT_FULL} className="h-10 object-contain" />
											<p className="flex gap-1 items-center justify-center text-sm text-muted-foreground mt-2">
												<MaterialSymbolsFilterAlt className="h-6 w-6" />
												Filter items by Buff %
											</p>
											<img key={16} src={ICON_SKINPORT_FULL} className="h-10 object-contain" />
										</CardContent>
									</Card>
									<Card className="shadow-md border-muted">
										<CardHeader className="text-center">
											<CardTitle>Early Access Features</CardTitle>
											<CardDescription>Keep the edge over your competition.</CardDescription>
										</CardHeader>
										<CardContent>
											<p className="text-sm text-muted-foreground text-center">Be the first to try out new features</p>
											<p className="text-sm text-muted-foreground text-center">before they are officially released.</p>
										</CardContent>
									</Card>
								</div>

								<div className="col-span-4 w-full flex justify-center gap-8 my-6">
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
									<Button variant="ghost" onClick={() => window.close()}>
										Continue for Free
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
