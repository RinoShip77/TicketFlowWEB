/**
 * Team Members — Load Function
 *
 * Récupère la liste exacte des techniciens depuis GET /api/technicians.
 * Chaque membre de l'équipe EST un technicien enregistré dans la base de données.
 */

import { fail, redirect } from '@sveltejs/kit';
import type { Actions, PageServerLoad } from './$types';
import { apiFetch, ApiException } from '$lib/server/api';
import type { User } from '$lib/types';

export interface TeamMember extends User {
	department: string;
	roleTitle: 'Admin' | 'Technician';
	status: 'Active' | 'Inactive';
}

export const load: PageServerLoad = async ({ cookies }) => {
	const token = cookies.get('tf_token');
	if (!token) throw redirect(302, '/login');

	try {
		const res = await apiFetch<User[] | { value: User[] }>('/api/technicians', { token });
		// L'API backend retourne un tableau d'utilisateurs directement: User[]
		const rawMembers: User[] = Array.isArray(res) ? res : res?.value ?? [];

		const defaultDepartments = ['IT', 'Support Technique', 'TI', 'Executive Team', 'HR'];

		// Les membres d'équipe sont TOUS des techniciens de la base de données
		const members: TeamMember[] = rawMembers.map((m, idx) => {
			// Niveau 3 = Admin, Niveau 1 et 2 = Technician
			const roleTitle: 'Admin' | 'Technician' = m.level === 3 ? 'Admin' : 'Technician';
			const department = defaultDepartments[idx % defaultDepartments.length];

			return {
				...m,
				department,
				roleTitle,
				status: 'Active' // Tous les techniciens existants en DB sont Actifs
			};
		});

		return {
			members
		};
	} catch (err) {
		if (err instanceof ApiException && err.statusCode === 401) {
			cookies.delete('tf_token', { path: '/' });
			cookies.delete('tf_user', { path: '/' });
			throw redirect(302, '/login');
		}
		return {
			members: [] as TeamMember[]
		};
	}
};

export const actions: Actions = {
	deleteMember: async ({ request, cookies }) => {
		const token = cookies.get('tf_token');
		if (!token) throw redirect(302, '/login');

		const data = await request.formData();
		const id = data.get('id') as string;
		if (!id) return fail(400, { deleteError: 'ID requis.' });

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
				return fail(err.statusCode, { deleteError: err.message });
			}
			return fail(500, { deleteError: 'Erreur lors de la suppression.' });
		}

		return { action: 'deleteMember', success: true };
	},

	bulkDelete: async ({ request, cookies }) => {
		const token = cookies.get('tf_token');
		if (!token) throw redirect(302, '/login');

		const data = await request.formData();
		const rawIds = data.get('ids') as string;
		if (!rawIds) return fail(400, { bulkError: 'Aucun membre sélectionné.' });

		let ids: string[] = [];
		try {
			ids = JSON.parse(rawIds);
		} catch {
			return fail(400, { bulkError: 'Format des identifiants invalide.' });
		}

		if (!Array.isArray(ids) || ids.length === 0) {
			return fail(400, { bulkError: 'Aucun membre sélectionné.' });
		}

		try {
			await Promise.all(
				ids.map((id) => apiFetch(`/api/technicians/${id}`, { method: 'DELETE', token }))
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
		const name = (data.get('name') as string)?.trim();
		const department = (data.get('department') as string)?.trim();
		const roleTitle = data.get('roleTitle') as string | null;
		const levelRaw = data.get('level') as string | null;
		const status = data.get('status') as string | null;

		if (!rawIds) return fail(400, { bulkError: 'Aucun membre sélectionné.' });

		let ids: string[] = [];
		try {
			ids = JSON.parse(rawIds);
		} catch {
			return fail(400, { bulkError: 'Format des identifiants invalide.' });
		}

		if (!Array.isArray(ids) || ids.length === 0) {
			return fail(400, { bulkError: 'Aucun membre sélectionné.' });
		}

		const payload: Record<string, any> = {};
		if (name) payload.name = name;
		if (department) payload.department = department;
		if (status) payload.status = status;
		if (roleTitle) {
			payload.roleTitle = roleTitle;
			if (roleTitle === 'Admin') payload.level = 3;
		}
		if (levelRaw) {
			const lvl = parseInt(levelRaw, 10);
			if (!isNaN(lvl)) {
				payload.level = lvl;
				if (lvl === 3) payload.roleTitle = 'Admin';
				else if (lvl < 3 && !roleTitle) payload.roleTitle = 'Technician';
			}
		}

		if (Object.keys(payload).length === 0) {
			return fail(400, { bulkError: 'Veuillez choisir au moins une propriété à modifier.' });
		}

		try {
			await Promise.all(
				ids.map((id) =>
					apiFetch(`/api/technicians/${id}`, {
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
