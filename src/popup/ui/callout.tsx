const WarningCallout = ({ text }: { text: string }) => (
	<div className="flex items-center justify-center gap-2 px-3 py-2 bg-red-500/20 rounded-lg border border-red-500/30">
		<span className="text-sm text-red-500">{text}</span>
	</div>
);

export { WarningCallout };
