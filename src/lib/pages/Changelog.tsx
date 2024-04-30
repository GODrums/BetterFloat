import { SettingsCard } from "~lib/components/SettingsCard";
import { ScrollArea, TabsContent } from "../components/Shadcn";

const SingleChangelog = ({ version, children }) => {
    return (
        <SettingsCard className="mb-4">
            <p className="text-base font-medium">{version}</p>
            <ul className="list-disc list-outside text-sm text-muted-foreground ml-5">
                {children}
            </ul>
        </SettingsCard>
    );
}

export const Changelogs = () => {
    return (
        <TabsContent value="changelog" className="h-[530px] w-[330px]">
            <ScrollArea className="h-full w-full py-2 px-2">
                <h3 className="text-lg font-bold leading-none tracking-tight uppercase text-center py-4">Changelog</h3>
                <SingleChangelog version="v2.4.0">
                    <li>Skinport - Sold items now still display their original price as well as additional available information.</li>
                    <li>Disabled the OCO option for Firefox users. Added additional key validation for Chrome users.</li>
                </SingleChangelog>
                <SingleChangelog version="v2.3.2">
                    <li>Provide default currency rates in case the API in unavailable for now.</li>
                    <li>Skinport - Fixed a case where Doppler Poison Frog stickers crashed the Buff calculation.</li>
                </SingleChangelog>
                <SingleChangelog version="v2.3.1">
                    <li>Skinport - The absolute and percentage price difference settings can now be used independently from each other. If both are activated, they now are seperated by a line break.</li>
                    <li>Skinport - Total Buff prices for the listed and Skinport inventory items</li>
                    <li>CSFloat - Made the csbluegem indicator overall smaller and removed it completely for non-knives</li>
                </SingleChangelog>
                <SingleChangelog version="v2.3.0">
                    <li>Skinport - New Buff Prices popup on item pages with advanced Buff details</li>
                    <li>Skinport - Item previews now display the pattern index</li>
                </SingleChangelog>
                <SingleChangelog version="v2.2.3">
                    <li>Skinbid - New feature: Buff difference percentage</li>
                    <li>Skinbid - Buff differences for various different prices and elements, such as individual bids</li>
                    <li>Skinbid - New 'Inspect in browser' button on item pages</li>
                </SingleChangelog>
                <SingleChangelog version="v2.2.1">
                    <li>Reworked Buff ID mapping for better performance</li>
                    <li>Skinport - LIVE-filter now has a button to reset it to defaults (no filtering)</li>
                    <li>CSFloat - Setting to add a link to the Steam markt page. Steam icon will be placed at the bottom of an item's card.</li>
                </SingleChangelog>
                <SingleChangelog version="v2.2.0">
                    <li>CSFloat - New 'Hide Side Menu'-button</li>
                    <li>CSFloat - Added Steam profile links to incoming offers</li>
                    <li>Fixed a bug where the 0.45-0.5 float range for BS skins has not been highlighted by the float coloring setting.</li>
                </SingleChangelog>
                <SingleChangelog version="v2.1.3">
                    <li>Reintroduction of the auto-refresh feature on CSFloat with redesigned and simplified UI.</li>
                    <li>Fix of BetterFloat's enhancements on CSF's offers page.</li>
                </SingleChangelog>
                <SingleChangelog version="v2.1.0">
                    <li>Reworked CSFloat integration, adapted it to the new design and adjusted some settings accordingly.</li>
                    <li>CSFloat's bargain popup now also enhanced by BetterFloat. Including Buff prices & %SP for both the minimum bid as well as your custom bid.</li>
                </SingleChangelog>
                <SingleChangelog version="v2.0.6">
                    <li>Reworked Skinport's LIVE-filter and fixed some of its bugs</li>
                </SingleChangelog>
                <SingleChangelog version="v2.0.0">
                    <li>Full rework with a new tech stack</li>
                    <li>Redesigned popup</li>
                    <li>Option to auto-hide the filter sidebar on Skinport via inline checkbox</li>
                </SingleChangelog>
            </ScrollArea>
        </TabsContent>
    );
};