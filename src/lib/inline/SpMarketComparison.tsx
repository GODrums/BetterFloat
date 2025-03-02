import { useEffect, useRef, useState } from 'react';
import type { DopplerPhase } from '~lib/@typings/FloatTypes';
import { LoadingSpinner } from '~popup/components/LoadingSpinner';
import { ScrollArea } from '~popup/ui/scroll-area';

import betterfloatLogo from 'data-base64:/assets/icon.png';
import { useStorage } from '@plasmohq/storage/hook';
import Decimal from 'decimal.js';
import { AnimatePresence } from 'framer-motion';
import type { Skinport } from '~lib/@typings/SkinportTypes';
import { getMarketID } from '~lib/handlers/mappinghandler';
import { fetchMarketComparisonData } from '~lib/handlers/networkhandler';
import { AvailableMarketSources, MarketSource } from '~lib/util/globals';
import { CurrencyFormatter, getMarketURL, isBuffBannedItem } from '~lib/util/helperfunctions';
import { ExtensionStorage, type SettingsUser } from '~lib/util/storage';
import { cn } from '~lib/utils';
import { MaterialSymbolsCloseSmallOutlineRounded } from '~popup/components/Icons';
import { Badge } from '~popup/ui/badge';
import { Button } from '~popup/ui/button';

interface MarketEntry {
	market: string;
	ask?: number;
	bid?: number;
	count: number;
	updated: number;
}

const CirclePlus: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
	<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 15 15" fill="none" width="19" height="19" {...props}>
		<circle cx="7" cy="7.5" r="7" fill="#FD484A" fillOpacity="0.25"></circle>
		<path d="M3.5 7.5H10.5" stroke="#FD484A" strokeWidth="2px" strokeLinecap="round" strokeLinejoin="round" fill="none"></path>
		<path d="M7 4L7 11" stroke="#FD484A" strokeWidth="2px" strokeLinecap="round" strokeLinejoin="round" fill="none"></path>
	</svg>
);
const CircleMinus: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
	<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 15 15" fill="none" width="19" height="19" {...props}>
		<circle cx="7" cy="7.5" r="7" fill="#64EC42" fillOpacity="0.15"></circle>
		<path d="M4 7.5H7H10" stroke="#64EC42" strokeWidth="2px" strokeLinecap="round" strokeLinejoin="round" fill="none"></path>
	</svg>
);
const LockKeyhole: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
	<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
		<circle cx="12" cy="16" r="1" />
		<rect width="18" height="12" x="3" y="10" rx="2" />
		<path d="M7 10V7a5 5 0 0 1 9.33-2.5" />
	</svg>
);
const ShieldCheck: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
	<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
		<path d="M20 13c0 5-3.5 7.5-7.66 8.95a1 1 0 0 1-.67-.01C7.5 20.5 4 18 4 13V6a1 1 0 0 1 1-1c2 0 4.5-1.2 6.24-2.72a1.17 1.17 0 0 1 1.52 0C14.51 3.81 17 5 19 5a1 1 0 0 1 1 1z" />
		<path d="m9 12 2 2 4-4" />
	</svg>
);
const Settings: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
	<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
		<path d="M12.22 2h-.44a2 2 0 0 0-2 2v.18a2 2 0 0 1-1 1.73l-.43.25a2 2 0 0 1-2 0l-.15-.08a2 2 0 0 0-2.73.73l-.22.38a2 2 0 0 0 .73 2.73l.15.1a2 2 0 0 1 1 1.72v.51a2 2 0 0 1-1 1.74l-.15.09a2 2 0 0 0-.73 2.73l.22.38a2 2 0 0 0 2.73.73l.15-.08a2 2 0 0 1 2 0l.43.25a2 2 0 0 1 1 1.73V20a2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2v-.18a2 2 0 0 1 1-1.73l.43-.25a2 2 0 0 1 2 0l.15.08a2 2 0 0 0 2.73-.73l.22-.39a2 2 0 0 0-.73-2.73l-.15-.08a2 2 0 0 1-1-1.74v-.5a2 2 0 0 1 1-1.74l.15-.09a2 2 0 0 0 .73-2.73l-.22-.38a2 2 0 0 0-2.73-.73l-.15.08a2 2 0 0 1-2 0l-.43-.25a2 2 0 0 1-1-1.73V4a2 2 0 0 0-2-2z" />
		<circle cx="12" cy="12" r="3" />
	</svg>
);
const BanIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
	<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
		<circle cx="12" cy="12" r="10" />
		<path d="m4.9 4.9 14.2 14.2" />
	</svg>
);

