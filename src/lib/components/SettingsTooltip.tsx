import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "./Shadcn";

export const SettingsTooltip = ({
    text,
    children,
    open,
    className,
}: {
    text: string;
    children: React.ReactNode;
    open?: boolean;
    className?: string;
}) => {
    return (
        <TooltipProvider delayDuration={300}>
            <Tooltip defaultOpen={open ?? false}>
                <TooltipTrigger>
                    {children}
                </TooltipTrigger>
                <TooltipContent className={className}>
                    <p>{text}</p>
                </TooltipContent>
            </Tooltip>
        </TooltipProvider>
    );
};