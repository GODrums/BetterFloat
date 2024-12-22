import type { IStorage } from '~lib/util/storage';
import { TabTemplate } from '../TabTemplate';
import { LoggedInView } from './UserProfileLoggedIn';
import { LoggedOutView } from './UserProfileLoggedOut';

interface UserProfileProps {
	user: IStorage['user'];
	setUser: (user: IStorage['user']) => void;
}

export const UserProfile = ({ user, setUser }: UserProfileProps) => {
	return (
		<TabTemplate value="user">
			<div className="flex flex-col items-center justify-center gap-4 pt-4">
				{user.steam.logged_in ? <LoggedInView user={user} setUser={setUser} /> : <LoggedOutView user={user} setUser={setUser} />}
			</div>
		</TabTemplate>
	);
};
