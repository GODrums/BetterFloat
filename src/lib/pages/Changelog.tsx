import { SettingsCard } from "~lib/components/SettingsCard";
import { ScrollArea, TabsContent } from "../components/Shadcn";

export const Changelogs = () => {
    return (
        <TabsContent value="changelog" className="h-[530px] w-[330px]">
            <ScrollArea className="h-full w-full py-2 px-2 gap-2">
                <h3 className="text-lg font-bold leading-none tracking-tight uppercase text-center py-4">Changelog</h3>
                <SettingsCard>
                    <p className="text-base font-medium">v2.0.0</p>
                    <ul className="list-disc list-inside text-sm text-muted-foreground">
                        <li>Full rework with a new tech stack</li>
                        <li>Redesigned popup</li>
                    </ul>
                </SettingsCard>
            </ScrollArea>
        </TabsContent>
    );
};