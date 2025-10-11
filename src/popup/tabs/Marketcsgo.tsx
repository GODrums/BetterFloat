import { useStorage } from '@plasmohq/storage/hook';
import { ICON_CSBLUEGEM, ICON_MARKETCSGO_FULL } from '~lib/util/globals';
import { IcOutlineDiscount, IcRoundAccessTime, PhSticker, StreamlineDiscountPercentCoupon } from '~popup/components/Icons';
import { MarketLogoFull } from '~popup/components/MarketLogoFull';
import { SettingsCard } from '~popup/components/SettingsCard';
import { SettingsCheckbox } from '~popup/components/SettingsCheckbox';
import { SettingsEnable } from '~popup/components/SettingsEnable';
import { SettingsSource } from '~popup/components/SettingsSource';
import { Badge } from '~popup/ui/badge';
import { WarningCallout } from '~popup/ui/callout';
import { TabTemplate } from './TabTemplate';

interface MarketCSGOSettingsProps {
	hasProPlan: boolean;
}

export const MarketCSGOSettings = ({ hasProPlan }: MarketCSGOSettingsProps) => {
	const [checked] = useStorage<boolean>('mcsgo-enable');

	return (
		<TabTemplate value="marketcsgo" checked={checked}>
			{!hasProPlan && <WarningCallout text="Please upgrade to Pro to access MarketCSGO features" />}
			<MarketLogoFull
				icon={ICON_MARKETCSGO_FULL}
				link="https://market.csgo.com?utm_campaign=main&utm_source=BetterFloat&utm_medium=referral&cpid=caa655bb-8c34-4013-9427-1a5f842fc898&oid=4c69d079-ad2a-44b0-a9ac-d0afc2167ee7"
			/>
			<div className="flex items-center justify-center gap-2">
				<Badge variant="outline">BETA</Badge>
			</div>
			<SettingsEnable id="mcsgo-enable" isPremiumFeature hasProPlan={hasProPlan} />
			<div className="">
				<div className="pt-4 pb-2">
					<p className="text-base font-bold leading-none tracking-tight uppercase">Features</p>
				</div>
				<div className="flex flex-col gap-1">
					<SettingsCard>
						<SettingsCheckbox
							id="mcsgo-csbluegem"
							text="Blue Gem Enhancements"
							icon={<img className="h-6 w-6" src={ICON_CSBLUEGEM} alt="CSBlueGem Logo" />}
							tooltipText="Adds pattern details and past sales to case hardened skins."
							isNew
						/>
					</SettingsCard>
					<SettingsCard>
						<SettingsCheckbox id="mcsgo-stickerprices" text="Sticker Prices" icon={<PhSticker className="h-6 w-6" />} disabled />
					</SettingsCard>
				</div>
			</div>
			<div className="">
				<div className="pt-4 pb-2">
					<p className="text-base font-bold leading-none tracking-tight uppercase">Prices</p>
				</div>
				<div className="flex flex-col gap-1">
					<SettingsSource prefix="mcsgo" />
					<SettingsCard>
						<SettingsCheckbox
							id="mcsgo-buffdifference"
							text="Show Buff Price Difference"
							tooltipText="Recalculates and replaces the original discount tag according to the item's reference price in absolute units."
							icon={<IcOutlineDiscount className="h-6 w-6" />}
						/>
					</SettingsCard>
					<SettingsCard>
						<SettingsCheckbox
							id="mcsgo-buffdifferencepercent"
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
						<SettingsCheckbox id="mcsgo-listingage" text="Show Listing Age" icon={<IcRoundAccessTime className="h-6 w-6" />} disabled />
					</SettingsCard>
				</div>
			</div>
		</TabTemplate>
	);
};
