import { cn } from '~lib/utils';

const WarningCallout = ({ text, className }: { text: string; className?: string }) => (
	<div className={cn('flex items-center justify-center gap-2 px-3 py-2 bg-red-500/20 rounded-lg border border-red-500/30 text-sm', className)}>
		<span className="text-red-500">{text}</span>
	</div>
);

const InfoCallout = ({ text, className }: { text: string; className?: string }) => (
	<div className={cn('flex items-center justify-center gap-2 px-3 py-2 bg-blue-500/20 rounded-lg border border-blue-500/30 text-sm', className)}>
		<span className="text-blue-500">{text}</span>
	</div>
);

export { WarningCallout, InfoCallout };
