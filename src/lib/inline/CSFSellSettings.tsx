import betterfloatLogo from 'data-base64:/assets/icon.png';
import { useStorage } from '@plasmohq/storage/hook';
import { AnimatePresence, motion } from 'framer-motion';
import { useEffect, useRef, useState } from 'react';
import type { CSFloat } from '~lib/@typings/FloatTypes';
import type { SettingsUser } from '~lib/util/storage';
import { cn } from '~lib/utils';
import { Badge } from '~popup/ui/badge';
import { Button } from '~popup/ui/button';
import { CSFCheckbox } from '~popup/ui/checkbox';
import { Separator } from '~popup/ui/separator';

function CircleHelp() {
	return (
		<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
			<circle cx="12" cy="12" r="10" />
			<path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3" />
			<path d="M12 17h.01" />
		</svg>
	);
}

const CSFSellSettings: React.FC = () => {
	const [open, setOpen] = useState(false);
	// auto-pricing
	const [isActive, setIsActive] = useState(false);

	const [displayBuff, setDisplayBuff] = useState(false);
	const [percentage, setPercentage] = useState(100);

	const [saveSuccess, setSaveSuccess] = useState(false);

	const [user] = useStorage<SettingsUser>('user');

	const ref = useRef(null);

	const toggleOpen = () => {
		setOpen(!open);
	};

	const handleSave = () => {
		const sellSettings: CSFloat.SellSettings = { displayBuff, percentage, active: isActive };
		localStorage.setItem('betterfloat-sell-settings', JSON.stringify(sellSettings));
		setSaveSuccess(true);
		setTimeout(() => setSaveSuccess(false), 1000);
	};

	const onClickOutside = () => {
		setOpen(false);
	};

	useEffect(() => {
		const handleClickOutside = (event: MouseEvent) => {
			if ((event?.target as HTMLElement)?.tagName !== 'BETTERFLOAT-SELL-SETTINGS') {
				onClickOutside();
			}
		};
		document.addEventListener('click', handleClickOutside, true);
		return () => {
			document.removeEventListener('click', handleClickOutside, true);
		};
	});

	useEffect(() => {
		const sellSettings = localStorage.getItem('betterfloat-sell-settings');
		if (sellSettings) {
			const { displayBuff: savedDisplayBuff, percentage: savedPercentage, active: savedActive } = JSON.parse(sellSettings) as CSFloat.SellSettings;
			setDisplayBuff(savedDisplayBuff || false);
			setPercentage(savedPercentage || 100);
			setIsActive(savedActive || false);
		}
	}, []);

	return (
		<div className="bg-transparent" style={{ fontFamily: 'Roboto, "Helvetica Neue", sans-serif' }}>
			<Button variant="light" className="h-9 px-6 flex items-center gap-2 bg-[--highlight-background-minimal] hover:bg-[--highlight-background] text-[--subtext-color]" onClick={toggleOpen}>
				<img src={betterfloatLogo} alt="BetterFloat" className="h-6 w-6" />
				Sell Settings
			</Button>
			<AnimatePresence>
				{open && (
					<div ref={ref}>
						<motion.div
							className="fixed z-[99] bg-[--module-background-color] border-2 border-[--highlight-background] flex flex-col items-center gap-2 p-6 text-center"
							style={{ translate: '-40px 10px', borderRadius: '12px', backdropFilter: 'blur(16px)', WebkitBackdropFilter: 'blur(16px)' }}
							initial={{ opacity: 0 }}
							animate={{ opacity: 1 }}
							exit={{ opacity: 0 }}
							transition={{ duration: 0.3, ease: 'easeOut' }}
						>
							<div className="flex items-center gap-2">
								<span className="text-[--primary-text-color] font-semibold">Auto Sell Pricing</span>
								<Badge variant="purple" className="text-white font-medium">
									Pro
								</Badge>
							</div>
							<div className="flex items-center gap-2 mt-2">
								<CSFCheckbox
									id="setting-show-buff"
									checked={displayBuff}
									onCheckedChange={(state) => setDisplayBuff(state === 'indeterminate' ? false : state)}
									disabled={user?.plan.type !== 'pro'}
								/>
								<label className="text-[--subtext-color] text-sm" htmlFor="setting-show-buff">
									Show Reference Price
								</label>
							</div>
							<Separator className="my-4 bg-[#c1ceff0a]" />
							<div className="flex items-center gap-2">
								<CSFCheckbox
									id="setting-active"
									checked={isActive}
									onCheckedChange={(state) => setIsActive(state === 'indeterminate' ? false : state)}
									disabled={user?.plan.type !== 'pro'}
								/>
								<label className="text-[--subtext-color] text-sm" htmlFor="setting-active">
									Enable
								</label>
								<Button variant="invisible" size="icon" className="h-8 w-8 text-[--subtext-color]" asChild>
									<a href="https://docs.betterfloat.com/tutorials/csfloat-sell-pricing" target="_blank" rel="noreferrer">
										<CircleHelp />
									</a>
								</Button>
							</div>
							<div className="flex flex-col items-start">
								<label className="text-[--subtext-color] text-sm" htmlFor="setting-percentage">
									Target Market %
								</label>
								<input
									type="number"
									id="setting-percentage"
									value={percentage}
									onChange={(e) => setPercentage(parseInt(e.target.value))}
									className="bg-transparent border border-[--highlight-background] rounded-lg py-1 px-2 text-[--subtext-color]"
								/>
							</div>
							<Button
								variant="default"
								className={cn(
									'w-full mt-2 transition-colors duration-200 text-[--primary-text-color]',
									saveSuccess ? 'bg-green-600 hover:bg-green-700' : 'bg-blue-600 hover:bg-blue-700'
								)}
								onClick={handleSave}
								disabled={user?.plan.type !== 'pro'}
							>
								{saveSuccess ? 'Saved!' : 'Save'}
							</Button>
							{user?.plan.type !== 'pro' && (
								<p className="text-[--subtext-color] text-sm text-center">
									Upgrade to BetterFloat Pro
									<br />
									to activate Notifications
									<br />& use 20s intervals!
								</p>
							)}
						</motion.div>
					</div>
				)}
			</AnimatePresence>
		</div>
	);
};

export default CSFSellSettings;
