/**
 * Settings — Load Function
 */

import { redirect } from '@sveltejs/kit';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ cookies, parent }) => {
	const token = cookies.get('tf_token');
	if (!token) throw redirect(302, '/login');

	const parentData = await parent();
	return {
		user: parentData.user
	};
};
