import { useStorage } from '@plasmohq/storage/hook';
import { ICON_CSMONEY_FULL } from '~lib/util/globals';
import { IcOutlineDiscount, MaterialSymbolsUpdate, PhSticker, StreamlineDiscountPercentCoupon } from '~popup/components/Icons';
import { MarketLogoFull } from '~popup/components/MarketLogoFull';
import { SettingsCard } from '~popup/components/SettingsCard';
import { SettingsCheckbox } from '~popup/components/SettingsCheckbox';
import { SettingsEnable } from '~popup/components/SettingsEnable';
import { SettingsSource } from '~popup/components/SettingsSource';
import { TabTemplate } from './TabTemplate';

export const CSMoneySettings = () => {
	const [checked] = useStorage<boolean>('csm-enable');

	return (
		<TabTemplate value="csmoney" checked={checked}>
			<MarketLogoFull icon={ICON_CSMONEY_FULL} link="https://cs.money/market/buy/?utm_source=mediabuy&utm_medium=betterfloat&utm_campaign=regular&utm_content=link" />
			<SettingsEnable id="csm-enable" />
			<div className="">
				<div className="pt-4 pb-2">
					<p className="text-base font-bold leading-none tracking-tight uppercase">Features</p>
				</div>
				<div className="flex flex-col gap-1">
					<SettingsCard>
						<SettingsCheckbox id="csm-autorefresh" text="Auto-Refresh" icon={<MaterialSymbolsUpdate className="h-6 w-6" />} isNew />
					</SettingsCard>
					<SettingsCard>
						<SettingsCheckbox id="csm-stickerprices" text="Sticker Prices" icon={<PhSticker className="h-6 w-6" />} />
					</SettingsCard>
				</div>
			</div>
			<div className="">
				<div className="pt-4 pb-2">
					<p className="text-base font-bold leading-none tracking-tight uppercase">Prices</p>
				</div>
				<div className="flex flex-col gap-1">
					<SettingsSource prefix="csm" />
					<SettingsCard>
						<SettingsCheckbox
							id="csm-buffdifference"
							text="Show Buff Price Difference"
							tooltipText="Recalculates and replaces the original discount tag according to the item's Buff price in absolute units."
							icon={<IcOutlineDiscount className="h-6 w-6" />}
						/>
					</SettingsCard>
					<SettingsCard>
						<SettingsCheckbox
							id="csm-buffdifferencepercent"
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