const ActivityPing: React.FC<{ activity: number }> = ({ activity }) => {
	const activityColor = activity < 10 ? 'bg-red-500' : activity < 20 ? 'bg-yellow-500' : 'bg-green-500';
	return (
		<div className="relative mr-1">
			<span className="flex h-2.5 w-2.5">
				<span className={cn('absolute inline-flex h-full w-full animate-ping rounded-full opacity-75', activityColor)}></span>
				<span className={cn('relative inline-flex h-2.5 w-2.5 rounded-full', activityColor)}></span>
			</span>
		</div>
	);
};

const convertStylesStringToObject = (stringStyles: string) =>
	typeof stringStyles === 'string'
		? stringStyles.split(';').reduce((acc, style) => {
				const colonPosition = style.indexOf(':');

				if (colonPosition === -1) {
					return acc;
				}

				const camelCaseProperty = style
					.substring(0, colonPosition)
					.trim()
					.replace(/^-ms-/, 'ms-')
					.replace(/-./g, (c) => c.substring(1).toUpperCase());

				const value = style.substring(colonPosition + 1).trim();

				// biome-ignore lint/performance/noAccumulatingSpread: <explanation>
				return value ? { ...acc, [camelCaseProperty]: value } : acc;
			}, {})
		: {};

const MarketCard: React.FC<{ listing: Skinport.Listing; entry: MarketEntry; currency: string }> = ({ listing, entry, currency }) => {
	const marketDetails = AvailableMarketSources.find((source) => source.source === entry.market);
	const priceDifference = entry.ask ? new Decimal(listing.price).mul(100).minus(entry.ask) : null;
	const pricePercentage = entry.ask ? new Decimal(listing.price).mul(100).div(entry.ask).mul(100).minus(100) : null;

	if (!marketDetails) {
		return <span className="text-red-500">Unknown market: {entry.market}</span>;
	}

	const formatCurrency = (value: number) => CurrencyFormatter(currency, 2).format(new Decimal(value).div(100).toNumber());

	const getHref = () => {
		const market_id = getMarketID(listing.full_name, marketDetails.source);
		const href = getMarketURL({ source: marketDetails.source, market_id, buff_name: listing.full_name, phase: listing.style as DopplerPhase });
		return href;
	};

	return (
		<div className="w-[210px] text-[#747778] my-2 border border-[#43484a] rounded-md">
			<div className="flex flex-col">
				<div className="flex flex-col gap-1 p-4 pb-1">
					<div className="flex items-center gap-2">
						<img src={marketDetails.logo} className="h-6 w-6" style={convertStylesStringToObject(marketDetails.style)} />
						<span className="text-lg font-semibold text-white">{marketDetails.text}</span>
						{[MarketSource.Buff, MarketSource.YouPin, MarketSource.Steam].includes(marketDetails.source) && <ShieldCheck className="h-5 w-5 text-green-500" />}
					</div>
					<div className="flex justify-center items-center gap-1">
						<ActivityPing activity={entry.count} />
						<span className="text-sm">
							{entry.count} item{entry.count !== 1 ? 's' : ''} in stock
						</span>
						{/* <span className="text-sm">{entry.updated}</span> */}
					</div>
				</div>
				<a className="border-t border-[#43484a] hover:bg-[#f6f6f6]/20" href={getHref()} target="_blank" rel="noreferrer">
					<div className="flex flex-col px-4 py-2">
						{entry.bid !== undefined && (
							<div className="flex items-center justify-between">
								<span>Buy Order</span>
								<span className="text-sm font-semibold" style={{ color: 'orange' }}>
									{formatCurrency(entry.bid)}
								</span>
							</div>
						)}
						<div className="flex items-center justify-between">
							<span className="text-white">Lowest</span>
							<span className="text-sm font-semibold" style={{ color: 'greenyellow' }}>
								{entry.ask ? formatCurrency(entry.ask) : 'N/A'}
							</span>
						</div>
						{priceDifference && pricePercentage && (
							<div className="flex items-center justify-center mt-1">
								<div className="flex items-center gap-1 text-sm py-1 px-2 rounded-lg border border-[#43484a] font-semibold text-white bg-[#f6f6f6]/10">
									{priceDifference.isPositive() ? <CirclePlus /> : <CircleMinus />}
									<span>{formatCurrency(priceDifference.abs().toNumber())}</span>
									<span>({pricePercentage.add(100).toDP(2).toNumber()}%)</span>
								</div>
							</div>
						)}
					</div>
				</a>
			</div>
		</div>
	);
};

