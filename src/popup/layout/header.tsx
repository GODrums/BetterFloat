import '~style.css';
import betterfloatLogo from 'data-base64:~/../assets/icon.png';
import { useStorage } from '@plasmohq/storage/hook';
import { useEffect } from 'react';
import { DISCORD_URL, GITHUB_URL, WEBSITE_URL } from '~lib/util/globals';
import { DEFAULT_SETTINGS, type IStorage } from '~lib/util/storage';
import { IcRoundWarning, MdiGithub, SkillIconsDiscord } from '~popup/components/Icons';
import { Badge } from '~popup/ui/badge';
import { Button } from '~popup/ui/button';

export default function Header() {
	const [user] = useStorage<IStorage['user']>('user', DEFAULT_SETTINGS.user);
	const hostpermissions = chrome.runtime.getManifest().host_permissions as string[];

	const requestPermissions = () => {
		chrome.permissions
			.request({
				origins: hostpermissions,
			})
			.then((granted) => {
				if (!granted) {
					console.log('Permission denied');
				} else {
					document.getElementById('permissions-warning')!.classList.add('hidden');
				}
			});
	};

	useEffect(() => {
		document.getElementById('version')!.textContent = `v. ${chrome.runtime.getManifest().version_name ?? chrome.runtime.getManifest().version}`;

		chrome.permissions
			.contains({
				origins: hostpermissions,
			})
			.then((result) => {
				const warning = document.getElementById('permissions-warning')!;
				if (result) {
					warning.classList.add('hidden');
				} else {
					warning.classList.remove('hidden');
				}
			});
	});

	return (
		<header className="w-full flex align-middle justify-between px-4 py-1.5 bg-card text-card-foreground border-b border-muted shadow-sm">
			<div className="flex gap-2 align-middle items-center">
				<img className="h-[38px] cursor-pointer" src={betterfloatLogo} onClick={() => window.open(WEBSITE_URL)} />
				<Badge variant={user.plan.type === 'pro' ? 'purple' : 'secondary'}>{user.plan.type === 'pro' ? 'Pro' : 'Free'}</Badge>
				<Badge id="version" variant="outline" className="border-muted text-muted-foreground">
					v. 3.2.0
				</Badge>
			</div>
			<div className="flex gap-1">
				<Button variant="ghost" size="icon" className="" id="permissions-warning" onClick={requestPermissions}>
					<IcRoundWarning height={30} width={30} filter="invert(19%) sepia(98%) saturate(7473%) hue-rotate(359deg) brightness(103%) contrast(109%)" />
				</Button>

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
