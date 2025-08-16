import { useStorage } from '@plasmohq/storage/hook';
import type { SVGProps } from 'react';
import { CSF_DEFAULT_ACTIONS, type CSFActionType } from '~lib/util/storage';
import { cn } from '~lib/utils';
import { MaterialSymbolsHelpOutline } from '~popup/components/Icons';
import { Badge } from '~popup/ui/badge';
import { Button } from '~popup/ui/button';
import { Card, CardContent } from '~popup/ui/card';
import { Label } from '~popup/ui/label';
import { SettingsTooltip } from './SettingsTooltip';

type ActionButtonsProps = {
	id: string;
	isPro?: boolean;
};

export const ActionKeyIcon = (props: SVGProps<SVGSVGElement>) => (
	<svg xmlns="http://www.w3.org/2000/svg" width="1em" height="1em" viewBox="0 0 24 24" {...props}>
		<path
			fill="currentColor"
			d="m21.6 23l-3.075-3.05q-.45.275-.962.413T16.5 20.5q-1.65 0-2.825-1.175T12.5 16.5q0-1.65 1.175-2.825T16.5 12.5q1.65 0 2.825 1.175T20.5 16.5q0 .575-.15 1.088t-.425.962L23 21.6zM5.5 20.5q-1.65 0-2.825-1.175T1.5 16.5q0-1.65 1.175-2.825T5.5 12.5q1.65 0 2.825 1.175T9.5 16.5q0 1.65-1.175 2.825T5.5 20.5m11-2q.825 0 1.413-.587T18.5 16.5q0-.825-.587-1.412T16.5 14.5q-.825 0-1.412.588T14.5 16.5q0 .825.588 1.413t1.412.587m-11-9q-1.65 0-2.825-1.175T1.5 5.5q0-1.65 1.175-2.825T5.5 1.5q1.65 0 2.825 1.175T9.5 5.5q0 1.65-1.175 2.825T5.5 9.5m11 0q-1.65 0-2.825-1.175T12.5 5.5q0-1.65 1.175-2.825T16.5 1.5q1.65 0 2.825 1.175T20.5 5.5q0 1.65-1.175 2.825T16.5 9.5"
		></path>
	</svg>
);

const InspectInGameIcon = (props: SVGProps<SVGSVGElement>) => (
	<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 18 19" fill="none" width="20" height="21" {...props}>
		<path
			d="M8.25 14.75C11.5637 14.75 14.25 12.0637 14.25 8.75C14.25 5.43629 11.5637 2.75 8.25 2.75C4.93629 2.75 2.25 5.43629 2.25 8.75C2.25 12.0637 4.93629 14.75 8.25 14.75Z"
			stroke="#9EA7B1"
			stroke-width="1.5px"
			stroke-linecap="round"
			stroke-linejoin="round"
			fill="none"
		></path>
		<path d="M15.7508 16.2508L12.4883 12.9883" stroke="#9EA7B1" stroke-width="1.5px" stroke-linecap="round" stroke-linejoin="round" fill="none"></path>
		<path d="M8.25 6.5V11" stroke="#9EA7B1" stroke-width="1.5px" stroke-linecap="round" stroke-linejoin="round" fill="none"></path>
		<path d="M6 8.75H10.5" stroke="#9EA7B1" stroke-width="1.5px" stroke-linecap="round" stroke-linejoin="round" fill="none"></path>
	</svg>
);

const InspectInServerIcon = (props: SVGProps<SVGSVGElement>) => (
	<svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 48 48" {...props}>
		<path
			d="M42 29V12.6666C42 9.72113 39.6122 7.33331 36.6667 7.33331H11.3333C8.38781 7.33331 6 9.72113 6 12.6666V30C6 32.9455 8.38781 35.3333 11.3333 35.3333H28"
			stroke="#9EA7B1"
			stroke-width="4px"
			stroke-linecap="round"
			stroke-linejoin="round"
			fill="none"
		></path>
		<path d="M12.666 42.3333H35.3327" stroke="#9EA7B1" stroke-width="4px" stroke-linecap="round" stroke-linejoin="round" fill="none"></path>
		<path
			d="M23.8333 28.6667C27.8834 28.6667 31.1667 25.3834 31.1667 21.3333C31.1667 17.2832 27.8834 14 23.8333 14C19.7832 14 16.5 17.2832 16.5 21.3333C16.5 25.3834 19.7832 28.6667 23.8333 28.6667Z"
			stroke="#9EA7B1"
			stroke-width="4px"
			stroke-linecap="round"
			stroke-linejoin="round"
			fill="none"
		></path>
		<path d="M28.959 26.576L37.8337 35.3333" stroke="#9EA7B1" stroke-width="4px" stroke-linecap="round" stroke-linejoin="round" fill="none"></path>
	</svg>
);

