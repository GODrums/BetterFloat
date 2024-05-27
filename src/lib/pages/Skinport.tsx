import csbluegemLogo from 'data-base64:~/../assets/csbluegem.svg';
import { useStorage } from '@plasmohq/storage/hook';
import { IcOutlineDiscount, MdiSteam, PhSticker, StreamlineDiscountPercentCoupon } from '~lib/components/Icons';
import { SettingsCard } from '~lib/components/SettingsCard';
import { SettingsCheckbox } from '~lib/components/SettingsCheckbox';
import { SettingsColorPicker } from '~lib/components/SettingsColorPicker';
import { SettingsEnable } from '~lib/components/SettingsEnable';
import { SettingsOCO } from '~lib/components/SettingsOCO';
import { SettingsSelect } from '~lib/components/SettingsSelect';
import { cn } from '~lib/utils';
import { ScrollArea, TabsContent } from '../components/Shadcn';
import { SettingsSource } from '~lib/components/SettingsSource';

export const SkinportSettings = () => {
	const [checked] = useStorage('sp-enable');

	return (
		<TabsContent value="skinport" className={cn('h-[530px] w-[330px]', checked ? '' : 'border-destructive/80')}>
			<ScrollArea className="h-full w-full py-2 px-2">
				<SettingsEnable id="sp-enable" />
				<div className="">
					<div className="pt-4 pb-2">
						<p className="text-base font-bold leading-none tracking-tight uppercase">Features</p>
					</div>
					<div className="flex flex-col gap-1">
						<SettingsCard>
							<SettingsCheckbox id="sp-stickerprices" text="Sticker Prices" icon={<PhSticker className="h-6 w-6" />} />
						</SettingsCard>
						<SettingsCard>
							<SettingsCheckbox
								id="sp-csbluegem"
								text="CSBlueGem Integration"
								icon={<img className="h-6 w-6" src={csbluegemLogo} alt="CSBlueGem Logo" />}
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
						<SettingsSource prefix="sp" />
						<SettingsCard>
							<SettingsSelect id="sp-currencyrates" text="Currency Conversion" options={['Real', 'Skinport']} />
						</SettingsCard>
						<SettingsCard>
							<SettingsCheckbox id="sp-steamprices" text="Show Steam Prices" icon={<MdiSteam className="h-6 w-6" />} />
						</SettingsCard>
						<SettingsCard>
							<SettingsCheckbox
								id="sp-buffdifference"
								text="Show Buff Price Difference"
								tooltipText="Recalculates and replaces the original discount tag according to the item's Buff price in absolute units."
								icon={<IcOutlineDiscount className="h-6 w-6" />}
							/>
						</SettingsCard>
						<SettingsCard>
							<SettingsCheckbox
								id="sp-buffdifferencepercent"
								text="Show Buff Price Percentage Difference"
								tooltipText="Display the ratio of an item's price to the Buff price in percentage. Price equality equates to 100%."
								icon={<StreamlineDiscountPercentCoupon className="h-6 w-6" />}
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
							<SettingsOCO /> {/* TODO: Input validation */}
						</SettingsCard>
						<SettingsCard>
							<SettingsSelect
								id="sp-bufflink"
								text="Buff Link Position"
								options={['Action Button', 'Text Link']}
								tooltipText="Define the placement of the Buff link. Per default it is located in the action bar. Alternatively you it can be placed as on-click for the buff prices."
							/>
						</SettingsCard>
						<SettingsCard>
							<SettingsCheckbox
								id="sp-floatcoloring"
								text="Low/High Float Coloring"
								tooltipText="Low and high floats in respect to each condition will get colored. 0.000X and 0.999X floats get the most prominent coloring."
							/>
						</SettingsCard>
						<SettingsCard>
							<SettingsCheckbox id="sp-autoclosepopup" text="Auto-Close Popup" tooltipText="Automatically closes the 'items in cart have been sold'-popup after 5 seconds." />
						</SettingsCard>
						<SettingsColorPicker prefix="sp" />
					</div>
				</div>
			</ScrollArea>
		</TabsContent>
	);
};
