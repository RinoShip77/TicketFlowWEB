/**
 * Login — Server Action
 *
 * Flux :
 * 1. Valide les champs côté serveur (longueur, format email)
 * 2. POST vers l'API Node.js /api/auth/login
 * 3. Stocke le JWT dans un cookie HttpOnly (jamais exposé au JS client)
 * 4. Redirige vers /dashboard
 *
 * En cas d'erreur → retourne { error } qui s'affiche dans le formulaire
 */

import { fail, redirect } from '@sveltejs/kit';
import type { Actions, PageServerLoad } from './$types';
import { apiFetch, ApiException } from '$lib/server/api';
import type { AuthResponse } from '$lib/types';

// Redirige vers /dashboard si déjà connecté
export const load: PageServerLoad = async ({ cookies }) => {
	if (cookies.get('tf_token')) {
		throw redirect(302, '/dashboard');
	}
	return {};
};

export const actions: Actions = {
	default: async ({ request, cookies }) => {
		const data = await request.formData();
		const email = (data.get('email') as string)?.trim();
		const password = data.get('password') as string;

		// ── Validation côté serveur ──────────────────────────────────
		const errors: Record<string, string> = {};

		if (!email) errors.email = 'L\'email est requis.';
		else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) errors.email = 'Format email invalide.';

		if (!password) errors.password = 'Le mot de passe est requis.';
		else if (password.length < 6) errors.password = 'Minimum 6 caractères.';

		if (Object.keys(errors).length > 0) {
			return fail(422, { errors, email });
		}

		// ── Appel API ────────────────────────────────────────────────
		try {
			const res = await apiFetch<AuthResponse>('/api/auth/login', {
				method: 'POST',
				body: { email, password }
			});

			const token = res.token;
			const user = res.data;

			// Cookie HttpOnly — invisible pour JavaScript côté client
			cookies.set('tf_token', token, {
				path: '/',
				httpOnly: true,
				secure: process.env.NODE_ENV === 'production',
				sameSite: 'lax',
				maxAge: 60 * 60 * 8 // 8 heures
			});

			const userId = user?._id || user?.id || '';

			// Stocker les infos utilisateur non-sensibles dans un cookie lisible
			cookies.set(
				'tf_user',
				JSON.stringify({ id: userId, name: user?.name, email: user?.email, level: user?.level }),
				{
					path: '/',
					httpOnly: false, // lisible côté client pour afficher le nom
					secure: process.env.NODE_ENV === 'production',
					sameSite: 'lax',
					maxAge: 60 * 60 * 24 * 7
				}
			);
		} catch (err) {
			if (err instanceof ApiException) {
				if (err.statusCode === 401) {
					return fail(401, { formError: 'Email ou mot de passe incorrect.', email });
				}
				return fail(err.statusCode, { formError: err.message, email });
			}
			return fail(500, { formError: 'Erreur de connexion au serveur. Réessayez.', email });
		}

		throw redirect(302, '/dashboard');
	}
};
