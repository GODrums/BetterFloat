import { Input, Label, Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "../shadcn";
import { useStorage } from "@plasmohq/storage/hook"
import { MaterialSymbolsHelpOutline } from "~lib/icons";
import { DISCORD_URL } from "~lib/util/globals";
import { z } from "zod";

export const SettingsOCO = () => {
    const [value, setValue, {
        setRenderValue,
        setStoreValue,
        remove
    }] = useStorage("sp-ocoapikey", "");

    const keySchema = z.string().regex(/^[a-zA-Z0-9]{36}$/, "Invalid API key format");

    const handleChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        // replace string symbols
        let value = event.target.value;
        if (value.includes("\"")) {
            value = value.replace(/"/g, "");
        }
        const parseResult = keySchema.safeParse(value);
        if (parseResult.success === false) {
            console.warn('Invalid API key format: ' + parseResult.error.message);
            return;
        }
        console.log(value);
        setStoreValue(value);
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
            <Input type="text" placeholder="Your API key..." value={value} onChange={handleChange} />
        </div>
    );
};