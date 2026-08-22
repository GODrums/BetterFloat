import type { Steam } from '~lib/@typings/SteamTypes';
import type { SettingsUser } from './storage';

export type SteamLoginErrorCode = 'network' | 'steam-unavailable' | 'invalid-response';

export class SteamLoginError extends Error {
	constructor(
		public readonly code: SteamLoginErrorCode,
		message: string,
		options?: ErrorOptions
	) {
		super(message, options);
		this.name = 'SteamLoginError';
	}
}

export async function getSteamLogin(): Promise<SettingsUser['steam'] | null> {
	const settingsUser = {} as SettingsUser;

	let steamPage: Response;
	try {
		steamPage = await fetch('https://steamcommunity.com/', {
			credentials: 'include',
			headers: {
				Accept: 'text/html,application/xhtml+xml,application/xml;q=0.9;q=0.8,application/signed-exchange;v=b3;q=0.7',
			},
		});
	} catch (error) {
		throw new SteamLoginError('network', 'Failed to reach Steam.', { cause: error });
	}

	if (!steamPage.ok) {
		throw new SteamLoginError('steam-unavailable', `Steam returned HTTP ${steamPage.status}.`);
	}

	let steamPageText: string;
	try {
		steamPageText = await steamPage.text();
	} catch (error) {
		throw new SteamLoginError('network', 'Failed to read Steam response.', { cause: error });
	}

	// get steam user info
	const steamUserInfoMatch = steamPageText.match(/data-userinfo="{(.*?)}"/);
	if (!steamUserInfoMatch) {
		return null;
	}

	let steamUserInfo: Steam.UserInfo;
	try {
		// Convert HTML entities and create valid JSON
		const encodedUserInfo = steamUserInfoMatch[1];
		if (!encodedUserInfo) return null;
		const decodedString = decodeURIComponent(encodedUserInfo)
			.replace(/&quot;/g, '"')
			.replace(/&amp;/g, '&');
		steamUserInfo = JSON.parse(`{${decodedString}}`) as Steam.UserInfo;
	} catch (error) {
		throw new SteamLoginError('invalid-response', 'Steam returned account data in an unexpected format.', { cause: error });
	}

	if (!steamUserInfo.logged_in || typeof steamUserInfo.steamid !== 'string' || !steamUserInfo.steamid) {
		return null;
	}

	settingsUser.steam = steamUserInfo;

	// Parse avatar image and alt text
	const avatarMatch = steamPageText.match(/<img src="(https:\/\/avatars\.cloudflare\.steamstatic\.com\/[^"]+)" alt="([^"]+)">/);
	if (avatarMatch) {
		settingsUser.steam.avatar_url = avatarMatch[1];
		settingsUser.steam.display_name = avatarMatch[2];
	} else {
		const nameSection = steamPageText.match(/data-miniprofile=[^>]*>([^<]+)<\/a>/);
		const avatarSection = steamPageText.match(/user_avatar[\s\S]*?<img[^>]+src="([^"]+)"/);

		if (avatarSection?.[1]) {
			settingsUser.steam.avatar_url = avatarSection[1];
		}
		if (nameSection?.[1]) {
			settingsUser.steam.display_name = nameSection[1];
		}
	}

	return settingsUser['steam'];
}
