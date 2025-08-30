import { useStorage } from '@plasmohq/storage/hook';
import type { IconProps } from '@radix-ui/react-icons/dist/types';
import type { ReactElement, SVGProps } from 'react';
import { cn } from '~lib/utils';
import { MaterialSymbolsHelpOutline } from '~popup/components/Icons';
import { Badge } from '~popup/ui/badge';
import { Input } from '~popup/ui/input';
import { Label } from '~popup/ui/label';
import { SettingsTooltip } from './SettingsTooltip';

type InputProps = {
	id: string;
	text: string;
	defaultValue?: string;
	icon?: ReactElement<IconProps>;
	tooltipText?: string;
	disabled?: boolean;
	isNew?: boolean;
	isPro?: boolean;
};

export function MaterialSymbolsDisabledByDefaultOutline(props: SVGProps<SVGSVGElement>) {
	return (
		<svg xmlns="http://www.w3.org/2000/svg" width="1em" height="1em" viewBox="0 0 24 24" {...props}>
			<path
				fill="#888888"
				d="m8.4 17l3.6-3.6l3.6 3.6l1.4-1.4l-3.6-3.6L17 8.4L15.6 7L12 10.6L8.4 7L7 8.4l3.6 3.6L7 15.6zM5 21q-.825 0-1.412-.587T3 19V5q0-.825.588-1.412T5 3h14q.825 0 1.413.588T21 5v14q0 .825-.587 1.413T19 21zm0-2h14V5H5zM5 5v14z"
			></path>
		</svg>
	);
}

export const SettingsInputNumber = ({ id, text, icon, tooltipText, disabled, isNew = false, isPro = false, defaultValue }: InputProps) => {
	const [value, setValue] = useStorage<number>(id, (prev) => prev ?? Number(defaultValue));

	return (
		<div className={cn('flex justify-between items-center align-middle gap-4', disabled && 'opacity-50 cursor-not-allowed')}>
			<div className="flex items-center gap-2">
				{icon}
				<Label htmlFor={id} className="text-balance leading-5">
					{text}
				</Label>
				{isNew && <Badge className="text-xs font-semibold text-accent">NEW</Badge>}
				{isPro && (
					<Badge variant="purple" className="text-xs font-semibold text-white">
						PRO
					</Badge>
				)}
			</div>
			<div className="flex items-center gap-2">
				{disabled && (
					<SettingsTooltip text="This functionality doesn't exist in the current version.">
						<MaterialSymbolsDisabledByDefaultOutline className="h-6 w-6" />
					</SettingsTooltip>
				)}
				{tooltipText && (
					<SettingsTooltip text={tooltipText}>
						<MaterialSymbolsHelpOutline className="h-6 w-6" />
					</SettingsTooltip>
				)}
				<Input className="w-20" type="number" id={id} value={value} onChange={(e) => setValue(Number(e.target.value))} disabled={disabled} />
			</div>
		</div>
	);
};
