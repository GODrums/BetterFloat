import { useStorage } from '@plasmohq/storage/hook';
import { Label } from '~popup/ui/label';
import { EnableSwitch } from '~popup/ui/switch';

export const SettingsEnable = ({ id }: { id: string }) => {
	const [checked, setChecked] = useStorage(id);

	return (
		<div className="flex justify-center items-center space-x-2 w-full mt-2">
			<EnableSwitch id={id} checked={checked} onCheckedChange={setChecked} />
			<Label htmlFor={id} className={checked ? 'text-card-foreground' : 'text-muted-foreground'}>
				Enabled
			</Label>
		</div>
	);
};
