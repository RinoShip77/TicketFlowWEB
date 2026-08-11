/**
 * Register — Server Action
 *
 * Flux :
 * 1. Valide les champs (email, name, level, password, confirmation)
 * 2. POST vers /api/technicians (création compte technicien)
 * 3. En cas de succès → redirige vers /login avec message de succès
 *
 * Note : L'API backend attend { email, name, level, password }
 */

import { fail, redirect } from '@sveltejs/kit';
import type { Actions, PageServerLoad } from './$types';
import { apiFetch, ApiException } from '$lib/server/api';
import type { RegisterPayload, User } from '$lib/types';

// Redirige si déjà connecté
export const load: PageServerLoad = async ({ cookies }) => {
	return {
		isLoggedIn: !!cookies.get('tf_token')
	};
};

export const actions: Actions = {
	default: async ({ request, cookies }) => {
		const token = cookies.get('tf_token');
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
			return fail(422, { errors, email, name, level: levelRaw });
		}

		// ── Appel API ────────────────────────────────────────────────
		try {
			await apiFetch<User>('/api/technicians', {
				method: 'POST',
				body: { email, name, level, password } satisfies RegisterPayload,
				token
			});
		} catch (err) {
			if (err instanceof ApiException) {
				if (err.statusCode === 401) {
					return fail(401, {
						formError: 'Accès refusé : Vous devez être connecté (ex: avec le compte Alice) pour créer un technicien.',
						email,
						name,
						level: levelRaw
					});
				}
				if (err.statusCode === 409 || err.statusCode === 400 || err.message.toLowerCase().includes('duplicate') || err.message.toLowerCase().includes('email')) {
					return fail(400, {
						errors: { email: 'Un compte avec cet email existe déjà.' },
						email,
						name,
						level: levelRaw
					});
				}
				return fail(err.statusCode, {
					formError: err.message,
					email,
					name,
					level: levelRaw
				});
			}
			return fail(500, { formError: 'Erreur de connexion au serveur.', email, name, level: levelRaw });
		}

		// Succès : redirige vers login avec param de confirmation
		throw redirect(302, '/login?registered=true');
	}
};
