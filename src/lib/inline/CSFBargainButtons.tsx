import { type FC, useEffect, useRef, useState } from 'react';
import type { CSFloat } from '~lib/@typings/FloatTypes';
import { CSF_BARGAIN_HISTORY_UPDATED_EVENT, type CSFloatBargainHistoryEntry, getCSFBargainHistory } from '~lib/db/csfloatBargainHistory';
import { Button } from '~popup/ui/button';
import { MultiplierInput } from '~popup/ui/input';

type PricingData = {
	buff_name: string;
	priceFromReference: string;
	userCurrency: string;
};

type BargainHistoryUpdateDetail = {
	contractId: string;
};

const PercentageButton: FC<{ percentage: number; handleClick: (percentage: number) => void }> = ({ percentage, handleClick }) => {
	return (
		<Button className="h-8 px-3 bg-[#c1ceff0a] hover:bg-[#fff3]" onClick={() => handleClick(percentage)}>
			{percentage}%
		</Button>
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
	const [history, setHistory] = useState<CSFloatBargainHistoryEntry[]>([]);
	const contractIdRef = useRef<string | null>(null);

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
		let cancelled = false;

		const loadHistory = async (nextContractId?: string | null) => {
			const resolvedContractId = nextContractId ?? (await getPopupContractId());
			if (cancelled) {
				return;
			}

			contractIdRef.current = resolvedContractId;
			if (!resolvedContractId) {
				setHistory([]);
				return;
			}

			const entries = await getCSFBargainHistory(resolvedContractId);
			if (!cancelled) {
				setHistory(entries);
			}
		};

		void loadHistory();

		const handleHistoryUpdate = (event: Event) => {
			const { detail } = event as CustomEvent<BargainHistoryUpdateDetail>;
			if (detail?.contractId && detail.contractId === contractIdRef.current) {
				void loadHistory(detail.contractId);
			}
		};

		document.addEventListener(CSF_BARGAIN_HISTORY_UPDATED_EVENT, handleHistoryUpdate as EventListener);
		return () => {
			cancelled = true;
			document.removeEventListener(CSF_BARGAIN_HISTORY_UPDATED_EVENT, handleHistoryUpdate as EventListener);
		};
	}, []);

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
			{history.length > 0 && (
				<div className="mt-4 border-t border-[#ffffff1f] pt-3">
					<h3 className="text-sm font-medium text-[#9EA7B1] mb-2">Previous bargains for this skin</h3>
					<div className="flex flex-col gap-2">
						{history.map((entry) => (
							<div key={entry.offerId} className="flex items-center justify-between rounded-md bg-[#c1ceff0a] px-3 py-2 text-sm">
								<div className="text-[#E5E7EB]">
									{Intl.NumberFormat(undefined, {
										style: 'currency',
										currency: entry.currency,
										currencyDisplay: 'narrowSymbol',
										minimumFractionDigits: 0,
										maximumFractionDigits: 2,
									}).format(entry.price / 100)}
								</div>
								<div className="text-right text-xs text-[#9EA7B1]">
									{new Intl.DateTimeFormat(undefined, {
										dateStyle: 'medium',
										timeStyle: 'short',
									}).format(new Date(entry.createdAt || entry.recordedAt))}
								</div>
							</div>
						))}
					</div>
				</div>
			)}
		</div>
	);
};

export default CSFBargainButtons;
