/**
 * Team Member Detail — Load Function
 *
 * Route : /team-members/[id]
 *
 * Load :
 *   - GET /api/technicians → liste complète, filtre par id côté serveur
 *
 * Actions :
 *   - updateMember : PATCH /api/technicians/:id (name, email, level)
 *   - deleteMember : DELETE /api/technicians/:id
 */

import { error, fail, redirect } from '@sveltejs/kit';
import type { Actions, PageServerLoad } from './$types';
import { apiFetch, ApiException } from '$lib/server/api';
import type { User } from '$lib/types';

export interface TeamMember extends User {
	department: string;
	roleTitle: 'Admin' | 'Technician';
	status: 'Active' | 'Inactive';
}

const defaultDepartments = ['IT', 'Support Technique', 'TI', 'Executive Team', 'HR'];

function buildMember(m: User, idx: number): TeamMember {
	return {
		...m,
		department: defaultDepartments[idx % defaultDepartments.length],
		roleTitle: m.level === 3 ? 'Admin' : 'Technician',
		status: 'Active'
	};
}

export const load: PageServerLoad = async ({ cookies, params }) => {
	const token = cookies.get('tf_token');
	if (!token) throw redirect(302, '/login');

	const { id } = params;

	try {
		const res = await apiFetch<User[] | { value: User[] }>('/api/technicians', { token });
		const rawMembers: User[] = Array.isArray(res) ? res : res?.value ?? [];

		const idx = rawMembers.findIndex((m) => (m._id ?? m.id) === id);
		if (idx === -1) throw error(404, 'Technicien introuvable.');

		const member = buildMember(rawMembers[idx], idx);

		return { member };
	} catch (err) {
		if (err instanceof ApiException) {
			if (err.statusCode === 401) {
				cookies.delete('tf_token', { path: '/' });
				cookies.delete('tf_user', { path: '/' });
				throw redirect(302, '/login');
			}
			throw error(err.statusCode, err.message);
		}
		// re-throw SvelteKit errors (404, etc.)
		throw err;
	}
};

export const actions: Actions = {
	// ── Mise à jour des informations du technicien ─────────────────────
	updateMember: async ({ request, cookies, params }) => {
		const token = cookies.get('tf_token');
		if (!token) throw redirect(302, '/login');

		const { id } = params;
		const data = await request.formData();

		const name  = (data.get('name')  as string)?.trim();
		const email = (data.get('email') as string)?.trim();
		const levelRaw = data.get('level') as string;

		// ── Validation ────────────────────────────────────────────────
		const errors: Record<string, string> = {};

		if (!name || name.length < 2) errors.name = 'Le nom doit contenir au moins 2 caractères.';
		if (name && name.length > 100) errors.name = 'Maximum 100 caractères.';
		if (!email) errors.email = "L'email est requis.";
		else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) errors.email = 'Format email invalide.';

		const level = levelRaw ? parseInt(levelRaw, 10) : NaN;
		if (levelRaw && (isNaN(level) || level < 1 || level > 3)) {
			errors.level = 'Le niveau doit être entre 1 et 3.';
		}

		if (Object.keys(errors).length > 0) {
			return fail(422, { action: 'updateMember', errors });
		}

		const payload: Partial<User> = {};
		if (name) payload.name = name;
		if (email) payload.email = email;
		if (levelRaw && !isNaN(level)) payload.level = level;

		try {
			await apiFetch<User>(`/api/technicians/${id}`, {
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
				return fail(err.statusCode, { action: 'updateMember', formError: err.message });
			}
			return fail(500, { action: 'updateMember', formError: 'Erreur de connexion au serveur.' });
		}

		return { action: 'updateMember', success: true };
	},

	// ── Suppression du technicien ──────────────────────────────────────
	deleteMember: async ({ cookies, params }) => {
		const token = cookies.get('tf_token');
		if (!token) throw redirect(302, '/login');

		const { id } = params;

		try {
			await apiFetch(`/api/technicians/${id}`, {
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
				return fail(err.statusCode, { action: 'deleteMember', formError: err.message });
			}
			return fail(500, { action: 'deleteMember', formError: 'Erreur lors de la suppression.' });
		}

		throw redirect(302, '/team-members');
	}
};
