import { useStorage } from '@plasmohq/storage/hook';
import { ICON_LISSKINS_FULL } from '~lib/util/globals';
import { IcOutlineDiscount, IcRoundAccessTime, MaterialSymbolsUpdate, MdiShoppingSearchOutline, PhSticker, StreamlineDiscountPercentCoupon } from '~popup/components/Icons';
import { MarketLogoFull } from '~popup/components/MarketLogoFull';
import { SettingsCard } from '~popup/components/SettingsCard';
import { SettingsCheckbox } from '~popup/components/SettingsCheckbox';
import { SettingsEnable } from '~popup/components/SettingsEnable';
import { SettingsSource } from '~popup/components/SettingsSource';
import { WarningCallout } from '~popup/ui/callout';
import { TabTemplate } from './TabTemplate';

interface LisSkinsSettingsProps {
	hasProPlan: boolean;
}

export const LisSkinsSettings = ({ hasProPlan }: LisSkinsSettingsProps) => {
	const [checked] = useStorage<boolean>('lis-enable');

	return (
		<TabTemplate value="lisskins" checked={checked}>
			{!hasProPlan && <WarningCallout text="Please upgrade to Pro to access Lisskins features" />}
			<MarketLogoFull icon={ICON_LISSKINS_FULL} link="https://lisskins.com?rf=130498354" />
			<SettingsEnable id="lis-enable" hasProPlan={hasProPlan} isPremiumFeature />
			<div className="">
				<div className="pt-4 pb-2">
					<p className="text-base font-bold leading-none tracking-tight uppercase">Features</p>
				</div>
				<div className="flex flex-col gap-1">
					<SettingsCard>
						<SettingsCheckbox id="lis-autorefresh" text="Auto-Refresh" icon={<MaterialSymbolsUpdate className="h-6 w-6" />} isNew />
					</SettingsCard>
					<SettingsCard>
						<SettingsCheckbox id="lis-stickerprices" text="Sticker Prices" icon={<PhSticker className="h-6 w-6" />} />
					</SettingsCard>
					<SettingsCard>
						<SettingsCheckbox id="lis-marketcomparison" text="Market Comparison" icon={<MdiShoppingSearchOutline className="h-6 w-6 text-[#888888]" />} isNew />
					</SettingsCard>
				</div>
			</div>
			<div className="">
				<div className="pt-4 pb-2">
					<p className="text-base font-bold leading-none tracking-tight uppercase">Prices</p>
				</div>
				<div className="flex flex-col gap-1">
					<SettingsSource prefix="lis" />
					<SettingsCard>
						<SettingsCheckbox
							id="lis-buffdifference"
							text="Show Buff Price Difference"
							tooltipText="Recalculates and replaces the original discount tag according to the item's reference price in absolute units."
							icon={<IcOutlineDiscount className="h-6 w-6" />}
						/>
					</SettingsCard>
					<SettingsCard>
						<SettingsCheckbox
							id="lis-buffdifferencepercent"
							text="Show Price Difference"
							tooltipText="Requires 'Show Buff Price Difference' to be activated. Display the ratio of an item's price to the reference price in percentage. Price equality equates to 100%."
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
						<SettingsCheckbox id="lis-listingage" text="Show Listing Age" icon={<IcRoundAccessTime className="h-6 w-6" />} disabled />
					</SettingsCard>
				</div>
			</div>
		</TabTemplate>
	);
};
