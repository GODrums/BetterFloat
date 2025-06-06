'use client';

import * as ScrollAreaPrimitive from '@radix-ui/react-scroll-area';
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
			<ScrollAreaPrimitive.Viewport className={cn('h-full w-full rounded-[inherit]', viewportClass)}>{children}</ScrollAreaPrimitive.Viewport>
			<ScrollBar orientation={orientation} hideScrollbar={hideScrollbar} />
			<ScrollAreaPrimitive.Corner />
			{fadeOut && <div className="absolute bottom-0 left-0 right-0 h-8 bg-gradient-to-t from-background/80 to-transparent pointer-events-none z-10" />}
		</ScrollAreaPrimitive.Root>
	)
);
ScrollArea.displayName = ScrollAreaPrimitive.Root.displayName;

const ScrollBar = React.forwardRef<
	React.ElementRef<typeof ScrollAreaPrimitive.ScrollAreaScrollbar>,
	React.ComponentPropsWithoutRef<typeof ScrollAreaPrimitive.ScrollAreaScrollbar> & { hideScrollbar?: boolean }
>(({ className, orientation = 'vertical', hideScrollbar = false, ...props }, ref) => (
	<ScrollAreaPrimitive.ScrollAreaScrollbar
		ref={ref}
		orientation={orientation}
		className={cn(
			'flex touch-none select-none transition-colors',
			orientation === 'vertical' && 'h-full w-2.5 border-l border-l-transparent p-[1px]',
			orientation === 'horizontal' && 'h-2.5 flex-col border-t border-t-transparent p-[1px]',
			className,
			hideScrollbar && 'hidden'
		)}
		{...props}
	>
		<ScrollAreaPrimitive.ScrollAreaThumb className="relative flex-1 rounded-full bg-border" />
	</ScrollAreaPrimitive.ScrollAreaScrollbar>
));
ScrollBar.displayName = ScrollAreaPrimitive.ScrollAreaScrollbar.displayName;

export { ScrollArea, ScrollBar };
