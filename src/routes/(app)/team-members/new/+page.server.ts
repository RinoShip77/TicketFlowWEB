/**
 * Nouveau Membre — Server (Load + Actions)
 *
 * Route: /team-members/new
 *
 * Load: vérifie l'authentification
 * Actions:
 *   - createSingle: POST /api/technicians (un membre)
 *   - createBulk: POST /api/technicians (plusieurs membres en lot)
 */

import { fail, redirect } from '@sveltejs/kit';
import type { Actions, PageServerLoad } from './$types';
import { apiFetch, ApiException } from '$lib/server/api';
import type { RegisterPayload, User } from '$lib/types';

export const load: PageServerLoad = async ({ cookies }) => {
	const token = cookies.get('tf_token');
	if (!token) throw redirect(302, '/login');

	return {};
};

export const actions: Actions = {
	createSingle: async ({ request, cookies }) => {
		const token = cookies.get('tf_token');
		if (!token) throw redirect(302, '/login');

		const data = await request.formData();

		const email = (data.get('email') as string)?.trim();
		const name = (data.get('name') as string)?.trim();
		const levelRaw = data.get('level') as string;
		const password = data.get('password') as string;
		const confirmPassword = data.get('confirmPassword') as string;

		// ── Validation ───────────────────────────────────────────────
		const errors: Record<string, string> = {};

		if (!email) errors.email = 'L\'email est requis.';
		else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) errors.email = 'Format email invalide.';

		if (!name) errors.name = 'Le nom complet est requis.';
		else if (name.length < 2) errors.name = 'Minimum 2 caractères.';

		const level = parseInt(levelRaw, 10);
		if (!levelRaw || isNaN(level)) errors.level = 'Le niveau est requis.';
		else if (level < 1 || level > 3) errors.level = 'Le niveau doit être entre 1 et 3.';

		if (!password) errors.password = 'Le mot de passe est requis.';
		else if (password.length < 8) errors.password = 'Minimum 8 caractères.';

		if (!confirmPassword) errors.confirmPassword = 'Veuillez confirmer le mot de passe.';
		else if (password !== confirmPassword) errors.confirmPassword = 'Les mots de passe ne correspondent pas.';

		if (Object.keys(errors).length > 0) {
			return fail(422, { action: 'createSingle', errors, email, name, level: levelRaw });
		}

		// ── Appel API ────────────────────────────────────────────────
		try {
			await apiFetch<User>('/api/technicians', {
				method: 'POST',
				token,
				body: { email, name, level, password } satisfies RegisterPayload
			});
		} catch (err) {
			if (err instanceof ApiException) {
				if (err.statusCode === 401) {
					cookies.delete('tf_token', { path: '/' });
					cookies.delete('tf_user', { path: '/' });
					throw redirect(302, '/login');
				}
				if (err.statusCode === 409 || err.statusCode === 400 || err.message.toLowerCase().includes('duplicate') || err.message.toLowerCase().includes('email')) {
					return fail(400, {
						action: 'createSingle',
						errors: { email: 'Un compte avec cet email existe déjà.' },
						email, name, level: levelRaw
					});
				}
				return fail(err.statusCode, {
					action: 'createSingle',
					formError: err.message,
					email, name, level: levelRaw
				});
			}
			return fail(500, { action: 'createSingle', formError: 'Erreur de connexion au serveur.', email, name, level: levelRaw });
		}

		throw redirect(302, '/team-members');
	},

	createBulk: async ({ request, cookies }) => {
		const token = cookies.get('tf_token');
		if (!token) throw redirect(302, '/login');

		const data = await request.formData();
		const rawMembers = data.get('members') as string;
		if (!rawMembers) return fail(400, { action: 'createBulk', bulkFormError: 'Aucun membre fourni.' });

		let memberItems: Array<{
			name: string;
			email: string;
			level: number;
			password?: string;
		}> = [];

		try {
			memberItems = JSON.parse(rawMembers);
		} catch {
			return fail(400, { action: 'createBulk', bulkFormError: 'Format des données invalide.' });
		}

		if (!Array.isArray(memberItems) || memberItems.length === 0) {
			return fail(400, { action: 'createBulk', bulkFormError: 'Veuillez ajouter au moins un membre.' });
		}

		// Validation de chaque membre
		const rowErrors: Record<number, string> = {};
		memberItems.forEach((m, index) => {
			if (!m.name?.trim() || m.name.length < 2) {
				rowErrors[index] = `Membre #${index + 1} : Le nom doit faire au moins 2 caractères.`;
			} else if (!m.email?.trim() || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(m.email)) {
				rowErrors[index] = `Membre #${index + 1} : Email invalide.`;
			} else if (!m.password || m.password.length < 8) {
				rowErrors[index] = `Membre #${index + 1} : Le mot de passe doit faire au moins 8 caractères.`;
			}
		});

		if (Object.keys(rowErrors).length > 0) {
			return fail(422, { action: 'createBulk', rowErrors, rawMembers });
		}

		try {
			await Promise.all(
				memberItems.map((m) =>
					apiFetch<User>('/api/technicians', {
						method: 'POST',
						token,
						body: {
							name: m.name.trim(),
							email: m.email.trim(),
							level: m.level ?? 1,
							password: m.password!
						} satisfies RegisterPayload
					})
				)
			);
		} catch (err) {
			if (err instanceof ApiException) {
				if (err.statusCode === 401) {
					cookies.delete('tf_token', { path: '/' });
					cookies.delete('tf_user', { path: '/' });
					throw redirect(302, '/login');
				}
				return fail(err.statusCode, { action: 'createBulk', bulkFormError: err.message, rawMembers });
			}
			return fail(500, { action: 'createBulk', bulkFormError: 'Erreur lors de la création des membres.', rawMembers });
		}

		throw redirect(302, '/team-members');
	}
};
