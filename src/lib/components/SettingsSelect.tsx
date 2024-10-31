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

export const SettingsSelect = (props: SelectProps) => {
	const isFirefox = navigator.userAgent.toLowerCase().indexOf('firefox') > -1;

	return isFirefox ? <SettingsSelectFirefox {...props} /> : <SettingsSelectChrome {...props} />;
};

export const SettingsSelectChrome = ({ id, text, options, icon, tooltipText }: SelectProps) => {
	const [value, setValue] = useStorage(id);

	let width = options[value ?? 0].length * 8 + 50 + 'px';

	useEffect(() => {
		width = options[value ?? 0].length * 8 + 50 + 'px';
	}, [value]);

	return (
		<div className="flex justify-between items-center align-middle gap-4">
			<div className="flex items-center gap-2">
				{icon}
				<Label htmlFor={id}>{text}</Label>
			</div>
			<div className="flex items-center gap-2">
				{tooltipText && (
					<SettingsTooltip text={tooltipText}>
						<MaterialSymbolsHelpOutline className="h-6 w-6" />
					</SettingsTooltip>
				)}
				<Select value={value} onValueChange={setValue}>
					<SelectTrigger style={{ width: width }}>
						<SelectValue aria-label={value}>
							<SelectValue>{options[value ?? 0]}</SelectValue>
						</SelectValue>
					</SelectTrigger>
					<SelectContent className="w-[60px]" position="popper" sideOffset={2} align="end">
						{options.map((option, index) => (
							<SelectItem key={index} value={index.toString()}>
								{option}
							</SelectItem>
						))}
					</SelectContent>
				</Select>
			</div>
		</div>
	);
};
export const SettingsSelectFirefox = ({ id, text, options, icon, tooltipText }: SelectProps) => {
	const [value, setValue] = useStorage(id);
	// Firefox is a bit special and needs a state to handle the dropdown
	const [open, setOpen] = useState(false);

	const optionsIsString = typeof options[0] === 'string';

	let width = optionsIsString ? (options[value ?? 0] as unknown as string[]).length * 8 + 50 + 'px' : '120px';

	const onValueChange = (value: string) => {
		setValue(value);
		setOpen(false);
	};

	useEffect(() => {
		width = optionsIsString ? (options[value ?? 0] as unknown as string[]).length * 8 + 50 + 'px' : '120px';
	}, [value]);

	return (
		<div className="flex justify-between items-center align-middle gap-4">
			<div className="flex items-center gap-2">
				{icon}
				<Label htmlFor={id}>{text}</Label>
			</div>
			<div className="flex items-center gap-2">
				{tooltipText && (
					<SettingsTooltip text={tooltipText}>
						<MaterialSymbolsHelpOutline className="h-6 w-6" />
					</SettingsTooltip>
				)}
				<Select open={open} value={value} onValueChange={onValueChange}>
					<SelectTrigger style={{ width: width }} onClick={() => setOpen(!open)}>
						<SelectValue aria-label={value}>
							<SelectValue>{options[value ?? 0]}</SelectValue>
						</SelectValue>
					</SelectTrigger>
					<SelectContent className="w-[80px]" position="popper" sideOffset={2} align="end">
						{options.map((option, index) => (
							<SelectItem key={index} value={index.toString()}>
								{option}
							</SelectItem>
						))}
					</SelectContent>
				</Select>
			</div>
		</div>
	);
};
