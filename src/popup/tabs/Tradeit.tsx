import { useStorage } from '@plasmohq/storage/hook';
import { ICON_TRADEIT_FULL } from '~lib/util/globals';
import { IcOutlineDiscount, MaterialSymbolsUpdate, PhSticker, StreamlineDiscountPercentCoupon } from '~popup/components/Icons';
import { MarketLogoFull } from '~popup/components/MarketLogoFull';
import { SettingsCard } from '~popup/components/SettingsCard';
import { SettingsCheckbox } from '~popup/components/SettingsCheckbox';
import { SettingsEnable } from '~popup/components/SettingsEnable';
import { SettingsSource } from '~popup/components/SettingsSource';
import { Badge } from '~popup/ui/badge';
// import { WarningCallout } from '~popup/ui/callout';
import { TabTemplate } from './TabTemplate';

interface TradeitSettingsProps {
	hasProPlan: boolean;
}

export const TradeitSettings = ({ hasProPlan }: TradeitSettingsProps) => {
	const [checked] = useStorage<boolean>('tradeit-enable');

	return (
		<TabTemplate value="tradeit" checked={checked}>
			{/* {!hasProPlan && <WarningCallout text="Please upgrade to Pro to access TradeIt features" />} */}
			<MarketLogoFull icon={ICON_TRADEIT_FULL} link="https://tradeit.gg?aff=betterfloat" />
			<div className="flex items-center justify-center gap-2 mt-1">
				<Badge variant="outline">Temporarily Free</Badge>
			</div>
			<SettingsEnable id="tradeit-enable" /> {/* hasProPlan={hasProPlan} isPremiumFeature */}
			<div className="">
				<div className="pt-4 pb-2">
					<p className="text-base font-bold leading-none tracking-tight uppercase">Features</p>
				</div>
				<div className="flex flex-col gap-1">
					<SettingsCard>
						<SettingsCheckbox id="tradeit-autorefresh" text="Auto-Refresh" icon={<MaterialSymbolsUpdate className="h-6 w-6" />} disabled />
					</SettingsCard>
					<SettingsCard>
						<SettingsCheckbox id="tradeit-stickerprices" text="Sticker Prices" icon={<PhSticker className="h-6 w-6" />} disabled />
					</SettingsCard>
				</div>
			</div>
			<div className="">
				<div className="pt-4 pb-2">
					<p className="text-base font-bold leading-none tracking-tight uppercase">Prices</p>
				</div>
				<div className="flex flex-col gap-1">
					<SettingsSource prefix="tradeit" />
					<SettingsCard>
						<SettingsCheckbox
							id="tradeit-buffdifference"
							text="Show Buff Price Difference"
							tooltipText="Recalculates and replaces the original discount tag according to the item's Buff price in absolute units."
							icon={<IcOutlineDiscount className="h-6 w-6" />}
						/>
					</SettingsCard>
					<SettingsCard>
						<SettingsCheckbox
							id="tradeit-buffdifferencepercent"
							text="Show Buff Price Percentage Difference"
							tooltipText="Requires 'Show Buff Price Difference' to be activated. Display the ratio of an item's price to the Buff price in percentage. Price equality equates to 100%."
							icon={<StreamlineDiscountPercentCoupon className="h-6 w-6" />}
						/>
					</SettingsCard>
				</div>
			</div>
		</TabTemplate>
	);
};
