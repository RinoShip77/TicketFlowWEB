/**
 * Team Members — Load Function
 *
 * Récupère la liste exacte des techniciens depuis GET /api/technicians.
 * Chaque membre de l'équipe EST un technicien enregistré dans la base de données.
 */

import { redirect } from '@sveltejs/kit';
import type { PageServerLoad } from './$types';
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
