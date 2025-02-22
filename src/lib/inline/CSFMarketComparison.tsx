import { useEffect, useState } from 'react';
import type { CSFloat } from '~lib/@typings/FloatTypes';
import { LoadingSpinner } from '~popup/components/LoadingSpinner';
import { ScrollArea } from '~popup/ui/scroll-area';

import betterfloatLogo from 'data-base64:/assets/icon.png';
import { useStorage } from '@plasmohq/storage/hook';
import Decimal from 'decimal.js';
import { getMarketID } from '~lib/handlers/mappinghandler';
import { AvailableMarketSources, MarketSource } from '~lib/util/globals';
import { CurrencyFormatter, getMarketURL } from '~lib/util/helperfunctions';
import type { SettingsUser } from '~lib/util/storage';
import { cn } from '~lib/utils';
import { Badge } from '~popup/ui/badge';
import { Button } from '~popup/ui/button';

interface MarketEntry {
	market: string;
	ask?: number;
	bid?: number;
	count: number;
	updated: number;
}

interface APIMarketResponse {
	[market: string]: Partial<MarketEntry>;
}

const InfoIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
	<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
		<circle cx="12" cy="12" r="10" />
		<path d="M12 16v-4" />
		<path d="M12 8h.01" />
	</svg>
);
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

function isBannedOnBuff(item: CSFloat.Item) {
	return item.type === 'container';
}

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

