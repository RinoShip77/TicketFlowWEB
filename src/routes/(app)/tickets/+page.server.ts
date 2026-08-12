/**
 * Ticket List — Load Function
 *
 * Paramètres de query supportés :
 * - page   : numéro de page (défaut: 1)
 * - status : filtre statut ('Open' | 'In progress' | 'Resolved' | 'Closed')
 * - search : recherche sur le titre
 * - sortBy : champ de tri ('_id' | 'title' | 'originDepartment' | 'status' | 'assignedTo' | 'priority' | 'createdAt', défaut: createdAt)
 * - orderBy: direction (asc | desc)
 */

import { fail, redirect } from '@sveltejs/kit';
import type { Actions, PageServerLoad } from './$types';
import { apiFetch, ApiException } from '$lib/server/api';
import type { PaginatedResponse, Ticket, TicketPriority, TicketStatus, UpdateTicketPayload, User } from '$lib/types';

export const load: PageServerLoad = async ({ cookies, url }) => {
	const token = cookies.get('tf_token');
	if (!token) throw redirect(302, '/login');

	const page = url.searchParams.get('page') ?? '1';
	const status = url.searchParams.get('status') ?? '';
	const search = url.searchParams.get('search') ?? '';
	const limit = url.searchParams.get('limit') ?? '10';
	const sortBy = url.searchParams.get('sortBy') ?? 'createdAt';
	const orderBy = url.searchParams.get('orderBy') ?? 'desc';

	// Construction de la query string
	const params = new URLSearchParams({ page, limit, sortBy, orderBy });
	if (status) params.set('status', status);
	if (search) params.set('search', search);

	try {
		const [response, techniciansRes] = await Promise.all([
			apiFetch<PaginatedResponse<Ticket>>(`/api/tickets?${params.toString()}`, { token }),
			apiFetch<User[] | { value: User[] }>('/api/technicians', { token }).catch(() => [])
		]);

		const technicians = Array.isArray(techniciansRes)
			? techniciansRes
			: ((techniciansRes as any)?.value ?? []);

		return {
			tickets: response.data,
			meta: response.meta,
			technicians,
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
			technicians: [] as User[],
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
	},

	bulkDelete: async ({ request, cookies }) => {
		const token = cookies.get('tf_token');
		if (!token) throw redirect(302, '/login');

		const data = await request.formData();
		const rawIds = data.get('ids') as string;
		if (!rawIds) return fail(400, { bulkError: 'Aucun ticket sélectionné.' });

		let ids: string[] = [];
		try {
			ids = JSON.parse(rawIds);
		} catch {
			return fail(400, { bulkError: 'Format des identifiants invalide.' });
		}

		if (!Array.isArray(ids) || ids.length === 0) {
			return fail(400, { bulkError: 'Aucun ticket sélectionné.' });
		}

		try {
			await Promise.all(
				ids.map((id) => apiFetch(`/api/tickets/${id}`, { method: 'DELETE', token }))
			);
		} catch (err) {
			if (err instanceof ApiException) {
				if (err.statusCode === 401) {
					cookies.delete('tf_token', { path: '/' });
					cookies.delete('tf_user', { path: '/' });
					throw redirect(302, '/login');
				}
				return fail(err.statusCode, { bulkError: err.message });
			}
			return fail(500, { bulkError: 'Erreur lors de la suppression en lot.' });
		}

		return { action: 'bulkDelete', success: true };
	},

	bulkUpdate: async ({ request, cookies }) => {
		const token = cookies.get('tf_token');
		if (!token) throw redirect(302, '/login');

		const data = await request.formData();
		const rawIds = data.get('ids') as string;
		const status = data.get('status') as TicketStatus | null;
		const priorityRaw = data.get('priority') as string | null;
		const assignedTo = data.get('assignedTo') as string | null;
		const originDepartment = data.get('originDepartment') as string | null;

		if (!rawIds) return fail(400, { bulkError: 'Aucun ticket sélectionné.' });

		let ids: string[] = [];
		try {
			ids = JSON.parse(rawIds);
		} catch {
			return fail(400, { bulkError: 'Format des identifiants invalide.' });
		}

		if (!Array.isArray(ids) || ids.length === 0) {
			return fail(400, { bulkError: 'Aucun ticket sélectionné.' });
		}

		const payload: UpdateTicketPayload = {};
		if (status) payload.status = status;
		if (priorityRaw) payload.priority = parseInt(priorityRaw, 10) as TicketPriority;
		if (assignedTo !== null && assignedTo !== undefined && assignedTo !== '') payload.assignedTo = assignedTo;
		if (originDepartment !== null && originDepartment !== undefined && originDepartment !== '') payload.originDepartment = originDepartment;

		if (Object.keys(payload).length === 0) {
			return fail(400, { bulkError: 'Veuillez choisir au moins une propriété à modifier.' });
		}

		try {
			await Promise.all(
				ids.map((id) =>
					apiFetch(`/api/tickets/${id}`, {
						method: 'PATCH',
						token,
						body: payload
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
				return fail(err.statusCode, { bulkError: err.message });
			}
			return fail(500, { bulkError: 'Erreur lors de la modification en lot.' });
		}

		return { action: 'bulkUpdate', success: true };
	}
};



