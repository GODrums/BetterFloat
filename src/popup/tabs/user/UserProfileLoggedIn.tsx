import type { IStorage } from '~lib/util/storage';
import { Avatar, AvatarFallback, AvatarImage } from '~popup/ui/avatar';
import { Button } from '~popup/ui/button';
import { Card, CardContent } from '~popup/ui/card';

interface LoggedInViewProps {
	user: IStorage['user'];
	setUser: (user: IStorage['user']) => void;
}

export function LoggedInView({ user, setUser }: LoggedInViewProps) {
	const steamLogout = () => {
		setUser({ ...user, steam: { logged_in: false } });
	};

	return (
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
					<p className="text-base font-semibold leading-none tracking-tight uppercase">Current plan</p>

					<div className="flex justify-between items-center gap-2">
						{user.plan.type === 'free' ? (
							<span className="text-lg font-semibold text-center">Free</span>
						) : (
							<span className="font-semibold text-lg bg-clip-text text-transparent bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500">Pro</span>
						)}
						<Button variant="secondary" asChild>
							<a href="https://betterfloat.com/pricing" target="_blank" rel="noreferrer">
								{user.plan.type === 'free' ? 'Upgrade' : 'Manage'}
							</a>
						</Button>
					</div>
				</CardContent>
			</Card>

			<div className="flex justify-center mt-4">
				<Button variant="destructive" onClick={steamLogout}>
					Logout
				</Button>
			</div>
		</>
	);
}
