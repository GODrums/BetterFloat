import { useStorage } from '@plasmohq/storage/hook';
import {
	IcOutlineDiscount,
	IcRoundAccessTime,
	MaterialSymbolsAvgTimeOutlineRounded,
	MaterialSymbolsImageOutlineRounded,
	MaterialSymbolsTravelExplore,
	MaterialSymbolsUpdate,
	MdiSteam,
	PhSticker,
	StreamlineDiscountPercentCoupon,
	TablerCircleChevronUp,
} from '~popup/components/Icons';
import { SettingsCard } from '~popup/components/SettingsCard';
import { SettingsCheckbox } from '~popup/components/SettingsCheckbox';
import { SettingsColorPicker } from '~popup/components/SettingsColorPicker';
import { SettingsEnable } from '~popup/components/SettingsEnable';
import { SettingsSelect } from '~popup/components/SettingsSelect';
import { SettingsSource } from '~popup/components/SettingsSource';
import { TabTemplate } from './TabTemplate';
import { ICON_CSBLUEGEM, ICON_CSFLOAT_FULL } from '~lib/util/globals';
import { MarketLogoFull } from '~popup/components/MarketLogoFull';

export const CSFloatSettings = () => {
	const [checked] = useStorage<boolean>('csf-enable');

	return (
		<TabTemplate value="csfloat" checked={checked}>
			<MarketLogoFull icon={ICON_CSFLOAT_FULL} />
			<SettingsEnable id="csf-enable" />
			<div className="">
				<div className="pt-4 pb-2">
					<p className="text-base font-semibold leading-none tracking-tight uppercase">Features</p>
				</div>
				<div className="flex flex-col gap-1">
					<SettingsCard>
						<SettingsCheckbox id="csf-autorefresh" text="Auto-Refresh" icon={<MaterialSymbolsUpdate className="h-6 w-6" />} />
					</SettingsCard>
					<SettingsCard>
						<SettingsCheckbox id="csf-stickerprices" text="Sticker Prices" icon={<PhSticker className="h-6 w-6" />} />
					</SettingsCard>
					<SettingsCard>
						<SettingsCheckbox
							id="csf-csbluegem"
							text="CSBlueGem Integration"
							icon={<img className="h-6 w-6" src={ICON_CSBLUEGEM} />}
							tooltipText="Adds pattern details and past sales to case hardened skins. Data powered by CSBlueGem.com."
						/>
					</SettingsCard>
				</div>
			</div>
			<div className="">
				<div className="pt-4 pb-2">
					<p className="text-base font-bold leading-none tracking-tight uppercase">Prices</p>
				</div>
				<div className="flex flex-col gap-1">
					<SettingsSource prefix="csf" />
					<SettingsCard>
						<SettingsCheckbox id="csf-steamlink" text="Link to Steam Market Page" icon={<MdiSteam className="h-6 w-6" />} />
					</SettingsCard>
					<SettingsCard>
						<SettingsCheckbox id="csf-floatappraiser" text="Show FloatAppraiser" icon={<MaterialSymbolsTravelExplore className="h-6 w-6" />} disabled={true} />
					</SettingsCard>
					<SettingsCard>
						<SettingsCheckbox
							id="csf-buffdifference"
							text="Show Price Difference"
							tooltipText="Recalculates and replaces the original discount tag according to the item's market price in absolute units."
							icon={<IcOutlineDiscount className="h-6 w-6" />}
						/>
					</SettingsCard>
					<SettingsCard>
						<SettingsCheckbox
							id="csf-buffdifferencepercent"
							text="Show Price Percentage Difference"
							tooltipText="Requires 'Show Buff Price Difference' to be activated. Display the ratio of an item's price to the market price in percentage. Price equality equates to 100%."
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
						<SettingsCheckbox
							id="csf-showingamess"
							text="Show In-Game Pictures"
							icon={<MaterialSymbolsImageOutlineRounded className="h-6 w-6" />}
							tooltipText="Show in-game screenshots instead of the default preview image. Be careful: this uses a lot of additional bandwith and memory. If your site loads slowly, keep this option turned off."
							isNew
						/>
					</SettingsCard>
					<SettingsCard>
						<SettingsCheckbox id="csf-listingage" text="Show Listing Age" icon={<IcRoundAccessTime className="h-6 w-6" />} />
					</SettingsCard>
					<SettingsCard>
						<SettingsCheckbox
							id="csf-floatcoloring"
							text="Low/High Float Coloring"
							tooltipText="Low and high floats in respect to each condition will get colored. 0.000X and 0.999X floats get the most prominent coloring."
						/>
					</SettingsCard>
					<SettingsCard>
						<SettingsCheckbox id="csf-showbargainprice" text="Show Minimum Bargain Price" />
					</SettingsCard>
					<SettingsCard>
						<SettingsCheckbox
							id="csf-removeclustering"
							text="Remove Preview Clustering"
							tooltipText="When enabled, this removes irrelevant data such as the seller's online status or the 'key'-symbol. Generally leads to a cleaner experience for experienced users and smaller item cards."
						/>
					</SettingsCard>
				</div>
			</div>
			<div className="mb-2">
				<div className="pt-4 pb-2">
					<p className="text-base font-bold leading-none tracking-tight uppercase">MISC</p>
				</div>
				<div className="flex flex-col gap-1">
					<SettingsCard>
						<SettingsSelect
							id="csf-refreshinterval"
							text="Auto-Refresh Interval"
							options={['30s', '60s', '2min', '5min']}
							icon={<MaterialSymbolsAvgTimeOutlineRounded className="h-6 w-6" />}
						/>
					</SettingsCard>
					<SettingsCard>
						<SettingsCheckbox id="csf-topbutton" text="Show 'Back to Top'-Button" icon={<TablerCircleChevronUp className="h-6 w-6" />} />
					</SettingsCard>
					<SettingsCard>
						<SettingsCheckbox
							id="csf-quickmenu"
							isNew
							text="Show Quick Menu"
							tooltipText="Shows a menu for quick access in the top toolbar. Contains similar elements to the menu accessible through a click on the user avatar."
						/>
					</SettingsCard>
					<SettingsCard>
						<SettingsCheckbox id="csf-themetoggle" isNew text="Show Theme Toggle" />
					</SettingsCard>
					<SettingsColorPicker prefix="csf" />
				</div>
			</div>
		</TabTemplate>
	);
};
