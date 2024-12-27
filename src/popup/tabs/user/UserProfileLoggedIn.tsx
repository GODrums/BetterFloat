import { Check, Sparkles, X } from 'lucide-react';
import { useState } from 'react';
import { ExtensionStorage, type IStorage } from '~lib/util/storage';
import { Avatar, AvatarFallback, AvatarImage } from '~popup/ui/avatar';
import { Button } from '~popup/ui/button';
import { Card, CardContent } from '~popup/ui/card';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '~popup/ui/dialog';

interface LoggedInViewProps {
	user: IStorage['user'];
	setUser: (user: IStorage['user']) => void;
}

export function LoggedInView({ user, setUser }: LoggedInViewProps) {
	const [showUpgradeDialog, setShowUpgradeDialog] = useState(false);
	
	const isDevMode = chrome.runtime.getManifest().name.includes('DEV');

	const steamLogout = () => {
		setUser({ ...user, steam: { logged_in: false } });
	};

	const changePlan = () => {
		const newPlanType = user.plan.type === 'free' ? 'pro' : 'free';

		if (newPlanType === 'free') {
			if (!isDevMode) {
				return;
			}
		}
		if (newPlanType === 'pro') {
			if (new Date().getTime() > new Date('2025-01-15').getTime()) {
				return;
			}
			ExtensionStorage.sync.setItem('bm-enable', true);
			ExtensionStorage.sync.setItem('lis-enable', true);
			ExtensionStorage.sync.setItem('csm-enable', true);
			ExtensionStorage.sync.setItem('dm-enable', true);
			ExtensionStorage.sync.setItem('baron-enable', true);
			ExtensionStorage.sync.setItem('bs-enable', true);
		}

		const newPlan = { type: newPlanType } as IStorage['user']['plan'];
		if (newPlanType === 'pro') {
			newPlan.expiry = new Date('2025-01-15').getTime();
		}

		setUser({ ...user, plan: newPlan });
		setShowUpgradeDialog(false);
	};

	const PlanFeatureIcon = user.plan.type === 'free' ? <X className="w-5 h-5 text-red-500" /> : <Check className="w-5 h-5 text-green-500" />;

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
						{user.plan.type === 'free' ? (
							<span className="text-lg font-semibold text-center">Free</span>
						) : (
							<span className="font-semibold text-lg bg-clip-text text-transparent bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500">Pro</span>
						)}
						<Button variant="secondary" onClick={() => (user.plan.type === 'free' ? setShowUpgradeDialog(true) : changePlan())}>
							{user.plan.type === 'free' ? 'Upgrade' : 'Manage'}
						</Button>
					</div>

					<div className="flex items-center gap-2">
						{PlanFeatureIcon}
						<span>Access to More Markets</span>
					</div>
					<div className="flex items-center gap-2">
						{PlanFeatureIcon}
						<span>Enhanced Price Refresh Rate (1 hour)</span>
					</div>
					<div className="flex items-center gap-2">
						{PlanFeatureIcon}
						{/* Exclusive Instant Notifications for New Listings */}
						<span>Live Notifications for New Listings (unavailable in beta)</span>
					</div>
					<div className="flex items-center gap-2">
						{PlanFeatureIcon}
						<span>Early Access to New Features</span>
					</div>
				</CardContent>
			</Card>

			<div className="flex items-center justify-center gap-2 px-3 py-2 bg-gradient-to-r from-purple-500/20 to-blue-500/20 rounded-lg border border-purple-500/30">
				<Sparkles className="w-8 h-8 text-purple-500 animate-pulse" />
				<span className="text-lg font-semibold text-center">Upgrade to Pro for free during the Beta!</span>
				<Sparkles className="w-8 h-8 text-purple-500 animate-pulse" />
			</div>

			<div className="flex justify-center mt-4">
				<Button variant="destructive" onClick={steamLogout}>
					Logout
				</Button>
			</div>

			<Dialog open={showUpgradeDialog} onOpenChange={setShowUpgradeDialog}>
				<DialogContent>
					<DialogHeader>
						<DialogTitle>Upgrade to Pro Plan</DialogTitle>
						<DialogDescription>
							<span className="text-red-500">Please note that this is a beta version, which does not represent the final product and is subject to change.</span>
							<br />
							You are encouraged to report all encountered bugs in our Discord server!
							<br />
							The Pro Plan is <span className="text-emerald-400">completely free</span> during the beta period and you will automatically be downgraded once the beta ends.
						</DialogDescription>
					</DialogHeader>
					<DialogFooter className="flex-row justify-center gap-2">
						<Button variant="outline" onClick={() => setShowUpgradeDialog(false)}>
							Cancel
						</Button>
						<Button onClick={changePlan}>Start Testing</Button>
					</DialogFooter>
				</DialogContent>
			</Dialog>
		</>
	);
}
