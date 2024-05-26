'use client';

import * as AccordionPrimitive from '@radix-ui/react-accordion';
import * as AvatarPrimitive from '@radix-ui/react-avatar';
import * as CheckboxPrimitive from '@radix-ui/react-checkbox';
import { Cross2Icon } from '@radix-ui/react-icons';
import { CaretSortIcon, CheckIcon, ChevronDownIcon, ChevronUpIcon, DividerHorizontalIcon } from '@radix-ui/react-icons';
import * as LabelPrimitive from '@radix-ui/react-label';
import * as PopoverPrimitive from '@radix-ui/react-popover';
import * as ScrollAreaPrimitive from '@radix-ui/react-scroll-area';
import * as SelectPrimitive from '@radix-ui/react-select';
import { Slot } from '@radix-ui/react-slot';
import * as SwitchPrimitives from '@radix-ui/react-switch';
import * as TabsPrimitive from '@radix-ui/react-tabs';
import * as ToastPrimitives from '@radix-ui/react-toast';
import * as TooltipPrimitive from '@radix-ui/react-tooltip';
import { type VariantProps, cva } from 'class-variance-authority';
import * as React from 'react';

import { cn } from '~lib/utils';

const labelVariants = cva('text-sm font-normal leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70');

const Label = React.forwardRef<React.ElementRef<typeof LabelPrimitive.Root>, React.ComponentPropsWithoutRef<typeof LabelPrimitive.Root> & VariantProps<typeof labelVariants>>(
	({ className, ...props }, ref) => <LabelPrimitive.Root ref={ref} className={cn(labelVariants(), className)} {...props} />
);
Label.displayName = LabelPrimitive.Root.displayName;

const Input = React.forwardRef<HTMLInputElement, InputProps>(({ className, type, ...props }, ref) => {
	return (
		<input
			type={type}
			className={cn(
				'flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50',
				className
			)}
			ref={ref}
			{...props}
		/>
	);
});
Input.displayName = 'Input';

