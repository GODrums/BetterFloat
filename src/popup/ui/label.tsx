'use client';

import { cva, type VariantProps } from 'class-variance-authority';
import * as React from 'react';

import { cn } from '~lib/utils';
import { FloatingInput, type InputProps } from './input';

const labelVariants = cva('text-sm font-normal leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70');

const Label = React.forwardRef<HTMLLabelElement, React.ComponentPropsWithoutRef<'label'> & VariantProps<typeof labelVariants>>(({ className, ...props }, ref) => (
	// biome-ignore lint/a11y/noLabelWithoutControl: Association is supplied by each consumer through htmlFor or nested controls.
	<label ref={ref} className={cn(labelVariants(), className)} {...props} />
));
Label.displayName = 'Label';

const FloatingLabel = React.forwardRef<React.ElementRef<typeof Label>, React.ComponentPropsWithoutRef<typeof Label>>(({ className, ...props }, ref) => {
	return (
		<Label
			className={cn(
				'peer-focus:secondary peer-focus:dark:secondary absolute inset-s-2 top-2 z-10 origin-left -translate-y-4 scale-75 transform bg-background px-2 text-sm text-gray-500 duration-300 peer-placeholder-shown:top-1/2 peer-placeholder-shown:-translate-y-1/2 peer-placeholder-shown:scale-100 peer-focus:top-2 peer-focus:-translate-y-4 peer-focus:scale-75 peer-focus:px-2 dark:bg-background peer-focus:rtl:left-auto peer-focus:rtl:translate-x-1/4',
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

export { Label };
