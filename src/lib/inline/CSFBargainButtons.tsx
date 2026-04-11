import { useStorage } from '@plasmohq/storage/hook';
import { useLiveQuery } from 'dexie-react-hooks';
import { Check, CircleHelp, Clock3, LockKeyhole, X } from 'lucide-react';
import { type FC, useEffect, useState } from 'react';
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
				<div className={cn('flex flex-col gap-2', !isPro && 'blur-sm pointer-events-none select-none')}>
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

async function getPopupContractId() {
	const listing = parsePopupListing();
	if (listing?.id) {
		return listing.id;
	}

	await new Promise((resolve) => setTimeout(resolve, 200));
	return parsePopupListing()?.id ?? null;
}

const CSFBargainButtons: FC = () => {
	const [percentage, setPercentage] = useState<string>('');
	const [contractId, setContractId] = useState<string | null>(() => parsePopupListing()?.id ?? null);
	const [user] = useStorage<SettingsUser>('user');
	const isPro = user?.plan?.type === 'pro';

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

	useEffect(() => {
		if (contractId) {
			return;
		}

		let cancelled = false;
		void getPopupContractId().then((resolvedContractId) => {
			if (!cancelled) {
				setContractId(resolvedContractId);
			}
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
			<h3 className="text-sm font-medium text-[#9EA7B1] mb-1">Bargain by Percentage</h3>
			<div className="flex justify-between items-center gap-2">
				<PercentageButton percentage={85} handleClick={() => applyPercentage(85)} />
				<PercentageButton percentage={87.5} handleClick={() => applyPercentage(87.5)} />
				<PercentageButton percentage={90} handleClick={() => applyPercentage(90)} />
				<PercentageButton percentage={92.5} handleClick={() => applyPercentage(92.5)} />
				<PercentageButton percentage={95} handleClick={() => applyPercentage(95)} />
			</div>
			<div className="flex justify-center items-center mt-2 ml-2 gap-2">
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
			</div>
			<BargainHistoryList history={history} isPro={isPro} />
		</div>
	);
};

export default CSFBargainButtons;
