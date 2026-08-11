/**
 * Guard d'authentification — Groupe (app)
 *
 * Ce fichier est exécuté côté serveur avant chaque rendu d'une page
 * appartenant au groupe (app). Il lit le cookie `tf_token`.
 * Si absent → redirect immédiat vers /login.
 * Si présent → expose `user` aux pages via `data`.
 */

import { redirect } from '@sveltejs/kit';
import type { LayoutServerLoad } from './$types';
import type { User } from '$lib/types';

export const load: LayoutServerLoad = async ({ cookies }) => {
	const token = cookies.get('tf_token');

	if (!token) {
		throw redirect(302, '/login');
	}

	// Lecture de l'utilisateur depuis le cookie tf_user (défini au login)
	let user: User | null = null;
	const userCookie = cookies.get('tf_user');
	if (userCookie) {
		try {
			user = JSON.parse(decodeURIComponent(userCookie)) as User;
		} catch {
			// Cookie corrompu → on ignore
		}
	}

	return {
		authenticated: true,
		user
	};
};
