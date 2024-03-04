import type { IconProps } from "@radix-ui/react-icons/dist/types";
import { type ReactElement } from "react";
import { Input, Label } from "./Shadcn";
import { useStorage } from "@plasmohq/storage/hook"
import { MaterialSymbolsHelpOutline } from "~lib/components/Icons";
import { SettingsTooltip } from "./SettingsTooltip";

type TextboxProps = {
    id: string;
    text: string;
    icon?: ReactElement<IconProps>;
    tooltipText?: string;
};

export const SettingsTextbox = ({
    id,
    text,
    icon,
    tooltipText
}: TextboxProps) => {
    const [value, setValue, {
        setRenderValue,
        setStoreValue,
        remove
    }] = useStorage(id, "");

    const labelClass = (text.length > 25 ? "max-w-32" : "max-w-40") + " text-balance leading-5";

    const handleChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        // replace string symbols
        let value = event.target.value;
        if (value.includes("\"")) {
            value = value.replace(/"/g, "");
        }
        console.log(value);
        setStoreValue(value);
    };

    return (
        <div className="flex justify-between items-center align-middle gap-4">
            <div className="flex items-center gap-2">
                {icon}
                <Label htmlFor={id} className={labelClass}>{text}</Label>
                {tooltipText &&
                    <SettingsTooltip text={tooltipText}>
                        <MaterialSymbolsHelpOutline className="h-5 w-5" />
                    </SettingsTooltip>
                }
            </div>
            <Input type="text" placeholder="Your API key..." value={value} onChange={handleChange} />
        </div>
    );
};