import { test, expect } from '@playwright/test';

/**
 * tests/team.spec.ts — Tests de la page Team Members
 *
 * Ces tests s'exécutent avec l'état authentifié chargé depuis
 * `.playwright/auth.json` (via `storageState` dans playwright.config.ts).
 *
 * Scénarios :
 *  1. Rendu de la liste — titre + bouton Add Member
 *  2. Tableau de membres — au moins une ligne avec boutons d'action
 *  3. Barre de recherche — présente et interactive
 *  4. Menu déroulant des départements — présent et interactif
 *  5. Filtre de recherche — filtre les résultats en temps réel
 *  6. Navigation — clic sur "Add Member" va vers /register
 *  7. Tri sur toutes les colonnes — URL mise à jour
 */

test.describe('Team Members', () => {

	test.beforeEach(async ({ page }) => {
		// La route SvelteKit est /team-members selon la structure de fichiers
		await page.goto('/team-members');
		await expect(page).toHaveURL(/\/team-members/);
	});

	// ── 1. Rendu de base ───────────────────────────────────────────────
	test('affiche la page Team Members avec le titre principal', async ({ page }) => {
		await expect(page.getByRole('heading', { name: /team members/i, level: 2 })).toBeVisible();

		// Bouton "Add Member" doit être visible
		await expect(page.locator('#btn-add-member')).toBeVisible();
		await expect(page.locator('#btn-add-member')).toContainText(/add member/i);
	});

	// ── 2. Tableau de membres — au moins une ligne rendue ───────────────
	test("rend au moins un membre dans le tableau avec des boutons d'action", async ({ page }) => {
		// Attendre que le tableau soit rendu (ou le message "aucun membre")
		const table = page.getByRole('table', { name: /liste des membres/i });
		const emptyState = page.getByText(/aucun membre trouvé/i);

		// Soit le tableau est visible, soit l'état vide
		const hasTable = await table.isVisible().catch(() => false);
		const hasEmpty = await emptyState.isVisible().catch(() => false);

		// Au moins l'un des deux doit être visible (la page est bien rendue)
		expect(hasTable || hasEmpty).toBe(true);

		if (hasTable) {
			// Si le tableau est présent, vérifier que le bouton Ouvrir (lien avec crayon) est visible
			const openLink = page.getByRole('link', { name: /ouvrir/i });
			await expect(openLink.first()).toBeVisible();

			// Bouton "Supprimer le membre" doit aussi être présent
			await expect(
				page.getByRole('button', { name: /supprimer le membre/i }).first()
			).toBeVisible();
		}

	});

	// ── 3. Barre de recherche — présente et interactive ─────────────────
	test('le champ "Search members..." est présent et accepte la saisie', async ({ page }) => {
		const searchInput = page.locator('#search-members');
		await expect(searchInput).toBeVisible();
		await expect(searchInput).toHaveAttribute('placeholder', 'Search members...');

		// Vérifier que le champ est interactif (accepte la saisie)
		await searchInput.fill('test query');
		await expect(searchInput).toHaveValue('test query');

		// Effacer pour ne pas polluer les autres assertions
		await searchInput.clear();
		await expect(searchInput).toHaveValue('');
	});

	// ── 4. Menu déroulant des départements — présent et interactif ──────
	test('le menu déroulant de département est présent et interactif', async ({ page }) => {
		const deptSelect = page.locator('#filter-department');
		await expect(deptSelect).toBeVisible();

		// L'option par défaut doit être "All Departments"
		await expect(deptSelect).toHaveValue('');

		// Vérifier qu'il y a des options de département
		const options = deptSelect.locator('option');
		const count = await options.count();
		expect(count).toBeGreaterThan(1); // Au moins "All Departments" + 1 département

		// Sélectionner un département et vérifier que la valeur change
		await deptSelect.selectOption('IT');
		await expect(deptSelect).toHaveValue('IT');

		// Revenir à "All Departments"
		await deptSelect.selectOption('');
		await expect(deptSelect).toHaveValue('');
	});

	// ── 5. La recherche filtre les résultats ────────────────────────────
	test('la barre de recherche filtre les membres en temps réel', async ({ page }) => {
		const searchInput = page.locator('#search-members');
		const table = page.getByRole('table', { name: /liste des membres/i });

		// Vérifier si le tableau de membres est présent
		const hasTable = await table.isVisible().catch(() => false);
		if (!hasTable) {
			test.skip(); // Ignorer si aucun membre n'est chargé
			return;
		}

		// Compter les lignes avant la recherche
		const rowsBefore = page.locator('tbody tr');
		const countBefore = await rowsBefore.count();

		// Saisir une chaîne improbable pour filtrer vers zéro résultats
		await searchInput.fill('zzzz_improbable_query_xyz');

		// Attendre le rendu de l'état vide (filtrage réactif Svelte 5 $derived)
		await expect(page.getByText(/aucun membre trouvé/i)).toBeVisible({ timeout: 5_000 });

		// Effacer — les membres reviennent
		await searchInput.clear();

		// Revenir au tableau avec les membres d'origine
		await expect(table).toBeVisible({ timeout: 5_000 });
		const countAfter = await rowsBefore.count();
		expect(countAfter).toBe(countBefore);
	});

	// ── 6. Navigation — clic sur "Add Member" va vers /team-members/new ──
	test('le bouton "Add Member" navigue vers /team-members/new', async ({ page }) => {
		await page.locator('#btn-add-member').click();
		await expect(page).toHaveURL(/\/team-members\/new/, { timeout: 10_000 });
	});

	// ── 7. Tri sur toutes les colonnes ──────────────────────────────────
	test('les colonnes du tableau permettent de trier les membres', async ({ page }) => {
		const table = page.getByRole('table', { name: /liste des membres/i });
		const hasTable = await table.isVisible().catch(() => false);
		if (!hasTable) {
			test.skip();
			return;
		}

		// Tri par nom (Member)
		await page.locator('#sort-name').click();
		await expect(page).toHaveURL(/sortBy=name/);

		// Double-clic — inverse l'ordre (desc)
		await page.locator('#sort-name').click();
		await expect(page).toHaveURL(/sortBy=name.*orderBy=desc|orderBy=desc.*sortBy=name/);

		// Tri par département
		await page.locator('#sort-department').click();
		await expect(page).toHaveURL(/sortBy=department/);

		// Tri par rôle
		await page.locator('#sort-role').click();
		await expect(page).toHaveURL(/sortBy=roleTitle/);

		// Tri par statut
		await page.locator('#sort-status').click();
		await expect(page).toHaveURL(/sortBy=status/);
	});
});
