/**
 * Logout — Server Action
 *
 * Efface les deux cookies (token + user) et redirige vers /login.
 * Cette route n'a pas de page UI : on la soumet via un <form method="POST">.
 */

import { redirect } from '@sveltejs/kit';
import type { Actions } from './$types';

export const actions: Actions = {
	default: async ({ cookies }) => {
		cookies.delete('tf_token', { path: '/' });
		cookies.delete('tf_user', { path: '/' });
		throw redirect(302, '/login');
	}
};
