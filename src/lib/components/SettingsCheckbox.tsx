import type { IconProps } from "@radix-ui/react-icons/dist/types";
import { type ReactElement, type SVGProps } from "react";
import { Checkbox, Label } from "./Shadcn";
import { useStorage } from "@plasmohq/storage/hook"
import { MaterialSymbolsHelpOutline } from "~lib/components/Icons";
import { SettingsTooltip } from "./SettingsTooltip";
import { cn, toast } from "~lib/utils";

type CheckboxProps = {
    id: string;
    text: string;
    icon?: ReactElement<IconProps>;
    tooltipText?: string;
    disabled?: boolean;
};


export function MaterialSymbolsDisabledByDefaultOutline(props: SVGProps<SVGSVGElement>) {
    return (
      <svg xmlns="http://www.w3.org/2000/svg" width="1em" height="1em" viewBox="0 0 24 24" {...props}><path fill="#888888" d="m8.4 17l3.6-3.6l3.6 3.6l1.4-1.4l-3.6-3.6L17 8.4L15.6 7L12 10.6L8.4 7L7 8.4l3.6 3.6L7 15.6zM5 21q-.825 0-1.412-.587T3 19V5q0-.825.588-1.412T5 3h14q.825 0 1.413.588T21 5v14q0 .825-.587 1.413T19 21zm0-2h14V5H5zM5 5v14z"></path></svg>
    )
  }

export const SettingsCheckbox = ({
    id,
    text,
    icon,
    tooltipText,
    disabled,
}: CheckboxProps) => {
    const [checked, setChecked] = useStorage(id);

    const labelClass = (text.length > 25 ? "max-w-32" : "max-w-40") + " text-balance leading-5";

    return (
        <div className={cn("flex justify-between items-center align-middle", disabled && "opacity-50 cursor-not-allowed")}>
            <div className="flex items-center gap-2">
                {icon}
                <Label htmlFor={id} className={labelClass}>{text}</Label>
                {disabled &&
                    <SettingsTooltip text="Currently disabled as this functionality doesn't exist anymore.">
                        <MaterialSymbolsDisabledByDefaultOutline className="h-5 w-5" />
                    </SettingsTooltip>
                }
                {tooltipText &&
                    <SettingsTooltip text={tooltipText}>
                        <MaterialSymbolsHelpOutline className="h-5 w-5" />
                    </SettingsTooltip>
                }
            </div>
            <Checkbox id={id} checked={checked} onCheckedChange={setChecked} onClick={() => {
                toast({
                    description: "Please refresh the website for changes to come into effect!",
                })
            }} disabled={disabled} />
        </div>
    );
};