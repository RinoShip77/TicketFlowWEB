/**
 * Gestion du thème (Système, Clair, Sombre)
 * Utilise les runes Svelte 5 ($state) pour une réactivité optimale dans l'ensemble de l'application.
 */

export type ThemeOption = 'system' | 'light' | 'dark';

let themeState = $state<ThemeOption>('system');
let resolvedState = $state<'light' | 'dark'>('light');

export function getTheme(): ThemeOption {
	return themeState;
}

export function getResolvedTheme(): 'light' | 'dark' {
	return resolvedState;
}

export function setTheme(newTheme: ThemeOption) {
	themeState = newTheme;
	if (typeof window !== 'undefined') {
		try {
			localStorage.setItem('tf_theme', newTheme);
		} catch {
			// Ignorer si localStorage est bloqué
		}
		applyTheme(newTheme);
	}
}

export function initTheme() {
	if (typeof window === 'undefined') return;

	let stored: ThemeOption = 'system';
	try {
		const val = localStorage.getItem('tf_theme');
		if (val === 'light' || val === 'dark' || val === 'system') {
			stored = val;
		}
	} catch {
		// Fallback sur 'system'
	}

	themeState = stored;
	applyTheme(stored);

	// Écouteur pour les changements de préférence système en temps réel
	const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
	const handleSystemChange = () => {
		if (themeState === 'system') {
			applyTheme('system');
		}
	};

	if (mediaQuery.addEventListener) {
		mediaQuery.addEventListener('change', handleSystemChange);
	} else {
		mediaQuery.addListener(handleSystemChange);
	}
}

function applyTheme(theme: ThemeOption) {
	if (typeof window === 'undefined') return;

	const isSystemDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
	const isDark = theme === 'dark' || (theme === 'system' && isSystemDark);

	resolvedState = isDark ? 'dark' : 'light';

	const root = document.documentElement;
	if (isDark) {
		root.classList.add('dark');
		root.style.colorScheme = 'dark';
	} else {
		root.classList.remove('dark');
		root.style.colorScheme = 'light';
	}
}
