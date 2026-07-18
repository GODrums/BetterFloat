'use client';

import { Tabs as TabsPrimitive } from '@base-ui/react/tabs';
import * as React from 'react';
import { cn } from '~lib/utils';

const Tabs = TabsPrimitive.Root;

const TabsList = React.forwardRef<React.ElementRef<typeof TabsPrimitive.List>, React.ComponentPropsWithoutRef<typeof TabsPrimitive.List>>(({ className, ...props }, ref) => (
	<TabsPrimitive.List ref={ref} className={cn('inline-flex flex-col items-center justify-center rounded-lg bg-muted p-1 text-muted-foreground', className)} {...props} />
));
TabsList.displayName = TabsPrimitive.List.displayName;

const TabsTrigger = React.forwardRef<React.ElementRef<typeof TabsPrimitive.Tab>, React.ComponentPropsWithoutRef<typeof TabsPrimitive.Tab>>(({ className, ...props }, ref) => (
	<TabsPrimitive.Tab
		ref={ref}
		className={cn(
			'inline-flex items-center justify-center whitespace-nowrap rounded-md p-1 text-sm font-medium cursor-pointer ring-offset-background transition-all focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 aria-disabled:pointer-events-none aria-disabled:opacity-50 data-active:bg-muted data-active:text-foreground data-active:shadow-sm',
			className
		)}
		{...props}
	/>
));
TabsTrigger.displayName = 'TabsTrigger';

const TabsContent = React.forwardRef<React.ElementRef<typeof TabsPrimitive.Panel>, React.ComponentPropsWithoutRef<typeof TabsPrimitive.Panel>>(({ className, ...props }, ref) => (
	<TabsPrimitive.Panel
		ref={ref}
		className={cn(
			'ring-offset-background focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 h-full w-full rounded-lg border shadow-xs border-muted text-card-foreground transition-opacity data-starting-style:opacity-0',
			className
		)}
		{...props}
	/>
));
TabsContent.displayName = 'TabsContent';

export { Tabs, TabsContent, TabsList, TabsTrigger };
