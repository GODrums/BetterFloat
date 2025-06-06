import { cn } from '~lib/utils';

interface Props {
	max: number;
	value: number;
	min: number;
	text?: string;
	gaugePrimaryColor: string;
	gaugeSecondaryColor: string;
	className?: string;
	disabled?: boolean;
}

export function AnimatedCircularProgressBar({ max = 100, min = 0, value = 0, text, gaugePrimaryColor, gaugeSecondaryColor, className, disabled = false }: Props) {
	const circumference = 2 * Math.PI * 45;
	const percentPx = circumference / 100;
	const currentPercent = Math.round(((value - min) / (max - min)) * 100);

	return (
		<div
			className={cn('relative size-28 text-2xl font-semibold', disabled && 'opacity-60', className)}
			style={
				{
					'--circle-size': '100px',
					'--circumference': circumference,
					'--percent-to-px': `${percentPx}px`,
					'--gap-percent': '5',
					'--offset-factor': '0',
					'--transition-length': '1s',
					'--transition-step': '200ms',
					'--delay': '0s',
					'--percent-to-deg': '2.6deg',
					transform: 'translateZ(0)',
				} as React.CSSProperties
			}
		>
			{disabled && (
				<svg className="absolute inset-0 z-10 size-full p-4 text-red-400 opacity-70" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
					<path d="M18 6L6 18M6 6l12 12" strokeLinecap="round" strokeLinejoin="round" />
				</svg>
			)}
			<svg fill="none" className="size-full" strokeWidth="2" viewBox="0 0 100 100">
				{currentPercent <= 90 && currentPercent >= 0 && (
					<circle
						cx="50"
						cy="50"
						r="45"
						strokeWidth="10"
						strokeDashoffset="0"
						strokeLinecap="round"
						strokeLinejoin="round"
						className=" opacity-100"
						style={
							{
								stroke: gaugeSecondaryColor,
								'--stroke-percent': 90 - currentPercent,
								'--offset-factor-secondary': 'calc(1 - var(--offset-factor))',
								strokeDasharray: 'calc(var(--stroke-percent) * var(--percent-to-px)) var(--circumference)',
								transform: 'rotate(calc(1turn - 90deg - (var(--gap-percent) * var(--percent-to-deg) * var(--offset-factor-secondary)))) scaleY(-1)',
								transition: 'all var(--transition-length) ease var(--delay)',
								transformOrigin: 'calc(var(--circle-size) / 2) calc(var(--circle-size) / 2)',
							} as React.CSSProperties
						}
					/>
				)}
				<circle
					cx="50"
					cy="50"
					r="45"
					strokeWidth="10"
					strokeDashoffset="0"
					strokeLinecap="round"
					strokeLinejoin="round"
					className="opacity-100"
					style={
						{
							stroke: gaugePrimaryColor,
							'--stroke-percent': currentPercent,
							strokeDasharray: 'calc(var(--stroke-percent) * var(--percent-to-px)) var(--circumference)',
							transition: 'var(--transition-length) ease var(--delay),stroke var(--transition-length) ease var(--delay)',
							transitionProperty: 'stroke-dasharray,transform',
							transform: 'rotate(calc(-90deg + var(--gap-percent) * var(--offset-factor) * var(--percent-to-deg)))',
							transformOrigin: 'calc(var(--circle-size) / 2) calc(var(--circle-size) / 2)',
						} as React.CSSProperties
					}
				/>
			</svg>
			<span data-current-value={currentPercent} className="duration-1000 absolute inset-0 m-auto size-fit ease-linear animate-in fade-in">
				{text ?? currentPercent}
			</span>
		</div>
	);
}
