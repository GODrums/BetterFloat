import { useStorage } from '@plasmohq/storage/hook';
import { useLiveQuery } from 'dexie-react-hooks';
import { Check, CircleHelp, Clock3, LockKeyhole, Pencil, X } from 'lucide-react';
import type { FC } from 'react';
import { getCSFCurrencyRate } from '~contents/csfloat/cache';
import { getCSFloatUserCurrency } from '~contents/csfloat/modules/currency';
import type { CSFloat } from '~lib/@typings/FloatTypes';
import { type CSFloatBargainHistoryEntry, getCSFBargainHistory } from '~lib/db/csfloatBargainHistory';
import type { SettingsUser } from '~lib/util/storage';
import { cn } from '~lib/utils';
import { Button } from '~popup/ui/button';
import { MultiplierInput } from '~popup/ui/input';

type PricingData = {
	buff_name: string;
	priceFromReference: string;
	userCurrency: string;
};

type OfferStatePresentation = {
	Icon: React.ElementType;
	className: string;
	label: string;
};

const STORAGE_KEY = 'betterfloat-bargainpercentages';
const DEFAULT_PERCENTAGES = [85, 87.5, 90, 92.5, 95];

function loadPercentages(): number[] {
	try {
		const parsed = JSON.parse(localStorage.getItem(STORAGE_KEY) ?? '');
		if (Array.isArray(parsed) && parsed.length > 0 && parsed.every((value) => typeof value === 'number' && Number.isFinite(value))) {
			return parsed;
		}
	} catch {
		// ignore malformed values and fall back to defaults
	}
	return DEFAULT_PERCENTAGES;
}

function savePercentages(values: number[]) {
	localStorage.setItem(STORAGE_KEY, JSON.stringify(values));
}

const PercentageButton: FC<{ percentage: number; handleClick: (percentage: number) => void }> = ({ percentage, handleClick }) => {
	return (
		<Button className="h-8 px-3 bg-[#c1ceff0a] hover:bg-[#fff3]" onClick={() => handleClick(percentage)}>
			{percentage}%
		</Button>
	);
};

function getOfferStatePresentation(state: string): OfferStatePresentation {
	const normalizedState = state.toLowerCase();

	if (normalizedState === 'accepted') {
		return {
			Icon: Check,
			className: 'text-[#39d98a]',
			label: 'Accepted',
		};
	}

	if (normalizedState === 'declined' || normalizedState === 'canceled') {
		return {
			Icon: X,
			className: 'text-[#ff6b6b]',
			label: normalizedState === 'declined' ? 'Declined' : 'Canceled',
		};
	}

	if (normalizedState === 'active' || normalizedState === 'expired') {
		return {
			Icon: Clock3,
			className: 'text-[#7db2ff]',
			label: normalizedState === 'active' ? 'Active' : 'Expired',
		};
	}

	return {
		Icon: CircleHelp,
		className: 'text-[#9EA7B1]',
		label: state || 'Unknown',
	};
}

const BargainHistoryList: FC<{ history: CSFloatBargainHistoryEntry[]; isPro: boolean }> = ({ history, isPro }) => {
	if (history.length === 0) {
		return null;
	}

	return (
		<div className="mt-4 border-t border-[#ffffff1f] pt-3">
			<h3 className="text-sm font-medium text-[#9EA7B1] mb-2">Previous bargains for this skin</h3>
			<div className="relative">
				<div className={cn('flex flex-col gap-2', !isPro && 'blur-xs pointer-events-none select-none')}>
					{history.map((entry) => {
						const { Icon, className, label } = getOfferStatePresentation(entry.state);

						return (
							<div key={entry.offerId} className="flex items-center justify-between rounded-md bg-[#c1ceff0a] px-3 py-2 text-sm">
								<div className="flex items-center gap-2 text-[#E5E7EB]">
									<span className={className} title={label}>
										<Icon size={14} aria-hidden="true" />
									</span>
									<span>
										{isPro
											? Intl.NumberFormat(undefined, {
													style: 'currency',
													currency: entry.currency,
													currencyDisplay: 'narrowSymbol',
													minimumFractionDigits: 0,
													maximumFractionDigits: 2,
												}).format(entry.price / 100)
											: '••••'}
									</span>
								</div>
								<div className="text-right text-xs text-[#9EA7B1]">
									{new Intl.DateTimeFormat(undefined, {
										dateStyle: 'medium',
										timeStyle: 'short',
									}).format(new Date(entry.createdAt || entry.recordedAt))}
								</div>
							</div>
						);
					})}
				</div>
				{!isPro && (
					<div className="absolute inset-0 flex items-center justify-center">
						<Button variant="purple" size="sm" asChild>
							<a className="flex items-center gap-2" href="https://betterfloat.com/pricing" target="_blank" rel="noreferrer">
								<LockKeyhole className="h-5 w-5 text-[#9EA7B1]" />
								Unlock Bargain History
							</a>
						</Button>
					</div>
				)}
			</div>
		</div>
	);
};

