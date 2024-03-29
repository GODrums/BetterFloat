import { Input, Label, Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "./Shadcn";
import { useStorage } from "@plasmohq/storage/hook"
import { MaterialSymbolsHelpOutline } from "~lib/components/Icons";
import { DISCORD_URL } from "~lib/util/globals";
import { z } from "zod";
import { useState } from "react";
import { cn } from "~lib/utils";

export const SettingsOCO = () => {
    const [value, setValue] = useStorage<string>("sp-ocoapikey", "");
    const [status, setStatus] = useState<"idle" | "success" | "error">("idle");

    const keyRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/;
    const keySchema = z.string().regex(keyRegex, "Invalid API key format");

    const handleChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        const value = event.target.value;
        
        if (value.length === 0) {
            setStatus("idle");
        } else {
            const parseResult = keySchema.safeParse(value);
            if (parseResult.success === false) {
                setStatus("error");
            } else {
                setStatus("success");
            }
            console.log(parseResult);
        }
        setValue(value);
    };

    return (
        <div className="flex justify-between items-center align-middle gap-4">
            <div className="flex items-center gap-2">
                <Label htmlFor="sp-ocoapikey" className="max-w-40 text-balance leading-5">OneClickBuy</Label>
                <TooltipProvider>
                    <Tooltip>
                        <TooltipTrigger>
                            <MaterialSymbolsHelpOutline className="h-5 w-5" />
                        </TooltipTrigger>
                        <TooltipContent>
                            <p>Enter your API-key for the OneClickBuy-feature. Leave empty to disable.
                                A valid key can be generated on the <a className="text-blue-600 cursor-pointer" onClick={() => window.open(DISCORD_URL)}>BetterFloat Discord server</a>.</p>
                        </TooltipContent>
                    </Tooltip>
                </TooltipProvider>
            </div>
            <Input type="text" placeholder="Your API key..." value={value} onChange={handleChange} className={cn(
                (status === "success" ? "focus:border-green-500" : (status === 'error' ? "focus:border-red-500" : "focus:border-slate-600")), 
                ''
            )} />
        </div>
    );
};