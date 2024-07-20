import type React from 'react';
import { useState } from 'react';
import { Button, MultiplierInput } from '~lib/components/Shadcn';

type PricingData = {
	buff_name: string;
	priceFromReference: string;
	userCurrency: string;
};

const PercentageButton: React.FC<{ percentage: number; handleClick: (percentage: number) => void }> = ({ percentage, handleClick }) => {
	return (
		<Button className="h-8 px-3 bg-[#c1ceff0a] hover:bg-[#fff3]" onClick={() => handleClick(percentage)}>
			{percentage}%
		</Button>
	);
};

const CSFBargainButtons: React.FC = () => {
	const [percentage, setPercentage] = useState<string>('');

	const inputElement = document.querySelector<HTMLInputElement>('app-make-offer-dialog .inputs input');

	let pricingData: PricingData | null = null;

	const getPricingData = () => {
		const bfPricingDiv = document.querySelector<HTMLDivElement>('app-make-offer-dialog item-card .betterfloat-buffprice');
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
		</div>
	);
};

export default CSFBargainButtons;
