// ─────────────────────────────────────────────────────────────────────────────
// Entités métier — Utilisateur / Technicien
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
// Tickets
// ─────────────────────────────────────────────────────────────────────────────

/** Statuts exacts renvoyés par le backend */
export type TicketStatus = 'Open' | 'In progress' | 'Resolved' | 'Closed';

/** Priorité numérique : 1 (Très faible) → 5 (Critique) */
export type TicketPriority = 1 | 2 | 3 | 4 | 5;

export interface TicketNote {
	_id?: string;
	text: string;
	technician?: Pick<User, '_id' | 'name' | 'email'>;
	createdAt?: string;
}

export interface Ticket {
	_id: string;
	title: string;
	description: string;
	status: TicketStatus;
	priority: TicketPriority;
	originDepartment?: string;
	assignedTo?: Pick<User, '_id' | 'name' | 'email' | 'level'>;
	notes: TicketNote[];
	createdAt: string;
	updatedAt: string;
}

export interface CreateTicketPayload {
	title: string;
	description: string;
	priority: TicketPriority;
	originDepartment?: string;
	status?: TicketStatus;
	assignedTo?: string;
}

// ─────────────────────────────────────────────────────────────────────────────
// Réponses API paginées
// ─────────────────────────────────────────────────────────────────────────────

export interface PaginationMeta {
	totalDocuments: number;
	totalPages: number;
	currentPage: number;
	hasNext: boolean;
}

export interface PaginatedResponse<T> {
	data: T[];
	meta: PaginationMeta;
}

// ─────────────────────────────────────────────────────────────────────────────
// Dashboard Stats
// ─────────────────────────────────────────────────────────────────────────────

export interface DashboardOverview {
	total: number;
	open: number;
	inProgress: number;
	resolved: number;
	closed: number;
	resolutionRate: number;
}

export interface PriorityMatrixItem {
	priorityLevel: TicketPriority;
	activeTickets: number;
}

export interface DepartmentStat {
	department: string;
	count: number;
}

export interface DashboardStats {
	type: string;
	overview: DashboardOverview;
	criticality: {
		priorityMatrix: PriorityMatrixItem[];
		zombieTickets: number;
	};
	departments: DepartmentStat[];
}

// ─────────────────────────────────────────────────────────────────────────────
// API générique
// ─────────────────────────────────────────────────────────────────────────────

export interface ApiError {
	message: string;
	statusCode: number;
}

export type ActionResult<T = undefined> =
	| { success: true; data?: T }
	| { success: false; error: string; fields?: Record<string, string> };
