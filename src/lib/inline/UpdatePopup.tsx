import betterfloatLogo from 'data-base64:/assets/icon.png';
import YoupinBuyOrder from 'data-base64:/assets/screenshots/youpin-buyorder-example.png';
import { useStorage } from '@plasmohq/storage/hook';
import type { SettingsUser } from '~lib/util/storage';
import { Button } from '~popup/ui/button';

export default function UpdatePopup() {
	const [user] = useStorage<SettingsUser>('user');

	const closePopup = () => {
		document.querySelector('betterfloat-update-popup')?.remove();
	};

	return (
		<div className="dark fixed bottom-5 right-5">
			<div className="relative w-[500px]">
				<div className="absolute inset-0 h-full w-full bg-gradient-to-r from-blue-500 to-teal-500 transform scale-[0.80] bg-red-500 rounded-full blur-3xl" />
				<div className="relative shadow-xl bg-card border border-gray-800 p-4 h-full overflow-hidden rounded-2xl flex flex-col justify-end items-start">
					<Button variant="ghost" size="icon" className="bf-close-button absolute top-4 right-4 text-white" onClick={closePopup}>
						X
					</Button>

					<h1 className="flex items-center font-bold text-xl text-white mb-4 relative z-50">
						<img src={betterfloatLogo} alt="BetterFloat" className="h-8 w-8 mr-2" />
						New Pro exclusive feature!
					</h1>

					<p className="font-normal text-base text-slate-500 mb-4 relative z-50">Choosing Youpin now displays separate Bid (highest buy order) and Ask (lowest listing) prices.</p>
					<img src={YoupinBuyOrder} alt="Youpin" className="h-24 rounded-lg" />
					{user?.plan?.type === 'pro' && (
						<Button className="absolute right-8 bottom-4" onClick={() => window.open('https://betterfloat.com/pricing')}>
							Upgrade now
						</Button>
					)}
				</div>
			</div>
		</div>
	);
}
