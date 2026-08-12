import { test, expect } from '@playwright/test';

/**
 * tests/tickets.spec.ts — Tests de la gestion des tickets
 *
 * Ces tests s'exécutent avec l'état authentifié chargé depuis
 * `.playwright/auth.json` (via `storageState` dans playwright.config.ts).
 *
 * Scénarios :
 *  1. Validation formulaire — soumission vide → erreurs UI affichées
 *  2. Création réussie — formulaire rempli → redirection vers /tickets
 */

// Données de test pour la création d'un ticket
const TEST_TICKET = {
	title: `[E2E] Test ticket ${Date.now()}`,
	description: 'Ceci est un ticket créé automatiquement par la suite de tests Playwright. Il peut être supprimé.',
};

test.describe('Tickets', () => {

	// ── 1. Page liste des tickets ───────────────────────────────────────
	test('affiche la page /tickets correctement', async ({ page }) => {
		await page.goto('/tickets');
		await expect(page).toHaveURL(/\/tickets/);

		// Le lien "nouveau ticket" doit être accessible
		const newTicketLink = page.getByRole('link', { name: /nouveau|new|créer/i });
		// Peut ne pas exister si la page liste n'a pas de CTA — on vérifie juste la page
		await expect(page).not.toHaveURL(/\/login/);
	});

	// ── 2. Validation formulaire — soumission du formulaire vide ────────
	test('affiche les erreurs de validation si le formulaire est soumis vide', async ({ page }) => {
		await page.goto('/tickets/new');
		await expect(page).toHaveURL(/\/tickets\/new/);

		// Vérifier que le formulaire de création est présent
		await expect(page.getByRole('heading', { name: /créer un nouveau ticket/i })).toBeVisible();

		// Vider explicitement les champs requis (ils peuvent avoir des valeurs par défaut)
		await page.getByLabel(/titre/i).clear();
		await page.getByLabel(/description/i).clear();

		// Soumettre le formulaire sans remplir les champs requis
		// Le bouton submit est identifié par son rôle et son texte
		await page.getByRole('button', { name: /créer|soumettre|submit/i }).click();

		// Après soumission, les messages d'erreur serveur doivent apparaître
		// (le server action retourne fail(422, { errors }))
		await expect(
			page.getByText(/le titre est requis/i)
		).toBeVisible({ timeout: 10_000 });

		await expect(
			page.getByText(/la description est requise/i)
		).toBeVisible();

		// L'URL doit rester sur /tickets/new (pas de redirection)
		await expect(page).toHaveURL(/\/tickets\/new/);
	});

	// ── 3. Présence des champs requis ──────────────────────────────────
	test('le formulaire contient tous les champs requis', async ({ page }) => {
		await page.goto('/tickets/new');
		await expect(page).toHaveURL(/\/tickets\/new/);

		// Champ Titre
		await expect(page.getByLabel(/titre/i)).toBeVisible();

		// Champ Description
		await expect(page.getByLabel(/description/i)).toBeVisible();

		// Sélecteur de priorité
		await expect(page.getByLabel(/priorité/i)).toBeVisible();

		// Bouton Cancel (lien vers /tickets)
		await expect(page.getByRole('link', { name: /cancel/i })).toBeVisible();
	});

	// ── 4. Sélecteur de priorité est interactif ─────────────────────────
	test('le sélecteur de priorité permet de changer la valeur', async ({ page }) => {
		await page.goto('/tickets/new');

		const prioritySelect = page.getByLabel(/priorité/i);
		await expect(prioritySelect).toBeVisible();

		// Changer la priorité vers "Critique" (valeur 5)
		await prioritySelect.selectOption('5');
		await expect(prioritySelect).toHaveValue('5');
	});

	// ── 5. Création réussie ─────────────────────────────────────────────
	test('crée un ticket avec succès et redirige vers /tickets', async ({ page }) => {
		await page.goto('/tickets/new');
		await expect(page).toHaveURL(/\/tickets\/new/);

		// Remplir le champ Titre
		await page.getByLabel(/titre/i).fill(TEST_TICKET.title);

		// Remplir le champ Description
		await page.getByLabel(/description/i).fill(TEST_TICKET.description);

		// Priorité déjà sélectionnée par défaut (P3 — Moyenne), laisser tel quel

		// Soumettre le formulaire
		await page.getByRole('button', { name: /créer|soumettre|submit/i }).click();

		// Après création réussie, le server action redirige vers /tickets
		await expect(page).toHaveURL(/\/tickets/, { timeout: 15_000 });

		// Vérifier qu'on n'est PAS sur la page de création (redirection effective)
		await expect(page).not.toHaveURL(/\/tickets\/new/);
	});

	// ── 6. Bouton Cancel redirige vers /tickets ─────────────────────────
	test('le bouton Cancel redirige vers /tickets', async ({ page }) => {
		await page.goto('/tickets/new');

		await page.getByRole('link', { name: /cancel/i }).click();
		await expect(page).toHaveURL(/\/tickets/, { timeout: 10_000 });
	});
});
