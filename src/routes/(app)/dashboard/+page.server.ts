/**
 * Dashboard — Load Function
 *
 * Récupère en parallèle :
 * - Les statistiques globales via GET /api/dashboard
 * - La première page de tickets via GET /api/tickets?limit=10&orderBy=desc
 *
 * Le JWT est lu depuis le cookie HttpOnly et injecté dans les headers.
 * Un 401 provoque une redirection immédiate vers /login.
 */

import { redirect } from '@sveltejs/kit';
import type { PageServerLoad } from './$types';
import { apiFetch, ApiException } from '$lib/server/api';
import type { DashboardStats, PaginatedResponse, Ticket } from '$lib/types';

export const load: PageServerLoad = async ({ cookies }) => {
	const token = cookies.get('tf_token');

	if (!token) {
		throw redirect(302, '/login');
	}

	try {
		// Appels parallèles pour optimiser le temps de chargement
		const [stats, ticketsResponse] = await Promise.all([
			apiFetch<DashboardStats>('/api/dashboard', { token }),
			apiFetch<PaginatedResponse<Ticket>>('/api/tickets?limit=10&sortBy=createdAt&orderBy=desc', {
				token
			})
		]);

		return {
			stats,
			tickets: ticketsResponse.data,
			meta: ticketsResponse.meta
		};
	} catch (err) {
		if (err instanceof ApiException && err.statusCode === 401) {
			// Token expiré ou invalide → déconnexion forcée
			cookies.delete('tf_token', { path: '/' });
			cookies.delete('tf_user', { path: '/' });
			throw redirect(302, '/login');
		}
		// Pour toute autre erreur, on renvoie des données vides plutôt que de crasher
		return {
			stats: null,
			tickets: [] as Ticket[],
			meta: null
		};
	}
};
