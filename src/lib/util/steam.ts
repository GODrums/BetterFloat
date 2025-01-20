import type { Steam } from '~lib/@typings/SteamTypes';
import type { SettingsUser } from './storage';

export async function getSteamLogin(): Promise<SettingsUser['steam'] | null> {
	const settingsUser = {} as SettingsUser;

	const steamPage = await fetch('https://steamcommunity.com/', {
		credentials: 'include',
		headers: {
			Accept: 'text/html,application/xhtml+xml,application/xml;q=0.9;q=0.8,application/signed-exchange;v=b3;q=0.7',
		},
	});
	const steamPageText = await steamPage.text();

	// get steam user info
	const steamUserInfoMatch = steamPageText.match(/data-userinfo="{(.*?)}"/);
	if (!steamUserInfoMatch) {
		return null;
	}

	// Convert HTML entities and create valid JSON
	const decodedString = decodeURIComponent(steamUserInfoMatch[1])
		.replace(/&quot;/g, '"')
		.replace(/&amp;/g, '&');
	const steamUserInfo = JSON.parse(`{${decodedString}}`) as Steam.UserInfo;
	settingsUser.steam = steamUserInfo;

	// Parse avatar image and alt text
	const avatarMatch = steamPageText.match(/<img src="(https:\/\/avatars\.cloudflare\.steamstatic\.com\/[^"]+)" alt="([^"]+)">/);
	if (avatarMatch) {
		settingsUser.steam.avatar_url = avatarMatch[1];
		settingsUser.steam.display_name = avatarMatch[2];
	} else {
		try {
			const name = steamPageText
				.substring(steamPageText.indexOf('data-miniprofile=') + 25)
				.split('">')?.[1]
				.split('</a>')?.[0];

			const avatar = steamPageText
				.substring(steamPageText.indexOf('user_avatar') + 40)
				.split('src="')?.[1]
				.split('"')?.[0];

			if (avatar) {
				settingsUser.steam.avatar_url = avatar;
			}
			if (name) {
				settingsUser.steam.display_name = name;
			}
		} catch (e) {
			console.error('Error parsing avatar', e);
		}
	}

	console.log(settingsUser);
	return settingsUser['steam'];
}
