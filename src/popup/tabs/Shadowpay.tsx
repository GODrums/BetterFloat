import { useStorage } from '@plasmohq/storage/hook';
import { ICON_CSBLUEGEM, ICON_SHADOWPAY_FULL } from '~lib/util/globals';
import { IcOutlineDiscount, IcRoundAccessTime, PhSticker, StreamlineDiscountPercentCoupon } from '~popup/components/Icons';
import { MarketLogoFull } from '~popup/components/MarketLogoFull';
import { SettingsCard } from '~popup/components/SettingsCard';
import { SettingsCheckbox } from '~popup/components/SettingsCheckbox';
import { SettingsEnable } from '~popup/components/SettingsEnable';
import { SettingsSource } from '~popup/components/SettingsSource';
import { Badge } from '~popup/ui/badge';
import { WarningCallout } from '~popup/ui/callout';
import { TabTemplate } from './TabTemplate';

interface ShadowpaySettingsProps {
	hasProPlan: boolean;
}

export const ShadowpaySettings = ({ hasProPlan }: ShadowpaySettingsProps) => {
	const [checked] = useStorage<boolean>('shp-enable');

	return (
		<TabTemplate value="shadowpay" checked={checked}>
			{!hasProPlan && <WarningCallout text="Please upgrade to Pro to access Shadowpay features" />}
			<MarketLogoFull icon={ICON_SHADOWPAY_FULL} />
			<div className="flex items-center justify-center gap-2">
				<Badge variant="outline">BETA</Badge>
			</div>
			<SettingsEnable id="shp-enable" isPremiumFeature hasProPlan={hasProPlan} />
			<div className="">
				<div className="pt-4 pb-2">
					<p className="text-base font-bold leading-none tracking-tight uppercase">Features</p>
				</div>
				<div className="flex flex-col gap-1">
					<SettingsCard>
						<SettingsCheckbox
							id="shp-csbluegem"
							text="Blue Gem Enhancements"
							icon={<img className="h-6 w-6" src={ICON_CSBLUEGEM} alt="CSBlueGem Logo" />}
							tooltipText="Adds pattern details and past sales to case hardened skins."
							disabled
						/>
					</SettingsCard>
					<SettingsCard>
						<SettingsCheckbox id="shp-stickerprices" text="Sticker Prices" icon={<PhSticker className="h-6 w-6" />} disabled />
					</SettingsCard>
				</div>
			</div>
			<div className="">
				<div className="pt-4 pb-2">
					<p className="text-base font-bold leading-none tracking-tight uppercase">Prices</p>
				</div>
				<div className="flex flex-col gap-1">
					<SettingsSource prefix="shp" />
					<SettingsCard>
						<SettingsCheckbox
							id="shp-buffdifference"
							text="Show Buff Price Difference"
							tooltipText="Recalculates and replaces the original discount tag according to the item's Buff price in absolute units."
							icon={<IcOutlineDiscount className="h-6 w-6" />}
						/>
					</SettingsCard>
					<SettingsCard>
						<SettingsCheckbox
							id="shp-buffdifferencepercent"
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
						<SettingsCheckbox id="shp-listingage" text="Show Listing Age" icon={<IcRoundAccessTime className="h-6 w-6" />} disabled />
					</SettingsCard>
				</div>
			</div>
		</TabTemplate>
	);
};
