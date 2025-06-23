import betterfloatLogo from 'data-base64:/assets/icon.png';
import { useStorage } from '@plasmohq/storage/hook';
import Decimal from 'decimal.js';
import { useEffect, useState } from 'react';
import type { DopplerPhase } from '~lib/@typings/FloatTypes';
import { getMarketID } from '~lib/handlers/mappinghandler';
import { AvailableMarketSources, MarketSource } from '~lib/util/globals';
import { CurrencyFormatter, getMarketURL, isBuffBannedItem } from '~lib/util/helperfunctions';
import { fetchMarketComparisonData } from '~lib/util/messaging';
import type { SettingsUser } from '~lib/util/storage';
import { ExtensionStorage } from '~lib/util/storage';
import { cn } from '~lib/utils';
import { LoadingSpinner } from '~popup/components/LoadingSpinner';
import { Button } from '~popup/ui/button';
import { ScrollArea } from '~popup/ui/scroll-area';

interface MarketEntry {
	market: string;
	ask?: number;
	bid?: number;
	count: number;
	updated: number;
}

interface LisSkinsItem {
	name: string;
	phase?: DopplerPhase | string;
	price: number; // Assuming price is passed in the local currency
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

const MarketCard: React.FC<{ listing: LisSkinsItem; entry: MarketEntry; currency: string }> = ({ listing, entry, currency }) => {
	const marketDetails = AvailableMarketSources.find((source) => source.source === entry.market);
	// Price is already in local currency on lis-skins, comparison price needs conversion
	const priceDifference = entry.ask ? new Decimal(listing.price).minus(entry.ask) : null;
	const pricePercentage = entry.ask ? new Decimal(listing.price).div(entry.ask).mul(100).minus(100) : null;

	if (!marketDetails) {
		return <span className="text-red-500">Unknown market: {entry.market}</span>;
	}

	// Use local currency format for the market card
	const formatCurrency = (value: number) => CurrencyFormatter(currency, 2).format(value);

	const getHref = () => {
		const market_id = getMarketID(listing.name, marketDetails.source);
		const href = getMarketURL({ source: marketDetails.source, market_id, buff_name: listing.name, phase: listing.phase as DopplerPhase });
		return href;
	};

	return (
		// Adapt styling to match Lis-Skins (light theme, different colors)
		<div className="w-[210px] text-gray-200 my-2 bg-[#2d313b] rounded-md shadow-sm">
			<div className="flex flex-col">
				<div className="flex flex-col gap-1 p-4 pb-1">
					<div className="flex items-center gap-2">
						<img src={marketDetails.logo} className="h-8 w-8" />
						<span className="text-lg font-bold text-gray-200">{marketDetails.text}</span>
						{[MarketSource.Buff, MarketSource.CSFloat, MarketSource.Steam].includes(marketDetails.source) && <ShieldCheck className="h-6 w-6 text-green-400" />}
					</div>
					<div className="flex justify-center items-center gap-1">
						<ActivityPing activity={entry.count} />
						<span className="text-sm">
							{entry.count} item{entry.count !== 1 ? 's' : ''} in stock
						</span>
					</div>
				</div>
				<a className="border-t border-gray-500 hover:bg-gray-500" href={getHref()} target="_blank" rel="noreferrer">
					<div className="flex flex-col px-4 py-2">
						{entry.bid !== undefined && (
							<div className="flex items-center justify-between">
								<span>Buy Order</span>
								<span className="text-sm font-semibold text-orange-600">{formatCurrency(entry.bid)}</span>
							</div>
						)}
						<div className="flex items-center justify-between">
							<span className="text-gray-200">Lowest</span>
							<span className="text-sm font-semibold text-green-400">{entry.ask ? formatCurrency(entry.ask) : 'N/A'}</span>
						</div>
						{priceDifference && pricePercentage && (
							<div className="flex items-center justify-center mt-1">
								{/* Adapt difference indicator styling */}
								<div
									className={cn(
										'flex items-center gap-1 text-sm py-1 px-2 rounded-lg font-semibold',
										priceDifference.isPositive() ? 'bg-[#ff80951a] text-[#ff8095]' : 'bg-[#7bc3771a] text-[#5bc27a]'
									)}
								>
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

const LisMarketComparison: React.FC = () => {
	const [isLoading, setIsLoading] = useState(true);
	const [listing, setListing] = useState<LisSkinsItem | null>(null);
	const [marketData, setMarketData] = useState<MarketEntry[]>([]);
	const [liquidity, setLiquidity] = useState<number | null>(null);
	const [currency, setCurrency] = useState('USD'); // Default, will be updated
	const [currencyRates, setCurrencyRates] = useState<{ [key: string]: number }>({});

	const [user] = useStorage<SettingsUser>('user');

	const fetchMarketData = async () => {
		if (!listing) {
			console.error('No item data found');
			return;
		}

		let buff_name = listing.name;
		if (listing.phase) {
			buff_name += ` - ${listing.phase}`;
		}

		// Determine the rate to convert *to* the local currency
		const rate = currencyRates[currency.toLowerCase()] ?? 1;

		try {
			const { data } = await fetchMarketComparisonData(buff_name);
			let convertedData = Object.entries(data)
				.map(([market, entry]) => ({
					market,
					// Convert fetched USD prices to local currency
					ask: entry.ask ? (entry.ask * rate) / 100 : undefined,
					bid: entry.bid ? (entry.bid * rate) / 100 : undefined,
					count: entry.count || 0,
					updated: entry.updated || 0,
				}))
				.filter((entry) => entry.market !== 'liquidity')
				.filter((entry) => entry.ask !== undefined || entry.bid !== undefined);

			if (isBuffBannedItem(listing.name)) {
				// Check based on name
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
		// Get currency from Lis-Skins UI
		const currencyElement = document.querySelector('p.currency-switcher__selected-currency');
		const localCurrency = currencyElement?.textContent?.toUpperCase() || 'USD';
		setCurrency(localCurrency);

		// Fetch our stored currency rates
		const ratesFromStorage = await ExtensionStorage.local.get<{ rates: { [key: string]: number } }>('currencyrates');
		if (ratesFromStorage?.rates) {
			setCurrencyRates(ratesFromStorage.rates);
		} else {
			console.warn('[BetterFloat] Currency rates not found in storage.');
			// Fallback or fetch rates if necessary
		}

		// Find the target element where data-betterfloat is stored
		const itemContainer = document.querySelector('div.skins-market-view[data-betterfloat]');

		let betterfloatData = itemContainer?.getAttribute('data-betterfloat');
		let attempts = 0;
		while ((!betterfloatData || betterfloatData.length < 2) && attempts++ < 25) {
			// Wait up to 5 seconds
			await new Promise((resolve) => setTimeout(resolve, 200));
			betterfloatData = itemContainer?.getAttribute('data-betterfloat');
		}

		if (betterfloatData) {
			try {
				const parsedData: LisSkinsItem = JSON.parse(betterfloatData);
				// Lis-Skins price might already be a number if parsed correctly in content script
				// Ensure it is a number for calculations
				parsedData.price = Number(parsedData.price) || 0;
				setListing(parsedData);
			} catch (e) {
				console.error('[BetterFloat] Error parsing data-betterfloat attribute:', e, betterfloatData);
			}
		} else {
			console.error('[BetterFloat] Could not find data-betterfloat attribute on item container.');
		}
	};

	useEffect(() => {
		if (user) {
			initData();
		}
	}, [user]);

	useEffect(() => {
		if (listing && currencyRates && Object.keys(currencyRates).length > 0 && marketData.length === 0) {
			fetchMarketData()
				.catch((error) => {
					console.error('Error fetching market data:', error);
				})
				.finally(() => {
					setIsLoading(false);
				});
		}
	}, [listing, currencyRates]); // Depend on listing and currencyRates

	return (
		<div className="max-h-[60vh] bg-[#21242a] rounded-md text-sm" style={{ fontFamily: 'inherit' }}>
			{isLoading ? (
				<div className="flex justify-center items-center mt-8">
					<LoadingSpinner className="size-10 text-gray-700" />
				</div>
			) : (
				<div className="flex flex-col">
					{/* Adapt header styling */}
					<div className="w-full rounded-md flex justify-between items-center gap-1 px-4 pt-4">
						<div className="flex justify-center items-center gap-2">
							<img src={betterfloatLogo} alt="BetterFloat" className="h-8 w-8" />
							<span className="text-gray-200 font-bold text-xl">Market Comparison</span>
						</div>
						<div className="flex flex-col justify-center items-center text-gray-200">
							<div className="flex items-center justify-between">
								<span>Total Listings:</span>
								<span className="font-medium">{marketData.reduce((acc, curr) => acc + curr.count, 0)}</span>
							</div>
							{liquidity && (
								<div className="flex items-center justify-between">
									<span>Liquidity:</span>
									<span className="font-medium">{liquidity.toFixed(2)}%</span>
								</div>
							)}
						</div>
					</div>
					{/* Adapt scroll area styling for horizontal scroll */}
					<ScrollArea className="w-full" viewportClass="w-full whitespace-nowrap rounded-md" orientation="horizontal">
						<div className="flex w-max space-x-4 p-4">
							{listing && marketData.map((dataEntry) => <MarketCard key={dataEntry.market} listing={listing} entry={dataEntry} currency={currency} />)}
							{(!marketData || marketData.length === 0) && (
								// Adapt no listings styling (keep it somewhat centered)
								<div className="flex-1 text-gray-200 bg-[#2d313b] border border-gray-500 rounded-md shadow-sm">
									<div className="flex flex-col items-center justify-center gap-1 p-4 h-full min-w-[200px]">
										<BanIcon className="size-8 text-gray-200" />
										<span className="text-base text-center text-gray-200">No listings found</span>
									</div>
								</div>
							)}
							{user?.plan.type !== 'pro' && (
								// Adapt Pro upgrade styling
								<div className="flex-shrink-0 text-gray-200 bg-[#2d313b] border border-gray-500 rounded-md shadow-sm">
									<div className="flex flex-col items-center justify-center gap-2 p-4 h-full min-w-[200px]">
										<LockKeyhole className="h-8 w-8 text-gray-200" />
										<span className="text-base text-center text-gray-200">Unlock 10+ more markets</span>
										<Button variant="purple" size="sm" asChild>
											<a href="https://betterfloat.com/pricing" target="_blank" rel="noreferrer">
												Upgrade to Pro
											</a>
										</Button>
									</div>
								</div>
							)}
						</div>
					</ScrollArea>
				</div>
			)}
		</div>
	);
};

export default LisMarketComparison;
