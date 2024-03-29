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