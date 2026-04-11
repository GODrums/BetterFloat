import type { Extension } from '~lib/@typings/ExtensionTypes';
import { toTitleCase } from '~lib/util/helperfunctions';

export function adjustCSFTitle(state: Extension.URLState) {
	let newTitle = '';
	const titleMap = {
		'/': 'Home',
		'/profile/offers': 'Offers',
		'/profile/watchlist': 'Watchlist',
		'/profile/trades': 'Trades',
		'/sell': 'Selling',
		'/profile': 'Profile',
		'/support': 'Support',
		'/profile/deposit': 'Deposit',
	};
	if (state.path === '/search') {
		const query = new URLSearchParams(location.search).get('sort_by');
		newTitle = query ? toTitleCase(query.replace(/_/g, ' ')) : 'Search';
	} else if (state.path in titleMap) {
		newTitle = titleMap[state.path as keyof typeof titleMap];
	} else if (location.pathname.includes('/stall/')) {
		const username = document.querySelector('.username')?.textContent;
		if (username) {
			newTitle = `${username}'s Stall`;
		}
	}

	if (newTitle !== '') {
		document.title = `${newTitle} - CSFloat`;
	}
}
