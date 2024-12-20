import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '~popup/ui/tooltip';

export const SettingsTooltip = ({
	text,
	children,
	open,
	className,
	side = 'top',
	asChild = false,
}: {
	text: string;
	children: React.ReactNode;
	open?: boolean;
	className?: string;
	side?: 'top' | 'right' | 'bottom' | 'left';
	asChild?: boolean;
}) => {
	return (
		<TooltipProvider delayDuration={300}>
			<Tooltip defaultOpen={open ?? false}>
				<TooltipTrigger asChild={asChild}>{children}</TooltipTrigger>
				<TooltipContent className={className} side={side}>
					<p>{text}</p>
				</TooltipContent>
			</Tooltip>
		</TooltipProvider>
	);
};
