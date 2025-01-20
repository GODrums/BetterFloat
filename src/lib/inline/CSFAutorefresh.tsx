import { useStorage } from '@plasmohq/storage/hook';
import { AnimatePresence, motion } from 'framer-motion';
import type React from 'react';
import { type SVGProps, useEffect, useRef, useState } from 'react';
import type { SettingsUser } from '~lib/util/storage';
import { cn } from '~lib/utils';
import { MaterialSymbolsAvgTimeOutlineRounded } from '~popup/components/Icons';
import { Badge } from '~popup/ui/badge';
import { Button } from '~popup/ui/button';
import { CSFCheckbox } from '~popup/ui/checkbox';
import { Separator } from '~popup/ui/separator';
import { Switch } from '~popup/ui/switch';

type NotificationSettings = {
	name: string;
	percentage: number;
	active: boolean;
};

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
	return (
		<Badge variant="default" className={cn('text-white font-normal', active ? 'bg-green-500/80 hover:bg-green-400/30' : 'bg-red-600/50 hover:bg-red-500/30')}>
			{active ? 'ON' : 'OFF'}
		</Badge>
	);
};

const CSFAutorefresh: React.FC = () => {
	const [open, setOpen] = useState(false);
	// auto-refresh
	const [isActive, setIsActive] = useState(false);
	// notifications
	const [nActive, setNActive] = useState(false);
	const [rInterval, setRInterval] = useStorage('csf-refreshinterval');
	const [interval, setIntervalValue] = useState<NodeJS.Timeout | null>(null);
	const [name, setName] = useState('');
	const [percentage, setPercentage] = useState(0);

	const [user] = useStorage<SettingsUser>('user');

	const refreshButton = document.querySelector<HTMLButtonElement>('.refresh > button');

	const ref = useRef(null);

	const toggleOpen = () => {
		setOpen(!open);
	};

	const getInterval = () => {
		switch (rInterval) {
			case '0': {
				if (user?.plan.type !== 'pro') {
					setRInterval('1');
					return 30000;
				}
				return 20000;
			}
			case '1':
				return 30000;
			case '2':
				return 60000;
			case '3':
				return 120000;
			case '4':
				return 300000;
			default:
				return 30000;
		}
	};

	const setActive = (value: boolean) => {
		setIsActive(value);
		refreshButton?.setAttribute('data-betterfloat-auto-refresh', value.toString());
		if (value) {
			const newInterval = setInterval(() => {
				if (!refreshButton && interval) {
					clearInterval(interval);
					setIntervalValue(null);
					return;
				}
				refreshButton?.click();
			}, getInterval());
			setIntervalValue(newInterval);
		} else if (interval) {
			clearInterval(interval);
		}
	};

	const handleSave = () => {
		const notificationSettings: NotificationSettings = { name, percentage, active: nActive };
		localStorage.setItem('betterfloat-notification', JSON.stringify(notificationSettings));
	};

	const intervalOptions = ['20s', '30s', '60s', '2min', '5min'];

	const onClickOutside = () => {
		setOpen(false);
	};

	useEffect(() => {
		const handleClickOutside = (event: MouseEvent) => {
			if ((event?.target as HTMLElement)?.tagName !== 'BETTERFLOAT-AUTOREFRESH') {
				onClickOutside();
			}
		};
		document.addEventListener('click', handleClickOutside, true);
		return () => {
			document.removeEventListener('click', handleClickOutside, true);
		};
	});

	useEffect(() => {
		const notificationSettings = localStorage.getItem('betterfloat-notification');
		if (notificationSettings) {
			const { name: savedName, percentage: savedPercentage, active: savedActive } = JSON.parse(notificationSettings) as NotificationSettings;
			setName(savedName || '');
			setPercentage(savedPercentage || 100);
			setNActive(savedActive || false);
		}
	}, []);

	return (
		<div className="bg-transparent" style={{ fontFamily: 'Roboto, "Helvetica Neue", sans-serif' }}>
			<Button variant="light" className="h-9 flex items-center gap-2 hover:bg-neutral-500/70" onClick={toggleOpen}>
				<MaterialSymbolsUpdate className="h-6 w-6 text-white" />
				<ActivityBadge active={isActive} />
			</Button>
			<AnimatePresence>
				{open && (
					<div ref={ref}>
						<motion.div
							className="fixed z-[99] bg-[#15171ccc] border-2 border-[#c1ceff12] flex flex-col items-center gap-2 p-6 text-center"
							style={{ translate: '-75px 10px', borderRadius: '12px', backdropFilter: 'blur(16px)', WebkitBackdropFilter: 'blur(16px)' }}
							initial={{ opacity: 0 }}
							animate={{ opacity: 1 }}
							exit={{ opacity: 0 }}
							transition={{ duration: 0.3, ease: 'easeOut' }}
						>
							<div className="flex items-center gap-2">
								<span className="text-white font-semibold">Auto-Refresh</span>
								<ActivityBadge active={isActive} />
							</div>
							<div className="flex items-center gap-2 mt-2">
								<Switch checked={isActive} onCheckedChange={setActive} />
								<MaterialSymbolsAvgTimeOutlineRounded className="h-6 w-6 text-white" />
								<select
									className="appearance-none bg-transparent text-[#9EA7B1] border border-[#c1ceff12] rounded-lg py-1 px-2 cursor-pointer"
									value={rInterval}
									onChange={(e) => setRInterval(e.target.value)}
								>
									{intervalOptions.map((option, index) => (
										<option key={index} value={index.toString()} className="bg-slate-800" disabled={index === 0 && user?.plan.type !== 'pro'}>
											{option}
										</option>
									))}
								</select>
							</div>
							<Separator className="my-4 bg-[#c1ceff0a]" />
							<div className="flex items-center gap-2">
								<span className="text-white font-semibold">Notifications</span>
								<Badge variant="purple" className="text-white font-medium">
									Pro
								</Badge>
							</div>
							<div className="flex flex-col gap-4 mt-2">
								<div className="flex items-center gap-2">
									<CSFCheckbox
										id="notification-enable"
										checked={nActive}
										onCheckedChange={(state) => setNActive(state === 'indeterminate' ? false : state)}
										disabled={!isActive || user?.plan.type !== 'pro'}
									/>
									<label className="text-[#9EA7B1] text-sm" htmlFor="notification-enable">
										Enable
									</label>
								</div>
								<div className="flex flex-col items-start">
									<label className="text-[#9EA7B1] text-sm" htmlFor="notification-name">
										Name
									</label>
									<input
										type="text"
										id="notification-name"
										value={name}
										onChange={(e) => setName(e.target.value)}
										className="bg-transparent border border-[#c1ceff12] rounded-lg py-1 px-2 text-[#9EA7B1]"
									/>
								</div>
								<div className="flex flex-col items-start">
									<label className="text-[#9EA7B1] text-sm" htmlFor="notification-percentage">
										Maximum Market %
									</label>
									<input
										type="number"
										id="notification-percentage"
										value={percentage}
										onChange={(e) => setPercentage(parseInt(e.target.value))}
										className="bg-transparent border border-[#c1ceff12] rounded-lg py-1 px-2 text-[#9EA7B1]"
									/>
								</div>
								<Button variant="default" className="w-full mt-2 bg-blue-600 hover:bg-blue-700" onClick={handleSave} disabled={user?.plan.type !== 'pro'}>
									Save
								</Button>
								{user?.plan.type !== 'pro' && (
									<p className="text-[#9EA7B1] text-sm text-center">
										Upgrade to BetterFloat Pro
										<br />
										to activate Notifications
										<br />& use 20s intervals!
									</p>
								)}
							</div>
						</motion.div>
					</div>
				)}
			</AnimatePresence>
		</div>
	);
};

export default CSFAutorefresh;
