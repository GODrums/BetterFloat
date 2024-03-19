import { ScrollArea, TabsContent } from "../components/Shadcn";
import { SettingsCard } from "~lib/components/SettingsCard";
import { IcOutlineDiscount, IcRoundAccessTime, MaterialSymbolsAvgTimeOutlineRounded, MaterialSymbolsTabMoveRounded, MaterialSymbolsTravelExplore, MaterialSymbolsUpdate, PhSticker, StreamlineDiscountPercentCoupon, TablerCircleChevronUp } from "~lib/components/Icons";
import csbluegemLogo from "data-base64:~/../assets/csbluegem.svg"
import { SettingsCheckbox } from "~lib/components/SettingsCheckbox";
import { SettingsSelect } from "~lib/components/SettingsSelect";
import { SettingsColorPicker } from "~lib/components/SettingsColorPicker";
import { SettingsEnable } from "~lib/components/SettingsEnable";
import { useStorage } from "@plasmohq/storage/hook";
import { cn } from "~lib/utils";

export const CSFloatSettings = () => {
    const [checked] = useStorage('csf-enable');

    return (
        <TabsContent value="csfloat" className={cn("h-[530px] w-[330px]", checked ? '' : "border-destructive/80")}>
            <ScrollArea className="h-full w-full py-2 px-2">
                <SettingsEnable id="csf-enable" />
                <div className="">
                    <div className="pt-4 pb-2">
                        <p className="text-base font-semibold leading-none tracking-tight uppercase">Features</p>
                    </div>
                    <div className="flex flex-col gap-1">
                        <SettingsCard>
                            <SettingsCheckbox
                                id="csf-autorefresh" text="Auto-Refresh" icon={<MaterialSymbolsUpdate className="h-6 w-6" />} />
                        </SettingsCard>
                        <SettingsCard>
                            <SettingsCheckbox
                                id="csf-stickerprices" text="Sticker Prices" icon={<PhSticker className="h-6 w-6" />} />
                        </SettingsCard>
                        <SettingsCard>
                            <SettingsCheckbox
                                id="csf-csbluegem" text="CSBlueGem Integration" icon={<img className="h-6 w-6" src={csbluegemLogo} />} tooltipText="Adds pattern details and past sales to case hardened skins. Data powered by CSBlueGem.com." />
                        </SettingsCard>
                    </div>
                </div>
                <div className="">
                    <div className="pt-4 pb-2">
                        <p className="text-base font-bold leading-none tracking-tight uppercase">Prices</p>
                    </div>
                    <div className="flex flex-col gap-1">
                        <SettingsCard>
                            <SettingsSelect id="csf-pricereference" text="Buff Price Reference" options={["Bid", "Ask"]} />
                        </SettingsCard>
                        <SettingsCard>
                            <SettingsCheckbox
                                id="csf-floatappraiser" text="Show FloatAppraiser" icon={<MaterialSymbolsTravelExplore className="h-6 w-6" />} />
                        </SettingsCard>
                        <SettingsCard>
                            <SettingsCheckbox
                                id="csf-buffdifference" text="Show Buff Price Difference" tooltipText="Recalculates and replaces the original discount tag according to the item's Buff price in absolute units." icon={<IcOutlineDiscount className="h-6 w-6" />} />
                        </SettingsCard>
                        <SettingsCard>
                            <SettingsCheckbox
                                id="csf-buffdifferencepercent" text="Show Buff Price Percentage Difference" tooltipText="Requires 'Show Buff Price Difference' to be activated. Display the ratio of an item's price to the Buff price in percentage. Price equality equates to 100%." icon={<StreamlineDiscountPercentCoupon className="h-6 w-6" />} />
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
                                id="csf-listingage" text="Show Listing Age" icon={<IcRoundAccessTime className="h-6 w-6" />} />
                        </SettingsCard>
                    </div>
                </div>
                <div className="mb-2">
                    <div className="pt-4 pb-2">
                        <p className="text-base font-bold leading-none tracking-tight uppercase">MISC</p>
                    </div>
                    <div className="flex flex-col gap-1">
                        <SettingsCard>
                            <SettingsSelect id="csf-refreshinterval" text="Auto-Refresh Interval" options={["30s", "60s", "2min", "5min"]} icon={<MaterialSymbolsAvgTimeOutlineRounded className="h-6 w-6" />}/>
                        </SettingsCard>
                        <SettingsCard>
                            <SettingsCheckbox
                                id="csf-topbutton" text="Show 'Back to Top'-Button" icon={<TablerCircleChevronUp className="h-6 w-6" />} />
                        </SettingsCard>
                        <SettingsCard>
                            <SettingsCheckbox
                                id="csf-floatcoloring" text="Low/High Float Coloring" tooltipText="Low and high floats in respect to each condition will get colored. 0.000X and 0.999X floats get the most prominent coloring." />
                        </SettingsCard>
                        <SettingsCard>
                            <SettingsCheckbox
                                id="csf-removeclustering" text="Remove Preview Clustering" tooltipText="When enabled, this removes irrelevant data such as the seller's online status or the 'key'-symbol. Generally leads to a cleaner experience for experienced users and smaller item cards." />
                        </SettingsCard>
                        <SettingsColorPicker prefix="csf" />
                    </div>
                </div>
            </ScrollArea>
        </TabsContent>
    );
};