const MarketCard: React.FC<{ listing: CSFloat.ListingData; entry: MarketEntry; currency: string }> = ({ listing, entry, currency }) => {
	const item = listing.item;
	const marketDetails = AvailableMarketSources.find((source) => source.source === entry.market);
	const priceDifference = entry.ask ? new Decimal(listing.price).minus(entry.ask) : null;
	const pricePercentage = entry.ask ? new Decimal(listing.price).div(entry.ask).mul(100).minus(100) : null;

	if (!marketDetails) {
		return <span className="text-red-500">Unknown market: {entry.market}</span>;
	}

	const formatCurrency = (value: number) => CurrencyFormatter(currency, 2).format(new Decimal(value).div(100).toNumber());

	const getHref = () => {
		const market_id = getMarketID(item.market_hash_name, marketDetails.source);
		const href = getMarketURL({ source: marketDetails.source, market_id, buff_name: item.market_hash_name });
		return href;
	};

	return (
		<div className="flex flex-col text-[--subtext-color] my-2 bg-[--highlight-background-minimal] rounded-md">
			<div className="flex flex-col">
				<div className="flex flex-col gap-1 p-4 pb-1">
					<div className="flex items-center gap-2">
						<img src={marketDetails.logo} className="h-8 w-8" style={convertStylesStringToObject(marketDetails.style)} />
						<span className="text-lg font-bold text-white">{marketDetails.text}</span>
						{[MarketSource.Buff, MarketSource.YouPin, MarketSource.Steam].includes(marketDetails.source) && <ShieldCheck className="h-6 w-6 text-green-500" />}
					</div>
					<div className="flex justify-center items-center gap-1">
						<ActivityPing activity={entry.count} />
						<span className="text-sm">
							{entry.count} item{entry.count !== 1 ? 's' : ''} in stock
						</span>
						{/* <span className="text-sm">{entry.updated}</span> */}
					</div>
				</div>
				<a className="border-t border-border hover:bg-[--highlight-background-heavy]" href={getHref()} target="_blank" rel="noreferrer">
					<div className="flex flex-col px-4 py-2">
						{entry.bid !== undefined && (
							<div className="flex items-center justify-between">
								<span>Buy Order</span>
								<span className="text-sm" style={{ color: 'orange' }}>
									{formatCurrency(entry.bid)}
								</span>
							</div>
						)}
						<div className="flex items-center justify-between">
							<span className="text-white">Lowest</span>
							<span className="text-sm" style={{ color: 'greenyellow' }}>
								{entry.ask ? formatCurrency(entry.ask) : 'N/A'}
							</span>
						</div>
						{priceDifference && pricePercentage && (
							<div className="flex items-center justify-center mt-1">
								<div className="flex items-center gap-1 text-sm py-1 px-2 rounded-lg bg-[--highlight-background-minimal] font-semibold">
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

const CSFMarketComparison: React.FC = () => {
	const [isLoading, setIsLoading] = useState(true);
	const [listing, setListing] = useState<CSFloat.ListingData | null>(null);
	const [marketData, setMarketData] = useState<MarketEntry[]>([]);
	const [liquidity, setLiquidity] = useState<number | null>(null);
	const [currency, setCurrency] = useState('USD');

	const [user] = useStorage<SettingsUser>('user');

	const fetchMarketData = async () => {
		const item = listing?.item;
		if (!item) {
			console.error('No item data found');
			return;
		}
		try {
			const response = await fetch(`${process.env.PLASMO_PUBLIC_BETTERFLOATAPI}/v1/price/${item.market_hash_name}`);
			const data = (await response.json()) as APIMarketResponse;

			let convertedData = Object.entries(data)
				.map(([market, entry]) => ({
					market,
					ask: entry.ask,
					bid: entry.bid,
					count: entry.count || 0,
					updated: entry.updated || 0,
				}))
				.filter((entry) => entry.market !== 'liquidity');

			console.log('User:', user);
			// Filter markets for free users
			if (user?.plan.type !== 'pro') {
				convertedData = convertedData.filter((entry) => entry.market === MarketSource.Buff || entry.market === MarketSource.YouPin);
			}

			if (isBannedOnBuff(listing?.item)) {
				convertedData = convertedData.filter((entry) => entry.market !== MarketSource.Buff);
			}

			if (convertedData.length === 0) {
				console.warn('No market data available');
			}

			if (data.liquidity) {
				setLiquidity(Number(data.liquidity));
			}

			const sortedData = convertedData.sort((a, b) => (!b.ask ? -1 : (a.ask ?? 0) - b.ask));
			setMarketData(sortedData || []);
		} catch (error) {
			console.error('Error fetching market data:', error);
		}
	};

	const initData = async () => {
		setCurrency(localStorage.getItem('selected_currency') || 'USD');

		const itemContainer = document.querySelector('mat-dialog-container item-detail');
		let betterfloatData = itemContainer?.getAttribute('data-betterfloat');
		while (!betterfloatData) {
			await new Promise((resolve) => setTimeout(resolve, 200));
			betterfloatData = itemContainer?.getAttribute('data-betterfloat');
		}
		if (betterfloatData) {
			setListing(JSON.parse(betterfloatData));
		}
	};

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

	return (
		<div className="dark w-[210px] max-h-[90vh]" style={{ fontFamily: 'Roboto, "Helvetica Neue", sans-serif' }}>
			{isLoading ? (
				<div className="flex justify-center items-center mt-8">
					<LoadingSpinner className="size-10 text-white" />
				</div>
			) : (
				<div className="flex flex-col gap-2">
					<div className="w-full bg-[--highlight-background-minimal] flex justify-center items-center gap-2 rounded-md py-2">
						<img src={betterfloatLogo} alt="BetterFloat" className="h-8 w-8" />
						<span className="text-white font-bold">Market Comparison</span>
					</div>
					<div className="flex flex-col justify-center gap-1 p-4 bg-[--highlight-background-minimal] text-[--subtext-color] text-sm rounded-md">
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
					<ScrollArea className="w-full h-[80vh] [--border:227_100%_88%_/_0.07]">
						{listing && marketData.map((dataEntry) => <MarketCard key={dataEntry.market} listing={listing} entry={dataEntry} currency={currency} />)}
						{user?.plan.type !== 'pro' && (
							<div className="text-[--subtext-color] mt-2 bg-[--highlight-background-minimal] rounded-md">
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

export default CSFMarketComparison;