const ScreenshotIcon = (props: SVGProps<SVGSVGElement>) => (
	<svg xmlns="http://www.w3.org/2000/svg" height="24px" viewBox="0 0 24 24" width="24px" fill="#9EA7B1" {...props}>
		<path d="M0 0h24v24H0z" fill="none" />
		<circle cx="12" cy="12" r="3.2" />
		<path d="M9 2L7.17 4H4c-1.1 0-2 .9-2 2v12c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2h-3.17L15 2H9zm3 15c-2.76 0-5-2.24-5-5s2.24-5 5-5 5 2.24 5 5-2.24 5-5 5z" />
	</svg>
);

const DescriptionIcon = (props: SVGProps<SVGSVGElement>) => (
	<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" {...props}>
		<path
			fill-rule="evenodd"
			clip-rule="evenodd"
			d="M14.6911 2.11058C14.2284 1.9995 13.7487 1.99973 13.1137 2.00003L9.7587 2.00006C8.95373 2.00005 8.28937 2.00004 7.74818 2.04426C7.18608 2.09018 6.66937 2.18875 6.18404 2.43604C5.43139 2.81953 4.81947 3.43145 4.43598 4.1841C4.18868 4.66944 4.09012 5.18614 4.04419 5.74824C3.99998 6.28943 3.99999 6.95378 4 7.75875V16.2414C3.99999 17.0463 3.99998 17.7107 4.04419 18.2519C4.09012 18.814 4.18868 19.3307 4.43598 19.816C4.81947 20.5687 5.43139 21.1806 6.18404 21.5641C6.66937 21.8114 7.18608 21.9099 7.74818 21.9559C8.28937 22.0001 8.95372 22.0001 9.75868 22.0001H14.2413C15.0463 22.0001 15.7106 22.0001 16.2518 21.9559C16.8139 21.9099 17.3306 21.8114 17.816 21.5641C18.5686 21.1806 19.1805 20.5687 19.564 19.816C19.8113 19.3307 19.9099 18.814 19.9558 18.2519C20 17.7107 20 17.0463 20 16.2414V8.8864C20.0003 8.25142 20.0006 7.77161 19.8895 7.30892C19.7915 6.90078 19.6299 6.5106 19.4106 6.15271C19.1619 5.74699 18.8225 5.40789 18.3733 4.95909L17.041 3.62678C16.5922 3.17756 16.2531 2.83813 15.8474 2.5895C15.4895 2.37019 15.0993 2.20857 14.6911 2.11058ZM13 4.00006H9.8C8.94342 4.00006 8.36113 4.00084 7.91104 4.03761C7.47262 4.07343 7.24842 4.13836 7.09202 4.21805C6.7157 4.4098 6.40973 4.71576 6.21799 5.09208C6.1383 5.24848 6.07337 5.47269 6.03755 5.9111C6.00078 6.36119 6 6.94348 6 7.80006V16.2001C6 17.0566 6.00078 17.6389 6.03755 18.089C6.07337 18.5274 6.1383 18.7516 6.21799 18.908C6.40973 19.2844 6.7157 19.5903 7.09202 19.7821C7.24842 19.8618 7.47262 19.9267 7.91104 19.9625C8.36113 19.9993 8.94342 20.0001 9.8 20.0001H14.2C15.0566 20.0001 15.6389 19.9993 16.089 19.9625C16.5274 19.9267 16.7516 19.8618 16.908 19.7821C17.2843 19.5903 17.5903 19.2844 17.782 18.908C17.8617 18.7516 17.9266 18.5274 17.9624 18.089C17.9992 17.6389 18 17.0566 18 16.2001V9.00006H16C14.3431 9.00006 13 7.65692 13 6.00006V4.00006ZM17.56 7.00006C17.4398 6.85796 17.2479 6.66216 16.887 6.30128L15.6988 5.11306C15.3379 4.75218 15.1421 4.56026 15 4.44009V6.00006C15 6.55235 15.4477 7.00006 16 7.00006H17.56Z"
			fill="#9EA7B1"
		></path>
		<path d="M9 13H12" stroke="#9EA7B1" stroke-width="2px" stroke-linecap="round" fill="none"></path>
		<path d="M9 16.5H14.5" stroke="#9EA7B1" stroke-width="2px" stroke-linecap="round" fill="none"></path>
	</svg>
);

