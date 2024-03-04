import type { IconProps } from "@radix-ui/react-icons/dist/types";
import { type ReactElement } from "react";
import { Checkbox, Label } from "./Shadcn";
import { useStorage } from "@plasmohq/storage/hook"
import { MaterialSymbolsHelpOutline } from "~lib/components/Icons";
import { SettingsTooltip } from "./SettingsTooltip";

type CheckboxProps = {
    id: string;
    text: string;
    icon?: ReactElement<IconProps>;
    tooltipText?: string;
};

export const SettingsCheckbox = ({
    id,
    text,
    icon,
    tooltipText
}: CheckboxProps) => {
    const [checked, setChecked] = useStorage(id);

    const labelClass = (text.length > 25 ? "max-w-32" : "max-w-40") + " text-balance leading-5";

    return (
        <div className="flex justify-between items-center align-middle">
            <div className="flex items-center gap-2">
                {icon}
                <Label htmlFor={id} className={labelClass}>{text}</Label>
                {tooltipText &&
                    <SettingsTooltip text={tooltipText}>
                        <MaterialSymbolsHelpOutline className="h-5 w-5" />
                    </SettingsTooltip>
                }
            </div>
            <Checkbox id={id} checked={checked} onCheckedChange={setChecked} />
        </div>
    );
};