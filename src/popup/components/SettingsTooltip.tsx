import * as React from 'react';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '~popup/ui/tooltip';

export const SettingsTooltip = ({
	text,
	children,
	open,
	className,
	side = 'top',
}: {
	text: string;
	children: React.ReactNode;
	open?: boolean;
	className?: string;
	side?: 'top' | 'right' | 'bottom' | 'left';
}) => {
	return (
		<TooltipProvider delay={300}>
			<Tooltip defaultOpen={open ?? false}>
				{React.isValidElement(children) ? <TooltipTrigger render={children} /> : <TooltipTrigger>{children}</TooltipTrigger>}
				<TooltipContent className={className} side={side}>
					<p>{text}</p>
				</TooltipContent>
			</Tooltip>
		</TooltipProvider>
	);
};
