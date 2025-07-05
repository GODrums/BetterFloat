import { useStorage } from '@plasmohq/storage/hook';
import { AnimatePresence, motion } from 'framer-motion';
import type React from 'react';
import { type SVGProps, useEffect, useRef, useState } from 'react';
import type { SettingsUser } from '~lib/util/storage';
import { cn } from '~lib/utils';
import { MaterialSymbolsAvgTimeOutlineRounded } from '~popup/components/Icons';
import { Button } from '~popup/ui/button';

function MaterialSymbolsUpdate(props: SVGProps<SVGSVGElement>) {
	return (
		<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" {...props}>
			<path
				fill="currentColor"
				d="M12 21q-1.875 0-3.512-.712t-2.85-1.925q-1.213-1.213-1.925-2.85T3 12q0-1.875.713-3.512t1.924-2.85q1.213-1.213 2.85-1.925T12 3q2.05 0 3.888.875T19 6.35V4h2v6h-6V8h2.75q-1.025-1.4-2.525-2.2T12 5Q9.075 5 7.038 7.038T5 12q0 2.925 2.038 4.963T12 19q2.625 0 4.588-1.7T18.9 13h2.05q-.375 3.425-2.937 5.713T12 21m2.8-4.8L11 12.4V7h2v4.6l3.2 3.2z"
			></path>
		</svg>
	);
}

const ActivityBadge = ({ active }: { active: boolean }) => {
	return <div className={cn('px-2 py-1 rounded text-lg font-medium', active ? 'bg-green-600 text-white' : 'bg-gray-600 text-gray-200')}>{active ? 'ON' : 'OFF'}</div>;
};

const GpAutorefresh: React.FC = () => {
	const [open, setOpen] = useState(false);
	// auto-refresh
	const [isActive, setIsActive] = useState(false);
	const [isIncreasing, setIsIncreasing] = useState(true);
	const [rInterval, setRInterval] = useStorage('gp-refreshinterval');
	const [interval, setIntervalValue] = useState<NodeJS.Timeout | null>(null);

	const [user] = useStorage<SettingsUser>('user');

	const priceInput = document.querySelector<HTMLInputElement>('input[class*="FiltersAside_numericFilters__"]');
	const applyButton = document.querySelector<HTMLButtonElement>('button[class*="FiltersAside_filterButton__"]');

	const ref = useRef(null);

	const toggleOpen = () => {
		setOpen(!open);
	};

	const getInterval = () => {
		switch (rInterval) {
			case '0':
				return 30000;
			case '1':
				return 60000;
			case '2':
				return 120000;
			case '3':
				return 300000;
			default:
				return 30000;
		}
	};

	const setActive = (value: boolean) => {
		if (user?.plan.type !== 'pro') return;
		setIsActive(value);
		if (value) {
			const newInterval = setInterval(() => {
				if (!priceInput && interval) {
					clearInterval(interval);
					setIntervalValue(null);
					return;
				}

				if (priceInput && applyButton) {
					const currentValue = Number(priceInput.value || 0);
					const newValue = isIncreasing ? currentValue + 0.01 : currentValue - 0.01;
					priceInput.value = newValue.toFixed(2);

					priceInput.dispatchEvent(new Event('input', { bubbles: true }));

					setIsIncreasing(!isIncreasing);
					setTimeout(() => {
						applyButton.click();
					}, 100);
				}
			}, getInterval());
			setIntervalValue(newInterval);
		} else if (interval) {
			clearInterval(interval);
		}
	};

	const intervalOptions = ['30s', '60s', '2min', '5min'];

	const onClickOutside = () => {
		setOpen(false);
	};

	useEffect(() => {
		const handleClickOutside = (event: MouseEvent) => {
			if ((event?.target as HTMLElement)?.tagName !== 'BETTERFLOAT-GP-AUTOREFRESH') {
				onClickOutside();
			}
		};

		document.addEventListener('click', handleClickOutside, true);

		return () => {
			document.removeEventListener('click', handleClickOutside, true);
		};
	}, [open]);

	return (
		<div className="bg-transparent ml-6" style={{ fontFamily: 'Inter, system-ui, -apple, BlinkMacSystemFont, sans-serif' }}>
			<Button
				className="h-16 px-8 flex items-center gap-2 bg-transparent border border-[#1d2530] hover:border-[#8293ac] rounded-lg text-white text-lg font-medium transition-colors duration-200"
				onClick={toggleOpen}
			>
				<MaterialSymbolsUpdate className="h-8 w-8 text-white" />
				<ActivityBadge active={isActive} />
			</Button>
			<AnimatePresence>
				{open && (
					<div ref={ref}>
						<motion.div
							className="absolute z-[9999] w-[200px] bg-[#1a1d21] border border-[#374151] flex flex-col gap-4 p-4 shadow-2xl rounded-lg"
							style={{ translate: '-50px 10px', borderRadius: '12px' }}
							initial={{ opacity: 0, scale: 0.95, y: -10 }}
							animate={{ opacity: 1, scale: 1, y: 0 }}
							exit={{ opacity: 0, scale: 0.95, y: -10 }}
							transition={{ duration: 0.2, ease: 'easeOut' }}
						>
							<div className="flex items-center justify-center">
								<span className="text-white font-medium">Auto-Refresh</span>
							</div>

							<div className="flex items-center justify-between">
								<span className="text-gray-300 text-lg">Enable</span>
								<div className="relative">
									<input type="checkbox" checked={isActive} onChange={(e) => setActive(e.target.checked)} className="sr-only" />
									<div
										className={cn('w-10 h-6 bg-gray-600 rounded-full p-1 cursor-pointer transition-colors duration-200', isActive ? 'bg-blue-600' : 'bg-gray-600')}
										onClick={() => setActive(!isActive)}
									>
										<div className={cn('w-4 h-4 bg-white rounded-full shadow-md transform transition-transform duration-200', isActive ? 'translate-x-4' : 'translate-x-0')} />
									</div>
								</div>
							</div>

							<div className="flex items-center justify-between">
								<div className="flex items-center gap-2">
									<MaterialSymbolsAvgTimeOutlineRounded className="h-8 w-8 text-gray-400" />
									<span className="text-gray-300 text-lg">Interval</span>
								</div>
								<select
									className="bg-[#2a2f36] border border-[#374151] rounded-md px-2 py-1 text-white text-lg min-w-[60px] cursor-pointer focus:outline-none focus:border-blue-500"
									value={rInterval}
									onChange={(e) => setRInterval(e.target.value)}
								>
									{intervalOptions.map((option, index) => (
										<option key={index} value={index.toString()} className="bg-[#2a2f36] text-white" disabled={index === 0 && user?.plan.type !== 'pro'}>
											{option}
										</option>
									))}
								</select>
							</div>
						</motion.div>
					</div>
				)}
			</AnimatePresence>
		</div>
	);
};

export default GpAutorefresh;
