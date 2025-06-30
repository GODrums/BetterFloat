import betterfloatLogo from 'data-base64:/assets/icon.png';
import { Badge } from '~popup/ui/badge';
import { Button } from '~popup/ui/button';

export default function UpdatePopup() {
	const closePopup = () => {
		document.querySelector('betterfloat-update-popup')?.remove();
	};

	return (
		<div className="dark fixed bottom-5 right-5 z-[9999]">
			<div className="relative w-[550px]">
				<div className="absolute inset-0 h-full w-full bg-gradient-to-r from-blue-500 to-teal-500 transform scale-[0.80] bg-red-500 rounded-full blur-3xl" />
				<div className="relative shadow-xl bg-card border border-gray-800 p-4 h-full overflow-hidden rounded-2xl flex flex-col justify-end items-start">
					<Button variant="ghost" size="icon" className="bf-close-button absolute top-4 right-4 text-white" onClick={closePopup}>
						X
					</Button>

					<h1 className="flex items-center font-bold text-xl text-white mb-4 relative z-50">
						<img src={betterfloatLogo} alt="BetterFloat" className="h-10 w-10 mr-2" />
						<span>Test our new TradeIt features!</span>
						<Badge variant="default" className="ml-2">
							Limited Time
						</Badge>
					</h1>

					<p className="font-normal text-base text-slate-500 mb-4 relative z-50">
						Our TradeIt integration is free for a limited time!
						<br />
						Try it out and join our Discord to give us feedback!
					</p>
					<div className="w-full flex items-center justify-end gap-4">
						<Button variant="purple" className="font-semibold" onClick={() => window.open('https://tradeit.gg?aff=betterfloat')}>
							Go to TradeIt
						</Button>
					</div>
				</div>
			</div>
		</div>
	);
}
