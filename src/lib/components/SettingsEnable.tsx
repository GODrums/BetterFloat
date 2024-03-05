import { EnableSwitch, Label } from "./Shadcn";
import { useStorage } from "@plasmohq/storage/hook"

export const SettingsEnable = ({
    id,
}: { id: string; }) => {
    const [checked, setChecked] = useStorage(id);

    return (
        <div className="flex justify-center items-center space-x-2 w-full mt-2">
            <EnableSwitch id={id} checked={checked} onCheckedChange={setChecked} />
            <Label htmlFor={id} className={checked ? "text-card-foreground" : "text-muted-foreground"}>Enabled</Label>
        </div>
    );
};