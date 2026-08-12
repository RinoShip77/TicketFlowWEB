<script lang="ts">
	import { enhance } from '$app/forms';
	import { goto } from '$app/navigation';
	import { page as pageState } from '$app/state';
	import type { PageData } from './$types';
	import type { TicketStatus } from '$lib/types';

	interface Props {
		data: PageData;
	}

	let { data }: Props = $props();

	// ── Suppression state & confirmation ──────────────────────────
	let ticketToDelete = $state<{ id: string; title: string } | null>(null);
	let isDeleting = $state(false);

	function confirmDelete(id: string, title: string) {
		ticketToDelete = { id, title };
	}

	function cancelDelete() {
		ticketToDelete = null;
	}

	// ── Multi-selection & actions en lot ─────────────────────────
	let selectedIds = $state<string[]>([]);
	let isBulkDeletingModalOpen = $state(false);
	let isBulkLoading = $state(false);

	const allSelected = $derived(
		data.tickets.length > 0 && data.tickets.every((t) => selectedIds.includes(t._id))
	);

	function toggleSelectAll() {
		if (allSelected) {
			selectedIds = [];
		} else {
			selectedIds = data.tickets.map((t) => t._id);
		}
	}

	function toggleSelectOne(id: string) {
		if (selectedIds.includes(id)) {
			selectedIds = selectedIds.filter((i) => i !== id);
		} else {
			selectedIds = [...selectedIds, id];
		}
	}

	function clearSelection() {
		selectedIds = [];
	}



	// ── Filter state ─────────────────────────────────────────────
	let searchValue = $state(data.filters.search);
	let statusFilter = $state(data.filters.status);
	let searchTimeout: ReturnType<typeof setTimeout>;

	// ── Sort state (synchronisé avec l'URL via $derived) ────────────
	type SortField = 'priority' | 'createdAt';
	type SortOrder = 'asc' | 'desc';
	// $derived lit data.filters à chaque changement de prop — pas besoin de $effect
	const sortBy = $derived<SortField>((data.filters.sortBy as SortField) ?? 'createdAt');
	const orderBy = $derived<SortOrder>((data.filters.orderBy as SortOrder) ?? 'desc');

	// Sync local state si l'URL change (navigation arrière/avant)
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

	/**
	 * Tri dynamique des colonnes.
	 * - Si on clique sur la colonne déjà active → inverse l'ordre (asc ↔ desc)
	 * - Sinon → active la colonne en ordre desc par défaut
	 * - Remet la pagination à la page 1
	 */
	function applySort(field: SortField) {
		const params = new URLSearchParams(pageState.url.searchParams);
		params.set('page', '1');

		if (sortBy === field) {
			// Inverser l'ordre
			const next: SortOrder = orderBy === 'desc' ? 'asc' : 'desc';
			params.set('sortBy', field);
			params.set('orderBy', next);
		} else {
			// Nouvelle colonne — desc par défaut
			params.set('sortBy', field);
			params.set('orderBy', 'desc');
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

	/**
	 * Badge de priorité (P1–P5) avec couleur et point coloré.
	 * Utilisé dans la colonne Priority du tableau.
	 */
	function priorityBadge(p?: number) {
		const levels: Record<number, { label: string; color: string; dot: string }> = {
			1: { label: 'Très faible', color: 'text-sky-600 dark:text-sky-400',    dot: '#0ea5e9' },
			2: { label: 'Faible',      color: 'text-blue-600 dark:text-blue-400',   dot: '#3b82f6' },
			3: { label: 'Moyenne',     color: 'text-amber-600 dark:text-amber-400', dot: '#f59e0b' },
			4: { label: 'Haute',       color: 'text-orange-600 dark:text-orange-400', dot: '#f97316' },
			5: { label: 'Critique',    color: 'text-red-600 dark:text-red-400',     dot: '#ef4444' }
		};
		return levels[p ?? 3] ?? levels[3];
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
			Create Ticket
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

		<!-- ── Barre d'actions en lot (si au moins 1 ticket sélectionné) ── -->
		{#if selectedIds.length > 0}
			<div class="mb-4 bg-indigo-50 dark:bg-indigo-950/70 border border-indigo-200 dark:border-indigo-800/60 rounded-xl p-4 space-y-3 animate-fade-in shadow-sm">
				<div class="flex flex-wrap items-center justify-between gap-3 border-b border-indigo-200/60 dark:border-indigo-800/40 pb-3">
					<div class="flex items-center gap-2.5">
						<span class="inline-flex items-center justify-center bg-indigo-600 text-white text-xs font-bold px-2.5 py-1 rounded-full">
							{selectedIds.length}
						</span>
						<span class="text-sm font-semibold text-indigo-900 dark:text-indigo-200">
							{selectedIds.length === 1 ? '1 ticket sélectionné' : `${selectedIds.length} tickets sélectionnés`}
						</span>
					</div>

					<div class="flex items-center gap-2">
						<button
							type="button"
							onclick={() => isBulkDeletingModalOpen = true}
							disabled={isBulkLoading}
							id="btn-bulk-delete"
							class="px-3.5 py-1.5 text-xs font-semibold rounded-lg bg-red-600 hover:bg-red-700 text-white transition-colors disabled:opacity-50 shadow-xs inline-flex items-center gap-1.5"
						>
							<svg class="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2" aria-hidden="true">
								<path stroke-linecap="round" stroke-linejoin="round" d="m14.74 9-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 0 1-2.244 2.077H8.084a2.25 2.25 0 0 1-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 0 0-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 0 1 3.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 0 0-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 0 0-7.5 0" />
							</svg>
							Supprimer ({selectedIds.length})
						</button>

						<button
							type="button"
							onclick={clearSelection}
							class="p-1.5 text-indigo-400 hover:text-indigo-700 dark:hover:text-indigo-200 transition-colors"
							aria-label="Annuler la sélection"
						>
							<svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2" aria-hidden="true">
								<path stroke-linecap="round" stroke-linejoin="round" d="M6 18 18 6M6 6l12 12" />
							</svg>
						</button>
					</div>
				</div>

				<!-- Modification groupée des propriétés -->
				<form
					method="POST"
					action="?/bulkUpdate"
					use:enhance={() => {
						isBulkLoading = true;
						return async ({ update }) => {
							await update();
							isBulkLoading = false;
							selectedIds = [];
						};
					}}
					class="flex flex-wrap items-center gap-2.5"
				>
					<input type="hidden" name="ids" value={JSON.stringify(selectedIds)} />

					<!-- Statut -->
					<select
						name="status"
						id="bulk-status-select"
						aria-label="Changer le statut en lot"
						disabled={isBulkLoading}
						class="text-xs font-medium px-3 py-1.5 rounded-lg border border-indigo-200 dark:border-indigo-700/60 bg-white dark:bg-zinc-900 text-indigo-900 dark:text-indigo-200 focus:outline-none focus:ring-2 focus:ring-indigo-500 cursor-pointer"
					>
						<option value="">Statut (inchangé)</option>
						<option value="Open">Open</option>
						<option value="In progress">In Progress</option>
						<option value="Resolved">Resolved</option>
						<option value="Closed">Closed</option>
					</select>

					<!-- Priorité -->
					<select
						name="priority"
						id="bulk-priority-select"
						aria-label="Changer la priorité en lot"
						disabled={isBulkLoading}
						class="text-xs font-medium px-3 py-1.5 rounded-lg border border-indigo-200 dark:border-indigo-700/60 bg-white dark:bg-zinc-900 text-indigo-900 dark:text-indigo-200 focus:outline-none focus:ring-2 focus:ring-indigo-500 cursor-pointer"
					>
						<option value="">Priorité (inchangée)</option>
						<option value="1">P1 — Très faible</option>
						<option value="2">P2 — Faible</option>
						<option value="3">P3 — Moyenne</option>
						<option value="4">P4 — Haute</option>
						<option value="5">P5 — Critique</option>
					</select>

					<!-- Assigné à -->
					<select
						name="assignedTo"
						id="bulk-assigned-select"
						aria-label="Changer le technicien assigné en lot"
						disabled={isBulkLoading}
						class="text-xs font-medium px-3 py-1.5 rounded-lg border border-indigo-200 dark:border-indigo-700/60 bg-white dark:bg-zinc-900 text-indigo-900 dark:text-indigo-200 focus:outline-none focus:ring-2 focus:ring-indigo-500 cursor-pointer"
					>
						<option value="">Assigné à (inchangé)</option>
						{#each data.technicians ?? [] as tech}
							<option value={tech._id ?? tech.id}>{tech.name}</option>
						{/each}
					</select>

					<!-- Département (Category) -->
					<select
						name="originDepartment"
						id="bulk-department-select"
						aria-label="Changer le département en lot"
						disabled={isBulkLoading}
						class="text-xs font-medium px-3 py-1.5 rounded-lg border border-indigo-200 dark:border-indigo-700/60 bg-white dark:bg-zinc-900 text-indigo-900 dark:text-indigo-200 focus:outline-none focus:ring-2 focus:ring-indigo-500 cursor-pointer"
					>
						<option value="">Département (inchangé)</option>
						{#each ['TI', 'Ressources Humaines', 'Comptabilité', 'Support Technique', 'Equipe de direction', 'Marketing', 'Finance'] as dept}
							<option value={dept}>{dept}</option>
						{/each}
					</select>

					<button
						type="submit"
						disabled={isBulkLoading}
						id="btn-apply-bulk-update"
						class="px-4 py-1.5 text-xs font-semibold rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white transition-colors disabled:opacity-50 shadow-xs"
					>
						{isBulkLoading ? 'Enregistrement…' : 'Appliquer aux tickets'}
					</button>
				</form>
			</div>
		{/if}



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
							<!-- Checkbox Select All -->
							<th class="px-3 py-3 w-10 text-center">
								<input
									type="checkbox"
									checked={allSelected}
									onclick={toggleSelectAll}
									class="rounded border-gray-300 dark:border-zinc-700 text-indigo-600 focus:ring-indigo-500 cursor-pointer w-4 h-4"
									aria-label="Sélectionner tous les tickets de cette page"
								/>
							</th>
							<th class="px-3 py-3">Ticket ID</th>
							<th class="px-4 py-3">Subject</th>
							<th class="px-4 py-3 hidden md:table-cell">Category</th>
							<th class="px-4 py-3">Status</th>
							<th class="px-4 py-3 hidden md:table-cell">Assigned To</th>

							<!-- ── Colonne triable : Priorité ────────────────── -->
							<th
								class="px-4 py-3 hidden sm:table-cell"
								aria-sort={sortBy === 'priority' ? (orderBy === 'asc' ? 'ascending' : 'descending') : 'none'}
							>
								<button
									id="sort-priority"
									onclick={() => applySort('priority')}
									class="inline-flex items-center gap-1 group select-none
										{sortBy === 'priority' ? 'text-indigo-500 dark:text-indigo-400' : 'hover:text-gray-700 dark:hover:text-zinc-200 transition-colors'}"
									aria-label="Trier par priorité"
								>
									Priority
									<!-- Icône de tri -->
									<span class="inline-flex flex-col gap-px opacity-60 {sortBy === 'priority' ? 'opacity-100' : 'group-hover:opacity-80'}" aria-hidden="true">
										{#if sortBy === 'priority' && orderBy === 'asc'}
											<!-- Ascendant actif -->
											<svg class="w-3 h-3 text-indigo-500 dark:text-indigo-400" fill="currentColor" viewBox="0 0 16 16">
												<path d="M8 4l4 6H4l4-6z"/>
											</svg>
										{:else if sortBy === 'priority' && orderBy === 'desc'}
											<!-- Descendant actif -->
											<svg class="w-3 h-3 text-indigo-500 dark:text-indigo-400" fill="currentColor" viewBox="0 0 16 16">
												<path d="M8 12l-4-6h8l-4 6z"/>
											</svg>
										{:else}
											<!-- Inactif — double flèche -->
											<svg class="w-3 h-3" fill="currentColor" viewBox="0 0 16 16">
												<path d="M8 2l3 4H5l3-4zm0 12l-3-4h6l-3 4z"/>
											</svg>
										{/if}
									</span>
								</button>
							</th>

							<!-- ── Colonne triable : Date ────────────────────── -->
							<th
								class="px-4 py-3 hidden lg:table-cell"
								aria-sort={sortBy === 'createdAt' ? (orderBy === 'asc' ? 'ascending' : 'descending') : 'none'}
							>
								<button
									id="sort-date"
									onclick={() => applySort('createdAt')}
									class="inline-flex items-center gap-1 group select-none
										{sortBy === 'createdAt' ? 'text-indigo-500 dark:text-indigo-400' : 'hover:text-gray-700 dark:hover:text-zinc-200 transition-colors'}"
									aria-label="Trier par date de création"
								>
									Date
									<!-- Icône de tri -->
									<span class="inline-flex flex-col gap-px opacity-60 {sortBy === 'createdAt' ? 'opacity-100' : 'group-hover:opacity-80'}" aria-hidden="true">
										{#if sortBy === 'createdAt' && orderBy === 'asc'}
											<svg class="w-3 h-3 text-indigo-500 dark:text-indigo-400" fill="currentColor" viewBox="0 0 16 16">
												<path d="M8 4l4 6H4l4-6z"/>
											</svg>
										{:else if sortBy === 'createdAt' && orderBy === 'desc'}
											<svg class="w-3 h-3 text-indigo-500 dark:text-indigo-400" fill="currentColor" viewBox="0 0 16 16">
												<path d="M8 12l-4-6h8l-4 6z"/>
											</svg>
										{:else}
											<svg class="w-3 h-3" fill="currentColor" viewBox="0 0 16 16">
												<path d="M8 2l3 4H5l3-4zm0 12l-3-4h6l-3 4z"/>
											</svg>
										{/if}
									</span>
								</button>
							</th>
							<th class="px-4 py-3">Action</th>
						</tr>
					</thead>
					<tbody class="divide-y divide-gray-100 dark:divide-zinc-800">
						{#each data.tickets as ticket (ticket._id)}
							{@const sb = statusBadge(ticket.status)}
							{@const pb = priorityBadge(ticket.priority)}
							{@const isSelected = selectedIds.includes(ticket._id)}
							<tr class="hover:bg-gray-50 dark:hover:bg-zinc-800/50 transition-colors duration-100 {isSelected ? 'bg-indigo-50/50 dark:bg-indigo-950/30' : ''}">
								<!-- Checkbox Select One -->
								<td class="px-3 py-3.5 text-center">
									<input
										type="checkbox"
										checked={isSelected}
										onclick={() => toggleSelectOne(ticket._id)}
										class="rounded border-gray-300 dark:border-zinc-700 text-indigo-600 focus:ring-indigo-500 cursor-pointer w-4 h-4"
										aria-label="Sélectionner le ticket {ticket.title}"
									/>
								</td>
								<td class="px-3 py-3.5 text-gray-400 dark:text-zinc-500 text-xs font-mono">
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

								<!-- ── Cellule Priorité ──────────────────────────────────── -->
								<td class="px-4 py-3.5 hidden sm:table-cell">
									<span
										class="inline-flex items-center gap-1.5 text-xs font-semibold {pb.color}"
										aria-label="Priorité {pb.label}"
									>
										<span class="w-1.5 h-1.5 rounded-full shrink-0" style="background:{pb.dot}" aria-hidden="true"></span>
										P{ticket.priority}
									</span>
								</td>

								<!-- ── Cellule Date ────────────────────────────────────────── -->
								<td class="px-4 py-3.5 hidden lg:table-cell text-xs text-gray-400 dark:text-zinc-500">
									{formatDate(ticket.createdAt)}
								</td>

								<td class="px-4 py-3.5">
									<div class="flex items-center gap-2">
										<!-- Voir & Modifier → même page détail -->
										<a
											href="/tickets/{ticket._id}"
											class="inline-flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-medium rounded-lg
												text-indigo-700 dark:text-indigo-300
												bg-indigo-50 dark:bg-indigo-950/40
												hover:bg-indigo-100 dark:hover:bg-indigo-900/50
												border border-indigo-200 dark:border-indigo-800/50
												transition-colors"
											aria-label="Voir et modifier le ticket {ticket.title}"
										>
											<svg class="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="1.75" aria-hidden="true">
												<path stroke-linecap="round" stroke-linejoin="round" d="m16.862 4.487 1.687-1.688a1.875 1.875 0 1 1 2.652 2.652L10.582 16.07a4.5 4.5 0 0 1-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 0 1 1.13-1.897l8.932-8.931Zm0 0L19.5 7.125" />
											</svg>
											Ouvrir
										</a>

										<button
											type="button"
											onclick={() => confirmDelete(ticket._id, ticket.title)}
											class="text-gray-400 dark:text-zinc-500 hover:text-red-500 transition-colors p-1 rounded-md hover:bg-red-50 dark:hover:bg-red-950/40"
											aria-label="Supprimer le ticket {ticket.title}"
										>
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

<!-- ── Modal de confirmation de suppression ────────────────────────── -->
{#if ticketToDelete}
	<div class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-fade-in" role="dialog" aria-modal="true" aria-labelledby="modal-delete-title">
		<div class="w-full max-w-md bg-white dark:bg-zinc-900 rounded-xl shadow-2xl border border-gray-200 dark:border-zinc-800 p-6 space-y-4">
			<div class="flex items-center gap-3 text-red-600 dark:text-red-400">
				<div class="p-2 rounded-full bg-red-100 dark:bg-red-950/60 shrink-0">
					<svg class="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2" aria-hidden="true">
						<path stroke-linecap="round" stroke-linejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z" />
					</svg>
				</div>
				<h3 id="modal-delete-title" class="text-lg font-bold text-gray-900 dark:text-white">Confirmer la suppression</h3>
			</div>

			<p class="text-sm text-gray-600 dark:text-zinc-400 leading-relaxed">
				Êtes-vous sûr de vouloir supprimer le ticket <strong class="text-gray-900 dark:text-zinc-200">« {ticketToDelete.title} »</strong> ? Cette action est définitive.
			</p>

			<form
				method="POST"
				action="?/deleteTicket"
				use:enhance={() => {
					isDeleting = true;
					return async ({ update }) => {
						await update();
						isDeleting = false;
						ticketToDelete = null;
					};
				}}
				class="flex items-center justify-end gap-3 pt-2"
			>
				<input type="hidden" name="id" value={ticketToDelete.id} />

				<button
					type="button"
					onclick={cancelDelete}
					disabled={isDeleting}
					class="px-4 py-2 text-sm font-medium text-gray-700 dark:text-zinc-300 hover:bg-gray-100 dark:hover:bg-zinc-800 rounded-lg transition-colors"
				>
					Annuler
				</button>

				<button
					type="submit"
					disabled={isDeleting}
					id="confirm-delete-btn"
					class="px-4 py-2 text-sm font-semibold text-white bg-red-600 hover:bg-red-700 disabled:opacity-50 rounded-lg shadow-sm transition-colors inline-flex items-center gap-2"
				>
					{#if isDeleting}
						<svg class="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24" aria-hidden="true">
							<circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"/>
							<path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z"/>
						</svg>
						Suppression…
					{:else}
						Supprimer
					{/if}
				</button>
			</form>
		</div>
	</div>
{/if}

<!-- ── Modal de confirmation de suppression en lot ──────────────────── -->
{#if isBulkDeletingModalOpen}
	<div class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-fade-in" role="dialog" aria-modal="true" aria-labelledby="modal-bulk-delete-title">
		<div class="w-full max-w-md bg-white dark:bg-zinc-900 rounded-xl shadow-2xl border border-gray-200 dark:border-zinc-800 p-6 space-y-4">
			<div class="flex items-center gap-3 text-red-600 dark:text-red-400">
				<div class="p-2 rounded-full bg-red-100 dark:bg-red-950/60 shrink-0">
					<svg class="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2" aria-hidden="true">
						<path stroke-linecap="round" stroke-linejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z" />
					</svg>
				</div>
				<h3 id="modal-bulk-delete-title" class="text-lg font-bold text-gray-900 dark:text-white">Confirmer la suppression en lot</h3>
			</div>

			<p class="text-sm text-gray-600 dark:text-zinc-400 leading-relaxed">
				Êtes-vous sûr de vouloir supprimer définitivement <strong class="text-gray-900 dark:text-zinc-200">{selectedIds.length} tickets</strong> ? Cette action est irréversible.
			</p>

			<form
				method="POST"
				action="?/bulkDelete"
				use:enhance={() => {
					isBulkLoading = true;
					return async ({ update }) => {
						await update();
						isBulkLoading = false;
						isBulkDeletingModalOpen = false;
						selectedIds = [];
					};
				}}
				class="flex items-center justify-end gap-3 pt-2"
			>
				<input type="hidden" name="ids" value={JSON.stringify(selectedIds)} />

				<button
					type="button"
					onclick={() => isBulkDeletingModalOpen = false}
					disabled={isBulkLoading}
					class="px-4 py-2 text-sm font-medium text-gray-700 dark:text-zinc-300 hover:bg-gray-100 dark:hover:bg-zinc-800 rounded-lg transition-colors"
				>
					Annuler
				</button>

				<button
					type="submit"
					disabled={isBulkLoading}
					id="confirm-bulk-delete-btn"
					class="px-4 py-2 text-sm font-semibold text-white bg-red-600 hover:bg-red-700 disabled:opacity-50 rounded-lg shadow-sm transition-colors inline-flex items-center gap-2"
				>
					{#if isBulkLoading}
						<svg class="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24" aria-hidden="true">
							<circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"/>
							<path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z"/>
						</svg>
						Suppression…
					{:else}
						Supprimer {selectedIds.length} tickets
					{/if}
				</button>
			</form>
		</div>
	</div>
{/if}

