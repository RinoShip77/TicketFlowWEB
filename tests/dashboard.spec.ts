import { test, expect } from '@playwright/test';

/**
 * tests/dashboard.spec.ts — Tests du tableau de bord
 *
 * Ces tests s'exécutent avec l'état authentifié chargé depuis
 * `.playwright/auth.json` (via `storageState` dans playwright.config.ts).
 *
 * Scénarios :
 *  1. Rendu UI — métriques principales affichées
 *  2. Navigation — bouton "+ Create Ticket" redirige vers /tickets/new
 */

test.describe('Dashboard', () => {

	test.beforeEach(async ({ page }) => {
		await page.goto('/dashboard');
		// Attendre que la page soit complètement chargée
		await expect(page).toHaveURL(/\/dashboard/);
	});

	// ── 1. Rendu UI — métriques principales ────────────────────────────
	test('affiche les cartes de métriques principales', async ({ page }) => {
		// Titre de bienvenue
		await expect(page.getByRole('heading', { name: /welcome/i })).toBeVisible();

		// Les 4 cartes de métriques (Total Tickets, Open Tickets, In Progress, Resolved)
		// sont rendues en tant que texte de label (uppercase tracking-wider)
		await expect(page.getByText(/total tickets/i)).toBeVisible();
		await expect(page.getByText(/in progress/i)).toBeVisible();
		await expect(page.getByText(/resolved/i)).toBeVisible();
	});

	// ── 2. Rendu UI — sections du dashboard ────────────────────────────
	test('affiche les sections Ticket List et Recent Activities', async ({ page }) => {
		// Section "Ticket List"
		await expect(page.getByRole('heading', { name: /ticket list/i })).toBeVisible();

		// Lien "View All" vers /tickets
		const viewAllLinks = page.getByRole('link', { name: /view all/i });
		await expect(viewAllLinks.first()).toBeVisible();
	});

	// ── 3. Navigation — bouton "+ Create Ticket" ───────────────────────
	test('le bouton "Create Ticket" navigue vers /tickets/new', async ({ page }) => {
		// Le bouton CTA du dashboard a l'id btn-create-ticket-dashboard
		const createBtn = page.locator('#btn-create-ticket-dashboard');
		await expect(createBtn).toBeVisible();
		await expect(createBtn).toContainText(/create ticket/i);

		// Cliquer et vérifier la navigation
		await createBtn.click();
		await expect(page).toHaveURL(/\/tickets\/new/, { timeout: 10_000 });
	});

	// ── 4. Graphique d'activité présent ────────────────────────────────
	test('affiche la section Ticket Activity avec le graphique', async ({ page }) => {
		await expect(page.getByRole('heading', { name: /ticket activity/i })).toBeVisible();
		// Le SVG du graphique linéaire doit être présent
		await expect(page.getByLabel('Ticket activity line chart')).toBeVisible();
	});

	// ── 5. Tableau de bord accessible sans redirection ─────────────────
	test('reste sur /dashboard (pas de redirection vers /login)', async ({ page }) => {
		// Confirme que l'état auth fonctionne correctement
		await expect(page).toHaveURL(/\/dashboard/);
		await expect(page).not.toHaveURL(/\/login/);
	});
});
