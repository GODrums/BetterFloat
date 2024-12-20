'use client';

import * as React from 'react';
import { cn } from '~lib/utils';
import { Button } from './button';

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {}

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

const MultiplierInput = React.forwardRef<HTMLInputElement, InputProps>(({ className, ...props }, ref) => {
	return (
		<div className="relative flex">
			<input
				type={props.type ?? 'text'}
				className={cn(
					'flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm transition-colors file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50 pl-7',
					className
				)}
				ref={ref}
				{...props}
			/>
			<Button size="sm" variant="ghost" className="absolute left-0 font-medium px-1.5 text-white hover:bg-transparent hover:text-white cursor-default">
				%
			</Button>
		</div>
	);
});
MultiplierInput.displayName = 'MultiplierInput';

const FloatingInput = React.forwardRef<HTMLInputElement, InputProps>(({ className, ...props }, ref) => {
	return <Input placeholder=" " className={cn('peer', className)} ref={ref} {...props} />;
});
FloatingInput.displayName = 'FloatingInput';

export { Input, MultiplierInput, FloatingInput };
