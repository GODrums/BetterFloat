import { useStorage } from '@plasmohq/storage/hook';
import { AnimatePresence, motion } from 'motion/react';
import type React from 'react';
import type { SVGProps } from 'react';
import { DMARKET_SELECTORS } from '~lib/handlers/selectors/dmarket_selectors';
import type { SettingsUser } from '~lib/util/storage';
import { cn } from '~lib/utils';
import { MaterialSymbolsAvgTimeOutlineRounded } from '~popup/components/Icons';
import { Badge } from '~popup/ui/badge';
import { Button } from '~popup/ui/button';
import { Switch } from '~popup/ui/switch';

const REFRESH_SELECTOR = `${DMARKET_SELECTORS.market.refreshButton}, ${DMARKET_SELECTORS.modern.market.refreshButton}`;

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

const DmAutorefresh: React.FC<{ modern?: boolean }> = ({ modern = false }) => {
	const [open, setOpen] = useState(false);
	// auto-refresh
	const [isActive, setIsActive] = useState(false);
	const [rInterval, setRInterval] = useStorage('dm-refreshinterval');
	const [interval, setIntervalValue] = useState<NodeJS.Timeout | null>(null);

	const [user] = useStorage<SettingsUser>('user');

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
				const refreshButton = document.querySelector<HTMLButtonElement>(REFRESH_SELECTOR);
				refreshButton?.click();
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

	const themeStyle = {
		fontFamily: 'Montserrat, Arial, sans-serif',
		'--dm-autorefresh-button': modern ? '#2a2a2a' : '#2a2c2e',
		'--dm-autorefresh-button-hover': modern ? '#353535' : '#222324',
		'--dm-autorefresh-surface': modern ? '#1e1e1e' : '#2a2c2e',
		'--dm-autorefresh-border': modern ? '#343434' : '#c1ceff12',
		'--dm-autorefresh-primary': modern ? '#e5e5e5' : '#ffffff',
		'--dm-autorefresh-subtext': modern ? '#848484' : '#9ea7b1',
		'--dm-autorefresh-option': modern ? '#2a2a2a' : '#272829',
	} as React.CSSProperties;

	useEffect(() => {
		const handleClickOutside = (event: MouseEvent) => {
			if ((event?.target as HTMLElement)?.tagName !== 'BETTERFLOAT-DM-AUTOREFRESH') {
				onClickOutside();
			}
		};
		document.addEventListener('click', handleClickOutside, true);
		return () => {
			document.removeEventListener('click', handleClickOutside, true);
		};
	});

	return (
		<div className="bg-transparent" style={themeStyle}>
			<Button
				variant="light"
				className={cn(
					'h-12 flex items-center gap-2 bg-(--dm-autorefresh-button) hover:bg-(--dm-autorefresh-button-hover) text-(--dm-autorefresh-primary)',
					modern ? 'rounded-md border border-(--dm-autorefresh-border)' : 'rounded-[2px]'
				)}
				onClick={toggleOpen}
			>
				<MaterialSymbolsUpdate className="h-6 w-6 text-(--dm-autorefresh-primary)" />
				<ActivityBadge active={isActive} />
			</Button>
			<AnimatePresence>
				{open && (
					<div ref={ref}>
						<motion.div
							className={cn('fixed z-99 bg-(--dm-autorefresh-surface) flex flex-col items-center gap-2 p-6 shadow-2xl', modern && 'border border-(--dm-autorefresh-border)')}
							style={{ translate: '-55px 10px', borderRadius: '12px' }}
							initial={{ opacity: 0 }}
							animate={{ opacity: 1 }}
							exit={{ opacity: 0 }}
							transition={{ duration: 0.3, ease: 'easeOut' }}
						>
							<div className="flex items-center gap-2">
								<span className="text-(--dm-autorefresh-primary) font-semibold">Auto-Refresh</span>
								<ActivityBadge active={isActive} />
							</div>
							<div className="flex items-center gap-2 mt-2">
								<Switch checked={isActive} onCheckedChange={setActive} />
								<MaterialSymbolsAvgTimeOutlineRounded className="ml-2 h-6 w-6 text-(--dm-autorefresh-primary)" />
								<select
									className="appearance-none bg-(--dm-autorefresh-button) text-(--dm-autorefresh-subtext) border border-(--dm-autorefresh-border) rounded-lg py-1 px-2 cursor-pointer"
									value={rInterval}
									onChange={(e) => setRInterval(e.target.value)}
								>
									{intervalOptions.map((option, index) => (
										<option
											key={index}
											value={index.toString()}
											className="bg-(--dm-autorefresh-option) text-(--dm-autorefresh-primary)"
											disabled={index === 0 && user?.plan.type !== 'pro'}
										>
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

export default DmAutorefresh;
