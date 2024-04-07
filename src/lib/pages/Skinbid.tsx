import { ScrollArea, TabsContent } from "../components/Shadcn";
import { SettingsCard } from "~lib/components/SettingsCard";
import { IcOutlineDiscount, IcRoundAccessTime, PhSticker, StreamlineDiscountPercentCoupon } from "~lib/components/Icons";
import { SettingsCheckbox } from "~lib/components/SettingsCheckbox";
import { SettingsSelect } from "~lib/components/SettingsSelect";
import { SettingsColorPicker } from "~lib/components/SettingsColorPicker";
import { SettingsEnable } from "~lib/components/SettingsEnable";
import { cn } from "~lib/utils";
import { useStorage } from "@plasmohq/storage/hook";

export const SkinbidSettings = () => {
    const [checked] = useStorage('skb-enable');
    
    return (
        <TabsContent value="skinbid" className={cn("h-[530px] w-[330px]", checked ? '' : "border-destructive/80")}>
            <ScrollArea className="h-full w-full py-2 px-2">
                <SettingsEnable id="skb-enable" />
                <div className="">
                    <div className="pt-4 pb-2">
                        <p className="text-base font-bold leading-none tracking-tight uppercase">Features</p>
                    </div>
                    <div className="flex flex-col gap-1">
                        <SettingsCard>
                            <SettingsCheckbox
                                id="skb-stickerprices" text="Sticker Prices" icon={<PhSticker className="h-6 w-6" />} />
                        </SettingsCard>
                    </div>
                </div>
                <div className="">
                    <div className="pt-4 pb-2">
                        <p className="text-base font-bold leading-none tracking-tight uppercase">Prices</p>
                    </div>
                    <div className="flex flex-col gap-1">
                        <SettingsCard>
                            <SettingsSelect id="skb-pricereference" text="Buff Price Reference" options={["Bid", "Ask"]} />
                        </SettingsCard>
                        <SettingsCard>
                            <SettingsCheckbox
                                id="skb-buffdifference" text="Show Buff Price Difference" tooltipText="Recalculates and replaces the original discount tag according to the item's Buff price in absolute units." icon={<IcOutlineDiscount className="h-6 w-6" />} />
                        </SettingsCard>
                        <SettingsCard>
                            <SettingsCheckbox
                                id="skb-buffdifferencepercent" text="Show Buff Price Percentage Difference" tooltipText="Requires 'Show Buff Price Difference' to be activated. Display the ratio of an item's price to the Buff price in percentage. Price equality equates to 100%." icon={<StreamlineDiscountPercentCoupon className="h-6 w-6" />} />
                        </SettingsCard>
                    </div>
                </div>
                <div className="mb-2">
                    <div className="pt-4 pb-2">
                        <p className="text-base font-bold leading-none tracking-tight uppercase">Listings</p>
                    </div>
                    <div className="flex flex-col gap-1">
                        <SettingsCard>
                            <SettingsCheckbox id="skb-listingage" text="Show Listing Age" icon={<IcRoundAccessTime className="h-6 w-6" />}/>
                        </SettingsCard>
                    </div>
                </div>
                <div className="mb-2">
                    <div className="pt-4 pb-2">
                        <p className="text-base font-bold leading-none tracking-tight uppercase">MISC</p>
                    </div>
                    <div className="flex flex-col gap-1">
                        <SettingsColorPicker prefix="skb" />
                    </div>
                </div>
            </ScrollArea>
        </TabsContent>
    );
};