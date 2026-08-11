/**
 * Route racine /
 * Redirige vers /login (qui redirigera vers /dashboard si connecté)
 */

import { redirect } from '@sveltejs/kit';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ cookies }) => {
	if (cookies.get('tf_token')) {
		throw redirect(302, '/dashboard');
	}
	throw redirect(302, '/login');
};
