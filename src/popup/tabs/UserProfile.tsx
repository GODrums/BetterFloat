import betterfloatLogo from 'data-base64:~/../assets/icon.png';
import { TabTemplate } from './TabTemplate';
import { useStorage } from '@plasmohq/storage/hook';
import type { BFUser } from '~lib/util/storage';
import { Badge, Button, Card, CardContent } from '~popup/components/Shadcn';
import { MdiSteamColored } from '~popup/components/Icons';
import { Bell, Globe, Sparkles, Star, Zap } from 'lucide-react';

export const UserProfile = () => {
	const [user, setUser] = useStorage<BFUser>('user');

	const steamSignin = () => {};

	return (
		<TabTemplate value="user">
			<div className="w-full mx-auto pt-6">
				{user?.steam?.isLoggedIn ? (
					<>
						<div className="flex justify-center">
							<img className="h-20 rounded-full" src={betterfloatLogo} />
						</div>
						<h1 className="pt-2 text-4xl md:text-7xl font-bold text-center bg-clip-text text-transparent bg-gradient-to-b from-neutral-50 to-neutral-400 bg-opacity-50">BetterFloat</h1>
						<h2 className="pt-4 text-lg font-semibold text-center bg-clip-text text-transparent bg-gradient-to-b from-neutral-50 to-neutral-400 bg-opacity-50">
							open-source & <span className="text-blue-500 dark:text-blue-500">community</span>-driven
						</h2>
					</>
				) : (
					<div className="flex flex-col items-center justify-center gap-4">
						<div className="flex flex-col items-center justify-center gap-1 mb-2">
							<h1 className="pt-2 text-4xl md:text-7xl font-bold text-center bg-clip-text text-transparent bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500">BetterFloat Pro</h1>
							<Badge variant="outline" className="border-muted">
								BETA
							</Badge>
						</div>
						<Button variant="default" className="flex gap-2 bg-sky-700 hover:bg-sky-600 text-white hover:text-gray-200" onClick={steamSignin}>
							<MdiSteamColored className="w-6 h-6 fill-white" />
							Sign in with Steam
						</Button>
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
					</div>
				)}
			</div>
		</TabTemplate>
	);
};
