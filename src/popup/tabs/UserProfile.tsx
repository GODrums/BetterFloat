import betterfloatLogo from 'data-base64:~/../assets/icon.png';
import { useStorage } from '@plasmohq/storage/hook';
import { Bell, Globe, Sparkles, Star, Zap } from 'lucide-react';
import { useState } from 'react';
import { getSteamLogin } from '~lib/util/steam';
import type { IStorage } from '~lib/util/storage';
import { MdiSteamColored } from '~popup/components/Icons';
import { Avatar, AvatarFallback, AvatarImage, Badge, Button, Card, CardContent } from '~popup/components/Shadcn';
import { TabTemplate } from './TabTemplate';

export const UserProfile = () => {
	const [user, setUser] = useStorage<IStorage['user']>('user');
	const [permissionDenied, setPermissionDenied] = useState(false);
	const [isLoading, setIsLoading] = useState(false);

	const steamSignin = async () => {
		setPermissionDenied(false);
		setIsLoading(true);

		try {
			const granted = await chrome.permissions.request({ origins: ['*://*.steamcommunity.com/*'] });
			if (!granted) {
				setPermissionDenied(true);
				console.warn('Permission denied');
				return;
			}

			const steamUser = await getSteamLogin();
			if (steamUser) {
				setUser({ ...user, steam: steamUser });
			}
		} finally {
			setIsLoading(false);
		}
	};

	const steamLogout = () => {
		setUser({ ...user, steam: { logged_in: false } });
	};

	return (
		<TabTemplate value="user">
			<div className="w-full mx-auto pt-4">
				<div className="flex flex-col items-center justify-center gap-4">
					<div className="flex flex-col items-center justify-center gap-1 mb-2">
						<h1 className="pt-2 text-4xl md:text-7xl font-bold text-center bg-clip-text text-transparent bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500">BetterFloat Pro</h1>
						<Badge variant="outline" className="border-muted">
							BETA
						</Badge>
					</div>
					{user?.steam?.logged_in ? (
						<>
							<div className="flex flex-col items-center justify-center">
								<div className="relative mb-2">
									<div className="absolute inset-0 bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500 rounded-full animate-spin-slow blur-sm" />
									<div className="relative bg-background rounded-full p-0.5">
										<Avatar className="size-20">
											<AvatarImage src={user.steam.avatar_url} />
											<AvatarFallback>{user.steam.display_name?.slice(0, 2)}</AvatarFallback>
										</Avatar>
									</div>
								</div>
								<span className="text-lg font-semibold">{user.steam.display_name}</span>
								<span className="text-sm text-muted-foreground">{user.steam.steamid}</span>
							</div>

							<Card className="shadow-md border-muted mx-1 w-full">
								<CardContent className="space-y-3 flex flex-col justify-center">
									{/* Display details about current plan / payment details */}
									Soon™
								</CardContent>
							</Card>

							<div className="flex justify-center mt-4">
								<Button variant="destructive" onClick={steamLogout}>
									Logout
								</Button>
							</div>
						</>
					) : (
						<>
							<Button variant="default" className="flex gap-2 bg-sky-700 hover:bg-sky-600 text-white hover:text-gray-200" onClick={steamSignin} disabled={isLoading}>
								{isLoading ? (
									<svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
										<circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
										<path
											className="opacity-75"
											fill="currentColor"
											d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
										></path>
									</svg>
								) : (
									<>
										<MdiSteamColored className="w-6 h-6 fill-white" />
										Sign in with Steam
									</>
								)}
							</Button>
							{permissionDenied && (
								<div className="flex items-center justify-center gap-2 px-3 py-2 bg-red-500/20 rounded-lg border border-red-500/30">
									<span className="text-sm text-red-500">Please allow access to Steam to login</span>
								</div>
							)}
							<div className="flex items-center justify-center gap-2 px-3 py-2 my-2 bg-gradient-to-r from-purple-500/20 to-blue-500/20 rounded-lg border border-purple-500/30">
								<Sparkles className="w-5 h-5 text-purple-500 animate-pulse" />
								<span className="text-lg font-semibold text-center">Free during the Beta!</span>
								<Sparkles className="w-5 h-5 text-purple-500 animate-pulse" />
							</div>
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
					)}
				</div>
			</div>
		</TabTemplate>
	);
};
