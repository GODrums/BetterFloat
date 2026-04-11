import type { IStorage } from '~lib/util/storage';

let extensionSettings: IStorage | null = null;
let observerStarted = false;
let refreshTimer: NodeJS.Timeout | null = null;

export function setCSFloatSettings(settings: IStorage) {
	extensionSettings = settings;
}

export function getCSFloatSettings(): IStorage {
	if (!extensionSettings) {
		throw new Error('[BetterFloat] CSFloat settings were accessed before initialization');
	}

	return extensionSettings;
}

export function markObserverStarted() {
	if (observerStarted) {
		return false;
	}

	observerStarted = true;
	return true;
}

export function setRefreshTimer(timer: NodeJS.Timeout | null) {
	refreshTimer = timer;
}

export function getRefreshTimer() {
	return refreshTimer;
}
