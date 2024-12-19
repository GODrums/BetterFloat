import { useStorage } from '@plasmohq/storage/hook';
import { useEffect, useState } from 'react';
import { MarketSource } from '~lib/util/globals';
import { MaterialSymbolsHelpOutline } from '~popup/components/Icons';
import type { SourceInfo } from './SettingsSource';
import { SettingsTooltip } from './SettingsTooltip';
import { Label, Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './Shadcn';

type SelectProps = {
	prefix: string;
	sources: SourceInfo[];
	primarySource: string;
};

const defaultSource: SourceInfo = {
	text: 'None',
	logo: 'data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIxZW0iIGhlaWdodD0iMWVtIiB2aWV3Qm94PSIwIDAgMjQgMjQiPjxwYXRoIGZpbGw9ImN1cnJlbnRDb2xvciIgZD0ibTguNCAxN2wzLjYtMy42bDMuNiAzLjZsMS40LTEuNGwtMy42LTMuNkwxNyA4LjRMMTUuNiA3TDEyIDEwLjZMOC40IDdMNyA4LjRsMy42IDMuNkw3IDE1LjZ6bTMuNiA1cS0yLjA3NSAwLTMuOS0uNzg4dC0zLjE3NS0yLjEzN1QyLjc4OCAxNS45VDIgMTJ0Ljc4OC0zLjl0Mi4xMzctMy4xNzVUOC4xIDIuNzg4VDEyIDJ0My45Ljc4OHQzLjE3NSAyLjEzN1QyMS4yMTMgOC4xVDIyIDEydC0uNzg4IDMuOXQtMi4xMzcgMy4xNzV0LTMuMTc1IDIuMTM4VDEyIDIybTAtMnEzLjM1IDAgNS42NzUtMi4zMjVUMjAgMTJ0LTIuMzI1LTUuNjc1VDEyIDRUNi4zMjUgNi4zMjVUNCAxMnQyLjMyNSA1LjY3NVQxMiAyMG0wLTgiLz48L3N2Zz4=',
	source: 'none' as MarketSource,
};

export const SettingsAltMarket = ({ prefix, sources, primarySource }: SelectProps) => {
	const id = `${prefix}-altmarket`;
	const [value, setValue] = useStorage<MarketSource>(id, (s) => (s === undefined ? MarketSource.None : s));
	const [currentSource, setCurrentSource] = useState(sources[0]);

	const isFirefox = navigator.userAgent.toLowerCase().indexOf('firefox') > -1;

	// create a 'none' source on demand
	if (sources[0].text !== 'None') {
		sources.unshift(defaultSource);
	}

	const onValueChange = (newValue: string) => {
		setValue(newValue as MarketSource);
		const newSource = sources.find((s) => s.source === newValue);
		if (newSource) {
			setCurrentSource(newSource);
		} else {
			setCurrentSource(defaultSource);
		}
	};

	// if the primary source is the same as the current source, set it to the default source
	if (primarySource === currentSource.source) {
		onValueChange(defaultSource.source);
	}

	useEffect(() => {
		setCurrentSource(sources.find((s) => value.includes(s.source)) ?? sources[0]);
	}, [value]);

	const AltMarketSelectChrome = () => {
		return (
			<Select value={value} onValueChange={onValueChange}>
				<SelectTrigger>
					<SelectValue aria-label={value.toString()}>
						<span className="text-xs">{currentSource.text}</span>
					</SelectValue>
				</SelectTrigger>
				<SelectContent className="w-[90px]" position="popper" sideOffset={2} align="end">
					{sources.map((source, index) => (
						<SelectItem key={index} value={source.source}>
							<div className="flex items-center justify-center gap-2">
								<img src={source.logo} alt={source.text} className="size-6 rounded-lg" />
								<span className="text-xs">{source.text}</span>
							</div>
						</SelectItem>
					))}
				</SelectContent>
			</Select>
		);
	};

	const AltMarketSelectFirefox = () => {
		// Firefox is a bit special and needs a state to handle the dropdown
		const [open, setOpen] = useState(false);

		const onValueChange = (value: MarketSource) => {
			setValue(value);
			setOpen(false);
		};

		return (
			<Select open={open} value={value} onValueChange={onValueChange}>
				<SelectTrigger onClick={() => setOpen(!open)}>
					<SelectValue aria-label={value.toString()}>
						<span className="text-xs">{currentSource.text}</span>
					</SelectValue>
				</SelectTrigger>
				<SelectContent className="w-[90px]" position="popper" sideOffset={2} align="end">
					{sources.map((source, index) => (
						<SelectItem key={index} value={source.source}>
							<div className="flex items-center justify-center gap-2">
								<img src={source.logo} alt={source.text} className="size-6 rounded-lg" />
								<span className="text-xs">{source.text}</span>
							</div>
						</SelectItem>
					))}
				</SelectContent>
			</Select>
		);
	};

	return (
		<div className="flex justify-between items-center align-middle gap-4 mt-2">
			<div className="flex items-center gap-2">
				<Label htmlFor={id}>Alternative Market</Label>
			</div>
			<div className="flex items-center gap-2">
				<SettingsTooltip text="The market to use whenever the primary market cannot provide a price. For example, Buff does not support cases/capsules/packages, and the Steam Market has a item price limit of $2000.">
					<MaterialSymbolsHelpOutline className="h-6 w-6" />
				</SettingsTooltip>
				{isFirefox ? <AltMarketSelectFirefox /> : <AltMarketSelectChrome />}
			</div>
		</div>
	);
};
