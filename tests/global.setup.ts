import { test as setup, expect } from '@playwright/test';
import path from 'path';

/**
 * Global Setup — Authentification globale
 *
 * Ce fichier est exécuté UNE SEULE FOIS avant tous les projets qui en dépendent.
 * Il effectue le login avec les identifiants de test, puis sauvegarde l'état
 * des cookies dans `.playwright/auth.json`.
 *
 * Les projets `dashboard`, `tickets` et `team` chargent cet état via
 * `storageState` dans playwright.config.ts — aucune reconnexion n'est nécessaire.
 *
 * Variables d'environnement :
 *   E2E_EMAIL    — email du compte de test (défaut : premier admin trouvé)
 *   E2E_PASSWORD — mot de passe du compte de test
 */

const AUTH_FILE = path.join(process.cwd(), '.playwright', 'auth.json');

const TEST_EMAIL = process.env.E2E_EMAIL ?? 'alice.dupont@ticketflow.com';
const TEST_PASSWORD = process.env.E2E_PASSWORD ?? 'password123';

setup('authenticate', async ({ page }) => {
	// 1. Naviguer vers la page de connexion
	await page.goto('/login');
	await expect(page).toHaveURL(/\/login/);

	// 2. Remplir le formulaire avec les identifiants de test
	await page.getByLabel('Adresse email').fill(TEST_EMAIL);
	await page.getByLabel('Mot de passe').fill(TEST_PASSWORD);

	// 3. Soumettre le formulaire
	await page.getByRole('button', { name: /se connecter/i }).click();

	// 4. Attendre la redirection vers /dashboard (preuve du login réussi)
	await page.waitForURL(/\/dashboard/, { timeout: 15_000 });

	// 5. Sauvegarder le storageState (cookies HttpOnly inclus via browser context)
	await page.context().storageState({ path: AUTH_FILE });

	console.log(`✅ Auth state saved to ${AUTH_FILE}`);
});
