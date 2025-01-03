import { useStorage } from '@plasmohq/storage/hook';
import { AnimatePresence, motion } from 'framer-motion';
import type React from 'react';
import { useEffect, useState } from 'react';
import { DEFAULT_FILTER, type SPFilter, type SettingsUser } from '~lib/util/storage';
import { cn } from '~lib/utils';
import { CarbonFilterReset, MaterialSymbolsCloseSmallOutlineRounded, MaterialSymbolsFilterAlt } from '~popup/components/Icons';
import { Badge } from '~popup/ui/badge';
import { Button } from '~popup/ui/button';
import { Label } from '~popup/ui/label';

interface TypeCheckboxProps {
	label: string;
	types: SPFilter['types'];
	setTypes: React.Dispatch<React.SetStateAction<SPFilter['types']>>;
	className?: string;
}

const TypeCheckbox: React.FC<TypeCheckboxProps> = (props: TypeCheckboxProps) => {
	const key = props.label.toLowerCase().replace(' ', '-');
	const [checked, setChecked] = useState<boolean>(props.types[key] ?? DEFAULT_FILTER.types[key]);
	const id = `filter-type-${key}`;

	const handleChecked = (e: React.ChangeEvent<HTMLInputElement>) => {
		setChecked(e.target.checked);
		props.setTypes({ ...props.types, [key]: e.target.checked });
	};

	return (
		<div className={cn('flex items-center pb-0.5 pl-1.5 gap-0.5', props.className)}>
			<input type="checkbox" id={id} checked={checked} onChange={handleChecked} className="w-5 h-5 mr-1 text-white" style={{ clipPath: 'circle(50%)', accentColor: '#ff5722' }} />
			<label className="mr-1.5 text-sm" htmlFor={id}>
				{props.label}
			</label>
		</div>
	);
};

