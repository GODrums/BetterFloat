import { useStorage } from '@plasmohq/storage/hook';
import { IcOutlineDiscount, IcRoundAccessTime, PhSticker, StreamlineDiscountPercentCoupon } from '~popup/components/Icons';
import { SettingsCard } from '~popup/components/SettingsCard';
import { SettingsCheckbox } from '~popup/components/SettingsCheckbox';
import { SettingsEnable } from '~popup/components/SettingsEnable';
import { SettingsSource } from '~popup/components/SettingsSource';
import { WarningCallout } from '~popup/ui/callout';
import { TabTemplate } from './TabTemplate';
import { MarketLogoFull } from '~popup/components/MarketLogoFull';
import { ICON_BUFFMARKET_FULL } from '~lib/util/globals';

interface BuffMarketSettingsProps {
	hasProPlan: boolean;
}

export const BuffMarketSettings = ({ hasProPlan }: BuffMarketSettingsProps) => {
	const [checked] = useStorage<boolean>('bm-enable');

	return (
		<TabTemplate value="buffmarket" checked={checked}>
			{!hasProPlan && <WarningCallout text="Please upgrade to Pro to access BuffMarket features" />}
			<MarketLogoFull icon={ICON_BUFFMARKET_FULL} />
			<SettingsEnable id="bm-enable" isPremiumFeature hasProPlan={hasProPlan} />
			<div className="">
				<div className="pt-4 pb-2">
					<p className="text-base font-bold leading-none tracking-tight uppercase">Features</p>
				</div>
				<div className="flex flex-col gap-1">
					<SettingsCard>
						<SettingsCheckbox id="bm-stickerprices" text="Sticker Prices" icon={<PhSticker className="h-6 w-6" />} disabled />
					</SettingsCard>
				</div>
			</div>
			<div className="">
				<div className="pt-4 pb-2">
					<p className="text-base font-bold leading-none tracking-tight uppercase">Prices</p>
				</div>
				<div className="flex flex-col gap-1">
					<SettingsSource prefix="bm" />
					<SettingsCard>
						<SettingsCheckbox
							id="bm-buffdifference"
							text="Show Buff Price Difference"
							tooltipText="Recalculates and replaces the original discount tag according to the item's Buff price in absolute units."
							icon={<IcOutlineDiscount className="h-6 w-6" />}
						/>
					</SettingsCard>
					<SettingsCard>
						<SettingsCheckbox
							id="bm-buffdifferencepercent"
							text="Show Buff Price Percentage Difference"
							tooltipText="Requires 'Show Buff Price Difference' to be activated. Display the ratio of an item's price to the Buff price in percentage. Price equality equates to 100%."
							icon={<StreamlineDiscountPercentCoupon className="h-6 w-6" />}
						/>
					</SettingsCard>
				</div>
			</div>
			<div className="mb-2">
				<div className="pt-4 pb-2">
					<p className="text-base font-bold leading-none tracking-tight uppercase">Listings</p>
				</div>
				<div className="flex flex-col gap-1">
					<SettingsCard>
						<SettingsCheckbox id="bm-listingage" text="Show Listing Age" icon={<IcRoundAccessTime className="h-6 w-6" />} isNew />
					</SettingsCard>
				</div>
			</div>
		</TabTemplate>
	);
};