const GenCodeIcon = (props: SVGProps<SVGSVGElement>) => (
	<svg xmlns="http://www.w3.org/2000/svg" height="20px" viewBox="0 0 24 24" width="20px" fill="#9EA7B1" {...props}>
		<path d="M0 0h24v24H0z" fill="none" />
		<path d="M16 1H4c-1.1 0-2 .9-2 2v14h2V3h12V1zm3 4H8c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h11c1.1 0 2-.9 2-2V7c0-1.1-.9-2-2-2zm0 16H8V7h11v14z" />
	</svg>
);

const SingleActionButton = ({
	text,
	logo,
	onClick,
	disabled = false,
	active = false,
}: {
	text: string;
	logo: (props: SVGProps<SVGSVGElement>) => JSX.Element;
	onClick: () => void;
	disabled?: boolean;
	active?: boolean;
}) => {
	return (
		<SettingsTooltip text={text} side="bottom" asChild>
			<Button variant="ghost" size="icon" className={cn('size-8 p-0', active && 'bg-neutral-800 ring-[0.5px] ring-neutral-600')} onClick={onClick} disabled={disabled}>
				{logo({ className: cn('size-7 rounded-lg', active && '') })}
			</Button>
		</SettingsTooltip>
	);
};

type ActionInfo = {
	key: CSFActionType;
	text: string;
	logo: (props: SVGProps<SVGSVGElement>) => JSX.Element;
};

export const SettingsActionButtons = ({ id, isPro = false }: ActionButtonsProps) => {
	const [actions, setActions] = useStorage(id, (s) => (s === undefined ? CSF_DEFAULT_ACTIONS : s));

	const actionButtons: ActionInfo[] = [
		{
			key: 'inspect-in-game',
			text: 'Inspect in Game',
			logo: InspectInGameIcon,
		},
		{
			key: 'description',
			text: 'Description',
			logo: DescriptionIcon,
		},
		{
			key: 'in-game-screenshot',
			text: 'In-Game Screenshot',
			logo: ScreenshotIcon,
		},
		{
			key: 'test-in-server',
			text: 'Test in Server',
			logo: InspectInServerIcon,
		},
		{
			key: 'gen-code',
			text: 'Copy !gen',
			logo: GenCodeIcon,
		},
	];

	return (
		<Card className="shadow-md border-muted mx-1">
			<CardContent className="space-y-2 flex flex-col justify-center">
				<div className="flex justify-between items-center">
					<div className="flex items-center gap-2">
						<ActionKeyIcon className="h-6 w-6" />
						<Label className="text-balance leading-5">Action Buttons</Label>
						<Badge variant="purple" className="text-xs font-semibold text-white">
							Pro
						</Badge>
					</div>
					<SettingsTooltip text="Customize the action buttons displayed for listings. Does not affect item popouts. Selecting more than 4 buttons might lead to space issues." asChild>
						<Button variant="ghost" size="icon" className="size-8 p-1">
							<MaterialSymbolsHelpOutline className="size-6" />
						</Button>
					</SettingsTooltip>
				</div>
				<div className="w-full flex justify-evenly items-center align-middle">
					{actionButtons.map(({ key, text, logo }) => (
						<SingleActionButton key={key} text={text} logo={logo} onClick={() => setActions({ ...actions, [key]: !actions[key] })} active={actions[key]} disabled={!isPro} />
					))}
				</div>
			</CardContent>
		</Card>
	);
};