function parsePopupListing() {
	const itemCard = document.querySelector('app-make-offer-dialog item-card');
	const listingData = itemCard?.getAttribute('data-betterfloat');
	if (!listingData) {
		return null;
	}

	try {
		return JSON.parse(listingData) as CSFloat.ListingData;
	} catch {
		return null;
	}
}

async function getPopupListing() {
	const listing = parsePopupListing();
	if (listing?.id) {
		return listing;
	}

	await new Promise((resolve) => setTimeout(resolve, 200));
	return parsePopupListing();
}

const CSFBargainButtons: FC = () => {
	const initialListing = parsePopupListing();
	const [percentage, setPercentage] = useState<string>('');
	const [percentages, setPercentages] = useState<number[]>(DEFAULT_PERCENTAGES);
	const [editing, setEditing] = useState(false);
	const [draft, setDraft] = useState<string[]>([]);
	const [contractId, setContractId] = useState<string | null>(initialListing?.id ?? null);
	const [minOfferPrice, setMinOfferPrice] = useState<number | null>(initialListing?.min_offer_price ?? null);
	const [user] = useStorage<SettingsUser>('user');
	const isPro = user?.plan?.type === 'pro';

	useEffect(() => {
		setPercentages(isPro ? loadPercentages() : DEFAULT_PERCENTAGES);
	}, [isPro]);

	const inputElement = document.querySelector<HTMLInputElement>('app-make-offer-dialog .inputs input');

	let pricingData: PricingData | null = null;

	const getPricingData = () => {
		const bfPricingDiv = document.querySelector<HTMLDivElement>('app-make-offer-dialog item-card .betterfloat-buff-a');
		if (bfPricingDiv) {
			pricingData = JSON.parse(bfPricingDiv.dataset.betterfloat || '{}');
			return true;
		}
		return false;
	};

	const applyPercentage = (percentage: number) => {
		if (!pricingData) {
			getPricingData();
		}
		const targetPrice = pricingData?.priceFromReference ? ((Number(pricingData.priceFromReference) * percentage) / 100).toFixed(2) : null;
		if (inputElement && targetPrice) {
			inputElement.value = targetPrice;
			inputElement.dispatchEvent(new Event('input', { bubbles: true }));
		}
	};

	const applyMinimum = async () => {
		const minPrice = parsePopupListing()?.min_offer_price ?? minOfferPrice;
		if (!minPrice || !inputElement) {
			return;
		}
		const currency = getCSFloatUserCurrency();
		const rate = (await getCSFCurrencyRate(currency)) ?? 1;
		inputElement.value = ((minPrice * rate) / 100).toFixed(2);
		inputElement.dispatchEvent(new Event('input', { bubbles: true }));
	};

	const startEditing = () => {
		if (!isPro) {
			return;
		}
		setDraft(percentages.map((value) => String(value)));
		setEditing(true);
	};

	const cancelEditing = () => {
		setEditing(false);
	};

	const saveEditing = () => {
		const next = draft.map((value, index) => {
			const parsed = Number(value);
			return Number.isFinite(parsed) && parsed > 0 ? parsed : percentages[index];
		});
		setPercentages(next);
		savePercentages(next);
		setEditing(false);
	};

	const updateDraft = (index: number, value: string) => {
		setDraft((current) => current.map((item, i) => (i === index ? value : item)));
	};

	useEffect(() => {
		if (contractId) {
			return;
		}

		let cancelled = false;
		void getPopupListing().then((listing) => {
			if (cancelled || !listing) {
				return;
			}
			setContractId(listing.id ?? null);
			setMinOfferPrice(listing.min_offer_price ?? null);
		});
		return () => {
			cancelled = true;
		};
	}, [contractId]);

	const history = useLiveQuery<CSFloatBargainHistoryEntry[], CSFloatBargainHistoryEntry[]>(
		async () => {
			if (!contractId) {
				return [];
			}
			return await getCSFBargainHistory(contractId);
		},
		[contractId],
		[]
	);

	return (
		<div style={{ fontFamily: 'Roboto, "Helvetica Neue", sans-serif' }}>
			<div className="flex items-center justify-between mb-1">
				<h3 className="text-sm font-medium text-[#9EA7B1]">Bargain by Percentage</h3>
				{editing ? (
					<div className="flex items-center gap-1">
						<Button size="icon" variant="ghost" className="h-6 w-6 text-[#39d98a] hover:bg-[#fff3]" onClick={saveEditing} title="Save percentages">
							<Check size={16} />
						</Button>
						<Button size="icon" variant="ghost" className="h-6 w-6 text-[#ff6b6b] hover:bg-[#fff3]" onClick={cancelEditing} title="Cancel">
							<X size={16} />
						</Button>
					</div>
				) : isPro ? (
					<Button size="icon" variant="ghost" className="h-6 w-6 text-[#9EA7B1] hover:bg-[#fff3]" onClick={startEditing} title="Edit percentages">
						<Pencil size={14} />
					</Button>
				) : (
					<Button size="icon" variant="ghost" className="h-6 w-6 text-[#9EA7B1] hover:bg-[#fff3]" asChild title="Editing percentages is a Pro feature">
						<a href="https://betterfloat.com/pricing" target="_blank" rel="noreferrer">
							<LockKeyhole size={14} />
						</a>
					</Button>
				)}
			</div>
			<div className="flex justify-between items-center gap-2">
				{editing
					? draft.map((value, index) => (
							<input
								key={index}
								type="text"
								inputMode="decimal"
								className="h-8 w-full min-w-0 rounded-md border-none text-center text-white bg-[#c1ceff0a] hover:bg-[#fff3] focus-visible:outline-hidden focus-visible:ring-1 focus-visible:ring-[#237BFF]"
								value={value}
								onChange={(event) => updateDraft(index, event.target.value)}
							/>
						))
					: percentages.map((value, index) => <PercentageButton key={index} percentage={value} handleClick={applyPercentage} />)}
			</div>
			<div className="flex justify-center items-center mt-2 gap-2">
				<MultiplierInput
					type="text"
					className="w-[90px] h-8 border-none text-white bg-[#c1ceff0a] hover:bg-[#fff3] active:bg-[#fff3]"
					value={percentage}
					onChange={(e) => setPercentage(e.target.value)}
				/>
				<Button
					className="h-8 px-3 text-[#237BFF] bg-[#237bff26] hover:bg-[#4f95ff4b] disabled:bg-[#ffffff1f] disabled:text-[#ffffff80]"
					onClick={() => applyPercentage(Number(percentage))}
					disabled={percentage.length === 0}
				>
					Apply
				</Button>
				<Button
					className="h-8 px-3 text-[#237BFF] bg-[#237bff26] hover:bg-[#4f95ff4b] disabled:bg-[#ffffff1f] disabled:text-[#ffffff80]"
					onClick={() => void applyMinimum()}
					disabled={!minOfferPrice}
					title={minOfferPrice ? 'Apply minimum allowed bargain' : 'No minimum bargain available'}
				>
					Min
				</Button>
			</div>
			<BargainHistoryList history={history} isPro={isPro} />
		</div>
	);
};

export default CSFBargainButtons;
