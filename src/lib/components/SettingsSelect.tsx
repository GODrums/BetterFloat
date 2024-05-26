import { useStorage } from '@plasmohq/storage/hook';
import type { IconProps } from '@radix-ui/react-icons/dist/types';
import { type ReactElement, useEffect, useState } from 'react';
import { MaterialSymbolsHelpOutline } from '~lib/components/Icons';
import { SettingsTooltip } from './SettingsTooltip';
import { Label, Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './Shadcn';

type SelectProps = {
	id: string;
	text: string;
	options: string[];
	icon?: ReactElement<IconProps>;
	tooltipText?: string;
};

export const SettingsSelect = ({ id, text, options, icon, tooltipText }: SelectProps) => {
	const [value, setValue] = useStorage(id);
	// the radix-ui select component is bugged and needs manual open/close handling
	const [open, setOpen] = useState(false);

	let width = options[value ?? 0].length * 8 + 50 + 'px';

	const onValueChange = (value: string) => {
		setValue(value);
		setOpen(false);
	};

	useEffect(() => {
		width = options[value ?? 0].length * 8 + 50 + 'px';
	}, [value]);

	return (
		<div className="flex justify-between items-center align-middle gap-4">
			<div className="flex items-center gap-2">
				{icon}
				<Label htmlFor={id}>{text}</Label>
				{tooltipText && (
					<SettingsTooltip text={tooltipText}>
						<MaterialSymbolsHelpOutline className="h-5 w-5" />
					</SettingsTooltip>
				)}
			</div>
			<Select open={open} value={value} onValueChange={onValueChange}>
				<SelectTrigger style={{ width: width }} onClick={() => setOpen(!open)}>
					<SelectValue aria-label={value}>
						<SelectValue>{options[value ?? 0]}</SelectValue>
					</SelectValue>
				</SelectTrigger>
				<SelectContent className="w-[80px]" position="popper" sideOffset={2} align="center">
					{options.map((option, index) => (
						<SelectItem key={index} value={index.toString()}>
							{option}
						</SelectItem>
					))}
				</SelectContent>
			</Select>
		</div>
	);
};
