/**
 * Utilitaire pour appeler l'API backend TicketFlow.
 * Utilisé UNIQUEMENT côté serveur (+page.server.ts, hooks).
 * Le JWT n'est jamais exposé au navigateur.
 */

import { PUBLIC_API_URL } from '$env/static/public';
import type { ApiError } from '$lib/types';

export class ApiException extends Error {
	constructor(
		public readonly statusCode: number,
		message: string
	) {
		super(message);
		this.name = 'ApiException';
	}
}

interface FetchOptions {
	method?: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';
	body?: unknown;
	token?: string;
}

export async function apiFetch<T>(endpoint: string, options: FetchOptions = {}): Promise<T> {
	const { method = 'GET', body, token } = options;

	const headers: Record<string, string> = {
		'Content-Type': 'application/json'
	};

	if (token) {
		headers['Authorization'] = `Bearer ${token}`;
	}

	const response = await fetch(`${PUBLIC_API_URL}${endpoint}`, {
		method,
		headers,
		body: body ? JSON.stringify(body) : undefined
	});

	if (!response.ok) {
		let errorMessage = `HTTP ${response.status}`;
		try {
			const err: ApiError = await response.json();
			errorMessage = err.message ?? errorMessage;
		} catch {
			// réponse non-JSON, on garde le message HTTP
		}
		throw new ApiException(response.status, errorMessage);
	}

	// 204 No Content — pas de corps
	if (response.status === 204) {
		return undefined as T;
	}

	return response.json() as Promise<T>;
}