const freeMarkets = [MarketSource.Buff, MarketSource.Steam];

const SpMarketComparison: React.FC = () => {
	const [isLoading, setIsLoading] = useState(true);
	const [isSettingsOpen, setIsSettingsOpen] = useState(false);
	const [listing, setListing] = useState<Skinport.Listing | null>(null);
	const [marketData, setMarketData] = useState<MarketEntry[]>([]);
	const [liquidity, setLiquidity] = useState<number | null>(null);
	const [currency, setCurrency] = useState('USD');
	const [currencyRate, setCurrencyRate] = useState<number>(1);

	const [visibleMarkets, setVisibleMarkets] = useStorage<string[]>(
		'sp-visible-markets',
		AvailableMarketSources.map((m) => m.source)
	);
	const [user] = useStorage<SettingsUser>('user');
	const [ratesSetting] = useStorage<string>('sp-currencyrates', '0');

	const ref = useRef(null);

	const fetchMarketData = async () => {
		if (!listing) {
			console.error('No item data found');
			return;
		}

		let buff_name = listing.full_name;
		const isDoppler = listing.name.includes('Doppler') && listing.category === 'Knife';
		if (isDoppler) {
			buff_name += ` - ${listing.style}`;
		}

		const convertCurrency = (input: number) => {
			if (Number(ratesSetting) === 0) {
				return new Decimal(input).mul(currencyRate);
			}
			return new Decimal(input).div(currencyRate);
		};

		try {
			const data = await fetchMarketComparisonData(buff_name, user?.steam?.steamid);
			let convertedData = Object.entries(data)
				.map(([market, entry]) => ({
					market,
					ask: entry.ask ? convertCurrency(entry.ask).toDP(2).toNumber() : undefined,
					bid: entry.bid ? convertCurrency(entry.bid).toDP(2).toNumber() : undefined,
					count: entry.count || 0,
					updated: entry.updated || 0,
				}))
				.filter((entry) => entry.market !== 'liquidity')
				.filter((entry) => entry.ask !== undefined || entry.bid !== undefined);

			// Filter markets for free users
			if (user?.plan.type !== 'pro') {
				convertedData = convertedData.filter((entry) => freeMarkets.includes(entry.market as MarketSource));
			}

			if (isBuffBannedItem(listing.full_name)) {
				convertedData = convertedData.filter((entry) => entry.market !== MarketSource.Buff);
			}

			if (convertedData.length === 0) {
				console.warn('No market data available');
			}

			if (data.liquidity) {
				setLiquidity(Number(data.liquidity));
			}

			const sortedData = convertedData.sort((a, b) => (!b.ask ? -1 : !a.ask ? 1 : a.ask - b.ask));
			setMarketData(sortedData || []);
		} catch (error) {
			console.error('Error fetching market data:', error);
		}
	};

	const initData = async () => {
		const userData = JSON.parse(localStorage.getItem('userData') || '{}') as Skinport.UserData;
		if (userData.currency) {
			setCurrency(userData.currency);
			setCurrencyRate(userData.rates['USD']);
		}

		if (Number(ratesSetting) === 0) {
			const currencyRates = await ExtensionStorage.local.getItem<{ [key: string]: number }>('currencyrates');
			const rate = currencyRates?.rates[userData.currency];
			if (rate) {
				setCurrencyRate(rate);
			}
		}

		const itemContainer = document.querySelector('.ItemPage');
		let betterfloatData = itemContainer?.getAttribute('data-betterfloat');
		while (!betterfloatData || betterfloatData.length < 2) {
			await new Promise((resolve) => setTimeout(resolve, 200));
			betterfloatData = itemContainer?.getAttribute('data-betterfloat');
		}
		setListing(JSON.parse(betterfloatData));
	};

	useEffect(() => {
		document.documentElement.style.height = '100%';
		document.body.style.height = '100%';
	}, []);

	useEffect(() => {
		if (user) {
			initData();
		}
	}, [user]);

	useEffect(() => {
		if (listing && marketData.length === 0) {
			fetchMarketData()
				.catch((error) => {
					console.error('Error fetching market data:', error);
				})
				.finally(() => {
					setIsLoading(false);
				});
		}
	}, [listing]);

	const toggleMarket = (market: string) => {
		setVisibleMarkets((prev) => {
			if (!prev) return [market];
			if (prev.includes(market)) {
				return prev.filter((m) => m !== market);
			}
			return [...prev, market];
		});
	};

	// Filter market data based on visibility settings
	const filteredMarketData = marketData.filter((entry) => visibleMarkets.includes(entry.market));

	return (
		<div className="dark w-[240px] max-h-[60vh] pl-[30px]" style={{ fontFamily: 'Montserrat, sans-serif' }}>
			{isLoading ? (
				<div className="flex justify-center items-center mt-8">
					<LoadingSpinner className="size-10 text-white" />
				</div>
			) : (
				<div className="flex flex-col gap-2">
					<div className="w-full py-2 flex flex-col items-center gap-1">
						<div className="flex justify-center items-center gap-2">
							<img src={betterfloatLogo} alt="BetterFloat" className="h-8 w-8" />
							<span className="text-white font-semibold text-base">Market Comparison</span>
						</div>
						<div className="flex justify-center items-center gap-2">
							<Button variant="ghost" className="h-9 gap-2 border border-[#43484a] hover:bg-[#f6f6f6] hover:text-[#1d2021] text-white" onClick={() => setIsSettingsOpen(!isSettingsOpen)}>
								<Settings className="h-6 w-6" />
								<span className="text-sm">Settings</span>
							</Button>
						</div>
					</div>
					<AnimatePresence>
						{isSettingsOpen && (
							<div ref={ref} className="w-full border border-[#43484a] rounded-md p-4 flex flex-col items-center gap-1">
								<div className="w-full flex justify-between items-center gap-2 pb-2">
									<div className="font-semibold text-lg text-white">Settings</div>
									<Button variant="ghost" size="icon" className="w-8 h-8 border border-[#43484a] hover:bg-[#f6f6f6] hover:text-[#1d2021]" onClick={() => setIsSettingsOpen(false)}>
										<MaterialSymbolsCloseSmallOutlineRounded className="size-6" />
									</Button>
								</div>
								<div className="w-full space-y-3 text-[#747778]">
									{AvailableMarketSources.map((market) => (
										<div key={market.source} className="flex justify-between items-center space-x-2">
											<div className="flex items-center space-x-2">
												<input
													type="checkbox"
													checked={visibleMarkets.includes(market.source)}
													onChange={() => toggleMarket(market.source)}
													className="w-5 h-5 text-white"
													style={{ clipPath: 'circle(50%)', accentColor: '#ff5722' }}
												/>
												<div className="flex items-center gap-2">
													<img src={market.logo} className="h-6 w-6" style={convertStylesStringToObject(market.style)} />
													<label htmlFor={market.source} className="text-sm font-medium leading-none cursor-pointer">
														{market.text}
													</label>
												</div>
											</div>
											{!freeMarkets.includes(market.source) && (
												<Badge variant="purple" className="text-white">
													Pro
												</Badge>
											)}
										</div>
									))}
								</div>
							</div>
						)}
					</AnimatePresence>

					<div className="flex flex-col justify-center gap-1 p-4 text-[#747778] text-sm rounded-md">
						<div className="flex items-center justify-between">
							<span>Total Listings:</span>
							<span>{marketData.reduce((acc, curr) => acc + curr.count, 0)}</span>
						</div>
						{liquidity && (
							<div className="flex items-center justify-between">
								<span>Liquidity:</span>
								<span>{liquidity.toFixed(2)}%</span>
							</div>
						)}
					</div>
					<ScrollArea className="w-full flex-1 [--border:227_100%_88%_/_0.07]" viewportClass="h-[825px]">
						{listing && filteredMarketData.map((dataEntry) => <MarketCard key={dataEntry.market} listing={listing} entry={dataEntry} currency={currency} />)}
						{filteredMarketData.length === 0 && (
							<div className="text-[#747778] border border-[#43484a] rounded-md">
								<div className="flex flex-col items-center justify-center gap-1 p-4">
									<BanIcon className="size-8 text-white" />
									<span className="text-base text-center text-white">No listings found</span>
								</div>
							</div>
						)}
						{user?.plan.type !== 'pro' && (
							<div className="text-[#747778] mt-2 border border-[#43484a] rounded-md">
								<div className="flex flex-col items-center justify-center gap-1 p-4">
									<LockKeyhole className="h-8 w-8 text-white" />
									<span className="text-base text-center text-white">Unlock 10+ more markets</span>
									<Button variant="purple" size="sm" asChild>
										<a href="https://betterfloat.com/pricing" target="_blank" rel="noreferrer">
											Upgrade to Pro
										</a>
									</Button>
								</div>
							</div>
						)}
					</ScrollArea>
				</div>
			)}
		</div>
	);
};

export default SpMarketComparison;
