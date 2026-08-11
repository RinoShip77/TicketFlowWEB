<script lang="ts">
	import { goto } from '$app/navigation';
	import { page as pageState } from '$app/state';
	import type { PageData } from './$types';
	import type { TicketStatus } from '$lib/types';

	interface Props {
		data: PageData;
	}

	let { data }: Props = $props();

	// ── Filter state ─────────────────────────────────────────────
	let searchValue = $state(data.filters.search);
	let statusFilter = $state(data.filters.status);
	let searchTimeout: ReturnType<typeof setTimeout>;

	// Sync local filter input values if URL parameters change
	$effect(() => {
		searchValue = data.filters.search;
		statusFilter = data.filters.status;
	});

	function applyFilter(overrides: { page?: number; status?: string; search?: string }) {
		const params = new URLSearchParams(pageState.url.searchParams);

		if (overrides.page !== undefined) {
			params.set('page', String(overrides.page));
		} else {
			// Si on recherche ou change de statut, on réinitialise à la page 1
			params.set('page', '1');
		}

		if (overrides.status !== undefined) {
			if (overrides.status) params.set('status', overrides.status);
			else params.delete('status');
		}

		if (overrides.search !== undefined) {
			if (overrides.search) params.set('search', overrides.search);
			else params.delete('search');
		}

		goto(`?${params.toString()}`, { keepFocus: true, noScroll: true });
	}

	function onSearchInput() {
		clearTimeout(searchTimeout);
		searchTimeout = setTimeout(() => applyFilter({ search: searchValue }), 350);
	}

	function onStatusChange() {
		applyFilter({ status: statusFilter });
	}

	// ── Pagination pages array ($derived.by réactif sur data.meta) ──
	const paginationPages = $derived.by(() => {
		if (!data.meta) return [];
		const total = data.meta.totalPages;
		const current = data.meta.currentPage;
		const pages: (number | '...')[] = [];
		if (total <= 7) {
			for (let i = 1; i <= total; i++) pages.push(i);
		} else {
			pages.push(1);
			if (current > 3) pages.push('...');
			for (let i = Math.max(2, current - 1); i <= Math.min(total - 1, current + 1); i++) pages.push(i);
			if (current < total - 2) pages.push('...');
			pages.push(total);
		}
		return pages;
	});

	// ── Helpers ─────────────────────────────────────────────────
	function statusBadge(status: TicketStatus) {
		const map: Record<TicketStatus, { label: string; color: string }> = {
			Open:            { label: 'Open',        color: 'text-blue-600 dark:text-blue-400' },
			'In progress':   { label: 'In Progress', color: 'text-purple-600 dark:text-purple-400' },
			Resolved:        { label: 'Resolved',    color: 'text-green-600 dark:text-emerald-400' },
			Closed:          { label: 'Closed',      color: 'text-red-600 dark:text-red-400' }
		};
		return map[status] ?? { label: status, color: 'text-gray-500 dark:text-zinc-400' };
	}

	function formatDate(iso: string) {
		return new Intl.DateTimeFormat('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }).format(new Date(iso));
	}

	const avatarColors = [
		'bg-indigo-100 dark:bg-indigo-900/40 text-indigo-700 dark:text-indigo-300',
		'bg-purple-100 dark:bg-purple-900/40 text-purple-700 dark:text-purple-300',
		'bg-pink-100 dark:bg-pink-900/40 text-pink-700 dark:text-pink-300',
		'bg-orange-100 dark:bg-orange-900/40 text-orange-700 dark:text-orange-300',
		'bg-teal-100 dark:bg-teal-900/40 text-teal-700 dark:text-teal-300',
		'bg-green-100 dark:bg-green-900/40 text-green-700 dark:text-green-300'
	];
	function avatarColor(name: string): string {
		let h = 0;
		for (const c of name) h = (h * 31 + c.charCodeAt(0)) % avatarColors.length;
		return avatarColors[Math.abs(h)];
	}

	const statusOptions: { value: string; label: string }[] = [
		{ value: '', label: 'All Statuses' },
		{ value: 'Open', label: 'Open' },
		{ value: 'In progress', label: 'In Progress' },
		{ value: 'Resolved', label: 'Resolved' },
		{ value: 'Closed', label: 'Closed' }
	];
</script>

<svelte:head>
	<title>All Tickets — TicketFlow</title>
	<meta name="description" content="Liste complète des tickets de support TicketFlow avec filtres et pagination." />
</svelte:head>

<div class="space-y-5">

	<!-- ── Header ──────────────────────────────────────────────────── -->
	<div class="flex items-center justify-between">
		<h2 class="text-xl font-bold text-gray-900 dark:text-white">All Tickets</h2>
		<a
			href="/tickets/new"
			id="btn-create-ticket-list"
			class="inline-flex items-center gap-2 px-4 py-2.5 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-semibold transition-colors duration-200 shadow-sm"
		>
			<svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2.5" aria-hidden="true">
				<path stroke-linecap="round" stroke-linejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
			</svg>
			+ Create Ticket
		</a>
	</div>

	<!-- ── Filters & Table Card ────────────────────────────────────── -->
	<div class="bg-white dark:bg-zinc-900 rounded-xl border border-gray-200 dark:border-zinc-800 shadow-sm transition-colors duration-200">

		<!-- Search + Filter bar -->
		<div class="flex flex-wrap items-center gap-3 px-5 py-4 border-b border-gray-100 dark:border-zinc-800">
			<!-- Search -->
			<div class="relative flex-1 min-w-[180px] max-w-xs">
				<svg class="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 dark:text-zinc-500 pointer-events-none" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="1.75" aria-hidden="true">
					<path stroke-linecap="round" stroke-linejoin="round" d="m21 21-5.197-5.197m0 0A7.5 7.5 0 1 0 5.196 5.196a7.5 7.5 0 0 0 10.607 10.607Z" />
				</svg>
				<input
					type="text"
					bind:value={searchValue}
					oninput={onSearchInput}
					placeholder="Search..."
					id="ticket-search"
					class="w-full pl-9 pr-3 py-2 text-sm rounded-lg border border-gray-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 text-gray-800 dark:text-zinc-200 placeholder:text-gray-400 dark:placeholder:text-zinc-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-colors"
				/>
			</div>

			<!-- Status filter -->
			<div class="relative">
				<select
					bind:value={statusFilter}
					onchange={onStatusChange}
					id="filter-status"
					class="appearance-none pl-3 pr-8 py-2 text-sm rounded-lg border border-gray-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 text-gray-700 dark:text-zinc-300 focus:outline-none focus:ring-2 focus:ring-indigo-500 cursor-pointer transition-colors"
				>
					{#each statusOptions as opt}
						<option value={opt.value}>{opt.label}</option>
					{/each}
				</select>
				<svg class="absolute right-2.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 dark:text-zinc-500 pointer-events-none" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2" aria-hidden="true">
					<path stroke-linecap="round" stroke-linejoin="round" d="m19.5 8.25-7.5 7.5-7.5-7.5" />
				</svg>
			</div>

			<!-- View toggle -->
			<div class="flex items-center gap-1 border border-gray-200 dark:border-zinc-700 rounded-lg p-0.5 ml-auto">
				<button class="p-1.5 rounded-md bg-indigo-600 text-white" aria-label="Vue liste" aria-pressed="true">
					<svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2" aria-hidden="true">
						<path stroke-linecap="round" stroke-linejoin="round" d="M4 6h16M4 10h16M4 14h16M4 18h16" />
					</svg>
				</button>
				<button class="p-1.5 rounded-md text-gray-400 dark:text-zinc-500 hover:text-gray-600 dark:hover:text-zinc-300" aria-label="Vue grille" aria-pressed="false">
					<svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2" aria-hidden="true">
						<path stroke-linecap="round" stroke-linejoin="round" d="M3.75 6A2.25 2.25 0 0 1 6 3.75h2.25A2.25 2.25 0 0 1 10.5 6v2.25a2.25 2.25 0 0 1-2.25 2.25H6a2.25 2.25 0 0 1-2.25-2.25V6ZM3.75 15.75A2.25 2.25 0 0 1 6 13.5h2.25a2.25 2.25 0 0 1 2.25 2.25V18a2.25 2.25 0 0 1-2.25 2.25H6A2.25 2.25 0 0 1 3.75 18v-2.25ZM13.5 6a2.25 2.25 0 0 1 2.25-2.25H18A2.25 2.25 0 0 1 20.25 6v2.25A2.25 2.25 0 0 1 18 10.5h-2.25a2.25 2.25 0 0 1-2.25-2.25V6ZM13.5 15.75a2.25 2.25 0 0 1 2.25-2.25H18a2.25 2.25 0 0 1 2.25 2.25V18A2.25 2.25 0 0 1 18 20.25h-2.25A2.25 2.25 0 0 1 13.5 18v-2.25Z" />
					</svg>
				</button>
			</div>
		</div>

		<!-- Table -->
		{#if !data.tickets || data.tickets.length === 0}
			<div class="py-16 text-center">
				<svg class="w-10 h-10 text-gray-300 dark:text-zinc-600 mx-auto mb-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="1.5" aria-hidden="true">
					<path stroke-linecap="round" stroke-linejoin="round" d="M9 5H7a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V7a2 2 0 0 0-2-2h-2M9 5a2 2 0 0 0 2 2h2a2 2 0 0 0 2-2M9 5a2 2 0 0 1 2-2h2a2 2 0 0 1 2 2" />
				</svg>
				<p class="text-gray-500 dark:text-zinc-400 text-sm">Aucun ticket trouvé.</p>
				<a href="/tickets/new" class="text-indigo-600 dark:text-indigo-400 text-sm hover:underline mt-1 inline-block">Créer le premier ticket →</a>
			</div>
		{:else}
			<div class="overflow-x-auto">
				<table class="w-full text-sm" aria-label="Liste des tickets">
					<thead>
						<tr class="text-left text-xs font-medium text-gray-400 dark:text-zinc-500 border-b border-gray-100 dark:border-zinc-800">
							<th class="px-5 py-3">Ticket ID</th>
							<th class="px-4 py-3">Subject</th>
							<th class="px-4 py-3 hidden md:table-cell">Category</th>
							<th class="px-4 py-3">Status</th>
							<th class="px-4 py-3 hidden md:table-cell">Assigned To</th>
							<th class="px-4 py-3 hidden lg:table-cell">Date</th>
							<th class="px-4 py-3">Action</th>
						</tr>
					</thead>
					<tbody class="divide-y divide-gray-100 dark:divide-zinc-800">
						{#each data.tickets as ticket (ticket._id)}
							{@const sb = statusBadge(ticket.status)}
							<tr class="hover:bg-gray-50 dark:hover:bg-zinc-800/50 transition-colors duration-100">
								<td class="px-5 py-3.5 text-gray-400 dark:text-zinc-500 text-xs font-mono">
									#{ticket._id.slice(-4)}
								</td>
								<td class="px-4 py-3.5 max-w-[180px]">
									<span class="text-gray-800 dark:text-zinc-200 font-medium line-clamp-1">{ticket.title}</span>
								</td>
								<td class="px-4 py-3.5 hidden md:table-cell">
									<span class="text-gray-500 dark:text-zinc-400 text-xs">{ticket.originDepartment ?? '—'}</span>
								</td>
								<td class="px-4 py-3.5">
									<span class="text-xs font-semibold {sb.color}">{sb.label}</span>
								</td>
								<td class="px-4 py-3.5 hidden md:table-cell">
									{#if ticket.assignedTo}
										<div class="flex items-center gap-2">
											<div class="w-7 h-7 rounded-full {avatarColor(ticket.assignedTo.name)} flex items-center justify-center shrink-0">
												<span class="text-[10px] font-bold">{ticket.assignedTo.name.charAt(0).toUpperCase()}</span>
											</div>
											<span class="text-gray-700 dark:text-zinc-300 text-xs truncate max-w-[100px]">{ticket.assignedTo.name}</span>
										</div>
									{:else}
										<span class="text-gray-400 dark:text-zinc-600 text-xs">Non assigné</span>
									{/if}
								</td>
								<td class="px-4 py-3.5 hidden lg:table-cell text-xs text-gray-400 dark:text-zinc-500">
									{formatDate(ticket.createdAt)}
								</td>
								<td class="px-4 py-3.5">
									<div class="flex items-center gap-2">
										<button class="text-gray-400 dark:text-zinc-500 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors" aria-label="Voir le ticket">
											<svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="1.75" aria-hidden="true">
												<path stroke-linecap="round" stroke-linejoin="round" d="M2.036 12.322a1.012 1.012 0 0 1 0-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178Z" />
												<path stroke-linecap="round" stroke-linejoin="round" d="M15 12a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z" />
											</svg>
										</button>
										<button class="text-gray-400 dark:text-zinc-500 hover:text-amber-500 transition-colors" aria-label="Modifier le ticket">
											<svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="1.75" aria-hidden="true">
												<path stroke-linecap="round" stroke-linejoin="round" d="m16.862 4.487 1.687-1.688a1.875 1.875 0 1 1 2.652 2.652L10.582 16.07a4.5 4.5 0 0 1-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 0 1 1.13-1.897l8.932-8.931Zm0 0L19.5 7.125" />
											</svg>
										</button>
										<button class="text-gray-400 dark:text-zinc-500 hover:text-red-500 transition-colors" aria-label="Supprimer le ticket">
											<svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="1.75" aria-hidden="true">
												<path stroke-linecap="round" stroke-linejoin="round" d="m14.74 9-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 0 1-2.244 2.077H8.084a2.25 2.25 0 0 1-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 0 0-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 0 1 3.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 0 0-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 0 0-7.5 0" />
											</svg>
										</button>
									</div>
								</td>
							</tr>
						{/each}
					</tbody>
				</table>
			</div>

			<!-- Pagination -->
			{#if data.meta && data.meta.totalPages > 1}
				<div class="px-5 py-4 border-t border-gray-100 dark:border-zinc-800 flex items-center justify-between">
					<!-- Previous -->
					<button
						onclick={() => applyFilter({ page: data.meta.currentPage - 1 })}
						disabled={data.meta.currentPage === 1}
						class="flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium text-gray-600 dark:text-zinc-400 hover:text-gray-900 dark:hover:text-zinc-100 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
					>
						<svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2" aria-hidden="true">
							<path stroke-linecap="round" stroke-linejoin="round" d="M15.75 19.5 8.25 12l7.5-7.5" />
						</svg>
						Previous
					</button>

					<!-- Page numbers -->
					<div class="flex items-center gap-1">
						{#each paginationPages as p}
							{#if p === '...'}
								<span class="w-8 text-center text-gray-400 dark:text-zinc-600 text-sm">…</span>
							{:else}
								<button
									onclick={() => applyFilter({ page: p as number })}
									class="
										w-8 h-8 rounded-lg text-sm font-medium transition-colors duration-100
										{data.meta.currentPage === p
											? 'bg-indigo-600 text-white font-semibold shadow-xs'
											: 'text-gray-600 dark:text-zinc-400 hover:bg-gray-100 dark:hover:bg-zinc-800 hover:text-gray-900 dark:hover:text-zinc-100'}
									"
									aria-current={data.meta.currentPage === p ? 'page' : undefined}
								>
									{p}
								</button>
							{/if}
						{/each}
					</div>

					<!-- Next -->
					<button
						onclick={() => applyFilter({ page: data.meta.currentPage + 1 })}
						disabled={!data.meta.hasNext}
						class="flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium text-gray-600 dark:text-zinc-400 hover:text-gray-900 dark:hover:text-zinc-100 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
					>
						Next
						<svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2" aria-hidden="true">
							<path stroke-linecap="round" stroke-linejoin="round" d="m8.25 4.5 7.5 7.5-7.5 7.5" />
						</svg>
					</button>
				</div>
			{/if}
		{/if}
	</div>
</div>
