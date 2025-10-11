import { useStorage } from '@plasmohq/storage/hook';
import { ICON_TRADEIT_FULL } from '~lib/util/globals';
import { IcOutlineDiscount, StreamlineDiscountPercentCoupon } from '~popup/components/Icons';
import { MarketLogoFull } from '~popup/components/MarketLogoFull';
import { SettingsCard } from '~popup/components/SettingsCard';
import { SettingsCheckbox } from '~popup/components/SettingsCheckbox';
import { SettingsEnable } from '~popup/components/SettingsEnable';
import { SettingsSource } from '~popup/components/SettingsSource';
import { TabTemplate } from './TabTemplate';

export const TradeitSettings = () => {
	const [checked] = useStorage<boolean>('tradeit-enable');

	return (
		<TabTemplate value="tradeit" checked={checked}>
			<MarketLogoFull icon={ICON_TRADEIT_FULL} link="https://tradeit.gg?aff=betterfloat" />
			<SettingsEnable id="tradeit-enable" />
			<div className="">
				<div className="pt-4 pb-2">
					<p className="text-base font-bold leading-none tracking-tight uppercase">Prices</p>
				</div>
				<div className="flex flex-col gap-1">
					<SettingsSource prefix="tradeit" />
					<SettingsCard>
						<SettingsCheckbox
							id="tradeit-buffdifference"
							text="Show Price Difference"
							tooltipText="Recalculates and replaces the original discount tag according to the item's reference price in absolute units."
							icon={<IcOutlineDiscount className="h-6 w-6" />}
						/>
					</SettingsCard>
					<SettingsCard>
						<SettingsCheckbox
							id="tradeit-buffdifferencepercent"
							text="Show Price Percentage Difference"
							tooltipText="Requires 'Show Price Difference' to be activated. Display the ratio of an item's price to the reference price in percentage. Price equality equates to 100%."
							icon={<StreamlineDiscountPercentCoupon className="h-6 w-6" />}
						/>
					</SettingsCard>
				</div>
			</div>
		</TabTemplate>
	);
};
