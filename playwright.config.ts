import { defineConfig, devices } from '@playwright/test';

/**
 * Playwright E2E Configuration — TicketFlow
 *
 * Stratégie d'authentification :
 * - `global.setup.ts` effectue le login une seule fois et sauvegarde le
 *   storageState (cookies) dans `.playwright/auth.json`.
 * - Les projets qui nécessitent l'auth chargent cet état via `storageState`.
 * - Les tests auth utilisent un contexte vierge (pas de storageState).
 */

export default defineConfig({
	testDir: './tests',
	timeout: 30_000,
	expect: { timeout: 5_000 },
	fullyParallel: false, // séquentiel pour éviter les conflits de session
	forbidOnly: !!process.env.CI,
	retries: process.env.CI ? 2 : 0,
	workers: 1,
	reporter: [['list'], ['html', { open: 'never' }]],

	use: {
		baseURL: 'http://localhost:5173',
		trace: 'on-first-retry',
		screenshot: 'only-on-failure',
		locale: 'fr-FR',
	},

	projects: [
		// ── 1. Setup global : login une seule fois ───────────────────
		{
			name: 'global-setup',
			testMatch: /global\.setup\.ts/,
		},

		// ── 2. Tests d'authentification (contexte vierge) ────────────
		{
			name: 'auth',
			testMatch: /auth\.spec\.ts/,
			use: { ...devices['Desktop Chrome'] },
		},

		// ── 3. Tests nécessitant l'état authentifié ──────────────────
		{
			name: 'dashboard',
			testMatch: /dashboard\.spec\.ts/,
			dependencies: ['global-setup'],
			use: {
				...devices['Desktop Chrome'],
				storageState: '.playwright/auth.json',
			},
		},
		{
			name: 'tickets',
			testMatch: /tickets\.spec\.ts/,
			dependencies: ['global-setup'],
			use: {
				...devices['Desktop Chrome'],
				storageState: '.playwright/auth.json',
			},
		},
		{
			name: 'team',
			testMatch: /team\.spec\.ts/,
			dependencies: ['global-setup'],
			use: {
				...devices['Desktop Chrome'],
				storageState: '.playwright/auth.json',
			},
		},
	],

	// Lance le serveur de dev SvelteKit automatiquement si non démarré
	webServer: {
		command: 'npm run dev',
		url: 'http://localhost:5173',
		reuseExistingServer: true,
		timeout: 60_000,
	},
});
