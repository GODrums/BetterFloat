'use client';

import * as CheckboxPrimitive from '@radix-ui/react-checkbox';
import { CheckIcon, DividerHorizontalIcon } from '@radix-ui/react-icons';
import * as React from 'react';
import { cn } from '~lib/utils';

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

const CSFCheckbox = React.forwardRef<React.ElementRef<typeof CheckboxPrimitive.Root>, React.ComponentPropsWithoutRef<typeof CheckboxPrimitive.Root>>(({ className, ...props }, ref) => (
	<CheckboxPrimitive.Root
		ref={ref}
		className={cn(
			'peer h-6 w-6 shrink-0 rounded-md border-2 border-[#ffffff8a] shadow focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50 data-[state=checked]:bg-[#237bff] data-[state=checked]:text-white',
			className
		)}
		{...props}
	>
		<CheckboxPrimitive.Indicator className={cn('flex items-center justify-center text-current')}>
			{props.checked === 'indeterminate' && <DividerHorizontalIcon className="h-5 w-5" />}
			{props.checked === true && <CheckIcon className="h-5 w-5" />}
		</CheckboxPrimitive.Indicator>
	</CheckboxPrimitive.Root>
));
CSFCheckbox.displayName = CheckboxPrimitive.Root.displayName;

export { Checkbox, CSFCheckbox };
