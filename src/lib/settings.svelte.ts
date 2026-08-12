/**
 * Gestion des paramètres de l'utilisateur (Preferences)
 * Persistance dans localStorage (tf_user_settings) avec Svelte 5 runes ($state)
 */

export interface UserSettings {
	density: 'comfortable' | 'compact';
	defaultTicketsView: 'list' | 'grid';
	itemsPerPage: 10 | 25 | 50;
	emailNotifications: boolean;
	soundAlerts: boolean;
	autoRefresh: boolean;
	language: 'fr-CA' | 'en-CA';
}

const DEFAULT_SETTINGS: UserSettings = {
	density: 'comfortable',
	defaultTicketsView: 'list',
	itemsPerPage: 10,
	emailNotifications: true,
	soundAlerts: false,
	autoRefresh: true,
	language: 'fr-CA'
};

let settingsState = $state<UserSettings>({ ...DEFAULT_SETTINGS });

export function getSettings(): UserSettings {
	return settingsState;
}

export function updateSettings(partial: Partial<UserSettings>) {
	settingsState = { ...settingsState, ...partial };
	if (typeof window !== 'undefined') {
		try {
			localStorage.setItem('tf_user_settings', JSON.stringify(settingsState));
		} catch {
			// Ignorer
		}
	}
}

export function initSettings() {
	if (typeof window === 'undefined') return;

	try {
		const stored = localStorage.getItem('tf_user_settings');
		if (stored) {
			const parsed = JSON.parse(stored);
			settingsState = { ...DEFAULT_SETTINGS, ...parsed };
		}
	} catch {
		settingsState = { ...DEFAULT_SETTINGS };
	}
}

// Initialisation immédiate côté client
if (typeof window !== 'undefined') {
	initSettings();
}