const SpLiveFilter: React.FC = () => {
	const [open, setOpen] = useState(false);
	const spFilter = JSON.parse(localStorage.getItem('spFilter') ?? JSON.stringify(DEFAULT_FILTER)) as SPFilter;
	const [name, setName] = useState<string>(spFilter.name);
	const [types, setTypes] = useState(spFilter.types);
	const [priceLow, setPriceLow] = useState<number>(spFilter.priceLow);
	const [priceHigh, setPriceHigh] = useState<number>(spFilter.priceHigh);
	const [percentage, setPercentage] = useState<number>(spFilter.percentage);
	const [newOnly, setNewOnly] = useState<boolean>(spFilter.new);
	const [filterCount, setFilterCount] = useState<number>(0);

	const [user] = useStorage<SettingsUser>('user');

	const toggleOpen = () => {
		setOpen(!open);
	};

	const handleSave = () => {
		spFilter.name = name;
		spFilter.priceLow = priceLow;
		spFilter.priceHigh = priceHigh;
		spFilter.types = types;
		spFilter.new = newOnly;
		if (user?.plan.type === 'pro') {
			spFilter.percentage = percentage;
		} else {
			spFilter.percentage = 0;
		}
		localStorage.setItem('spFilter', JSON.stringify(spFilter));
		setOpen(false);
	};

	const handleReset = () => {
		setName(DEFAULT_FILTER.name);
		setPriceLow(DEFAULT_FILTER.priceLow);
		setPriceHigh(DEFAULT_FILTER.priceHigh);
		setPercentage(DEFAULT_FILTER.percentage);
		setTypes(DEFAULT_FILTER.types);
		setNewOnly(DEFAULT_FILTER.new);
		localStorage.setItem('spFilter', JSON.stringify(DEFAULT_FILTER));
	};

	const filterLabels = ['Knife', 'Gloves', 'Agent', 'Weapon', 'Collectible', 'Container', 'Sticker', 'Charm', 'Equipment', 'Pass'];

	useEffect(() => {
		let count = 0;
		if (spFilter.name.length > 0) {
			count++;
		}
		if (Object.values(spFilter.types).some((value) => !value)) {
			count++;
		}
		if (spFilter.priceLow > 0) {
			count++;
		}
		if (spFilter.priceHigh < 999999) {
			count++;
		}
		if (spFilter.new) {
			count++;
		}
		if (spFilter.percentage > 0) {
			count++;
		}
		setFilterCount(count);
	}, [spFilter]);

	return (
		<div className="mr-4 bg-transparent" style={{ fontFamily: 'Montserrat,sans-serif' }}>
			<Button variant="invisible" size="icon" className="hover:bg-neutral-700" onClick={toggleOpen}>
				{filterCount > 0 && (
					<div className="absolute inline-flex items-center justify-center w-4 text-xs text-white font-semibold bg-[#fa490a] rounded-[8px] translate-x-3 -translate-y-3">{filterCount}</div>
				)}
				<MaterialSymbolsFilterAlt className={cn('h-8 w-8', filterCount > 0 ? 'text-white' : 'text-gray-600')} />
			</Button>
			<AnimatePresence>
				{open && (
					<motion.div
						className="fixed w-[450px] h-[450px] z-[9999] bg-[#232728] border border-black flex flex-col items-center gap-2 px-3 py-4 text-center text-white"
						style={{ translate: '-210px 10px', borderRadius: '20px' }}
						initial={{ opacity: 0 }}
						animate={{ opacity: 1 }}
						exit={{ opacity: 0 }}
						transition={{ duration: 0.3, ease: 'easeOut' }}
					>
						<h3 className="pt-2 pb-0 mb-0 font-bold uppercase text-white" style={{ lineHeight: 0.5, fontSize: '18px' }}>
							Item Filter
						</h3>
						<h4 className="pt-0 mt-0 font-bold text-[#828282]" style={{ lineHeight: 0.7, fontSize: '16px' }}>
							by BetterFloat
						</h4>
						<Button variant="invisible" size="icon" className="absolute top-4 right-7" onClick={() => setOpen(false)}>
							<MaterialSymbolsCloseSmallOutlineRounded className="h-8 w-8" />
						</Button>
						<div className="flex flex-col items-start w-4/5 mx-5 mt-2.5">
							<label className="font-semibold my-1 mx-0" htmlFor="filter-name">
								NAME
							</label>
							<input type="text" id="filter-name" className="w-full h-9 pl-3.5 text-white bg-[#2a2d2f] rounded-[20px] text-base" value={name} onChange={(e) => setName(e.target.value)} />
						</div>
						<div className="flex justify-between w-4/5 mt-1.5">
							<div className="flex flex-col gap-0.5 items-start">
								<Label className="font-semibold my-1.5">TYPE</Label>
								{filterLabels.map((type, index) => {
									return <TypeCheckbox key={index} label={type} types={types} setTypes={setTypes} />;
								})}
							</div>
							<div className="flex flex-col items-center">
								<div className="flex items-center gap-2">
									<Label htmlFor="filter-percentage" className="font-semibold my-1.5">
										Below Buff %
									</Label>
									<Badge variant="purple" className="text-white font-medium">
										Pro
									</Badge>
								</div>
								<input
									type="number"
									id="filter-percentage"
									min="0"
									className="w-[100px] h-9 pl-3.5 mb-2 text-white bg-[#2a2d2f] rounded-[20px] text-base [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none border border-purple-800 disabled:text-gray-500"
									value={percentage}
									onChange={(e) => {
										setPercentage(parseFloat(e.target.value));
									}}
									disabled={user?.plan.type !== 'pro'}
								/>
								<Label htmlFor="filter-price-low" className="font-semibold my-1.5">
									PRICE
								</Label>
								<input
									type="number"
									id="filter-price-low"
									min="0"
									max="999999"
									className="w-[100px] h-9 pl-3.5 text-white bg-[#2a2d2f] rounded-[20px] text-base [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
									value={priceLow}
									onChange={(e) => {
										setPriceLow(parseFloat(e.target.value));
									}}
								/>
								<span className="text-white">-</span>
								<input
									type="number"
									min="0"
									max="999999"
									className="w-[100px] h-9 pl-3.5 mb-2 text-white bg-[#2a2d2f] rounded-[20px] text-base [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
									value={priceHigh}
									onChange={(e) => {
										setPriceHigh(parseFloat(e.target.value));
									}}
								/>
								<div className="flex items-center pb-1 pl-1.5 gap-0.5 mt-2">
									<input
										type="checkbox"
										id="filter-new-only"
										checked={newOnly}
										onChange={(e) => setNewOnly(e.target.checked)}
										className="w-5 h-5 mr-1 text-white"
										style={{ clipPath: 'circle(50%)', accentColor: '#ff5722' }}
									/>
									<label className="mr-1.5 text-sm" htmlFor="filter-new-only">
										NEW ONLY
									</label>
								</div>
							</div>
						</div>
						<div className="absolute bottom-5 right-7 flex items-center gap-4">
							<Button variant="invisible" size="icon" className={cn('hover:bg-neutral-700', filterCount === 0 && 'hidden')} onClick={handleReset}>
								<CarbonFilterReset className="h-7 w-7 text-gray-600" />
							</Button>
							<Button className="font-semibold bg-[#4db5da]" onClick={handleSave}>
								SAVE
							</Button>
						</div>
					</motion.div>
				)}
			</AnimatePresence>
		</div>
	);
};

export default SpLiveFilter;
