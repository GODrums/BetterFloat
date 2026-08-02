import { Bell, Globe, Star, Zap } from 'lucide-react';
import { getSteamLogin, SteamLoginError } from '~lib/util/steam';
import type { IStorage } from '~lib/util/storage';
import { MdiSteamColored } from '~popup/components/Icons';
import { LoadingSpinner } from '~popup/components/LoadingSpinner';
import { Button } from '~popup/ui/button';
import { WarningCallout } from '~popup/ui/callout';
import { Card, CardContent } from '~popup/ui/card';

interface LoggedOutViewProps {
	user: IStorage['user'];
	setUser: (user: IStorage['user']) => void;
}

type SteamSignInError = 'permission-denied' | 'permission-error' | 'not-signed-in' | 'network' | 'steam-unavailable' | 'invalid-response' | 'unexpected';

const steamSignInErrorMessages: Record<SteamSignInError, string> = {
	'permission-denied': 'Steam access was not granted. Try again and allow access when your browser asks.',
	'permission-error': 'Your browser could not request access to Steam. Try again or review BetterFloat’s site permissions.',
	'not-signed-in': 'You are not signed in to Steam in this browser. Sign in on Steam, then try again.',
	network: 'Could not reach Steam. Check your internet connection, then try again.',
	'steam-unavailable': 'Steam could not complete the request right now. Please wait a moment and try again.',
	'invalid-response': 'Steam responded, but BetterFloat could not read your account details. Reload Steam and try again.',
	unexpected: 'Something went wrong while signing in with Steam. Please try again.',
};

export function LoggedOutView({ user, setUser }: LoggedOutViewProps) {
	const [signInError, setSignInError] = useState<SteamSignInError | null>(null);
	const [isLoading, setIsLoading] = useState(false);

	const steamSignin = async () => {
		setSignInError(null);
		setIsLoading(true);

		try {
			try {
				if (!(await chrome.permissions.contains({ origins: ['*://*.steamcommunity.com/*', '*://*.steampowered.com/*'] }))) {
					const granted = await chrome.permissions.request({ origins: ['*://*.steamcommunity.com/*', '*://*.steampowered.com/*'] });

					if (!granted) {
						setSignInError('permission-denied');
						return;
					}
				}
			} catch (error) {
				console.error('Failed to request Steam permissions:', error);
				setSignInError('permission-error');
				return;
			}

			const steamUser = await getSteamLogin();
			if (!steamUser) {
				setSignInError('not-signed-in');
				return;
			}

			setUser({ ...user, steam: steamUser });
		} catch (error) {
			console.error('Steam sign-in failed:', error);
			if (error instanceof SteamLoginError) {
				setSignInError(error.code);
			} else {
				setSignInError('unexpected');
			}
		} finally {
			setIsLoading(false);
		}
	};

	return (
		<>
			<div className="flex flex-col items-center justify-center gap-1 mb-2">
				<h1 className="pt-2 text-4xl md:text-7xl font-bold text-center bg-clip-text text-transparent bg-linear-to-r from-blue-500 via-purple-500 to-pink-500">BetterFloat Pro</h1>
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
			{signInError && <WarningCallout text={steamSignInErrorMessages[signInError]} className="w-full text-center" />}
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
