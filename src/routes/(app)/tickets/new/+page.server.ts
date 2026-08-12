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
		const res = await apiFetch<User[] | { value: User[] }>('/api/technicians', { token });
		technicians = Array.isArray(res) ? res : res?.value ?? [];
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
	},

	createBulk: async ({ request, cookies }) => {
		const token = cookies.get('tf_token');
		if (!token) throw redirect(302, '/login');

		const data = await request.formData();
		const rawTickets = data.get('tickets') as string;
		if (!rawTickets) return fail(400, { bulkFormError: 'Aucun ticket fourni.' });

		let ticketItems: Array<{
			title: string;
			description: string;
			priority: number;
			originDepartment?: string;
			assignedTo?: string;
		}> = [];

		try {
			ticketItems = JSON.parse(rawTickets);
		} catch {
			return fail(400, { bulkFormError: 'Format des tickets invalide.' });
		}

		if (!Array.isArray(ticketItems) || ticketItems.length === 0) {
			return fail(400, { bulkFormError: 'Veuillez ajouter au moins un ticket.' });
		}

		// Validation de chaque ticket
		const rowErrors: Record<number, string> = {};
		ticketItems.forEach((t, index) => {
			if (!t.title?.trim()) {
				rowErrors[index] = `Ticket #${index + 1} : Le titre est requis.`;
			} else if (t.title.length > 100) {
				rowErrors[index] = `Ticket #${index + 1} : Titre > 100 caractères.`;
			} else if (!t.description?.trim()) {
				rowErrors[index] = `Ticket #${index + 1} : La description est requise.`;
			}
		});

		if (Object.keys(rowErrors).length > 0) {
			return fail(422, { action: 'createBulk', rowErrors, rawTickets });
		}

		try {
			await Promise.all(
				ticketItems.map((t) =>
					apiFetch<Ticket>('/api/tickets', {
						method: 'POST',
						token,
						body: {
							title: t.title.trim(),
							description: t.description.trim(),
							priority: (t.priority ?? 3) as TicketPriority,
							...(t.originDepartment ? { originDepartment: t.originDepartment.trim() } : {}),
							...(t.assignedTo ? { assignedTo: t.assignedTo.trim() } : {})
						} satisfies CreateTicketPayload
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
				return fail(err.statusCode, { action: 'createBulk', bulkFormError: err.message, rawTickets });
			}
			return fail(500, { action: 'createBulk', bulkFormError: 'Erreur lors de la création des tickets.', rawTickets });
		}

		throw redirect(302, '/tickets');
	}
};

