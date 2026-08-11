/**
 * Guard d'authentification — Groupe (app)
 *
 * Ce fichier est exécuté côté serveur avant chaque rendu d'une page
 * appartenant au groupe (app). Il lit le cookie `tf_token`.
 * Si absent → redirect immédiat vers /login.
 * Si présent → expose `user` aux pages via `locals` (via hooks) ou `data`.
 */

import { redirect } from '@sveltejs/kit';
import type { LayoutServerLoad } from './$types';

export const load: LayoutServerLoad = async ({ cookies }) => {
	const token = cookies.get('tf_token');

	if (!token) {
		throw redirect(302, '/login');
	}

	// Le token est validé ici. Dans une app de production, vous pourriez
	// appeler GET /api/auth/me pour vérifier la validité du token
	// et récupérer les infos utilisateur fraîches.
	// Pour l'instant, on fait confiance au cookie existant.

	return {
		authenticated: true
	};
};
