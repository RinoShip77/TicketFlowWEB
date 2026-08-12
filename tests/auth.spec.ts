import { test, expect } from '@playwright/test';

/**
 * tests/auth.spec.ts — Tests d'authentification
 *
 * Ces tests s'exécutent dans un contexte de navigateur VIERGE (aucun cookie).
 * Ils couvrent :
 *  1. Redirection vers /login si non authentifié
 *  2. Connexion réussie avec identifiants valides
 *  3. Message d'erreur avec identifiants invalides
 */

const TEST_EMAIL = process.env.E2E_EMAIL ?? 'alice.dupont@ticketflow.com';
const TEST_PASSWORD = process.env.E2E_PASSWORD ?? 'password123';

test.describe('Authentification', () => {

	// ── 1. Redirection vers /login si non authentifié ──────────────────
	test('redirige vers /login quand on accède à /dashboard sans cookie', async ({ page }) => {
		// Accès direct à /dashboard sans aucun cookie de session
		await page.goto('/dashboard');

		// Doit être redirigé immédiatement vers la page de connexion
		await expect(page).toHaveURL(/\/login/, { timeout: 10_000 });

		// Vérifier que le formulaire de connexion est présent (confirmation du bon rendu)
		await expect(page.getByRole('heading', { name: /connexion/i })).toBeVisible();
	});

	// ── 2. Login réussi ────────────────────────────────────────────────
	test('connexion réussie : cookie créé et redirection vers /dashboard', async ({ page, context }) => {
		await page.goto('/login');
		await expect(page).toHaveURL(/\/login/);

		// Remplir le formulaire avec des identifiants valides
		await page.getByLabel('Adresse email').fill(TEST_EMAIL);
		await page.getByLabel('Mot de passe').fill(TEST_PASSWORD);

		// Soumettre
		await page.getByRole('button', { name: /se connecter/i }).click();

		// Vérifier la redirection vers /dashboard
		await expect(page).toHaveURL(/\/dashboard/, { timeout: 15_000 });

		// Vérifier que le cookie HttpOnly `tf_token` a bien été créé
		const cookies = await context.cookies();
		const sessionCookie = cookies.find((c) => c.name === 'tf_token');
		expect(sessionCookie).toBeDefined();
		expect(sessionCookie?.httpOnly).toBe(true);
		expect(sessionCookie?.value).toBeTruthy();

		// Vérifier que la page dashboard est bien rendue
		await expect(page.getByRole('heading', { name: /welcome/i })).toBeVisible();
	});

	// ── 3. Login échoué — identifiants invalides ───────────────────────
	test('affiche un message d\'erreur avec des identifiants invalides', async ({ page }) => {
		await page.goto('/login');
		await expect(page).toHaveURL(/\/login/);

		// Entrer des identifiants incorrects
		await page.getByLabel('Adresse email').fill('inexistant@example.com');
		await page.getByLabel('Mot de passe').fill('mauvais-mot-de-passe');

		// Soumettre
		await page.getByRole('button', { name: /se connecter/i }).click();

		// L'URL doit rester sur /login (pas de redirection)
		await expect(page).toHaveURL(/\/login/);

		// Un message d'erreur doit apparaître dans l'UI
		// (le composant Alert affiche form.formError)
		await expect(
			page.getByText(/email ou mot de passe incorrect/i)
		).toBeVisible({ timeout: 10_000 });
	});

	// ── 4. Validation côté serveur — champs vides ─────────────────────
	test('affiche les erreurs de validation si les champs sont vides', async ({ page }) => {
		await page.goto('/login');

		// Soumettre sans remplir les champs
		await page.getByRole('button', { name: /se connecter/i }).click();

		// Les messages de validation serveur doivent s'afficher
		await expect(page.getByText(/l'email est requis/i)).toBeVisible({ timeout: 5_000 });
		await expect(page.getByText(/le mot de passe est requis/i)).toBeVisible();
	});
});
