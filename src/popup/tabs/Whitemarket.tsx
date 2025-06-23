import { useStorage } from '@plasmohq/storage/hook';
import { ICON_CSBLUEGEM, ICON_WHITEMARKET_FULL } from '~lib/util/globals';
import { IcOutlineDiscount, IcRoundAccessTime, PhSticker, StreamlineDiscountPercentCoupon } from '~popup/components/Icons';
import { MarketLogoFull } from '~popup/components/MarketLogoFull';
import { SettingsCard } from '~popup/components/SettingsCard';
import { SettingsCheckbox } from '~popup/components/SettingsCheckbox';
import { SettingsEnable } from '~popup/components/SettingsEnable';
import { SettingsSource } from '~popup/components/SettingsSource';
import { WarningCallout } from '~popup/ui/callout';
import { TabTemplate } from './TabTemplate';

interface WhiteMarketSettingsProps {
	hasProPlan: boolean;
}

export const WhiteMarketSettings = ({ hasProPlan }: WhiteMarketSettingsProps) => {
	const [checked] = useStorage<boolean>('wm-enable');

	return (
		<TabTemplate value="whitemarket" checked={checked}>
			{!hasProPlan && <WarningCallout text="Please upgrade to Pro to access WhiteMarket features" />}
			<MarketLogoFull icon={ICON_WHITEMARKET_FULL} />
			<SettingsEnable id="wm-enable" isPremiumFeature hasProPlan={hasProPlan} />
			<div className="">
				<div className="pt-4 pb-2">
					<p className="text-base font-bold leading-none tracking-tight uppercase">Features</p>
				</div>
				<div className="flex flex-col gap-1">
					<SettingsCard>
						<SettingsCheckbox
							id="wm-csbluegem"
							text="Blue Gem Enhancements"
							icon={<img className="h-6 w-6" src={ICON_CSBLUEGEM} alt="CSBlueGem Logo" />}
							tooltipText="Adds pattern details and past sales to case hardened skins."
							disabled
						/>
					</SettingsCard>
					<SettingsCard>
						<SettingsCheckbox id="wm-stickerprices" text="Sticker Prices" icon={<PhSticker className="h-6 w-6" />} disabled />
					</SettingsCard>
				</div>
			</div>
			<div className="">
				<div className="pt-4 pb-2">
					<p className="text-base font-bold leading-none tracking-tight uppercase">Prices</p>
				</div>
				<div className="flex flex-col gap-1">
					<SettingsSource prefix="wm" />
					<SettingsCard>
						<SettingsCheckbox
							id="wm-buffdifference"
							text="Show Buff Price Difference"
							tooltipText="Recalculates and replaces the original discount tag according to the item's Buff price in absolute units."
							icon={<IcOutlineDiscount className="h-6 w-6" />}
						/>
					</SettingsCard>
					<SettingsCard>
						<SettingsCheckbox
							id="wm-buffdifferencepercent"
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
						<SettingsCheckbox id="wm-listingage" text="Show Listing Age" icon={<IcRoundAccessTime className="h-6 w-6" />} disabled />
					</SettingsCard>
				</div>
			</div>
		</TabTemplate>
	);
};
