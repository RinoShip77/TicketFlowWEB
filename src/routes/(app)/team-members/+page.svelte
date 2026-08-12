<script lang="ts">
	import { goto } from '$app/navigation';
	import { page as pageState } from '$app/state';
	import { enhance } from '$app/forms';
	import { onMount } from 'svelte';
	import type { ActionData, PageData } from './$types';
	import { getSettings, updateSettings, initSettings } from '$lib/settings.svelte';
	import { t } from '$lib/i18n.svelte';

	interface Props {
		data: PageData;
		form?: ActionData;
	}

	let { data, form }: Props = $props();

	const settings = $derived(getSettings());

	onMount(() => {
		initSettings();
	});

	// ── Types ──────────────────────────────────────────────────────────
	type SortField = 'name' | 'email' | 'department' | 'roleTitle' | 'status' | 'level';
	type SortOrder = 'asc' | 'desc';

	// ── Sort state — synchronisé avec l'URL ────────────────────────────
	const sortBy   = $derived<SortField>((pageState.url.searchParams.get('sortBy')  as SortField)  ?? 'name');
	const orderBy  = $derived<SortOrder>((pageState.url.searchParams.get('orderBy') as SortOrder)  ?? 'asc');

	// ── View Mode state (Liste vs Grille) — synchronisé avec l'URL ─────
	let viewMode = $state<'list' | 'grid'>((pageState.url.searchParams.get('view') as 'grid' | 'list') ?? 'list');

	$effect(() => {
		const urlView = pageState.url.searchParams.get('view');
		viewMode = urlView === 'grid' ? 'grid' : 'list';
	});

	function setViewMode(mode: 'list' | 'grid') {
		viewMode = mode;
		const params = buildParams({ view: mode === 'grid' ? 'grid' : null });
		goto(`?${params.toString()}`, { keepFocus: true, noScroll: true });
	}

	// ── Filter state — synchronisé avec l'URL ─────────────────────────
	let searchQuery       = $state(pageState.url.searchParams.get('search') ?? '');
	let selectedDepartment = $state(pageState.url.searchParams.get('dept') ?? '');
	let currentPage       = $state(Number(pageState.url.searchParams.get('page') ?? '1'));
	const pageSize        = $derived(settings.itemsPerPage ?? 10);

	// ── Selection & Bulk actions ──────────────────────────────────────
	let selectedIds             = $state<string[]>([]);
	let isBulkLoading           = $state(false);
	let isBulkDeletingModalOpen = $state(false);

	// Modal de suppression unique
	let isDeleteModalOpen = $state(false);
	let deleteTargetId    = $state<string | null>(null);
	let deleteTargetName  = $state('');
	let isDeleting        = $state(false);

	function confirmDelete(id: string, name: string) {
		deleteTargetId   = id;
		deleteTargetName = name;
		isDeleteModalOpen = true;
	}

	// Sync si l'URL change (navigation arrière/avant)
	$effect(() => {
		searchQuery        = pageState.url.searchParams.get('search') ?? '';
		selectedDepartment = pageState.url.searchParams.get('dept')   ?? '';
		currentPage        = Number(pageState.url.searchParams.get('page') ?? '1');
	});

	let searchTimeout: ReturnType<typeof setTimeout>;

	// ── Helpers navigation ─────────────────────────────────────────────
	function buildParams(overrides: Record<string, string | null> = {}) {
		const params = new URLSearchParams(pageState.url.searchParams);
		for (const [key, value] of Object.entries(overrides)) {
			if (value === null || value === '') params.delete(key);
			else params.set(key, value);
		}
		return params;
	}

	function applySort(field: SortField) {
		const params = buildParams({ page: '1' });
		if (sortBy === field) {
			params.set('orderBy', orderBy === 'desc' ? 'asc' : 'desc');
			params.set('sortBy', field);
		} else {
			params.set('sortBy', field);
			params.set('orderBy', 'asc');
		}
		goto(`?${params.toString()}`, { keepFocus: true, noScroll: true });
	}

	function onSearchInput() {
		clearTimeout(searchTimeout);
		searchTimeout = setTimeout(() => {
			const params = buildParams({ page: '1', search: searchQuery || null });
			goto(`?${params.toString()}`, { keepFocus: true, noScroll: true });
		}, 350);
	}

	function onDeptChange() {
		const params = buildParams({ page: '1', dept: selectedDepartment || null });
		goto(`?${params.toString()}`, { keepFocus: true, noScroll: true });
	}

	function goToPage(p: number) {
		const params = buildParams({ page: String(p) });
		goto(`?${params.toString()}`, { keepFocus: true, noScroll: true });
	}

	// ── Avatar / initiales ─────────────────────────────────────────────
	const avatarStyles = [
		'bg-emerald-100 dark:bg-emerald-950/70 text-emerald-700 dark:text-emerald-300',
		'bg-sky-100 dark:bg-sky-950/70 text-sky-700 dark:text-sky-300',
		'bg-pink-100 dark:bg-pink-950/70 text-pink-700 dark:text-pink-300',
		'bg-cyan-100 dark:bg-cyan-950/70 text-cyan-700 dark:text-cyan-300',
		'bg-purple-100 dark:bg-purple-950/70 text-purple-700 dark:text-purple-300',
		'bg-indigo-100 dark:bg-indigo-950/70 text-indigo-700 dark:text-indigo-300',
		'bg-amber-100 dark:bg-amber-950/70 text-amber-700 dark:text-amber-300'
	];

	function getAvatarStyle(name: string): string {
		let h = 0;
		for (let i = 0; i < name.length; i++) {
			h = (h * 31 + name.charCodeAt(i)) % avatarStyles.length;
		}
		return avatarStyles[Math.abs(h)];
	}

	function getInitials(name: string): string {
		const parts = name.trim().split(' ');
		if (parts.length >= 2) return (parts[0][0] + parts[1][0]).toUpperCase();
		return name.slice(0, 2).toUpperCase();
	}

	// ── Pipeline : filtre → tri → pagination ──────────────────────────
	const filteredMembers = $derived(
		(data.members ?? []).filter((m) => {
			const q = searchQuery.toLowerCase();
			const matchesSearch =
				q === '' ||
				m.name.toLowerCase().includes(q) ||
				m.email.toLowerCase().includes(q);
			const matchesDept =
				selectedDepartment === '' || m.department === selectedDepartment;
			return matchesSearch && matchesDept;
		})
	);

	const sortedMembers = $derived.by(() => {
		const field = sortBy;
		const dir   = orderBy === 'asc' ? 1 : -1;
		return [...filteredMembers].sort((a, b) => {
			const av = String((a as any)[field] ?? '').toLowerCase();
			const bv = String((b as any)[field] ?? '').toLowerCase();
			return av < bv ? -dir : av > bv ? dir : 0;
		});
	});

	const totalPages = $derived(Math.ceil(sortedMembers.length / pageSize) || 1);

	const paginatedMembers = $derived(
		sortedMembers.slice((currentPage - 1) * pageSize, currentPage * pageSize)
	);

	// ── Logic Sélection multiple (cases à cocher) ─────────────────────
	const allSelected = $derived(
		paginatedMembers.length > 0 && paginatedMembers.every((m) => selectedIds.includes(m._id ?? m.id))
	);

	function toggleSelectAll() {
		const pageMemberIds = paginatedMembers.map((m) => m._id ?? m.id);
		if (allSelected) {
			selectedIds = selectedIds.filter((id) => !pageMemberIds.includes(id));
		} else {
			selectedIds = Array.from(new Set([...selectedIds, ...pageMemberIds]));
		}
	}

	function toggleSelect(id: string) {
		if (selectedIds.includes(id)) {
			selectedIds = selectedIds.filter((i) => i !== id);
		} else {
			selectedIds = [...selectedIds, id];
		}
	}

	function clearSelection() {
		selectedIds = [];
	}

	// Pagination pages
	const paginationPages = $derived.by(() => {
		const total = totalPages;
		const cur   = currentPage;
		if (total <= 7) return Array.from({ length: total }, (_, i) => i + 1);
		const pages: (number | '…')[] = [1];
		if (cur > 3) pages.push('…');
		for (let i = Math.max(2, cur - 1); i <= Math.min(total - 1, cur + 1); i++) {
			pages.push(i);
		}
		if (cur < total - 2) pages.push('…');
		pages.push(total);
		return pages;
	});

	const departments = ['IT', 'Executive Team', 'HR', 'Finance', 'Support Technique'];
