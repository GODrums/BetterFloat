'use client';

import { Checkbox as CheckboxPrimitive } from '@base-ui/react/checkbox';
import { Check, Minus } from 'lucide-react';
import * as React from 'react';
import { cn } from '~lib/utils';

const Checkbox = React.forwardRef<React.ElementRef<typeof CheckboxPrimitive.Root>, React.ComponentPropsWithoutRef<typeof CheckboxPrimitive.Root>>(({ className, ...props }, ref) => (
	<CheckboxPrimitive.Root
		ref={ref}
		className={cn(
			'peer relative inline-flex h-6 w-6 shrink-0 box-border cursor-pointer items-center justify-center rounded-sm border border-primary border-solid shadow-sm focus-visible:outline-hidden focus-visible:ring-1 focus-visible:ring-ring data-disabled:cursor-not-allowed data-disabled:opacity-50 data-checked:bg-primary data-checked:text-primary-foreground',
			className
		)}
		{...props}
	>
		<CheckboxPrimitive.Indicator className={cn('flex items-center justify-center text-current')}>
			{props.indeterminate && <Minus className="h-6 w-6" />}
			{props.checked === true && <Check className="h-6 w-6" />}
		</CheckboxPrimitive.Indicator>
	</CheckboxPrimitive.Root>
));
Checkbox.displayName = CheckboxPrimitive.Root.displayName;

const CSFCheckbox = React.forwardRef<React.ElementRef<typeof CheckboxPrimitive.Root>, React.ComponentPropsWithoutRef<typeof CheckboxPrimitive.Root>>(({ className, ...props }, ref) => (
	<CheckboxPrimitive.Root
		ref={ref}
		className={cn(
			'peer relative inline-flex h-6 w-6 shrink-0 box-border cursor-pointer items-center justify-center rounded-md border-2 border-[#ffffff8a] border-solid shadow-sm focus-visible:outline-hidden focus-visible:ring-1 focus-visible:ring-[#237bff] data-disabled:cursor-not-allowed data-disabled:opacity-50 data-checked:bg-[#237bff] data-checked:text-white',
			className
		)}
		{...props}
	>
		<CheckboxPrimitive.Indicator className={cn('flex items-center justify-center text-current')}>
			{props.indeterminate && <Minus className="h-5 w-5" />}
			{props.checked === true && <Check className="h-5 w-5" />}
		</CheckboxPrimitive.Indicator>
	</CheckboxPrimitive.Root>
));
CSFCheckbox.displayName = CheckboxPrimitive.Root.displayName;

export { Checkbox, CSFCheckbox };