const buttonVariants = cva(
	'inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50',
	{
		variants: {
			variant: {
				default: 'bg-primary text-primary-foreground hover:bg-primary/90',
				destructive: 'bg-destructive text-destructive-foreground hover:bg-destructive/90',
				outline: 'border border-input bg-background hover:bg-accent hover:text-accent-foreground',
				secondary: 'bg-secondary text-secondary-foreground hover:bg-secondary/80',
				light: 'bg-[#1e2025] text-white hover:bg-neutral-700 hover:text-neutral-foreground',
				ghost: 'hover:bg-accent hover:text-accent-foreground',
				link: 'text-primary underline-offset-4 hover:underline',
				invisible: 'hover:bg-neutral-700 hover:text-accent-foreground',
			},
			size: {
				default: 'h-10 px-4 py-2',
				sm: 'h-9 rounded-md px-3',
				lg: 'h-11 rounded-md px-8',
				icon: 'h-10 w-10',
			},
		},
		defaultVariants: {
			variant: 'default',
			size: 'default',
		},
	}
);

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement>, VariantProps<typeof buttonVariants> {
	asChild?: boolean;
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(({ className, variant, size, asChild = false, ...props }, ref) => {
	const Comp = asChild ? Slot : 'button';
	return <Comp className={cn(buttonVariants({ variant, size, className }))} ref={ref} {...props} />;
});
Button.displayName = 'Button';

const Card = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(({ className, ...props }, ref) => (
	<div ref={ref} className={cn('rounded-lg border shadow-sm bg-card text-card-foreground', className)} {...props} />
));
Card.displayName = 'Card';

const CardHeader = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(({ className, ...props }, ref) => (
	<div ref={ref} className={cn('flex flex-col space-y-1 p-4', className)} {...props} />
));
CardHeader.displayName = 'CardHeader';

const CardTitle = React.forwardRef<HTMLParagraphElement, React.HTMLAttributes<HTMLHeadingElement>>(({ className, ...props }, ref) => (
	<h3 ref={ref} className={cn('text-xl font-bold leading-none tracking-tight', className)} {...props} />
));
CardTitle.displayName = 'CardTitle';

const CardDescription = React.forwardRef<HTMLParagraphElement, React.HTMLAttributes<HTMLParagraphElement>>(({ className, ...props }, ref) => (
	<p ref={ref} className={cn('text-sm text-muted-foreground', className)} {...props} />
));
CardDescription.displayName = 'CardDescription';

const CardContent = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(({ className, ...props }, ref) => <div ref={ref} className={cn('py-3 px-4', className)} {...props} />);
CardContent.displayName = 'CardContent';

const CardFooter = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(({ className, ...props }, ref) => (
	<div ref={ref} className={cn('flex items-center p-6 pt-0', className)} {...props} />
));
CardFooter.displayName = 'CardFooter';

const Tabs = TabsPrimitive.Root;

const TabsList = React.forwardRef<React.ElementRef<typeof TabsPrimitive.List>, React.ComponentPropsWithoutRef<typeof TabsPrimitive.List>>(({ className, ...props }, ref) => (
	<TabsPrimitive.List ref={ref} className={cn('inline-flex flex-col items-center justify-center rounded-lg bg-muted p-1 text-muted-foreground', className)} {...props} />
));
TabsList.displayName = TabsPrimitive.List.displayName;

const TabsTrigger = React.forwardRef<React.ElementRef<typeof TabsPrimitive.Trigger>, React.ComponentPropsWithoutRef<typeof TabsPrimitive.Trigger>>(({ className, ...props }, ref) => (
	<TabsPrimitive.Trigger
		ref={ref}
		className={cn(
			'inline-flex items-center justify-center whitespace-nowrap rounded-md px-3 py-1 text-sm font-medium ring-offset-background transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 data-[state=active]:bg-muted data-[state=active]:text-foreground data-[state=active]:shadow',
			className
		)}
		{...props}
	/>
));
TabsTrigger.displayName = TabsPrimitive.Trigger.displayName;

const TabsContent = React.forwardRef<React.ElementRef<typeof TabsPrimitive.Content>, React.ComponentPropsWithoutRef<typeof TabsPrimitive.Content>>(({ className, ...props }, ref) => (
	<TabsPrimitive.Content
		ref={ref}
		className={cn(
			'ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 h-full w-full rounded-lg border shadow-sm border-muted text-card-foreground',
			className
		)}
		{...props}
	/>
));
TabsContent.displayName = TabsPrimitive.Content.displayName;

const Avatar = React.forwardRef<React.ElementRef<typeof AvatarPrimitive.Root>, React.ComponentPropsWithoutRef<typeof AvatarPrimitive.Root>>(({ className, ...props }, ref) => (
	<AvatarPrimitive.Root ref={ref} className={cn('relative flex h-10 w-10 shrink-0 overflow-hidden rounded-full', className)} {...props} />
));
Avatar.displayName = AvatarPrimitive.Root.displayName;

const AvatarImage = React.forwardRef<React.ElementRef<typeof AvatarPrimitive.Image>, React.ComponentPropsWithoutRef<typeof AvatarPrimitive.Image>>(({ className, ...props }, ref) => (
	<AvatarPrimitive.Image ref={ref} className={cn('aspect-square h-full w-full', className)} {...props} />
));
AvatarImage.displayName = AvatarPrimitive.Image.displayName;

const AvatarFallback = React.forwardRef<React.ElementRef<typeof AvatarPrimitive.Fallback>, React.ComponentPropsWithoutRef<typeof AvatarPrimitive.Fallback>>(({ className, ...props }, ref) => (
	<AvatarPrimitive.Fallback ref={ref} className={cn('flex h-full w-full items-center justify-center rounded-full bg-muted', className)} {...props} />
));
AvatarFallback.displayName = AvatarPrimitive.Fallback.displayName;

const Switch = React.forwardRef<React.ElementRef<typeof SwitchPrimitives.Root>, React.ComponentPropsWithoutRef<typeof SwitchPrimitives.Root>>(({ className, ...props }, ref) => (
	<SwitchPrimitives.Root
		className={cn(
			'peer inline-flex h-5 w-9 shrink-0 cursor-pointer items-center rounded-full border-2 border-transparent shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background disabled:cursor-not-allowed disabled:opacity-50 data-[state=checked]:bg-muted-foreground data-[state=unchecked]:bg-primary',
			className
		)}
		{...props}
		ref={ref}
	>
		<SwitchPrimitives.Thumb
			className={cn('pointer-events-none block h-4 w-4 rounded-full shadow-lg bg-muted ring-0 transition-transform data-[state=checked]:translate-x-4 data-[state=unchecked]:translate-x-0')}
		/>
	</SwitchPrimitives.Root>
));
Switch.displayName = SwitchPrimitives.Root.displayName;

const EnableSwitch = React.forwardRef<React.ElementRef<typeof SwitchPrimitives.Root>, React.ComponentPropsWithoutRef<typeof SwitchPrimitives.Root>>(({ className, ...props }, ref) => (
	<SwitchPrimitives.Root
		className={cn(
			'peer inline-flex h-5 w-9 shrink-0 cursor-pointer items-center rounded-full border-2 border-transparent shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background disabled:cursor-not-allowed disabled:opacity-50 data-[state=checked]:bg-primary data-[state=unchecked]:bg-input',
			className
		)}
		{...props}
		ref={ref}
	>
		<SwitchPrimitives.Thumb
			className={cn('pointer-events-none block h-4 w-4 rounded-full bg-background shadow-lg ring-0 transition-transform data-[state=checked]:translate-x-4 data-[state=unchecked]:translate-x-0')}
		/>
	</SwitchPrimitives.Root>
));
EnableSwitch.displayName = SwitchPrimitives.Root.displayName;

const Checkbox = React.forwardRef<React.ElementRef<typeof CheckboxPrimitive.Root>, React.ComponentPropsWithoutRef<typeof CheckboxPrimitive.Root>>(({ className, ...props }, ref) => (
	<CheckboxPrimitive.Root
		ref={ref}
		className={cn(
			'peer h-6 w-6 shrink-0 rounded-sm border border-primary shadow focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50 data-[state=checked]:bg-primary data-[state=checked]:text-primary-foreground',
			className
		)}
		{...props}
	>
		<CheckboxPrimitive.Indicator className={cn('flex items-center justify-center text-current')}>
			{props.checked === 'indeterminate' && <DividerHorizontalIcon className="h-6 w-6" />}
			{props.checked === true && <CheckIcon className="h-6 w-6" />}
		</CheckboxPrimitive.Indicator>
	</CheckboxPrimitive.Root>
));
Checkbox.displayName = CheckboxPrimitive.Root.displayName;

const Select = SelectPrimitive.Root;

const SelectGroup = SelectPrimitive.Group;

const SelectValue = SelectPrimitive.Value;

const SelectTrigger = React.forwardRef<React.ElementRef<typeof SelectPrimitive.Trigger>, React.ComponentPropsWithoutRef<typeof SelectPrimitive.Trigger>>(({ className, children, ...props }, ref) => (
	<SelectPrimitive.Trigger
		ref={ref}
		className={cn(
			'flex h-9 w-full items-center justify-between whitespace-nowrap rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-sm ring-offset-background placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-ring disabled:cursor-not-allowed disabled:opacity-50 [&>span]:line-clamp-1',
			className
		)}
		{...props}
	>
		{children}
		<SelectPrimitive.Icon asChild>
			<CaretSortIcon className="h-4 w-4 opacity-50" />
		</SelectPrimitive.Icon>
	</SelectPrimitive.Trigger>
));
SelectTrigger.displayName = SelectPrimitive.Trigger.displayName;

const SelectScrollUpButton = React.forwardRef<React.ElementRef<typeof SelectPrimitive.ScrollUpButton>, React.ComponentPropsWithoutRef<typeof SelectPrimitive.ScrollUpButton>>(
	({ className, ...props }, ref) => (
		<SelectPrimitive.ScrollUpButton ref={ref} className={cn('flex cursor-default items-center justify-center py-1', className)} {...props}>
			<ChevronUpIcon />
		</SelectPrimitive.ScrollUpButton>
	)
);
SelectScrollUpButton.displayName = SelectPrimitive.ScrollUpButton.displayName;

const SelectScrollDownButton = React.forwardRef<React.ElementRef<typeof SelectPrimitive.ScrollDownButton>, React.ComponentPropsWithoutRef<typeof SelectPrimitive.ScrollDownButton>>(
	({ className, ...props }, ref) => (
		<SelectPrimitive.ScrollDownButton ref={ref} className={cn('flex cursor-default items-center justify-center py-1', className)} {...props}>
			<ChevronDownIcon />
		</SelectPrimitive.ScrollDownButton>
	)
);
SelectScrollDownButton.displayName = SelectPrimitive.ScrollDownButton.displayName;

const SelectContent = React.forwardRef<React.ElementRef<typeof SelectPrimitive.Content>, React.ComponentPropsWithoutRef<typeof SelectPrimitive.Content>>(
	({ className, children, position = 'popper', ...props }, ref) => (
		<SelectPrimitive.Portal>
			<SelectPrimitive.Content
				ref={ref}
				className={cn(
					'relative z-50 max-h-96 min-w-[8rem] overflow-hidden rounded-md border bg-popover text-popover-foreground shadow-md data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95 data-[side=bottom]:slide-in-from-top-2 data-[side=left]:slide-in-from-right-2 data-[side=right]:slide-in-from-left-2 data-[side=top]:slide-in-from-bottom-2',
					position === 'popper' && 'data-[side=bottom]:translate-y-1 data-[side=left]:-translate-x-1 data-[side=right]:translate-x-1 data-[side=top]:-translate-y-1',
					className
				)}
				position={position}
				{...props}
			>
				<SelectScrollUpButton />
				<SelectPrimitive.Viewport className={cn('p-1', position === 'popper' && 'h-[var(--radix-select-trigger-height)] w-full min-w-[var(--radix-select-trigger-width)]')}>
					{children}
				</SelectPrimitive.Viewport>
				<SelectScrollDownButton />
			</SelectPrimitive.Content>
		</SelectPrimitive.Portal>
	)
);
SelectContent.displayName = SelectPrimitive.Content.displayName;

const SelectLabel = React.forwardRef<React.ElementRef<typeof SelectPrimitive.Label>, React.ComponentPropsWithoutRef<typeof SelectPrimitive.Label>>(({ className, ...props }, ref) => (
	<SelectPrimitive.Label ref={ref} className={cn('px-2 py-1.5 text-sm font-semibold', className)} {...props} />
));
SelectLabel.displayName = SelectPrimitive.Label.displayName;

const SelectItem = React.forwardRef<React.ElementRef<typeof SelectPrimitive.Item>, React.ComponentPropsWithoutRef<typeof SelectPrimitive.Item>>(({ className, children, ...props }, ref) => (
	<SelectPrimitive.Item
		ref={ref}
		className={cn(
			'relative flex w-full cursor-default select-none items-center rounded-sm py-1.5 pl-2 pr-8 text-sm outline-none focus:bg-accent focus:text-accent-foreground data-[disabled]:pointer-events-none data-[disabled]:opacity-50',
			className
		)}
		{...props}
	>
		<span className="absolute right-2 flex h-3.5 w-3.5 items-center justify-center">
			<SelectPrimitive.ItemIndicator>
				<CheckIcon className="h-4 w-4" />
			</SelectPrimitive.ItemIndicator>
		</span>
		<SelectPrimitive.ItemText>{children}</SelectPrimitive.ItemText>
	</SelectPrimitive.Item>
));
SelectItem.displayName = SelectPrimitive.Item.displayName;

const SelectSeparator = React.forwardRef<React.ElementRef<typeof SelectPrimitive.Separator>, React.ComponentPropsWithoutRef<typeof SelectPrimitive.Separator>>(({ className, ...props }, ref) => (
	<SelectPrimitive.Separator ref={ref} className={cn('-mx-1 my-1 h-px bg-muted', className)} {...props} />
));

SelectSeparator.displayName = SelectPrimitive.Separator.displayName;

const TooltipProvider = TooltipPrimitive.Provider;

const Tooltip = TooltipPrimitive.Root;

const TooltipTrigger = TooltipPrimitive.Trigger;

const TooltipContent = React.forwardRef<React.ElementRef<typeof TooltipPrimitive.Content>, React.ComponentPropsWithoutRef<typeof TooltipPrimitive.Content>>(
	({ className, sideOffset = 4, ...props }, ref) => (
		<TooltipPrimitive.Content
			ref={ref}
			sideOffset={sideOffset}
			className={cn(
				'z-50 max-w-64 overflow-hidden rounded-md bg-primary px-3 py-1.5 text-xs text-primary-foreground text-center animate-in fade-in-0 zoom-in-95 data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=closed]:zoom-out-95 data-[side=bottom]:slide-in-from-top-2 data-[side=left]:slide-in-from-right-2 data-[side=right]:slide-in-from-left-2 data-[side=top]:slide-in-from-bottom-2',
				className
			)}
			{...props}
		/>
	)
);
TooltipContent.displayName = TooltipPrimitive.Content.displayName;

const ScrollArea = React.forwardRef<React.ElementRef<typeof ScrollAreaPrimitive.Root>, React.ComponentPropsWithoutRef<typeof ScrollAreaPrimitive.Root>>(({ className, children, ...props }, ref) => (
	<ScrollAreaPrimitive.Root ref={ref} className={cn('relative overflow-hidden', className)} {...props}>
		<ScrollAreaPrimitive.Viewport className="h-full w-full rounded-[inherit]">{children}</ScrollAreaPrimitive.Viewport>
		<ScrollBar />
		<ScrollAreaPrimitive.Corner />
	</ScrollAreaPrimitive.Root>
));
ScrollArea.displayName = ScrollAreaPrimitive.Root.displayName;

const ScrollBar = React.forwardRef<React.ElementRef<typeof ScrollAreaPrimitive.ScrollAreaScrollbar>, React.ComponentPropsWithoutRef<typeof ScrollAreaPrimitive.ScrollAreaScrollbar>>(
	({ className, orientation = 'vertical', ...props }, ref) => (
		<ScrollAreaPrimitive.ScrollAreaScrollbar
			ref={ref}
			orientation={orientation}
			className={cn(
				'flex touch-none select-none transition-colors',
				orientation === 'vertical' && 'h-full w-2.5 border-l border-l-transparent p-[1px]',
				orientation === 'horizontal' && 'h-2.5 flex-col border-t border-t-transparent p-[1px]',
				className
			)}
			{...props}
		>
			<ScrollAreaPrimitive.ScrollAreaThumb className="relative flex-1 rounded-full bg-border" />
		</ScrollAreaPrimitive.ScrollAreaScrollbar>
	)
);
ScrollBar.displayName = ScrollAreaPrimitive.ScrollAreaScrollbar.displayName;

const Popover = PopoverPrimitive.Root;

const PopoverTrigger = PopoverPrimitive.Trigger;

const PopoverAnchor = PopoverPrimitive.Anchor;

const PopoverClose = PopoverPrimitive.Close;

interface PopoverProps extends React.ComponentPropsWithoutRef<typeof PopoverPrimitive.Content> {
	portal?: HTMLElement;
}

const PopoverContent = React.forwardRef<React.ElementRef<typeof PopoverPrimitive.Content>, PopoverProps>(({ className, align = 'center', sideOffset = 4, portal = document.body, ...props }, ref) => (
	<PopoverPrimitive.Portal container={portal}>
		<PopoverPrimitive.Content
			ref={ref}
			align={align}
			sideOffset={sideOffset}
			className={cn(
				'z-50 w-72 rounded-md border border-border bg-popover p-4 text-popover-foreground shadow-md outline-none data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95 data-[side=bottom]:slide-in-from-top-2 data-[side=left]:slide-in-from-right-2 data-[side=right]:slide-in-from-left-2 data-[side=top]:slide-in-from-bottom-2',
				className
			)}
			{...props}
		/>
	</PopoverPrimitive.Portal>
));
PopoverContent.displayName = PopoverPrimitive.Content.displayName;

const PopoverColorPicker = React.forwardRef<React.ElementRef<typeof PopoverPrimitive.Content>, React.ComponentPropsWithoutRef<typeof PopoverPrimitive.Content>>(
	({ className, align = 'center', sideOffset = 4, ...props }, ref) => (
		<PopoverPrimitive.Portal>
			<PopoverPrimitive.Content
				ref={ref}
				align={align}
				sideOffset={sideOffset}
				className={cn(
					'z-50 rounded-lg bg-black p-2 border border-stone-800 outline-none data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95 data-[side=bottom]:slide-in-from-top-2 data-[side=left]:slide-in-from-right-2 data-[side=right]:slide-in-from-left-2 data-[side=top]:slide-in-from-bottom-2',
					className
				)}
				{...props}
			/>
		</PopoverPrimitive.Portal>
	)
);
PopoverColorPicker.displayName = PopoverPrimitive.Content.displayName;

const Accordion = AccordionPrimitive.Root;

const AccordionItem = React.forwardRef<React.ElementRef<typeof AccordionPrimitive.Item>, React.ComponentPropsWithoutRef<typeof AccordionPrimitive.Item>>(({ className, ...props }, ref) => (
	<AccordionPrimitive.Item ref={ref} className={cn('border-b', className)} {...props} />
));
AccordionItem.displayName = 'AccordionItem';

const AccordionTrigger = React.forwardRef<React.ElementRef<typeof AccordionPrimitive.Trigger>, React.ComponentPropsWithoutRef<typeof AccordionPrimitive.Trigger>>(
	({ className, children, ...props }, ref) => (
		<AccordionPrimitive.Header className="flex">
			<AccordionPrimitive.Trigger
				ref={ref}
				className={cn('flex flex-1 items-center justify-between py-4 text-sm font-medium transition-all hover:underline [&[data-state=open]>svg]:rotate-180', className)}
				{...props}
			>
				{children}
				<ChevronDownIcon className="h-4 w-4 shrink-0 text-muted-foreground transition-transform duration-200" />
			</AccordionPrimitive.Trigger>
		</AccordionPrimitive.Header>
	)
);
AccordionTrigger.displayName = AccordionPrimitive.Trigger.displayName;

const AccordionContent = React.forwardRef<React.ElementRef<typeof AccordionPrimitive.Content>, React.ComponentPropsWithoutRef<typeof AccordionPrimitive.Content>>(
	({ className, children, ...props }, ref) => (
		<AccordionPrimitive.Content ref={ref} className="overflow-hidden text-sm data-[state=closed]:animate-accordion-up data-[state=open]:animate-accordion-down" {...props}>
			<div className={cn('pb-4 pt-0', className)}>{children}</div>
		</AccordionPrimitive.Content>
	)
);
AccordionContent.displayName = AccordionPrimitive.Content.displayName;

const badgeVariants = cva('inline-flex items-center rounded-md border px-2.5 py-0.5 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2', {
	variants: {
		variant: {
			default: 'border-transparent bg-primary text-primary-foreground shadow hover:bg-primary/80',
			secondary: 'border-transparent bg-secondary text-secondary-foreground hover:bg-secondary/80',
			destructive: 'border-transparent bg-destructive text-destructive-foreground shadow hover:bg-destructive/80',
			outline: 'text-foreground',
		},
	},
	defaultVariants: {
		variant: 'default',
	},
});

export interface BadgeProps extends React.HTMLAttributes<HTMLDivElement>, VariantProps<typeof badgeVariants> {}

function Badge({ className, variant, ...props }: BadgeProps) {
	return <div className={cn(badgeVariants({ variant }), className)} {...props} />;
}

const alertVariants = cva('relative w-full rounded-lg border px-4 py-3 text-sm [&>svg+div]:translate-y-[-3px] [&>svg]:absolute [&>svg]:left-4 [&>svg]:top-4 [&>svg]:text-foreground [&>svg~*]:pl-7', {
	variants: {
		variant: {
			default: 'bg-background text-foreground',
			destructive: 'border-destructive/50 text-destructive dark:border-destructive [&>svg]:text-destructive',
		},
	},
	defaultVariants: {
		variant: 'default',
	},
});

const Alert = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement> & VariantProps<typeof alertVariants>>(({ className, variant, ...props }, ref) => (
	<div ref={ref} role="alert" className={cn(alertVariants({ variant }), className)} {...props} />
));
Alert.displayName = 'Alert';

const AlertTitle = React.forwardRef<HTMLParagraphElement, React.HTMLAttributes<HTMLHeadingElement>>(({ className, ...props }, ref) => (
	<h5 ref={ref} className={cn('mb-1 font-medium leading-none tracking-tight', className)} {...props} />
));
AlertTitle.displayName = 'AlertTitle';

const AlertDescription = React.forwardRef<HTMLParagraphElement, React.HTMLAttributes<HTMLParagraphElement>>(({ className, ...props }, ref) => (
	<div ref={ref} className={cn('text-sm [&_p]:leading-relaxed', className)} {...props} />
));
AlertDescription.displayName = 'AlertDescription';

const ToastProvider = ToastPrimitives.Provider;

const ToastViewport = React.forwardRef<React.ElementRef<typeof ToastPrimitives.Viewport>, React.ComponentPropsWithoutRef<typeof ToastPrimitives.Viewport>>(({ className, ...props }, ref) => (
	<ToastPrimitives.Viewport ref={ref} className={cn('fixed top-0 right-[10%] z-[100] flex max-h-screen w-4/5 flex-col-reverse p-4 sm:top-auto sm:flex-col md:max-w-[420px]', className)} {...props} />
));
ToastViewport.displayName = ToastPrimitives.Viewport.displayName;

const toastVariants = cva(
	'group pointer-events-auto relative flex w-full items-center justify-between space-x-2 overflow-hidden rounded-md border border-green-600/60 p-4 pr-6 shadow-lg transition-all data-[swipe=cancel]:translate-y-0 data-[swipe=end]:translate-y-[var(--radix-toast-swipe-end-x)] data-[swipe=move]:translate-y-[var(--radix-toast-swipe-move-x)] data-[swipe=move]:transition-none data-[state=open]:animate-in data-[state=closed]:animate-out data-[swipe=end]:animate-out data-[state=closed]:fade-out-80 data-[state=closed]:slide-out-to-top-full data-[state=open]:slide-in-from-top-full data-[state=open]:sm:slide-in-from-bottom-full',
	{
		variants: {
			variant: {
				default: 'border bg-background text-foreground',
				destructive: 'destructive group border-destructive bg-destructive text-destructive-foreground',
			},
		},
		defaultVariants: {
			variant: 'default',
		},
	}
);

const Toast = React.forwardRef<React.ElementRef<typeof ToastPrimitives.Root>, React.ComponentPropsWithoutRef<typeof ToastPrimitives.Root> & VariantProps<typeof toastVariants>>(
	({ className, variant, ...props }, ref) => {
		return <ToastPrimitives.Root ref={ref} className={cn(toastVariants({ variant }), className)} {...props} />;
	}
);
Toast.displayName = ToastPrimitives.Root.displayName;

const ToastAction = React.forwardRef<React.ElementRef<typeof ToastPrimitives.Action>, React.ComponentPropsWithoutRef<typeof ToastPrimitives.Action>>(({ className, ...props }, ref) => (
	<ToastPrimitives.Action
		ref={ref}
		className={cn(
			'inline-flex h-8 shrink-0 items-center justify-center rounded-md border bg-transparent px-3 text-sm font-medium transition-colors hover:bg-secondary focus:outline-none focus:ring-1 focus:ring-ring disabled:pointer-events-none disabled:opacity-50 group-[.destructive]:border-muted/40 group-[.destructive]:hover:border-destructive/30 group-[.destructive]:hover:bg-destructive group-[.destructive]:hover:text-destructive-foreground group-[.destructive]:focus:ring-destructive',
			className
		)}
		{...props}
	/>
));
ToastAction.displayName = ToastPrimitives.Action.displayName;

const ToastClose = React.forwardRef<React.ElementRef<typeof ToastPrimitives.Close>, React.ComponentPropsWithoutRef<typeof ToastPrimitives.Close>>(({ className, ...props }, ref) => (
	<ToastPrimitives.Close
		ref={ref}
		className={cn(
			'absolute right-1 top-1/4 rounded-md p-1 text-foreground/80 transition-opacity hover:text-foreground focus:opacity-100 focus:outline-none focus:ring-1 group-hover:opacity-100 group-[.destructive]:text-red-300 group-[.destructive]:hover:text-red-50 group-[.destructive]:focus:ring-red-400 group-[.destructive]:focus:ring-offset-red-600',
			className
		)}
		toast-close=""
		{...props}
	>
		<Cross2Icon className="h-5 w-5" />
	</ToastPrimitives.Close>
));
ToastClose.displayName = ToastPrimitives.Close.displayName;

const ToastTitle = React.forwardRef<React.ElementRef<typeof ToastPrimitives.Title>, React.ComponentPropsWithoutRef<typeof ToastPrimitives.Title>>(({ className, ...props }, ref) => (
	<ToastPrimitives.Title ref={ref} className={cn('text-sm font-semibold [&+div]:text-xs', className)} {...props} />
));
ToastTitle.displayName = ToastPrimitives.Title.displayName;

const ToastDescription = React.forwardRef<React.ElementRef<typeof ToastPrimitives.Description>, React.ComponentPropsWithoutRef<typeof ToastPrimitives.Description>>(({ className, ...props }, ref) => (
	<ToastPrimitives.Description ref={ref} className={cn('text-sm opacity-90', className)} {...props} />
));
ToastDescription.displayName = ToastPrimitives.Description.displayName;

type ToastProps = React.ComponentPropsWithoutRef<typeof Toast>;

type ToastActionElement = React.ReactElement<typeof ToastAction>;

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {}

const FloatingInput = React.forwardRef<HTMLInputElement, InputProps>(({ className, ...props }, ref) => {
	return <Input placeholder=" " className={cn('peer', className)} ref={ref} {...props} />;
});
FloatingInput.displayName = 'FloatingInput';

const FloatingLabel = React.forwardRef<React.ElementRef<typeof Label>, React.ComponentPropsWithoutRef<typeof Label>>(({ className, ...props }, ref) => {
	return (
		<Label
			className={cn(
				'peer-focus:secondary peer-focus:dark:secondary absolute start-2 top-2 z-10 origin-[0] -translate-y-4 scale-75 transform bg-background px-2 text-sm text-gray-500 duration-300 peer-placeholder-shown:top-1/2 peer-placeholder-shown:-translate-y-1/2 peer-placeholder-shown:scale-100 peer-focus:top-2 peer-focus:-translate-y-4 peer-focus:scale-75 peer-focus:px-2 dark:bg-background rtl:peer-focus:left-auto rtl:peer-focus:translate-x-1/4',
				className
			)}
			ref={ref}
			{...props}
		/>
	);
});
FloatingLabel.displayName = 'FloatingLabel';

type FloatingLabelInputProps = InputProps & { label?: string };

const FloatingLabelInput = React.forwardRef<React.ElementRef<typeof FloatingInput>, React.PropsWithoutRef<FloatingLabelInputProps>>(({ id, label, ...props }, ref) => {
	return (
		<div className="relative">
			<FloatingInput ref={ref} id={id} {...props} />
			<FloatingLabel htmlFor={id}>{label}</FloatingLabel>
		</div>
	);
});
FloatingLabelInput.displayName = 'FloatingLabelInput';

export {
	Card,
	CardHeader,
	CardFooter,
	CardTitle,
	CardDescription,
	CardContent,
	Avatar,
	AvatarImage,
	AvatarFallback,
	Tabs,
	TabsList,
	TabsTrigger,
	TabsContent,
	Button,
	buttonVariants,
	Switch,
	Input,
	Label,
	EnableSwitch,
	Checkbox,
	Select,
	SelectGroup,
	SelectValue,
	SelectTrigger,
	SelectContent,
	SelectLabel,
	SelectItem,
	SelectSeparator,
	SelectScrollUpButton,
	SelectScrollDownButton,
	Tooltip,
	TooltipTrigger,
	TooltipContent,
	TooltipProvider,
	ScrollArea,
	ScrollBar,
	Popover,
	PopoverTrigger,
	PopoverContent,
	PopoverColorPicker,
	PopoverAnchor,
	PopoverClose,
	Accordion,
	AccordionItem,
	AccordionTrigger,
	AccordionContent,
	Badge,
	badgeVariants,
	Alert,
	AlertTitle,
	AlertDescription,
	type ToastProps,
	type ToastActionElement,
	ToastProvider,
	ToastViewport,
	Toast,
	ToastTitle,
	ToastDescription,
	ToastClose,
	ToastAction,
	FloatingInput,
	FloatingLabel,
	FloatingLabelInput,
};
