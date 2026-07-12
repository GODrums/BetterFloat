'use client';

import { Select as SelectPrimitive } from '@base-ui/react/select';
import { Check, ChevronDown, ChevronsUpDown, ChevronUp } from 'lucide-react';
import * as React from 'react';
import { cn } from '~lib/utils';

const Select = SelectPrimitive.Root;
const SelectGroup = SelectPrimitive.Group;
const SelectValue = SelectPrimitive.Value;

const SelectTrigger = React.forwardRef<React.ElementRef<typeof SelectPrimitive.Trigger>, React.ComponentPropsWithoutRef<typeof SelectPrimitive.Trigger>>(({ className, children, ...props }, ref) => (
	<SelectPrimitive.Trigger
		ref={ref}
		className={cn(
			'group flex h-9 w-full items-center justify-between whitespace-nowrap rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-xs ring-offset-background transition-all placeholder:text-muted-foreground hover:bg-accent/50 focus:outline-hidden focus:ring-1 focus:ring-neutral-600 data-popup-open:ring-1 data-popup-open:ring-neutral-600 disabled:cursor-not-allowed disabled:opacity-50 [&>span]:line-clamp-1',
			className
		)}
		{...props}
	>
		{children}
		<SelectPrimitive.Icon render={<ChevronsUpDown className="h-4 w-4 opacity-50 ml-1 transition-transform duration-200 group-data-popup-open:rotate-180" />} />
	</SelectPrimitive.Trigger>
));
SelectTrigger.displayName = 'SelectTrigger';

const SelectScrollUpButton = React.forwardRef<React.ElementRef<typeof SelectPrimitive.ScrollUpArrow>, React.ComponentPropsWithoutRef<typeof SelectPrimitive.ScrollUpArrow>>(
	({ className, ...props }, ref) => (
		<SelectPrimitive.ScrollUpArrow ref={ref} className={cn('top-0 flex w-full cursor-default items-center justify-center py-1', className)} {...props}>
			<ChevronUp />
		</SelectPrimitive.ScrollUpArrow>
	)
);
SelectScrollUpButton.displayName = 'SelectScrollUpButton';

const SelectScrollDownButton = React.forwardRef<React.ElementRef<typeof SelectPrimitive.ScrollDownArrow>, React.ComponentPropsWithoutRef<typeof SelectPrimitive.ScrollDownArrow>>(
	({ className, ...props }, ref) => (
		<SelectPrimitive.ScrollDownArrow ref={ref} className={cn('bottom-0 flex w-full cursor-default items-center justify-center py-1', className)} {...props}>
			<ChevronDown />
		</SelectPrimitive.ScrollDownArrow>
	)
);
SelectScrollDownButton.displayName = 'SelectScrollDownButton';

type SelectContentProps = SelectPrimitive.Popup.Props & Pick<SelectPrimitive.Positioner.Props, 'align' | 'alignOffset' | 'side' | 'sideOffset' | 'alignItemWithTrigger'>;

const SelectContent = React.forwardRef<React.ElementRef<typeof SelectPrimitive.Popup>, SelectContentProps>(
	({ className, children, side = 'bottom', sideOffset = 4, align = 'center', alignOffset = 0, alignItemWithTrigger = false, ...props }, ref) => (
		<SelectPrimitive.Portal>
			<SelectPrimitive.Positioner side={side} sideOffset={sideOffset} align={align} alignOffset={alignOffset} alignItemWithTrigger={alignItemWithTrigger}>
				<SelectPrimitive.Popup
					ref={ref}
					className={cn(
						'relative isolate z-50 max-h-(--available-height) min-w-32 w-(--anchor-width) origin-(--transform-origin) overflow-hidden rounded-md border border-neutral-700 bg-popover/95 backdrop-blur-xs text-popover-foreground shadow-lg shadow-black/20 outline-hidden ring-0 focus:outline-hidden focus:ring-0 focus-visible:outline-hidden focus-visible:ring-0 **:outline-hidden **:ring-0 transition-[opacity,transform] data-starting-style:opacity-0 data-ending-style:opacity-0 data-starting-style:scale-95 data-ending-style:scale-95',
						className
					)}
					{...props}
				>
					<SelectScrollUpButton />
					<SelectPrimitive.List className="p-1">{children}</SelectPrimitive.List>
					<SelectScrollDownButton />
				</SelectPrimitive.Popup>
			</SelectPrimitive.Positioner>
		</SelectPrimitive.Portal>
	)
);
SelectContent.displayName = 'SelectContent';

const SelectLabel = React.forwardRef<React.ElementRef<typeof SelectPrimitive.GroupLabel>, React.ComponentPropsWithoutRef<typeof SelectPrimitive.GroupLabel>>(({ className, ...props }, ref) => (
	<SelectPrimitive.GroupLabel ref={ref} className={cn('px-2 py-1.5 text-sm font-semibold', className)} {...props} />
));
SelectLabel.displayName = 'SelectLabel';

const SelectItem = React.forwardRef<React.ElementRef<typeof SelectPrimitive.Item>, React.ComponentPropsWithoutRef<typeof SelectPrimitive.Item>>(({ className, children, ...props }, ref) => (
	<SelectPrimitive.Item
		ref={ref}
		className={cn(
			'relative flex w-full cursor-default select-none items-center rounded-sm py-1.5 pl-2 pr-8 text-sm outline-hidden transition-colors duration-150 focus:bg-accent focus:text-accent-foreground data-selected:text-foreground data-selected:font-medium data-disabled:pointer-events-none data-disabled:opacity-50',
			className
		)}
		{...props}
	>
		<SelectPrimitive.ItemText className="shrink-0 whitespace-nowrap">{children}</SelectPrimitive.ItemText>
		<SelectPrimitive.ItemIndicator render={<span className="absolute right-2 flex h-3.5 w-3.5 items-center justify-center" />}>
			<Check className="h-4 w-4" />
		</SelectPrimitive.ItemIndicator>
	</SelectPrimitive.Item>
));
SelectItem.displayName = 'SelectItem';

const SelectSeparator = React.forwardRef<React.ElementRef<typeof SelectPrimitive.Separator>, React.ComponentPropsWithoutRef<typeof SelectPrimitive.Separator>>(({ className, ...props }, ref) => (
	<SelectPrimitive.Separator ref={ref} className={cn('-mx-1 my-1 h-px bg-muted', className)} {...props} />
));
SelectSeparator.displayName = 'SelectSeparator';

export { Select, SelectContent, SelectGroup, SelectItem, SelectLabel, SelectSeparator, SelectTrigger, SelectValue };
