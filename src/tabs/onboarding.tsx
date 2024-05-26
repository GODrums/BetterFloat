import BetterfloatLogo from 'data-base64:~/../assets/icon.png';
import DataImage from 'data-base64:~/../assets/illustrations/data-extraction-amico.svg';
import { motion } from 'framer-motion';
import { Highlight } from '~lib/components/Highlight';
import { Vortex } from '~lib/components/Vortex';
import '~style.css';
import { Button } from '~lib/components/Shadcn';
import { WEBSITE_URL } from '~lib/util/globals';

export default function OnboardingPage() {
	return (
		<div className="size-full bg-neutral-950 justify-between overflow-hidden mx-auto h-screen">
			<img className="absolute top-5 right-5 h-20 z-10 rounded-full shadow-2xl" src={BetterfloatLogo} alt="BetterFloat Logo" />
			<Vortex backgroundColor="black" rangeY={800} particleCount={250} rangeSpeed={0.5} baseHue={200} className="flex items-center flex-col justify-between px-2 py-48 w-full h-full">
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
				<div className="flex flex-col items-center justify-center">
					<div className="grid grid-cols-2 justify-items-center gap-4 mt-6 max-w-4xl">
						<img className="h-64" src={DataImage} alt="Data" />
						<div className="flex flex-col items-center justify-center">
							<p className="text-neutral-100 text-2xl font-semibold text-center">
								Check out our <span className="text-purple-500">onboarding guide</span> to get started with BetterFloat.
							</p>
							<div className="flex flex-col sm:flex-row items-center gap-4 mt-6">
								<Button variant="light" className="px-4 py-2 transition duration-200 rounded-lg text-white shadow-[0px_2px_0px_0px_#FFFFFF40_inset]" asChild>
									<a href={`${WEBSITE_URL}onboarding`} target="_blank" rel="noreferrer">
										Get started
									</a>
								</Button>
							</div>
						</div>
					</div>
					<div className="flex items-center mt-6"></div>
				</div>
			</Vortex>
		</div>
	);
}
