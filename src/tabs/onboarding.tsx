import BetterfloatLogo from 'data-base64:~/../assets/icon.png';
import DataImage from 'data-base64:~/../assets/illustrations/data-extraction-amico.svg';
import { motion } from 'framer-motion';
import { Highlight } from '~popup/components/Highlight';
import { Vortex } from '~popup/components/Vortex';
import '~style.css';
import IconX from 'react:/assets/icons/x.svg';
import { useEffect, useState } from 'react';
import {
	DISCORD_URL,
	GITHUB_URL,
	ICON_BITSKINS,
	ICON_BUFFMARKET,
	ICON_CSFLOAT,
	ICON_CSMONEY,
	ICON_DMARKET,
	ICON_LISSKINS,
	ICON_SKINBARON,
	ICON_SKINPORT,
	TWITTER_URL,
	WEBSITE_URL,
} from '~lib/util/globals';
import { MdiGithub, SkillIconsDiscord } from '~popup/components/Icons';
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
			<div className="absolute top-5 right-5 z-10 flex items-center gap-8 px-4 py-2">
				<a href={DISCORD_URL} target="_blank" rel="noreferrer">
					<img src="https://i.postimg.cc/Fzj7T05w/discord.png" alt="Discord" className="h-16" />
				</a>
				<img className="h-20 rounded-full shadow-2xl" src={BetterfloatLogo} alt="BetterFloat Logo" />
			</div>
			<Vortex backgroundColor="black" rangeY={800} particleCount={250} rangeSpeed={0.5} baseHue={200} className="flex items-center flex-col justify-between px-2 py-36 w-full h-full">
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
				<div className="grid grid-cols-3 justify-items-center gap-4 mt-6 max-w-4xl">
					{/* <motion.img
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
						className="h-64"
						src={DataImage}
						alt="Data"
					/> */}
					<div className="col-span-2">
						<Card className="shadow-md border-muted mx-1">
							<CardContent className="h-full space-y-3 flex flex-col items-center justify-center">
								<p className="text-neutral-100 text-2xl font-semibold text-center">
									Unlock even more features with <span className="text-purple-500"> Pro</span>.
								</p>

								<Card className="shadow-md border-muted mx-1 p-4">
									<CardHeader className="text-center">
										<CardTitle>5 Exclusive Markets</CardTitle>
										<CardDescription>More opportunities to find great deals.</CardDescription>
									</CardHeader>
									<CardContent className="h-full flex justify-center gap-4">
										{[ICON_BITSKINS, ICON_CSMONEY, ICON_BUFFMARKET, ICON_DMARKET, ICON_LISSKINS, ICON_SKINBARON].map((icon, index) => (
											<img key={index} src={icon} className="h-10 w-10" />
										))}
									</CardContent>
								</Card>

								<Card className="shadow-md border-muted mx-1 p-4">
									<CardHeader className="text-center">
										<CardTitle>Price Refresh Rate</CardTitle>
										<CardDescription>Maximize profits with the most accurate prices.</CardDescription>
									</CardHeader>
									<CardContent className="h-full flex justify-center gap-8 mx-4">
										<AnimatedCircularProgressBar max={100} min={0} value={priceProValue} text="1h" gaugePrimaryColor="purple" gaugeSecondaryColor="rgba(0, 0, 0, 0.1)" />
									</CardContent>
								</Card>

								<Card className="shadow-md border-muted mx-1 p-4">
									<CardHeader className="text-center">
										<CardTitle>New Listing Notifications</CardTitle>
										<CardDescription>React as fast as the Terms of Service allow.</CardDescription>
									</CardHeader>
									<CardContent className="h-full flex justify-center gap-8 mx-4"></CardContent>
								</Card>

								<div className="flex flex-col sm:flex-row items-center gap-4 mt-6">
									<Button variant="outline" asChild>
										<a href={`${WEBSITE_URL}pricing`} target="_blank" rel="noreferrer">
											Get Pro
										</a>
									</Button>
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
									<Button variant="outline" size="icon" title={DISCORD_URL}>
										<a href={GITHUB_URL} target="_blank" rel="noreferrer">
											<SkillIconsDiscord height={30} width={30} />
										</a>
									</Button>
									<Button variant="outline" size="icon" asChild>
										<a href={GITHUB_URL} target="_blank" rel="noreferrer">
											<MdiGithub height={30} width={30} color="white" />
										</a>
									</Button>
									<Button variant="outline" size="icon" asChild>
										<a href={TWITTER_URL} target="_blank" rel="noreferrer">
											<IconX className="h-6 fill-white" />
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
