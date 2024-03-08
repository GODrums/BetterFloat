import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "./Shadcn";

export const SettingsTooltip = ({
    text,
    children,
    open
}: {
    text: string;
    children: React.ReactNode;
    open?: boolean;
}) => {
    return (
        <TooltipProvider delayDuration={300}>
            <Tooltip defaultOpen={open ?? false}>
                <TooltipTrigger>
                    {children}
                </TooltipTrigger>
                <TooltipContent>
                    <p>{text}</p>
                </TooltipContent>
            </Tooltip>
        </TooltipProvider>
    );
};