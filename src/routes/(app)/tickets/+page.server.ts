/**
 * Ticket List — Load Function
 *
 * Paramètres de query supportés :
 * - page   : numéro de page (défaut: 1)
 * - status : filtre statut ('Open' | 'In progress' | 'Resolved' | 'Closed')
 * - search : recherche sur le titre
 * - sortBy : champ de tri (défaut: createdAt)
 * - orderBy: direction (asc | desc)
 */

import { fail, redirect } from '@sveltejs/kit';
import type { Actions, PageServerLoad } from './$types';
import { apiFetch, ApiException } from '$lib/server/api';
import type { PaginatedResponse, Ticket } from '$lib/types';

export const load: PageServerLoad = async ({ cookies, url }) => {
	const token = cookies.get('tf_token');
	if (!token) throw redirect(302, '/login');

	const page = url.searchParams.get('page') ?? '1';
	const status = url.searchParams.get('status') ?? '';
	const search = url.searchParams.get('search') ?? '';
	const sortBy = url.searchParams.get('sortBy') ?? 'createdAt';
	const orderBy = url.searchParams.get('orderBy') ?? 'desc';

	// Construction de la query string
	const params = new URLSearchParams({ page, limit: '10', sortBy, orderBy });
	if (status) params.set('status', status);
	if (search) params.set('search', search);

	try {
		const response = await apiFetch<PaginatedResponse<Ticket>>(
			`/api/tickets?${params.toString()}`,
			{ token }
		);

		return {
			tickets: response.data,
			meta: response.meta,
			filters: { page: Number(page), status, search, sortBy, orderBy }
		};
	} catch (err) {
		if (err instanceof ApiException && err.statusCode === 401) {
			cookies.delete('tf_token', { path: '/' });
			cookies.delete('tf_user', { path: '/' });
			throw redirect(302, '/login');
		}
		return {
			tickets: [] as Ticket[],
			meta: null,
			filters: { page: 1, status, search, sortBy, orderBy }
		};
	}
};

export const actions: Actions = {
	deleteTicket: async ({ request, cookies }) => {
		const token = cookies.get('tf_token');
		if (!token) throw redirect(302, '/login');

		const data = await request.formData();
		const id = data.get('id') as string;

		if (!id) {
			return fail(400, { deleteError: 'ID du ticket manquant.' });
		}

		try {
			await apiFetch(`/api/tickets/${id}`, {
				method: 'DELETE',
				token
			});
		} catch (err) {
			if (err instanceof ApiException) {
				if (err.statusCode === 401) {
					cookies.delete('tf_token', { path: '/' });
					cookies.delete('tf_user', { path: '/' });
					throw redirect(302, '/login');
				}
				return fail(err.statusCode, { deleteError: err.message });
			}
			return fail(500, { deleteError: 'Erreur lors de la suppression du ticket.' });
		}

		return { success: true };
	}
};

