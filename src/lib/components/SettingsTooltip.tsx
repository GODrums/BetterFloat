import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "../shadcn";

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
        <TooltipProvider>
            <Tooltip open={open ?? false}>
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