</script>

<svelte:head>
	<title>Team Members — TicketFlow</title>
	<meta name="description" content="Gestion des membres de l'équipe et techniciens TicketFlow." />
</svelte:head>

<div class="space-y-6">

	<!-- ── Header & CTA Button ──────────────────────────────────────── -->
	<div class="flex items-center justify-between">
		<h2 class="text-2xl font-bold text-gray-900 dark:text-white">Team Members</h2>
		<a
			href="/team-members/new"
			id="btn-add-member"
			class="inline-flex items-center gap-2 px-4 py-2.5 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-semibold transition-colors duration-200 shadow-sm"
		>
			<svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2.5" aria-hidden="true">
				<path stroke-linecap="round" stroke-linejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
			</svg>
			Add Member
		</a>
	</div>

	<!-- ── Barre d'actions en lot (si au moins 1 membre sélectionné) ── -->
	{#if selectedIds.length > 0}
		<div class="bg-indigo-50 dark:bg-indigo-950/70 border border-indigo-200 dark:border-indigo-800/60 rounded-xl p-4 space-y-3 animate-fade-in shadow-sm">
			<div class="flex flex-wrap items-center justify-between gap-3 border-b border-indigo-200/60 dark:border-indigo-800/40 pb-3">
				<div class="flex items-center gap-2.5">
					<span class="inline-flex items-center justify-center bg-indigo-600 text-white text-xs font-bold px-2.5 py-1 rounded-full">
						{selectedIds.length}
					</span>
					<span class="text-sm font-semibold text-indigo-900 dark:text-indigo-200">
						{selectedIds.length === 1 ? '1 membre sélectionné' : `${selectedIds.length} membres sélectionnés`}
					</span>
				</div>

				<div class="flex items-center gap-2">
					<button
						type="button"
						onclick={() => isBulkDeletingModalOpen = true}
						disabled={isBulkLoading}
						id="btn-bulk-delete-members"
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

			<!-- Formulaire de modification groupée -->
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

				<!-- Nom complet -->
				<input
					type="text"
					name="name"
					placeholder="Nouveau nom (inchangé)"
					disabled={isBulkLoading}
					class="text-xs font-medium px-3 py-1.5 rounded-lg border border-indigo-200 dark:border-indigo-700/60 bg-white dark:bg-zinc-900 text-indigo-900 dark:text-indigo-200 focus:outline-none focus:ring-2 focus:ring-indigo-500 placeholder:text-indigo-300 dark:placeholder:text-zinc-600 max-w-[180px]"
				/>

				<!-- Département -->
				<select
					name="department"
					id="bulk-dept-select"
					aria-label="Changer le département en lot"
					disabled={isBulkLoading}
					class="text-xs font-medium px-3 py-1.5 rounded-lg border border-indigo-200 dark:border-indigo-700/60 bg-white dark:bg-zinc-900 text-indigo-900 dark:text-indigo-200 focus:outline-none focus:ring-2 focus:ring-indigo-500 cursor-pointer"
				>
					<option value="">Département (inchangé)</option>
					{#each departments as dept}
						<option value={dept}>{dept}</option>
					{/each}
				</select>

				<!-- Rôle -->
				<select
					name="roleTitle"
					id="bulk-role-select"
					aria-label="Changer le rôle en lot"
					disabled={isBulkLoading}
					class="text-xs font-medium px-3 py-1.5 rounded-lg border border-indigo-200 dark:border-indigo-700/60 bg-white dark:bg-zinc-900 text-indigo-900 dark:text-indigo-200 focus:outline-none focus:ring-2 focus:ring-indigo-500 cursor-pointer"
				>
					<option value="">Rôle (inchangé)</option>
					<option value="Technician">Technician</option>
					<option value="Admin">Admin</option>
				</select>

				<!-- Niveau -->
				<select
					name="level"
					id="bulk-level-select"
					aria-label="Changer le niveau en lot"
					disabled={isBulkLoading}
					class="text-xs font-medium px-3 py-1.5 rounded-lg border border-indigo-200 dark:border-indigo-700/60 bg-white dark:bg-zinc-900 text-indigo-900 dark:text-indigo-200 focus:outline-none focus:ring-2 focus:ring-indigo-500 cursor-pointer"
				>
					<option value="">Niveau (inchangé)</option>
					<option value="1">L1 — Junior</option>
					<option value="2">L2 — Senior</option>
					<option value="3">L3 — Admin</option>
				</select>

				<!-- Statut -->
				<select
					name="status"
					id="bulk-status-select"
					aria-label="Changer le statut en lot"
					disabled={isBulkLoading}
					class="text-xs font-medium px-3 py-1.5 rounded-lg border border-indigo-200 dark:border-indigo-700/60 bg-white dark:bg-zinc-900 text-indigo-900 dark:text-indigo-200 focus:outline-none focus:ring-2 focus:ring-indigo-500 cursor-pointer"
				>
					<option value="">Statut (inchangé)</option>
					<option value="Active">Active</option>
					<option value="Inactive">Inactive</option>
				</select>

				<button
					type="submit"
					disabled={isBulkLoading}
					id="btn-apply-bulk-members"
					class="px-3.5 py-1.5 text-xs font-semibold rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white transition-colors disabled:opacity-50 shadow-xs inline-flex items-center gap-1.5"
				>
					{#if isBulkLoading}
						<svg class="w-3.5 h-3.5 animate-spin" fill="none" viewBox="0 0 24 24" aria-hidden="true">
							<circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
							<path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 0 1 8-8V0C5.373 0 0 5.373 0 12h4Z"></path>
						</svg>
						Enregistrement…
					{:else}
						Appliquer la modification ({selectedIds.length})
					{/if}
				</button>
			</form>
		</div>
	{/if}

	<!-- ── Table Container ─────────────────────────────────────────── -->
	<div class="bg-white dark:bg-zinc-900 rounded-xl border border-gray-200 dark:border-zinc-800 shadow-sm transition-colors duration-200">

		<!-- Filter Bar -->
		<div class="flex flex-wrap items-center gap-3 px-5 py-4 border-b border-gray-100 dark:border-zinc-800">
			<!-- Search bar -->
			<div class="relative flex-1 min-w-[200px] max-w-xs">
				<svg class="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 dark:text-zinc-500 pointer-events-none" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="1.75" aria-hidden="true">
					<path stroke-linecap="round" stroke-linejoin="round" d="m21 21-5.197-5.197m0 0A7.5 7.5 0 1 0 5.196 5.196a7.5 7.5 0 0 0 10.607 10.607Z" />
				</svg>
				<input
					type="text"
					bind:value={searchQuery}
					oninput={onSearchInput}
					placeholder="Search members..."
					id="search-members"
					class="w-full pl-9 pr-3 py-2 text-sm rounded-lg border border-gray-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 text-gray-800 dark:text-zinc-200 placeholder:text-gray-400 dark:placeholder:text-zinc-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-colors"
				/>
			</div>

			<!-- Department Dropdown -->
			<div class="relative">
				<select
					bind:value={selectedDepartment}
					onchange={onDeptChange}
					id="filter-department"
					class="appearance-none pl-3 pr-8 py-2 text-sm rounded-lg border border-gray-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 text-gray-700 dark:text-zinc-300 focus:outline-none focus:ring-2 focus:ring-indigo-500 cursor-pointer transition-colors"
				>
					<option value="">All Departments</option>
					{#each departments as dept}
						<option value={dept}>{dept}</option>
					{/each}
				</select>
				<svg class="absolute right-2.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 dark:text-zinc-500 pointer-events-none" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2" aria-hidden="true">
					<path stroke-linecap="round" stroke-linejoin="round" d="m19.5 8.25-7.5 7.5-7.5-7.5" />
				</svg>
			</div>

			<!-- Items per page selector -->
			<div class="relative">
				<select
					value={settings.itemsPerPage}
					onchange={(e) => updateSettings({ itemsPerPage: parseInt((e.target as HTMLSelectElement).value, 10) as any })}
					id="select-team-items-per-page"
					aria-label="Nombre d'éléments par page"
					class="appearance-none pl-3 pr-8 py-2 text-sm rounded-lg border border-gray-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 text-gray-700 dark:text-zinc-300 focus:outline-none focus:ring-2 focus:ring-indigo-500 cursor-pointer transition-colors"
				>
					<option value="10">10 / page</option>
					<option value="25">25 / page</option>
					<option value="50">50 / page</option>
				</select>
				<svg class="absolute right-2.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 dark:text-zinc-500 pointer-events-none" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2" aria-hidden="true">
					<path stroke-linecap="round" stroke-linejoin="round" d="m19.5 8.25-7.5 7.5-7.5-7.5" />
				</svg>
			</div>

			<!-- View toggle (List vs Grid) -->
			<div class="inline-flex items-center p-1 rounded-2xl bg-white dark:bg-zinc-900 border border-gray-200 dark:border-zinc-700/80 shadow-xs gap-1 ml-auto">
				<button
					type="button"
					onclick={() => setViewMode('list')}
					id="btn-view-list"
					class="p-2 rounded-xl transition-all duration-200 flex items-center justify-center cursor-pointer
						{viewMode === 'list'
							? 'bg-indigo-600 text-white shadow-xs'
							: 'text-gray-400 dark:text-zinc-500 hover:text-gray-600 dark:hover:text-zinc-300'}"
					aria-label="Vue liste"
					aria-pressed={viewMode === 'list'}
				>
					<!-- 5 horizontal lines icon -->
					<svg class="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2.5" aria-hidden="true">
						<path stroke-linecap="round" stroke-linejoin="round" d="M4 6h16M4 9.5h16M4 13h16M4 16.5h16M4 20h16" />
					</svg>
				</button>

				<button
					type="button"
					onclick={() => setViewMode('grid')}
					id="btn-view-grid"
					class="p-2 rounded-xl transition-all duration-200 flex items-center justify-center cursor-pointer
						{viewMode === 'grid'
							? 'bg-indigo-600 text-white shadow-xs'
							: 'text-gray-400 dark:text-zinc-500 hover:text-gray-600 dark:hover:text-zinc-300'}"
					aria-label="Vue grille"
					aria-pressed={viewMode === 'grid'}
				>
					<!-- 4 rounded squares in 2x2 grid icon -->
					<svg class="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2.5" aria-hidden="true">
						<path stroke-linecap="round" stroke-linejoin="round" d="M3.75 6A2.25 2.25 0 0 1 6 3.75h2.25A2.25 2.25 0 0 1 10.5 6v2.25a2.25 2.25 0 0 1-2.25 2.25H6a2.25 2.25 0 0 1-2.25-2.25V6ZM3.75 15.75A2.25 2.25 0 0 1 6 13.5h2.25a2.25 2.25 0 0 1 2.25 2.25V18a2.25 2.25 0 0 1-2.25 2.25H6A2.25 2.25 0 0 1 3.75 18v-2.25ZM13.5 6a2.25 2.25 0 0 1 2.25-2.25H18A2.25 2.25 0 0 1 20.25 6v2.25A2.25 2.25 0 0 1 18 10.5h-2.25a2.25 2.25 0 0 1-2.25-2.25V6ZM13.5 15.75a2.25 2.25 0 0 1 2.25-2.25H18a2.25 2.25 0 0 1 2.25 2.25V18A2.25 2.25 0 0 1 18 20.25h-2.25A2.25 2.25 0 0 1 13.5 18v-2.25Z" />
					</svg>
				</button>
			</div>
		</div>

		<!-- Members Container (Tableau ou Grille) -->
		{#if paginatedMembers.length === 0}
			<div class="py-16 text-center">
				<svg class="w-10 h-10 text-gray-300 dark:text-zinc-600 mx-auto mb-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="1.5" aria-hidden="true">
					<path stroke-linecap="round" stroke-linejoin="round" d="M15 19.128a9.38 9.38 0 0 0 2.625.372 9.337 9.337 0 0 0 4.121-.952 4.125 4.125 0 0 0-7.533-2.493M15 19.128v-.003c0-1.113-.285-2.16-.786-3.07M15 19.128v.106A12.318 12.318 0 0 1 8.624 21c-2.331 0-4.512-.645-6.374-1.766l-.001-.109a6.375 6.375 0 0 1 11.964-3.07M12 6.375a3.375 3.375 0 1 1-6.75 0 3.375 3.375 0 0 1 6.75 0Zm8.25 2.25a2.625 2.625 0 1 1-5.25 0 2.625 2.625 0 0 1 5.25 0Z" />
				</svg>
				<p class="text-gray-500 dark:text-zinc-400 text-sm">Aucun membre trouvé.</p>
				<a href="/team-members/new" class="text-indigo-600 dark:text-indigo-400 text-sm hover:underline mt-1 inline-block">Ajouter un membre →</a>
			</div>
		{:else if viewMode === 'list'}
			<!-- ── VUE TABLEAU ─────────────────────────────────────────── -->
			<div class="overflow-x-auto">
				<table class="w-full text-sm" aria-label="Liste des membres de l'équipe">
					<thead>
						<tr class="text-left text-xs font-medium text-gray-400 dark:text-zinc-500 border-b border-gray-100 dark:border-zinc-800">

							<!-- ── Case à cocher : Tout sélectionner ─────────────── -->
							<th class="px-4 py-3.5 w-10 text-center">
								<input
									type="checkbox"
									checked={allSelected}
									onclick={toggleSelectAll}
									id="select-all-members"
									class="w-4 h-4 rounded-sm border-gray-300 dark:border-zinc-700 text-indigo-600 focus:ring-indigo-500 cursor-pointer"
									aria-label="Sélectionner tous les membres de la page"
								/>
							</th>

							<!-- ── Colonne triable : Member (name) ─────────────────── -->
							<th
								class="px-5 py-3.5"
								aria-sort={sortBy === 'name' ? (orderBy === 'asc' ? 'ascending' : 'descending') : 'none'}
							>
								<button
									id="sort-name"
									onclick={() => applySort('name')}
									class="inline-flex items-center gap-1 group select-none
										{sortBy === 'name' ? 'text-indigo-500 dark:text-indigo-400' : 'hover:text-gray-700 dark:hover:text-zinc-200 transition-colors'}"
									aria-label="Trier par nom"
								>
									{t('member')}
									<span class="inline-flex flex-col gap-px opacity-60 {sortBy === 'name' ? 'opacity-100' : 'group-hover:opacity-80'}" aria-hidden="true">
										{#if sortBy === 'name' && orderBy === 'asc'}
											<svg class="w-3 h-3 text-indigo-500 dark:text-indigo-400" fill="currentColor" viewBox="0 0 16 16">
												<path d="M8 4l4 6H4l4-6z"/>
											</svg>
										{:else if sortBy === 'name' && orderBy === 'desc'}
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

							<!-- ── Colonne triable : Email ──────────────────────────── -->
							<th
								class="px-4 py-3.5 hidden md:table-cell"
								aria-sort={sortBy === 'email' ? (orderBy === 'asc' ? 'ascending' : 'descending') : 'none'}
							>
								<button
									id="sort-email"
									onclick={() => applySort('email')}
									class="inline-flex items-center gap-1 group select-none
										{sortBy === 'email' ? 'text-indigo-500 dark:text-indigo-400' : 'hover:text-gray-700 dark:hover:text-zinc-200 transition-colors'}"
									aria-label="Trier par e-mail"
								>
									{t('email')}
									<span class="inline-flex flex-col gap-px opacity-60 {sortBy === 'email' ? 'opacity-100' : 'group-hover:opacity-80'}" aria-hidden="true">
										{#if sortBy === 'email' && orderBy === 'asc'}
											<svg class="w-3 h-3 text-indigo-500 dark:text-indigo-400" fill="currentColor" viewBox="0 0 16 16">
												<path d="M8 4l4 6H4l4-6z"/>
											</svg>
										{:else if sortBy === 'email' && orderBy === 'desc'}
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

							<!-- ── Colonne triable : Department ────────────────────── -->
							<th
								class="px-4 py-3.5"
								aria-sort={sortBy === 'department' ? (orderBy === 'asc' ? 'ascending' : 'descending') : 'none'}
							>
								<button
									id="sort-department"
									onclick={() => applySort('department')}
									class="inline-flex items-center gap-1 group select-none
										{sortBy === 'department' ? 'text-indigo-500 dark:text-indigo-400' : 'hover:text-gray-700 dark:hover:text-zinc-200 transition-colors'}"
									aria-label="Trier par département"
								>
									{t('department')}
									<span class="inline-flex flex-col gap-px opacity-60 {sortBy === 'department' ? 'opacity-100' : 'group-hover:opacity-80'}" aria-hidden="true">
										{#if sortBy === 'department' && orderBy === 'asc'}
											<svg class="w-3 h-3 text-indigo-500 dark:text-indigo-400" fill="currentColor" viewBox="0 0 16 16">
												<path d="M8 4l4 6H4l4-6z"/>
											</svg>
										{:else if sortBy === 'department' && orderBy === 'desc'}
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

							<!-- ── Colonne triable : Role ───────────────────────────── -->
							<th
								class="px-4 py-3.5"
								aria-sort={sortBy === 'roleTitle' ? (orderBy === 'asc' ? 'ascending' : 'descending') : 'none'}
							>
								<button
									id="sort-role"
									onclick={() => applySort('roleTitle')}
									class="inline-flex items-center gap-1 group select-none
										{sortBy === 'roleTitle' ? 'text-indigo-500 dark:text-indigo-400' : 'hover:text-gray-700 dark:hover:text-zinc-200 transition-colors'}"
									aria-label="Trier par rôle"
								>
									{t('role')}
									<span class="inline-flex flex-col gap-px opacity-60 {sortBy === 'roleTitle' ? 'opacity-100' : 'group-hover:opacity-80'}" aria-hidden="true">
										{#if sortBy === 'roleTitle' && orderBy === 'asc'}
											<svg class="w-3 h-3 text-indigo-500 dark:text-indigo-400" fill="currentColor" viewBox="0 0 16 16">
												<path d="M8 4l4 6H4l4-6z"/>
											</svg>
										{:else if sortBy === 'roleTitle' && orderBy === 'desc'}
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

							<!-- ── Colonne triable : Level ──────────────────────────── -->
							<th
								class="px-4 py-3.5 hidden sm:table-cell"
								aria-sort={sortBy === 'level' ? (orderBy === 'asc' ? 'ascending' : 'descending') : 'none'}
							>
								<button
									id="sort-level"
									onclick={() => applySort('level')}
									class="inline-flex items-center gap-1 group select-none
										{sortBy === 'level' ? 'text-indigo-500 dark:text-indigo-400' : 'hover:text-gray-700 dark:hover:text-zinc-200 transition-colors'}"
									aria-label="Trier par niveau"
								>
									{t('level')}
									<span class="inline-flex flex-col gap-px opacity-60 {sortBy === 'level' ? 'opacity-100' : 'group-hover:opacity-80'}" aria-hidden="true">
										{#if sortBy === 'level' && orderBy === 'asc'}
											<svg class="w-3 h-3 text-indigo-500 dark:text-indigo-400" fill="currentColor" viewBox="0 0 16 16">
												<path d="M8 4l4 6H4l4-6z"/>
											</svg>
										{:else if sortBy === 'level' && orderBy === 'desc'}
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

							<!-- ── Colonne triable : Status ─────────────────────────── -->
							<th
								class="px-4 py-3.5"
								aria-sort={sortBy === 'status' ? (orderBy === 'asc' ? 'ascending' : 'descending') : 'none'}
							>
								<button
									id="sort-status"
									onclick={() => applySort('status')}
									class="inline-flex items-center gap-1 group select-none
										{sortBy === 'status' ? 'text-indigo-500 dark:text-indigo-400' : 'hover:text-gray-700 dark:hover:text-zinc-200 transition-colors'}"
									aria-label="Trier par statut"
								>
									{t('status')}
									<span class="inline-flex flex-col gap-px opacity-60 {sortBy === 'status' ? 'opacity-100' : 'group-hover:opacity-80'}" aria-hidden="true">
										{#if sortBy === 'status' && orderBy === 'asc'}
											<svg class="w-3 h-3 text-indigo-500 dark:text-indigo-400" fill="currentColor" viewBox="0 0 16 16">
												<path d="M8 4l4 6H4l4-6z"/>
											</svg>
										{:else if sortBy === 'status' && orderBy === 'desc'}
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

							<th class="px-4 py-3.5">{t('action')}</th>
						</tr>
					</thead>
					<tbody class="divide-y divide-gray-100 dark:divide-zinc-800">
						{#each paginatedMembers as member (member._id)}
							{@const memberId = member._id ?? member.id}
							{@const isSelected = selectedIds.includes(memberId)}
							<tr class="hover:bg-gray-50 dark:hover:bg-zinc-800/50 transition-colors duration-100 {isSelected ? 'bg-indigo-50/50 dark:bg-indigo-950/30' : ''}">

								<!-- Case à cocher individuelle -->
								<td class="px-4 py-3.5 text-center">
									<input
										type="checkbox"
										checked={isSelected}
										onclick={() => toggleSelect(memberId)}
										class="w-4 h-4 rounded-sm border-gray-300 dark:border-zinc-700 text-indigo-600 focus:ring-indigo-500 cursor-pointer"
										aria-label="Sélectionner le membre {member.name}"
									/>
								</td>

								<!-- Member (Avatar + Name + Email) -->
								<td class="px-5 py-3.5">
									<div class="flex items-center gap-3">
										<!-- Avatar Badge -->
										<div class="w-9 h-9 rounded-full {getAvatarStyle(member.name)} flex items-center justify-center shrink-0 font-semibold text-xs shadow-xs">
											{getInitials(member.name)}
										</div>
										<div>
											<p class="font-medium text-gray-900 dark:text-zinc-100 leading-tight">{member.name}</p>
											<p class="text-xs text-gray-400 dark:text-zinc-500 leading-tight mt-0.5">{member.email}</p>
										</div>
									</div>
								</td>

								<!-- Email -->
								<td class="px-4 py-3.5 text-gray-500 dark:text-zinc-400 text-xs hidden md:table-cell">
									{member.email}
								</td>

								<!-- Department -->
								<td class="px-4 py-3.5 text-gray-700 dark:text-zinc-300 font-normal">
									{member.department}
								</td>

								<!-- Role -->
								<td class="px-4 py-3.5">
									<span class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium
										{member.roleTitle === 'Admin'
											? 'bg-indigo-100 dark:bg-indigo-950/70 text-indigo-700 dark:text-indigo-300'
											: 'bg-gray-100 dark:bg-zinc-800 text-gray-600 dark:text-zinc-400'}">
										{member.roleTitle}
									</span>
								</td>

								<!-- Level -->
								<td class="px-4 py-3.5 hidden sm:table-cell text-gray-500 dark:text-zinc-400 text-xs font-mono">
									L{member.level}
								</td>

								<!-- Status Badge -->
								<td class="px-4 py-3.5">
									{#if member.status === 'Active'}
										<span class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-emerald-100 dark:bg-emerald-950/70 text-emerald-600 dark:text-emerald-400">
											Active
										</span>
									{:else}
										<span class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 dark:bg-red-950/70 text-red-600 dark:text-red-400">
											Inactive
										</span>
									{/if}
								</td>

								<!-- ── Action Buttons ── -->
								<td class="px-4 py-3.5">
									<div class="flex items-center gap-2">
										<!-- Voir & Modifier → page détail -->
										<a
											href="/team-members/{member._id ?? member.id}"
											class="inline-flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-medium rounded-lg
												text-indigo-700 dark:text-indigo-300
												bg-indigo-50 dark:bg-indigo-950/40
												hover:bg-indigo-100 dark:hover:bg-indigo-900/50
												border border-indigo-200 dark:border-indigo-800/50
												transition-colors"
											aria-label="Voir et modifier le membre {member.name}"
										>
											<svg class="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="1.75" aria-hidden="true">
												<path stroke-linecap="round" stroke-linejoin="round" d="m16.862 4.487 1.687-1.688a1.875 1.875 0 1 1 2.652 2.652L10.582 16.07a4.5 4.5 0 0 1-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 0 1 1.13-1.897l8.932-8.931Zm0 0L19.5 7.125" />
											</svg>
											Ouvrir
										</a>

										<!-- Supprimer -->
										<button
											type="button"
											onclick={() => confirmDelete(member._id ?? member.id, member.name)}
											class="text-gray-400 dark:text-zinc-500 hover:text-red-500 transition-colors p-1 rounded-md hover:bg-red-50 dark:hover:bg-red-950/40"
											aria-label="Supprimer le membre {member.name}"
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
		{:else}
			<!-- ── VUE GRILLE / CARTES ─────────────────────────────────── -->
			<div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 p-5">
				{#each paginatedMembers as member (member._id ?? member.id)}
					{@const memberId = member._id ?? member.id}
					{@const isSelected = selectedIds.includes(memberId)}

					<div
						class="relative flex flex-col justify-between p-5 rounded-2xl border bg-white dark:bg-zinc-900 shadow-xs hover:shadow-md transition-all duration-200 group
							{isSelected
								? 'border-indigo-500 ring-2 ring-indigo-500/20 bg-indigo-50/20 dark:bg-indigo-950/20'
								: 'border-gray-200 dark:border-zinc-800/80 hover:border-gray-300 dark:hover:border-zinc-700'}"
					>
						<!-- Top row: Checkbox & Badges -->
						<div>
							<div class="flex items-center justify-between gap-2 mb-3">
								<div class="flex items-center gap-2">
									<input
										type="checkbox"
										checked={isSelected}
										onclick={() => toggleSelect(memberId)}
										class="w-4 h-4 rounded border-gray-300 dark:border-zinc-700 text-indigo-600 focus:ring-indigo-500 cursor-pointer"
										aria-label="Sélectionner le membre {member.name}"
									/>
									<span class="font-mono text-xs font-semibold text-gray-500 dark:text-zinc-400">
										L{member.level}
									</span>
								</div>

								<div class="flex items-center gap-1.5">
									<!-- Role badge -->
									<span class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold
										{member.roleTitle === 'Admin'
											? 'bg-purple-100 dark:bg-purple-950/70 text-purple-700 dark:text-purple-300'
											: 'bg-gray-100 dark:bg-zinc-800 text-gray-600 dark:text-zinc-400'}">
										{member.roleTitle}
									</span>

									<!-- Status badge -->
									{#if member.status === 'Active'}
										<span class="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-emerald-100 dark:bg-emerald-950/70 text-emerald-600 dark:text-emerald-400">
											Active
										</span>
									{:else}
										<span class="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-red-100 dark:bg-red-950/70 text-red-600 dark:text-red-400">
											Inactive
										</span>
									{/if}
								</div>
							</div>

							<!-- Member Identity -->
							<div class="flex items-center gap-3 my-3">
								<div class="w-12 h-12 rounded-full {getAvatarStyle(member.name)} flex items-center justify-center shrink-0 font-bold text-sm shadow-xs">
									{getInitials(member.name)}
								</div>
								<div class="min-w-0 flex-1">
									<h3 class="font-bold text-gray-900 dark:text-white text-base leading-snug truncate group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">
										<a href="/team-members/{memberId}">
											{member.name}
										</a>
									</h3>
									<p class="text-xs text-gray-500 dark:text-zinc-400 truncate mt-0.5">{member.email}</p>
								</div>
							</div>
						</div>

						<!-- Bottom section: Department & Actions -->
						<div class="border-t border-gray-100 dark:border-zinc-800/80 pt-3.5 mt-2 flex items-center justify-between gap-2">
							<span class="px-2.5 py-1 rounded-lg bg-gray-100 dark:bg-zinc-800/80 text-gray-600 dark:text-zinc-300 font-medium text-xs">
								{member.department}
							</span>

							<div class="flex items-center gap-2">
								<a
									href="/team-members/{memberId}"
									class="inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-medium rounded-lg
										text-indigo-700 dark:text-indigo-300
										bg-indigo-50 dark:bg-indigo-950/40
										hover:bg-indigo-100 dark:hover:bg-indigo-900/50
										border border-indigo-200 dark:border-indigo-800/50
										transition-colors"
									aria-label="Voir et modifier le membre {member.name}"
								>
									<svg class="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="1.75" aria-hidden="true">
										<path stroke-linecap="round" stroke-linejoin="round" d="m16.862 4.487 1.687-1.688a1.875 1.875 0 1 1 2.652 2.652L10.582 16.07a4.5 4.5 0 0 1-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 0 1 1.13-1.897l8.932-8.931Zm0 0L19.5 7.125" />
									</svg>
									Ouvrir
								</a>

								<button
									type="button"
									onclick={() => confirmDelete(memberId, member.name)}
									class="text-gray-400 dark:text-zinc-500 hover:text-red-500 transition-colors p-1 rounded-md hover:bg-red-50 dark:hover:bg-red-950/40"
									aria-label="Supprimer le membre {member.name}"
								>
									<svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="1.75" aria-hidden="true">
										<path stroke-linecap="round" stroke-linejoin="round" d="m14.74 9-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 0 1-2.244 2.077H8.084a2.25 2.25 0 0 1-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 0 0-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 0 1 3.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 0 0-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 0 0-7.5 0" />
									</svg>
								</button>
							</div>
						</div>
					</div>
				{/each}
			</div>
		{/if}

		<!-- Pagination Footer -->
		{#if paginatedMembers.length > 0}
			<div class="px-5 py-4 border-t border-gray-100 dark:border-zinc-800 flex items-center justify-between gap-4">
				<!-- Info -->
				<span class="text-xs text-gray-400 dark:text-zinc-500 shrink-0">
					{(currentPage - 1) * pageSize + 1}–{Math.min(currentPage * pageSize, sortedMembers.length)} / {sortedMembers.length} membres
				</span>

				<!-- Pages -->
				<div class="flex items-center gap-1">
					<!-- Previous -->
					<button
						onclick={() => goToPage(Math.max(1, currentPage - 1))}
						disabled={currentPage === 1}
						class="flex items-center gap-1 px-2.5 py-1.5 text-sm font-medium rounded-lg text-gray-600 dark:text-zinc-400 hover:text-gray-900 dark:hover:text-zinc-100 hover:bg-gray-100 dark:hover:bg-zinc-800 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
						aria-label="Page précédente"
					>
						<svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2" aria-hidden="true">
							<path stroke-linecap="round" stroke-linejoin="round" d="M15.75 19.5 8.25 12l7.5-7.5" />
						</svg>
					</button>

					<!-- Page Numbers -->
					{#each paginationPages as p}
						{#if p === '…'}
							<span class="w-8 h-8 flex items-center justify-center text-xs text-gray-400 dark:text-zinc-500">…</span>
						{:else}
							<button
								onclick={() => goToPage(p as number)}
								class="w-8 h-8 rounded-lg text-sm font-medium transition-colors duration-100
									{currentPage === p
										? 'bg-indigo-600 text-white font-semibold'
										: 'text-gray-600 dark:text-zinc-400 hover:bg-gray-100 dark:hover:bg-zinc-800 hover:text-gray-900 dark:hover:text-zinc-100'}"
								aria-current={currentPage === p ? 'page' : undefined}
							>
								{p}
							</button>
						{/if}
					{/each}

					<!-- Next -->
					<button
						onclick={() => goToPage(Math.min(totalPages, currentPage + 1))}
						disabled={currentPage === totalPages}
						class="flex items-center gap-1 px-2.5 py-1.5 text-sm font-medium rounded-lg text-gray-600 dark:text-zinc-400 hover:text-gray-900 dark:hover:text-zinc-100 hover:bg-gray-100 dark:hover:bg-zinc-800 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
						aria-label="Page suivante"
					>
						<svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2" aria-hidden="true">
							<path stroke-linecap="round" stroke-linejoin="round" d="m8.25 4.5 7.5 7.5-7.5 7.5" />
						</svg>
					</button>
				</div>
			</div>
		{/if}
	</div>

</div>

<!-- ── Modal de confirmation de suppression unique ─────────────────── -->
{#if isDeleteModalOpen}
	<div
		class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-fade-in"
		role="dialog"
		aria-modal="true"
		aria-labelledby="modal-delete-title"
	>
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
				Êtes-vous sûr de vouloir supprimer le membre <strong class="text-gray-900 dark:text-zinc-200">«&nbsp;{deleteTargetName}&nbsp;»</strong> ? Cette action est irréversible.
			</p>

			<form
				method="POST"
				action="?/deleteMember"
				use:enhance={() => {
					isDeleting = true;
					return async ({ update }) => {
						await update();
						isDeleting = false;
						isDeleteModalOpen = false;
					};
				}}
				class="flex items-center justify-end gap-3 pt-2"
			>
				<input type="hidden" name="id" value={deleteTargetId} />

				<button
					type="button"
					onclick={() => isDeleteModalOpen = false}
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
	<div
		class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-fade-in"
		role="dialog"
		aria-modal="true"
		aria-labelledby="modal-bulk-delete-title"
	>
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
				Êtes-vous sûr de vouloir supprimer définitivement <strong class="text-gray-900 dark:text-zinc-200">{selectedIds.length} membre(s)</strong> ? Cette action est irréversible.
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
						Supprimer {selectedIds.length} membres
					{/if}
				</button>
			</form>
		</div>
	</div>
{/if}
