'use client';

import { Slider as SliderPrimitive } from '@base-ui/react/slider';
import * as React from 'react';
import { cn } from '~lib/utils';

interface DualRangeSliderProps extends React.ComponentProps<typeof SliderPrimitive.Root> {
	labelPosition?: 'top' | 'bottom';
	label?: (value: number | undefined) => React.ReactNode;
}

const DualRangeSlider = React.forwardRef<React.ElementRef<typeof SliderPrimitive.Root>, DualRangeSliderProps>(({ className, label, labelPosition = 'top', ...props }, ref) => {
	const initialValue = Array.isArray(props.value) ? props.value : [props.min, props.max];

	return (
		<SliderPrimitive.Root ref={ref} thumbAlignment="edge" {...props}>
			<SliderPrimitive.Control className={cn('relative flex w-full touch-none select-none items-center', className)}>
				<SliderPrimitive.Track className="relative h-2 w-full grow rounded-full bg-secondary">
					<SliderPrimitive.Indicator className="absolute h-full rounded-full bg-primary" />
					{initialValue.map((value, index) => (
						<SliderPrimitive.Thumb
							key={index}
							index={index}
							className="relative block h-4 w-4 rounded-full border-2 border-primary bg-background ring-offset-background transition-colors focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 data-disabled:pointer-events-none data-disabled:opacity-50"
						>
							{label && <span className={cn('absolute flex w-full justify-center', labelPosition === 'top' && '-top-6', labelPosition === 'bottom' && 'top-4')}>{label(value)}</span>}
						</SliderPrimitive.Thumb>
					))}
				</SliderPrimitive.Track>
			</SliderPrimitive.Control>
		</SliderPrimitive.Root>
	);
});
DualRangeSlider.displayName = 'DualRangeSlider';

export { DualRangeSlider };
