import { AnimatePresence, motion } from 'framer-motion';
import type React from 'react';
import { useState } from 'react';
import type { Skinport } from '~lib/@typings/SkinportTypes';
import { cn } from '~lib/utils';
import { MaterialSymbolsCloseSmallOutlineRounded } from '~popup/components/Icons';
import { Badge } from '~popup/ui/badge';
import { Button } from '~popup/ui/button';

const BellRing = (props: React.SVGProps<SVGSVGElement>) => (
	<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
		<path d="M10.268 21a2 2 0 0 0 3.464 0" />
		<path d="M22 8c0-2.3-.8-4.3-2-6" />
		<path d="M3.262 15.326A1 1 0 0 0 4 17h16a1 1 0 0 0 .74-1.673C19.41 13.956 18 12.499 18 8A6 6 0 0 0 6 8c0 4.499-1.411 5.956-2.738 7.326" />
		<path d="M4 2C2.8 3.7 2 5.7 2 8" />
	</svg>
);

const SpNotifications: React.FC = () => {
	const [open, setOpen] = useState(false);
	const spNotification = JSON.parse(localStorage.getItem('spNotification') ?? '{}') as Skinport.BFNotification;
	const [name, setName] = useState<string>(spNotification.name);
	const [priceBelow, setPriceBelow] = useState<number>(spNotification.priceBelow ?? 100);
	const [isActive, setIsActive] = useState(spNotification.isActive);

	const toggleOpen = () => {
		setOpen(!open);
	};

	const handleSave = () => {
		spNotification.name = name;
		spNotification.priceBelow = priceBelow;
		spNotification.isActive = isActive;
		localStorage.setItem('spNotification', JSON.stringify(spNotification));
		setOpen(false);
	};

	return (
		<div className="mr-4 bg-transparent" style={{ fontFamily: 'Montserrat,sans-serif' }}>
			<Button variant="invisible" size="icon" className="hover:bg-neutral-700 relative" onClick={toggleOpen}>
				{isActive && (
					<span className="absolute -top-1 -right-1 flex size-2">
						<span className="absolute inline-flex size-full animate-ping rounded-full bg-[#ff5722] opacity-75 duration-1000" />
						<span className="relative inline-flex size-2 rounded-full bg-[#ff5722]" />
					</span>
				)}
				<BellRing className="h-6 w-6 text-purple-600" />
			</Button>
			<AnimatePresence>
				{open && (
					<motion.div
						className="fixed w-[350px] h-[320px] z-[9999] bg-[#232728] border border-black flex flex-col items-center gap-4 px-3 py-4 text-center text-white"
						style={{ translate: '-210px 10px', borderRadius: '20px' }}
						initial={{ opacity: 0 }}
						animate={{ opacity: 1 }}
						exit={{ opacity: 0 }}
						transition={{ duration: 0.3, ease: 'easeOut' }}
					>
						<h3 className="pt-2 pb-0 mb-0 font-bold uppercase text-white" style={{ lineHeight: 0.5, fontSize: '18px' }}>
							Notifications
						</h3>
						<h4 className="pt-0 mt-0 font-bold text-[#828282]" style={{ lineHeight: 0.7, fontSize: '16px' }}>
							by BetterFloat
						</h4>
						<Badge variant="purple" className="text-white text-sm">
							Pro
						</Badge>
						<Button variant="invisible" size="icon" className="absolute top-4 right-7" onClick={() => setOpen(false)}>
							<MaterialSymbolsCloseSmallOutlineRounded className="h-8 w-8" />
						</Button>
						<div className="flex flex-col items-start w-4/5 mx-5">
							<label className="font-semibold my-1 mx-0" htmlFor="notifications-name">
								NAME
							</label>
							<input
								type="text"
								id="notifications-name"
								className="w-full h-9 pb-1 pl-3.5 text-white bg-[#2a2d2f] rounded-[20px] text-base"
								value={name}
								onChange={(e) => setName(e.target.value)}
							/>
						</div>
						<div className="flex justify-center w-4/5">
							<div className="flex items-center pb-1 pl-1.5 gap-0.5">
								<label className="mr-1.5 text-sm" htmlFor="notifications-buff-below">
									Price below (Buff %):
								</label>
								<input
									type="number"
									id="notifications-buff-below"
									min="0"
									max="200"
									className="w-[100px] h-9 pl-3.5 text-white bg-[#2a2d2f] rounded-[20px] text-base [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
									value={priceBelow}
									onChange={(e) => {
										setPriceBelow(parseFloat(e.target.value));
									}}
								/>
							</div>
						</div>
						<div className="absolute bottom-5 right-7 flex gap-4">
							<Button variant="ghost" className="gap-2 font-semibold" onClick={() => setIsActive(!isActive)}>
								active
								<Badge className={cn('text-white font-normal', isActive ? 'bg-green-500/80 hover:bg-green-400/30' : 'bg-red-600/50 hover:bg-red-500/30')}>
									{isActive ? 'ON' : 'OFF'}
								</Badge>
							</Button>
							<Button className="font-semibold bg-[#4db5da]" onClick={handleSave}>
								Save
							</Button>
						</div>
					</motion.div>
				)}
			</AnimatePresence>
		</div>
	);
};

export default SpNotifications;
