import { Bell, Globe, Sparkles, Star, Zap } from 'lucide-react';
import { useState } from 'react';
import { getSteamLogin } from '~lib/util/steam';
import type { IStorage } from '~lib/util/storage';
import { MdiSteamColored } from '~popup/components/Icons';
import { LoadingSpinner } from '~popup/components/LoadingSpinner';
import { Badge } from '~popup/ui/badge';
import { Button } from '~popup/ui/button';
import { WarningCallout } from '~popup/ui/callout';
import { Card, CardContent } from '~popup/ui/card';

interface LoggedOutViewProps {
	user: IStorage['user'];
	setUser: (user: IStorage['user']) => void;
}

export function LoggedOutView({ user, setUser }: LoggedOutViewProps) {
	const [permissionDenied, setPermissionDenied] = useState(false);
	const [noSteamLogon, setNoSteamLogon] = useState(false);
	const [isLoading, setIsLoading] = useState(false);

	const steamSignin = async () => {
		setPermissionDenied(false);
		setIsLoading(true);

		try {
			const granted = await chrome.permissions.request({ origins: ['https://*/*', 'http://*/*'], permissions: ['notifications'] });
			if (!granted) {
				setPermissionDenied(true);
				console.warn('Permission denied');
				return;
			}

			const steamUser = await getSteamLogin();
			if (!steamUser) {
				console.warn('Failed to get Steam login');
				setNoSteamLogon(true);
				return;
			}

			setUser({ ...user, steam: steamUser });
		} finally {
			setIsLoading(false);
		}
	};

	return (
		<>
			<div className="flex flex-col items-center justify-center gap-1 mb-2">
				<h1 className="pt-2 text-4xl md:text-7xl font-bold text-center bg-clip-text text-transparent bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500">BetterFloat Pro</h1>
			</div>
			<Button variant="default" className="flex gap-2 bg-sky-700 hover:bg-sky-600 text-white hover:text-gray-200" onClick={steamSignin} disabled={isLoading}>
				{isLoading ? (
					<LoadingSpinner />
				) : (
					<>
						<MdiSteamColored className="w-6 h-6 fill-white" />
						Sign in with Steam
					</>
				)}
			</Button>
			{noSteamLogon && (
				<div className="flex items-center justify-center gap-2 px-3 py-2 bg-amber-500/20 rounded-lg border border-amber-500/30">
					<span className="text-sm text-amber-500">Login to Steam to continue</span>
				</div>
			)}
			{permissionDenied && <WarningCallout text="Please allow access to Steam to login" />}
			<Card className="shadow-md border-muted mx-1 w-full">
				<CardContent className="space-y-3 flex flex-col justify-center">
					<p className="text-base font-semibold leading-none tracking-tight uppercase">Features</p>
					<div className="flex items-center gap-2">
						<Globe className="w-5 h-5 text-blue-500" />
						<span>Access to More Markets</span>
					</div>
					<div className="flex items-center gap-2">
						<Zap className="w-5 h-5 text-yellow-500" />
						<span>Enhanced Price Refresh Rate (1 hour)</span>
					</div>
					<div className="flex items-center gap-2">
						<Bell className="w-5 h-5 text-green-500" />
						<span>Exclusive Instant Notifications for New Listings</span>
					</div>
					<div className="flex items-center gap-2">
						<Star className="w-5 h-5 text-purple-500" />
						<span>Early Access to New Features</span>
					</div>
				</CardContent>
			</Card>
		</>
	);
}
