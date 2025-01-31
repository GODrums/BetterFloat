import { Check, X } from 'lucide-react';
import { useEffect, useState } from 'react';
import { MarketSource } from '~lib/util/globals';
import { decodeJWT, refreshToken, verifyPlan } from '~lib/util/jwt';
import { getSteamLogin } from '~lib/util/steam';
import { ExtensionStorage, type IStorage } from '~lib/util/storage';
import { LoadingSpinner } from '~popup/components/LoadingSpinner';
import { Avatar, AvatarFallback, AvatarImage } from '~popup/ui/avatar';
import { Button } from '~popup/ui/button';
import { WarningCallout } from '~popup/ui/callout';
import { Card, CardContent } from '~popup/ui/card';

interface LoggedInViewProps {
	user: IStorage['user'];
	setUser: (user: IStorage['user']) => void;
}

const features = ['Access to 9+ Markets', 'Most Accurate Prices (1 hour refreshes)', 'Exclusive Instant Notifications for New Listings', 'Auto-Refresh on 3+ Markets', 'Early Access to New Features'];

export function LoggedInView({ user, setUser }: LoggedInViewProps) {
	const [permissionDenied, setPermissionDenied] = useState(false);
	const [syncing, setSyncing] = useState(false);
	const [syncCooldown, setSyncCooldown] = useState(false);
	const [refreshing, setRefreshing] = useState(false);
	const [refreshCooldown, setRefreshCooldown] = useState(false);
	const isDevMode = chrome.runtime.getManifest().name.includes('DEV');

	const steamLogout = () => {
		setUser({ ...user, steam: { logged_in: false }, plan: { type: 'free' } });
	};

	const resetUpdateCounter = (source: MarketSource) => {
		return ExtensionStorage.sync.setItem(`${source}-update`, 0);
	};

	const refreshPrices = async () => {
		if (refreshCooldown || !user?.steam?.steamid) return;

		setRefreshing(true);
		setRefreshCooldown(true);

		try {
			const allSources = [MarketSource.Buff, MarketSource.Steam, MarketSource.YouPin, MarketSource.C5Game, MarketSource.CSFloat];
			await Promise.all(allSources.map((source) => resetUpdateCounter(source)));
		} finally {
			setRefreshing(false);
			setTimeout(() => setRefreshCooldown(false), 60000); // 1 minute cooldown
		}
	};

	const changePlan = async () => {
		const newPlanType = user?.plan?.type === 'pro' ? 'free' : 'pro';

		if (newPlanType === 'free') {
			if (!isDevMode) {
				return;
			}

			setUser({ ...user, plan: { type: 'free' } });
		}
		if (newPlanType === 'pro') {
			await chrome.tabs.create({ url: 'https://betterfloat.com/pricing', active: true });
		}
	};

	const syncAccount = async () => {
		if (syncCooldown || !user?.steam?.steamid) return;
		// make sure we got the required permissions

		if (permissionDenied) {
			const newlyGranted = await chrome.permissions.request({ origins: ['https://*/*', 'http://*/*'], permissions: ['notifications'] });
			if (!newlyGranted) {
				console.warn('Permission denied');
				return;
			}
			setPermissionDenied(false);
		}

		setSyncing(true);
		setSyncCooldown(true);

		const steamUser = await getSteamLogin();
		if (steamUser?.steamid) {
			setUser({ ...user, steam: steamUser });
		}

		try {
			const token = await refreshToken(user.steam.steamid);
			if (!token) {
				return;
			}
			const verifiedPlan = await verifyPlan(decodeJWT(token), user);
			setUser({ ...user, plan: verifiedPlan });

			ExtensionStorage.sync.setItem('bm-enable', true);
			ExtensionStorage.sync.setItem('lis-enable', true);
			ExtensionStorage.sync.setItem('csm-enable', true);
			ExtensionStorage.sync.setItem('dm-enable', true);
			ExtensionStorage.sync.setItem('baron-enable', true);
			ExtensionStorage.sync.setItem('bs-enable', true);
		} finally {
			setSyncing(false);
			setTimeout(() => setSyncCooldown(false), 60000); // 1 minute cooldown
		}
	};

	useEffect(() => {
		// check for permissions
		chrome.permissions.contains({ origins: ['https://*/*', 'http://*/*'], permissions: ['notifications'] }, (result) => {
			if (!result) {
				setPermissionDenied(true);
			}
		});
	}, []);

	const PlanFeatureIcon = user.plan.type === 'pro' ? <Check className="w-5 h-5 text-green-500" /> : <X className="w-5 h-5 text-red-500" />;

	return (
		<>
			<div className="flex flex-col items-center justify-center">
				<div className="relative mb-2">
					{user.plan.type === 'pro' ? (
						<div className="absolute inset-0 bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500 rounded-full animate-spin-slow blur-sm" />
					) : (
						<div className="absolute inset-0 bg-gradient-to-r from-gray-500 via-gray-400 to-gray-300 rounded-full animate-spin-slow blur-sm" />
					)}
					<div className="relative bg-background rounded-full p-0.5">
						<Avatar className="size-20">
							<AvatarImage src={user.steam.avatar_url} />
							<AvatarFallback>{user.steam.display_name?.slice(0, 2)}</AvatarFallback>
						</Avatar>
					</div>
				</div>
				<span className="max-w-[250px] text-lg font-semibold truncate">{user.steam.display_name}</span>
				<span className="text-sm text-muted-foreground">{user.steam.steamid}</span>
			</div>

			<Card className="shadow-md border-muted mx-1 w-full">
				<CardContent className="space-y-3 flex flex-col justify-center">
					<p className="text-base font-semibold leading-none tracking-tight uppercase">Current plan</p>

					<div className="flex justify-between items-center gap-2">
						{user.plan.type === 'pro' ? (
							<span className="font-semibold text-lg bg-clip-text text-transparent bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500">Pro</span>
						) : (
							<span className="text-lg font-semibold text-center">Free</span>
						)}
						<Button variant="outline" onClick={syncAccount} disabled={syncing || syncCooldown}>
							{syncing ? <LoadingSpinner /> : 'Sync Account'}
						</Button>
						<Button variant="secondary" onClick={changePlan}>
							{user.plan.type === 'pro' ? 'Manage' : 'Upgrade'}
						</Button>
					</div>
					{user.plan.type === 'pro' && user.plan.endDate && (
						<>
							<p className="text-sm text-muted-foreground text-center">Subscription ends on {new Date(user.plan.endDate).toLocaleDateString()}</p>
							<Button variant="outline" onClick={refreshPrices} disabled={refreshing || refreshCooldown}>
								{refreshing ? <LoadingSpinner /> : 'Refresh prices manually'}
							</Button>
						</>
					)}
					{permissionDenied && <WarningCallout text="Please grant the required permissions to sync your account!" className="text-center" />}

					{features.map((feature, index) => (
						<div key={index} className="flex items-center gap-2 text-xs">
							{PlanFeatureIcon}
							<span>{feature}</span>
						</div>
					))}
				</CardContent>
			</Card>

			<div className="flex justify-center mt-2">
				<Button variant="destructive" onClick={steamLogout}>
					Logout
				</Button>
			</div>
		</>
	);
}
