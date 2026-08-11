// ─────────────────────────────────────────────────────────────────────────────
// Entités métier
// ─────────────────────────────────────────────────────────────────────────────

export interface User {
	_id?: string;
	id?: string;
	email: string;
	name: string;
	level: number;
	role?: 'technician' | 'admin';
	createdAt?: string;
}

// ─────────────────────────────────────────────────────────────────────────────
// Auth
// ─────────────────────────────────────────────────────────────────────────────

export interface AuthResponse {
	success: boolean;
	token: string;
	data: User;
}

export interface LoginPayload {
	email: string;
	password: string;
}

export interface RegisterPayload {
	email: string;
	name: string;
	level: number;
	password: string;
}

// ─────────────────────────────────────────────────────────────────────────────
// API générique
// ─────────────────────────────────────────────────────────────────────────────

export interface ApiError {
	message: string;
	statusCode: number;
}

// Résultat retourné par les form actions de SvelteKit
export type ActionResult<T = undefined> =
	| { success: true; data?: T }
	| { success: false; error: string; fields?: Record<string, string> };

// ─────────────────────────────────────────────────────────────────────────────
// Tickets (prêt pour l'étape 2)
// ─────────────────────────────────────────────────────────────────────────────

export type TicketStatus = 'open' | 'in_progress' | 'resolved' | 'closed';
export type TicketPriority = 'low' | 'medium' | 'high' | 'critical';

export interface Ticket {
	id: string;
	title: string;
	description: string;
	status: TicketStatus;
	priority: TicketPriority;
	assignedTo?: User;
	createdBy: User;
	createdAt: string;
	updatedAt: string;
}
