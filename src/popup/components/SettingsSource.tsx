import steamLogo from 'data-base64:/assets/icons/icon-steam.svg';
import buffLogo from 'data-base64:~/../assets/buff_favicon.png';
import csfloatLogo from 'data-base64:~/../assets/csfloat.png';
import c5gameLogo from 'data-base64:~/../assets/icons/icon-c5game.png';
import youpinLogo from 'data-base64:~/../assets/icons/icon-youpin.png';
import { useStorage } from '@plasmohq/storage/hook';
import type { SVGProps } from 'react';
import { MarketSource } from '~lib/util/globals';
import { cn } from '~lib/utils';
import { Badge } from '~popup/ui/badge';
import { Button } from '~popup/ui/button';
import { Card, CardContent } from '~popup/ui/card';
import { Label } from '~popup/ui/label';
import { MaterialSymbolsHelpOutline } from './Icons';
import { SettingsAltMarket } from './SettingsAltMarket';
import { SettingsCheckbox } from './SettingsCheckbox';
import { SettingsSelect } from './SettingsSelect';
import { SettingsTooltip } from './SettingsTooltip';

export function MaterialSymbolsLightStorefrontOutline(props: SVGProps<SVGSVGElement>) {
	return (
		<svg xmlns="http://www.w3.org/2000/svg" width="1em" height="1em" viewBox="0 0 24 24" {...props}>
			<path
				fill="#888888"
				d="M20.506 10.896v7.989q0 .69-.463 1.152t-1.153.463H5.121q-.69 0-1.153-.462t-.462-1.153v-8.027q-.633-.468-.926-1.225t-.013-1.618l.973-3.207q.2-.612.646-.96t1.1-.348h13.4q.656 0 1.099.326t.648.943l1.011 3.246q.281.86-.012 1.631t-.926 1.25m-6.3-.396q.963 0 1.438-.54t.4-1.114L15.38 4.5h-2.873v4.2q0 .737.504 1.268q.503.532 1.196.532m-4.5 0q.806 0 1.303-.532q.497-.531.497-1.268V4.5H8.633l-.666 4.423q-.061.465.407 1.021t1.332.556m-4.45 0q.661 0 1.124-.45t.576-1.123L7.583 4.5H5.287q-.327 0-.52.144t-.288.433l-.923 3.158q-.246.788.21 1.527q.457.738 1.49.738m13.5 0q.898 0 1.434-.7q.537-.7.266-1.565l-.973-3.197q-.096-.288-.289-.413t-.519-.125h-2.246l.627 4.427q.113.673.576 1.123t1.124.45m-13.635 9h13.77q.269 0 .442-.173t.173-.442v-7.512q-.202.07-.384.098t-.366.029q-.675 0-1.188-.263t-.974-.84q-.392.488-.967.795t-1.398.308q-.598 0-1.138-.279t-1.085-.825q-.502.546-1.113.825T9.73 11.5q-.629 0-1.226-.24t-1.047-.864q-.737.737-1.288.92q-.55.184-.912.184q-.185 0-.372-.029t-.378-.098v7.512q0 .269.173.442t.442.173m13.77 0H5.12z"
			></path>
		</svg>
	);
}

const SingleMarket = ({ text, logo, onClick, active = false }: { text: string; logo: string; onClick: () => void; active?: boolean }) => {
	return (
		<SettingsTooltip text={text} side="bottom" asChild>
			<Button variant="ghost" size="icon" className={cn('size-10 p-0 m-0.5', active && '')} onClick={onClick}>
				<img src={logo} alt={text} className={cn('size-9 rounded-lg', active && 'ring ring-sky-900')} />
			</Button>
		</SettingsTooltip>
	);
};

export type SourceInfo = {
	text: string;
	logo: string;
	source: MarketSource;
};

export const SettingsSource = ({ prefix }: { prefix: string }) => {
	const [source, setSource] = useStorage(`${prefix}-pricingsource`, (s) => (s === undefined ? MarketSource.Buff : s));

	const sources: SourceInfo[] = [
		{ text: 'Buff163', logo: buffLogo, source: MarketSource.Buff },
		{ text: 'Steam', logo: steamLogo, source: MarketSource.Steam },
		{ text: 'YouPin / UU', logo: youpinLogo, source: MarketSource.YouPin },
		{ text: 'C5Game', logo: c5gameLogo, source: MarketSource.C5Game },
		{ text: 'CSFloat', logo: csfloatLogo, source: MarketSource.CSFloat },
	];

	return (
		<Card className="shadow-md border-muted mx-1">
			<CardContent className="space-y-2 flex flex-col justify-center">
				<div className="flex justify-between items-center">
					<div className="flex items-center gap-2">
						<MaterialSymbolsLightStorefrontOutline className="h-6 w-6" />
						<Label className="text-balance leading-5">Source Market</Label>
						<Badge className="text-xs font-semibold text-accent">NEW</Badge>
					</div>
					<SettingsTooltip text="Determines the source market for all prices. If you are unsure about this, stick to Buff." asChild>
						<Button variant="ghost" size="icon" className="size-8 p-1">
							<MaterialSymbolsHelpOutline className="size-6" />
						</Button>
					</SettingsTooltip>
				</div>
				<div className="w-full flex justify-evenly items-center align-middle">
					{sources.map(({ text, logo, source: singleSource }) => (
						<SingleMarket key={text} text={text} logo={logo} onClick={() => setSource(singleSource)} active={source === singleSource} />
					))}
				</div>
				{[MarketSource.Buff, MarketSource.Steam].includes(source) && (
					<div className="pt-1 px-4">
						<SettingsSelect id={`${prefix}-pricereference`} text="Primary Price" tooltipText="Bid => highest buy order; Ask => lowest listing" options={['Bid', 'Ask']} />
						{prefix !== 'skb' && <SettingsAltMarket prefix={prefix} sources={sources.filter((s) => s.source !== source)} primarySource={source} />}
					</div>
				)}
				{prefix === 'csf' && source !== MarketSource.Steam && (
					<div className="pt-1 px-4">
						<SettingsCheckbox
							id={`${prefix}-steamsupplement`}
							text="Supplement with Steam"
							tooltipText="Adds the respective percentage to the Steam Market ask price to the Steam Market link."
						/>
					</div>
				)}
			</CardContent>
		</Card>
	);
};
