import { useStorage } from '@plasmohq/storage/hook';
import { DEFAULT_SETTINGS, type IStorage } from '~lib/util/storage';
import { TabTemplate } from '../TabTemplate';
import { LoggedInView } from './UserProfileLoggedIn';
import { LoggedOutView } from './UserProfileLoggedOut';

export const UserProfile = () => {
	const [user, setUser] = useStorage<IStorage['user']>('user', DEFAULT_SETTINGS.user);

	return (
		<TabTemplate value="user">
			<div className="flex flex-col items-center justify-center gap-4 pt-4">
				{user.steam.logged_in ? (
					<LoggedInView user={user} setUser={setUser} />
				) : (
					<LoggedOutView user={user} setUser={setUser}/>
				)}
			</div>
		</TabTemplate>
	);
};
