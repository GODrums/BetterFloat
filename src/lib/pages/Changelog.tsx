import { SettingsCard } from "~lib/components/SettingsCard";
import { ScrollArea, TabsContent } from "../components/Shadcn";

const SingleChangelog = ({ version, children }) => {
    return (
        <SettingsCard>
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
            <ScrollArea className="h-full w-full py-2 px-2 gap-2">
                <h3 className="text-lg font-bold leading-none tracking-tight uppercase text-center py-4">Changelog</h3>
                <SingleChangelog version="v2.0.0">
                    <li>Full rework with a new tech stack</li>
                    <li>Redesigned popup</li>
                    <li>Option to auto-hide the filter sidebar on Skinport via inline checkbox</li>
                </SingleChangelog>
            </ScrollArea>
        </TabsContent>
    );
};