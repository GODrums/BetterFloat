import { useStorage } from '@plasmohq/storage/hook';
import { Badge } from '~popup/ui/badge';
import { Label } from '~popup/ui/label';
import { EnableSwitch } from '~popup/ui/switch';

export const SettingsEnable = ({ id, isPremiumFeature = false, hasProPlan }: { id: string; isPremiumFeature?: boolean; hasProPlan?: boolean }) => {
	const [checked, setChecked] = useStorage<boolean | undefined>(id, (v) => {
		if (hasProPlan === false) return false;
		return v;
	});

	return (
		<div className="flex justify-center items-center space-x-2 w-full mt-2">
			<EnableSwitch id={id} checked={checked} onCheckedChange={setChecked} disabled={hasProPlan === false} />
			<Label htmlFor={id} className={checked ? 'text-card-foreground' : 'text-muted-foreground'}>
				Enabled
			</Label>
			{isPremiumFeature && <Badge variant="purple">Pro</Badge>}
		</div>
	);
};
