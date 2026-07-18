'use client';

import { Popover as PopoverPrimitive } from '@base-ui/react/popover';
import * as React from 'react';
import { cn } from '~lib/utils';

const Popover = PopoverPrimitive.Root;
const PopoverTrigger = PopoverPrimitive.Trigger;
const PopoverClose = PopoverPrimitive.Close;

const PopoverAnchor = ({ children }: { children: React.ReactNode }) => <>{children}</>;

interface PopoverProps extends React.ComponentPropsWithoutRef<typeof PopoverPrimitive.Popup>, Pick<PopoverPrimitive.Positioner.Props, 'align' | 'alignOffset' | 'side' | 'sideOffset'> {
	portal?: HTMLElement;
}

const PopoverContent = React.forwardRef<React.ElementRef<typeof PopoverPrimitive.Popup>, PopoverProps>(
	({ className, align = 'center', alignOffset, side, sideOffset = 4, portal = document.body, ...props }, ref) => (
		<PopoverPrimitive.Portal container={portal}>
			<PopoverPrimitive.Positioner align={align} alignOffset={alignOffset} side={side} sideOffset={sideOffset} className="isolate z-50">
				<PopoverPrimitive.Popup
					ref={ref}
					className={cn(
						'z-50 w-72 rounded-md border border-border bg-popover p-4 text-popover-foreground shadow-md outline-hidden transition-[opacity,transform] data-starting-style:opacity-0 data-ending-style:opacity-0 data-starting-style:scale-95 data-ending-style:scale-95',
						className
					)}
					{...props}
				/>
			</PopoverPrimitive.Positioner>
		</PopoverPrimitive.Portal>
	)
);
PopoverContent.displayName = 'PopoverContent';

const PopoverColorPicker = React.forwardRef<React.ElementRef<typeof PopoverPrimitive.Popup>, PopoverProps>(
	({ className, align = 'center', alignOffset, side, sideOffset = 4, portal = document.body, ...props }, ref) => (
		<PopoverPrimitive.Portal container={portal}>
			<PopoverPrimitive.Positioner align={align} alignOffset={alignOffset} side={side} sideOffset={sideOffset} className="isolate z-50">
				<PopoverPrimitive.Popup
					ref={ref}
					className={cn(
						'z-50 rounded-lg bg-black p-2 border border-stone-800 outline-hidden transition-[opacity,transform] data-starting-style:opacity-0 data-ending-style:opacity-0 data-starting-style:scale-95 data-ending-style:scale-95',
						className
					)}
					{...props}
				/>
			</PopoverPrimitive.Positioner>
		</PopoverPrimitive.Portal>
	)
);
PopoverColorPicker.displayName = 'PopoverColorPicker';

export { Popover, PopoverAnchor, PopoverClose, PopoverColorPicker, PopoverContent, PopoverTrigger };
