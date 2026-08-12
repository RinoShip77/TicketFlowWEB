/**
 * Ticket Detail — Server (Load + Actions)
 *
 * Route : /tickets/[id]
 *
 * Load :
 *   - GET /api/tickets/:id  → ticket complet (notes, assignedTo)
 *   - GET /api/technicians  → liste pour le select "Assigné à"
 *
 * Actions :
 *   - updateTicket : PATCH /api/tickets/:id  (titre, description, statut, priorité, assignation)
 *   - addNote      : POST  /api/tickets/:id/notes  (ajout d'une note dans l'historique)
 */

import { error, fail, redirect } from '@sveltejs/kit';
import type { Actions, PageServerLoad } from './$types';
import { apiFetch, ApiException } from '$lib/server/api';
import type {
	AddNotePayload,
	Ticket,
	TicketPriority,
	TicketStatus,
	UpdateTicketPayload,
	User
} from '$lib/types';

export const load: PageServerLoad = async ({ cookies, params }) => {
	const token = cookies.get('tf_token');
	if (!token) throw redirect(302, '/login');

	const { id } = params;

	// ── Chargement en parallèle : ticket + techniciens ────────────────
	let ticket: Ticket;
	let technicians: User[] = [];

	try {
		[ticket, technicians] = await Promise.all([
			apiFetch<Ticket>(`/api/tickets/${id}`, { token }),
			apiFetch<User[] | { value: User[] }>('/api/technicians', { token }).then((res) =>
				Array.isArray(res) ? res : (res?.value ?? [])
			)
		]);
	} catch (err) {
		if (err instanceof ApiException) {
			if (err.statusCode === 401) {
				cookies.delete('tf_token', { path: '/' });
				cookies.delete('tf_user', { path: '/' });
				throw redirect(302, '/login');
			}
			if (err.statusCode === 404) {
				throw error(404, 'Ticket introuvable.');
			}
			throw error(err.statusCode, err.message);
		}
		throw error(500, 'Erreur lors du chargement du ticket.');
	}

	return { ticket, technicians };
};

export const actions: Actions = {
	// ── Mise à jour du ticket (titre, description, statut, priorité…) ──
	updateTicket: async ({ request, cookies, params }) => {
		const token = cookies.get('tf_token');
		if (!token) throw redirect(302, '/login');

		const { id } = params;
		const data = await request.formData();

		const title = (data.get('title') as string)?.trim();
		const description = (data.get('description') as string)?.trim();
		const status = data.get('status') as TicketStatus | null;
		const priorityRaw = data.get('priority') as string | null;
		const assignedTo = data.get('assignedTo') as string | null;
		const originDepartment = (data.get('originDepartment') as string)?.trim() || undefined;

		// ── Validation légère ─────────────────────────────────────────
		const errors: Record<string, string> = {};

		if (title !== undefined && title !== null && title.length === 0) {
			errors.title = 'Le titre ne peut pas être vide.';
		}
		if (title && title.length > 100) {
			errors.title = 'Maximum 100 caractères.';
		}
		if (description !== undefined && description !== null && description.length === 0) {
			errors.description = 'La description ne peut pas être vide.';
		}

		const priority = priorityRaw ? (parseInt(priorityRaw, 10) as TicketPriority) : undefined;
		if (priorityRaw && (isNaN(priority!) || priority! < 1 || priority! > 5)) {
			errors.priority = 'Priorité invalide (1–5).';
		}

		if (Object.keys(errors).length > 0) {
			return fail(422, { action: 'updateTicket', errors });
		}

		// ── Construction du payload (uniquement les champs fournis) ───
		const payload: UpdateTicketPayload = {};
		if (title) payload.title = title;
		if (description) payload.description = description;
		if (status) payload.status = status;
		if (priority) payload.priority = priority;
		if (originDepartment !== undefined) payload.originDepartment = originDepartment;
		if (assignedTo !== undefined) payload.assignedTo = assignedTo || null;

		try {
			await apiFetch<Ticket>(`/api/tickets/${id}`, {
				method: 'PATCH',
				token,
				body: payload
			});
		} catch (err) {
			if (err instanceof ApiException) {
				if (err.statusCode === 401) {
					cookies.delete('tf_token', { path: '/' });
					cookies.delete('tf_user', { path: '/' });
					throw redirect(302, '/login');
				}
				return fail(err.statusCode, { action: 'updateTicket', formError: err.message });
			}
			return fail(500, { action: 'updateTicket', formError: 'Erreur de connexion au serveur.' });
		}

		// SvelteKit recharge automatiquement le load() après une action réussie
		return { action: 'updateTicket', success: true };
	},

	// ── Ajout d'une note dans l'historique ────────────────────────────
	addNote: async ({ request, cookies, params }) => {
		const token = cookies.get('tf_token');
		if (!token) throw redirect(302, '/login');

		const { id } = params;
		const data = await request.formData();

		const text = (data.get('noteText') as string)?.trim();

		if (!text || text.length < 5) {
			return fail(422, {
				action: 'addNote',
				noteError: 'La note doit contenir au moins 5 caractères.'
			});
		}
		if (text.length > 2000) {
			return fail(422, { action: 'addNote', noteError: 'Maximum 2 000 caractères.' });
		}

		try {
			await apiFetch(`/api/tickets/${id}/notes`, {
				method: 'POST',
				token,
				body: { text } satisfies AddNotePayload
			});
		} catch (err) {
			if (err instanceof ApiException) {
				if (err.statusCode === 401) {
					cookies.delete('tf_token', { path: '/' });
					cookies.delete('tf_user', { path: '/' });
					throw redirect(302, '/login');
				}
				return fail(err.statusCode, { action: 'addNote', noteError: err.message });
			}
			return fail(500, { action: 'addNote', noteError: 'Erreur de connexion au serveur.' });
		}

		return { action: 'addNote', success: true };
	},

	// ── Suppression du ticket ──────────────────────────────────────────
	deleteTicket: async ({ cookies, params }) => {
		const token = cookies.get('tf_token');
		if (!token) throw redirect(302, '/login');

		const { id } = params;

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
				return fail(err.statusCode, { action: 'deleteTicket', formError: err.message });
			}
			return fail(500, { action: 'deleteTicket', formError: 'Erreur lors de la suppression.' });
		}

		throw redirect(302, '/tickets');
	}
};

