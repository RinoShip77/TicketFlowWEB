/**
 * Nouveau Ticket — Server (Load + Action)
 *
 * Load: récupère la liste des techniciens pour le dropdown "Assigné à"
 * Action: valide et POST vers /api/tickets
 */

import { fail, redirect } from '@sveltejs/kit';
import type { Actions, PageServerLoad } from './$types';
import { apiFetch, ApiException } from '$lib/server/api';
import type { CreateTicketPayload, Ticket, TicketPriority, User } from '$lib/types';

export const load: PageServerLoad = async ({ cookies }) => {
	const token = cookies.get('tf_token');
	if (!token) throw redirect(302, '/login');

	// Chargement des techniciens pour le select "Assigné à"
	let technicians: User[] = [];
	try {
		const res = await apiFetch<{ value: User[] }>('/api/technicians', { token });
		technicians = res.value ?? [];
	} catch {
		// Non bloquant — le dropdown sera vide
	}

	return { technicians };
};

export const actions: Actions = {
	default: async ({ request, cookies }) => {
		const token = cookies.get('tf_token');
		if (!token) throw redirect(302, '/login');

		const data = await request.formData();

		const title = (data.get('title') as string)?.trim();
		const description = (data.get('description') as string)?.trim();
		const priorityRaw = data.get('priority') as string;
		const originDepartment = (data.get('originDepartment') as string)?.trim() || undefined;
		const assignedTo = (data.get('assignedTo') as string)?.trim() || undefined;

		// ── Validation ────────────────────────────────────────────────
		const errors: Record<string, string> = {};

		if (!title) errors.title = 'Le titre est requis.';
		else if (title.length > 100) errors.title = 'Maximum 100 caractères.';

		if (!description) errors.description = 'La description est requise.';

		const priority = parseInt(priorityRaw, 10) as TicketPriority;
		if (!priorityRaw || isNaN(priority)) errors.priority = 'La priorité est requise.';
		else if (priority < 1 || priority > 5) errors.priority = 'Priorité invalide (1-5).';

		if (Object.keys(errors).length > 0) {
			return fail(422, { errors, title, description, priority: priorityRaw, originDepartment, assignedTo });
		}

		// ── Appel API ────────────────────────────────────────────────
		try {
			await apiFetch<Ticket>('/api/tickets', {
				method: 'POST',
				token,
				body: {
					title,
					description,
					priority,
					...(originDepartment ? { originDepartment } : {}),
					...(assignedTo ? { assignedTo } : {})
				} satisfies CreateTicketPayload
			});
		} catch (err) {
			if (err instanceof ApiException) {
				if (err.statusCode === 401) {
					cookies.delete('tf_token', { path: '/' });
					cookies.delete('tf_user', { path: '/' });
					throw redirect(302, '/login');
				}
				return fail(err.statusCode, {
					formError: err.message,
					title, description, priority: priorityRaw, originDepartment, assignedTo
				});
			}
			return fail(500, {
				formError: 'Erreur de connexion au serveur. Réessayez.',
				title, description, priority: priorityRaw, originDepartment, assignedTo
			});
		}

		throw redirect(302, '/tickets');
	}
};
