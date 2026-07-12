import betterfloatLogo from '@@/assets/icon.png?inline';
import { useStorage } from '@plasmohq/storage/hook';
import { useEffect, useState } from 'react';
import { DISCORD_URL, GITHUB_URL, WEBSITE_URL } from '~lib/util/globals';
import { DEFAULT_SETTINGS, type IStorage } from '~lib/util/storage';
import { IcRoundWarning, MdiGithub, SkillIconsDiscord } from '~popup/components/Icons';
import { Badge } from '~popup/ui/badge';
import { Button } from '~popup/ui/button';

export default function Header() {
	const [user] = useStorage<IStorage['user']>('user', DEFAULT_SETTINGS.user);
	const [showPermissionsWarning, setShowPermissionsWarning] = useState(false);
	const manifest = chrome.runtime.getManifest();
	const hostPermissions = manifest.host_permissions as string[];

	const requestPermissions = async () => {
		const granted = await chrome.permissions.request({ origins: hostPermissions });
		if (granted) {
			setShowPermissionsWarning(false);
		} else {
			console.log('Permission denied');
		}
	};

	useEffect(() => {
		chrome.permissions.contains({ origins: hostPermissions }).then((granted) => {
			setShowPermissionsWarning(!granted);
		});
	}, []);

	return (
		<header className="w-full flex align-middle justify-between px-4 py-1.5 bg-card text-card-foreground border-b border-muted shadow-xs">
			<div className="flex gap-2 align-middle items-center">
				<img className="h-[38px] cursor-pointer" src={betterfloatLogo} onClick={() => window.open(WEBSITE_URL)} />
				<Badge variant={user.plan.type === 'pro' ? 'purple' : 'secondary'}>{user.plan.type === 'pro' ? 'Pro' : 'Free'}</Badge>
				<Badge id="version" variant="outline" className="border-muted text-muted-foreground">
					v. {manifest.version_name ?? manifest.version}
				</Badge>
			</div>
			<div className="flex gap-1">
				{showPermissionsWarning && (
					<Button variant="ghost" size="icon" id="permissions-warning" onClick={requestPermissions}>
						<IcRoundWarning height={30} width={30} filter="invert(19%) sepia(98%) saturate(7473%) hue-rotate(359deg) brightness(103%) contrast(109%)" />
					</Button>
				)}

				<Button variant="ghost" size="icon" onClick={() => window.open(DISCORD_URL)} title={DISCORD_URL}>
					<SkillIconsDiscord height={30} width={30} />
				</Button>

				<Button variant="ghost" size="icon" onClick={() => window.open(GITHUB_URL)} title={GITHUB_URL}>
					<MdiGithub height={30} width={30} color="white" />
				</Button>
			</div>
		</header>
	);
}
