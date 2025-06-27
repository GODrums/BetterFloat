import { sendToBackgroundViaRelay } from '@plasmohq/messaging';
import { useStorage } from '@plasmohq/storage/hook';
import { AnimatePresence, motion } from 'framer-motion';
import { type SVGProps, useEffect, useRef, useState } from 'react';
import type { CreateNotificationBody, CreateNotificationResponse } from '~background/messages/createNotification';
import type { CSFloat } from '~lib/@typings/FloatTypes';
import type { SettingsUser } from '~lib/util/storage';
import { cn } from '~lib/utils';
import { MaterialSymbolsAvgTimeOutlineRounded } from '~popup/components/Icons';
import { Badge } from '~popup/ui/badge';
import { Button } from '~popup/ui/button';
import { CSFCheckbox } from '~popup/ui/checkbox';
import { DualRangeSlider } from '~popup/ui/dualrangeslider';
import { Separator } from '~popup/ui/separator';
import { Switch } from '~popup/ui/switch';

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

function CircleHelp() {
	return (
		<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
			<circle cx="12" cy="12" r="10" />
			<path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3" />
			<path d="M12 17h.01" />
		</svg>
	);
}

const ActivityBadge = ({ active }: { active: boolean }) => {
	return (
		<Badge variant="default" className={cn('text-[--primary-text-color] font-normal', active ? 'bg-green-500/80 hover:bg-green-400/30' : 'bg-red-600/50 hover:bg-red-500/30')}>
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
	// [low, high]
	const [floatRanges, setFloatRanges] = useState<number[]>([0, 1]);
	const [useBrowser, setUseBrowser] = useState(false);

	const [saveSuccess, setSaveSuccess] = useState(false);

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
		const notificationSettings: CSFloat.BFNotification = { name, percentage, active: nActive, floatRanges, browser: useBrowser };
		localStorage.setItem('betterfloat-notification', JSON.stringify(notificationSettings));
		setSaveSuccess(true);
		setTimeout(() => setSaveSuccess(false), 2000);
	};

	const intervalOptions = ['20s', '30s', '60s', '2min', '5min'];

	const onClickOutside = () => {
		setOpen(false);
	};

	const requestNotificationPermission = async (): Promise<boolean> => {
		if (!('Notification' in window)) {
			console.warn('This browser does not support desktop notifications');
			return false;
		}

		if (Notification.permission === 'granted') {
			return true;
		}

		if (Notification.permission === 'denied') {
			console.warn('Notification permission has been denied');
			return false;
		}

		const permission = await Notification.requestPermission();
		return permission === 'granted';
	};

	const testNotification = async () => {
		if (useBrowser) {
			const hasPermission = await requestNotificationPermission();
			if (!hasPermission) {
				alert('Notification permission is required to use browser notifications. Please enable notifications in your browser settings.');
				return;
			}

			const notification = new Notification('BetterFloat Notification', {
				body: 'This is a test notification',
				tag: 'betterfloat-notification-test',
				icon: 'https://csfloat.com/assets/n-mini-logo.png',
				silent: false,
			});
			notification.onclick = () => {
				window.open(location.href, '_blank');
			};
		} else {
			await sendToBackgroundViaRelay<CreateNotificationBody, CreateNotificationResponse>({
				name: 'createNotification',
				body: {
					id: Math.random().toString(36).substring(2, 9), // generate a random id
					message: 'This is a test notification',
					title: 'BetterFloat Notification',
					site: 'csfloat',
				},
			});
		}
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
			const { name: savedName, percentage: savedPercentage, active: savedActive, floatRanges: savedFloat } = JSON.parse(notificationSettings) as CSFloat.BFNotification;
			setName(savedName || '');
			setPercentage(savedPercentage || 100);
			setNActive(savedActive || false);
			setFloatRanges(savedFloat || [0, 1]);
		}
	}, []);

	return (
		<div className="bg-transparent" style={{ fontFamily: 'Roboto, "Helvetica Neue", sans-serif' }}>
			<Button variant="light" className="h-9 flex items-center gap-2 bg-[--highlight-background-minimal] hover:bg-[--highlight-background]" onClick={toggleOpen}>
				<MaterialSymbolsUpdate className="h-6 w-6 text-[--primary-text-color]" />
				<ActivityBadge active={isActive} />
			</Button>
			<AnimatePresence>
				{open && (
					<div ref={ref}>
						<motion.div
							className="fixed z-[99] bg-[--module-background-color] border-2 border-[--highlight-background] flex flex-col items-center gap-2 p-6 text-center"
							style={{ translate: '-75px 10px', borderRadius: '12px', backdropFilter: 'blur(16px)', WebkitBackdropFilter: 'blur(16px)' }}
							initial={{ opacity: 0 }}
							animate={{ opacity: 1 }}
							exit={{ opacity: 0 }}
							transition={{ duration: 0.3, ease: 'easeOut' }}
						>
							<div className="flex items-center gap-2">
								<span className="text-[--primary-text-color] font-semibold">Auto-Refresh</span>
								<ActivityBadge active={isActive} />
							</div>
							<div className="flex items-center gap-2 mt-2">
								<Switch checked={isActive} onCheckedChange={setActive} />
								<MaterialSymbolsAvgTimeOutlineRounded className="h-6 w-6 text-[--primary-text-color]" />
								<select
									className="appearance-none bg-transparent text-[--primary-text-color] border border-[--highlight-background] rounded-lg py-1 px-2 cursor-pointer"
									value={rInterval}
									onChange={(e) => setRInterval(e.target.value)}
								>
									{intervalOptions
										.filter((_, index) => index !== 0 || user?.plan.type === 'pro')
										.map((option, index) => (
											<option key={index} value={index.toString()} className="bg-[--module-background-color]">
												{option}
											</option>
										))}
								</select>
							</div>
							<Separator className="my-4 bg-[#c1ceff0a]" />
							<div className="flex items-center gap-2">
								<span className="text-[--primary-text-color] font-semibold">Notifications</span>
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
									<label className="text-[--subtext-color] text-sm" htmlFor="notification-enable">
										Enable
									</label>

									<Button variant="invisible" size="icon" className="h-8 w-8 text-[--subtext-color]" asChild>
										<a href="https://docs.betterfloat.com/tutorials/activate-notifications" target="_blank" rel="noreferrer">
											<CircleHelp />
										</a>
									</Button>
								</div>
								<div className="flex items-center gap-2">
									<CSFCheckbox
										id="notification-use-browser"
										checked={useBrowser}
										onCheckedChange={async (state) => {
											const newState = state === 'indeterminate' ? false : state;
											if (newState) {
												const hasPermission = await requestNotificationPermission();
												if (!hasPermission) {
													alert('Notification permission is required to use browser notifications. Please enable notifications in your browser settings.');
													return;
												}
											}
											setUseBrowser(newState);
										}}
										disabled={user?.plan.type !== 'pro'}
									/>
									<label className="text-[--subtext-color] text-sm" htmlFor="notification-use-browser">
										Use Site Notifications
									</label>
								</div>
								<div className="flex flex-col items-start">
									<label className="text-[--subtext-color] text-sm" htmlFor="notification-name">
										Item Name
									</label>
									<input
										type="text"
										id="notification-name"
										value={name}
										onChange={(e) => setName(e.target.value)}
										className="bg-transparent border border-[--highlight-background] rounded-lg py-1 px-2 text-[--subtext-color]"
									/>
								</div>
								<div className="dark flex flex-col items-start gap-6">
									<label className="text-[--subtext-color] text-sm" htmlFor="notification-float">
										Float
									</label>
									<DualRangeSlider
										id="notification-float"
										label={(value) => value}
										value={floatRanges}
										onValueChange={(value) => setFloatRanges(value)}
										min={0}
										max={1}
										step={0.01}
										className="text-[--subtext-color]"
										style={{ '--primary': '0 0% 80%' } as React.CSSProperties}
									/>
								</div>
								<div className="flex flex-col items-start">
									<label className="text-[--subtext-color] text-sm" htmlFor="notification-percentage">
										Maximum Market %
									</label>
									<input
										type="number"
										id="notification-percentage"
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
								{user?.plan.type === 'pro' ? (
									<Button
										variant="default"
										className="w-full bg-[--highlight-background-minimal] hover:bg-[--highlight-background] text-[--primary-text-color]"
										onClick={testNotification}
									>
										Send Test Notification
									</Button>
								) : (
									<p className="text-[--subtext-color] text-sm text-center">
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
