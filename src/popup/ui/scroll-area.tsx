'use client';

import { ScrollArea as ScrollAreaPrimitive } from '@base-ui/react/scroll-area';
import * as React from 'react';
import { cn } from '~lib/utils';

type ScrollAreaProps = React.ComponentPropsWithoutRef<typeof ScrollAreaPrimitive.Root> & {
	viewportClass?: string;
	orientation?: 'vertical' | 'horizontal';
	hideScrollbar?: boolean;
	fadeOut?: boolean;
};

const ScrollArea = React.forwardRef<React.ElementRef<typeof ScrollAreaPrimitive.Root>, ScrollAreaProps>(
	({ className, children, viewportClass, orientation, hideScrollbar = false, fadeOut = false, ...props }, ref) => (
		<ScrollAreaPrimitive.Root ref={ref} className={cn('relative overflow-hidden', className)} {...props}>
			<ScrollAreaPrimitive.Viewport className={cn('h-full w-full rounded-[inherit]', viewportClass)}>
				<ScrollAreaPrimitive.Content>{children}</ScrollAreaPrimitive.Content>
			</ScrollAreaPrimitive.Viewport>
			<ScrollBar orientation={orientation} hideScrollbar={hideScrollbar} />
			<ScrollAreaPrimitive.Corner />
			{fadeOut && <div className="absolute bottom-0 left-0 right-0 h-8 bg-linear-to-t from-background/80 to-transparent pointer-events-none z-10" />}
		</ScrollAreaPrimitive.Root>
	)
);
ScrollArea.displayName = ScrollAreaPrimitive.Root.displayName;

const ScrollBar = React.forwardRef<React.ElementRef<typeof ScrollAreaPrimitive.Scrollbar>, React.ComponentPropsWithoutRef<typeof ScrollAreaPrimitive.Scrollbar> & { hideScrollbar?: boolean }>(
	({ className, orientation = 'vertical', hideScrollbar = false, ...props }, ref) => (
		<ScrollAreaPrimitive.Scrollbar
			ref={ref}
			orientation={orientation}
			className={cn(
				'flex touch-none select-none transition-colors',
				orientation === 'vertical' && 'h-full w-2.5 border-l border-l-transparent p-px',
				orientation === 'horizontal' && 'h-2.5 flex-col border-t border-t-transparent p-px',
				className,
				hideScrollbar && 'hidden'
			)}
			{...props}
		>
			<ScrollAreaPrimitive.Thumb className="relative flex-1 rounded-full bg-border" />
		</ScrollAreaPrimitive.Scrollbar>
	)
);
ScrollBar.displayName = 'ScrollBar';

export { ScrollArea, ScrollBar };
