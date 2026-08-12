<script lang="ts">
	import { enhance } from '$app/forms';
	import type { ActionData, PageData } from './$types';
	import { t } from '$lib/i18n.svelte';

	interface Props {
		data: PageData;
		form: ActionData;
	}

	let { data, form }: Props = $props();

	const { technicians } = data;

	let creationMode = $state<'single' | 'bulk'>('single');

	// ── Mode création multiple ─────────────────────────────────────
	interface BulkItem {
		id: string;
		title: string;
		description: string;
		priority: number;
		originDepartment: string;
		assignedTo: string;
	}

	let bulkItems = $state<BulkItem[]>([
		{ id: '1', title: '', description: '', priority: 3, originDepartment: '', assignedTo: '' },
		{ id: '2', title: '', description: '', priority: 3, originDepartment: '', assignedTo: '' }
	]);

	let bulkLoading = $state(false);

	const bulkRowErrors = $derived<Record<number, string>>(
		(form as any)?.action === 'createBulk' ? ((form as any)?.rowErrors ?? {}) : {}
	);
	const bulkFormError = $derived<string | undefined>(
		(form as any)?.action === 'createBulk' ? (form as any)?.bulkFormError : undefined
	);

	function addBulkRow() {
		bulkItems = [
			...bulkItems,
			{ id: String(Date.now()), title: '', description: '', priority: 3, originDepartment: '', assignedTo: '' }
		];
	}

	function removeBulkRow(index: number) {
		if (bulkItems.length > 1) {
			bulkItems = bulkItems.filter((_, i) => i !== index);
		}
	}

	function setAllBulkDepartment(dept: string) {
		if (!dept) return;
		bulkItems = bulkItems.map((item) => ({ ...item, originDepartment: dept }));
	}

	function setAllBulkTechnician(techId: string) {
		if (!techId) return;
		bulkItems = bulkItems.map((item) => ({ ...item, assignedTo: techId }));
	}

	function setAllBulkPriority(p: number) {
		bulkItems = bulkItems.map((item) => ({ ...item, priority: p }));
	}

	// ── Mode création unique ──────────────────────────────────────
	let title            = $state('');
	let description      = $state('');
	let priority         = $state('3');
	let originDepartment = $state('');
	let assignedTo       = $state('');
	let loading          = $state(false);

	const fieldErrors = $derived<Record<string, string>>(
		(form as any)?.action === 'createSingle' ? ((form as any)?.fieldErrors ?? {}) : {}
	);
	const formError = $derived<string | undefined>(
		(form as any)?.action === 'createSingle' ? (form as any)?.formError : undefined
	);

	const priorityOptions = [
		{ value: '1', label: 'Basse',   color: '#64748b' },
		{ value: '2', label: 'Normale', color: '#06b6d4' },
		{ value: '3', label: 'Moyenne', color: '#eab308' },
		{ value: '4', label: 'Haute',   color: '#f97316' },
		{ value: '5', label: 'Critique', color: '#ef4444' }
	];

	const departments = [
		'TI', 'Ressources Humaines', 'Comptabilité',
		'Support Technique', 'Equipe de direction', 'Marketing', 'Finance'
	];

	const currentPriority = $derived(priorityOptions.find((p) => p.value === priority) ?? priorityOptions[2]);
</script>

<svelte:head>
	<title>{t('create_ticket_title')} — TicketFlow</title>
	<meta name="description" content="Créer un ou plusieurs nouveaux billets de support TicketFlow." />
</svelte:head>

<!-- Page header -->
<div class="flex flex-wrap items-center justify-between gap-4 mb-6">
	<div>
		<h2 class="text-2xl font-bold text-gray-900 dark:text-white">{t('create_ticket_title')}</h2>
		<p class="text-xs text-gray-500 dark:text-zinc-400 mt-0.5">{t('create_ticket_desc')}</p>
	</div>

	<a
		href="/tickets"
		class="inline-flex items-center gap-2 px-4 py-2.5 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-semibold transition-colors duration-200 shadow-sm"
	>
		<svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2.5" aria-hidden="true">
			<path stroke-linecap="round" stroke-linejoin="round" d="M6 18 18 6M6 6l12 12" />
		</svg>
		{t('cancel_btn')}
	</a>
</div>

<!-- ── Mode switcher tab ─────────────────────────────────────────────── -->
<div class="flex items-center gap-1 bg-gray-100 dark:bg-zinc-800/60 p-1 rounded-xl mb-6 max-w-md">
	<button
		type="button"
		onclick={() => creationMode = 'single'}
		class="flex-1 py-2 px-4 rounded-lg text-sm font-semibold transition-all duration-150 flex items-center justify-center gap-2
			{creationMode === 'single'
				? 'bg-white dark:bg-zinc-900 text-indigo-600 dark:text-indigo-400 shadow-xs'
				: 'text-gray-600 dark:text-zinc-400 hover:text-gray-900 dark:hover:text-zinc-200'}"
	>
		<svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2" aria-hidden="true">
			<path stroke-linecap="round" stroke-linejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 0 0-3.375-3.375h-1.5A1.125 1.125 0 0 1 13.5 7.125v-1.5a3.375 3.375 0 0 0-3.375-3.375H8.25m2.25 0H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 0 0-9-9Z" />
		</svg>
		{t('single_ticket')}
	</button>

	<button
		type="button"
		onclick={() => creationMode = 'bulk'}
		id="btn-mode-bulk"
		class="flex-1 py-2 px-4 rounded-lg text-sm font-semibold transition-all duration-150 flex items-center justify-center gap-2
			{creationMode === 'bulk'
				? 'bg-white dark:bg-zinc-900 text-indigo-600 dark:text-indigo-400 shadow-xs'
				: 'text-gray-600 dark:text-zinc-400 hover:text-gray-900 dark:hover:text-zinc-200'}"
	>
		<svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2" aria-hidden="true">
			<path stroke-linecap="round" stroke-linejoin="round" d="M15.75 17.25v2.25C15.75 20.77 14.52 22 13 22H4c-1.52 0-2.75-1.23-2.75-2.75V11c0-1.52 1.23-2.75 2.75-2.75h2.25m3 3h9c1.52 0 2.75 1.23 2.75 2.75v8c0 1.52-1.23 2.75-2.75 2.75h-9c-1.52 0-2.75-1.23-2.75-2.75v-8c0-1.52 1.23-2.75 2.75-2.75Z" />
		</svg>
		{t('bulk_tickets')}
	</button>
</div>

<!-- ══ MODE TICKET UNIQUE ═════════════════════════════════════════════ -->
{#if creationMode === 'single'}

{#if formError}
	<div class="mb-5 p-4 rounded-lg bg-red-50 dark:bg-red-500/10 border border-red-200 dark:border-red-500/30 text-red-700 dark:text-red-300 text-sm flex items-start gap-2" role="alert">
		<svg class="w-4 h-4 shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20" aria-hidden="true">
			<path fill-rule="evenodd" d="M18 10A8 8 0 1 1 2 10a8 8 0 0 1 16 0Zm-8-5a.75.75 0 0 1 .75.75v4.5a.75.75 0 0 1-1.5 0v-4.5A.75.75 0 0 1 10 5Zm0 10a1 1 0 1 0 0-2 1 1 0 0 0 0 2Z" clip-rule="evenodd" />
		</svg>
		{formError}
	</div>
{/if}

<form
	method="POST"
	action="?/createSingle"
	use:enhance={() => {
		loading = true;
		return async ({ update }) => {
			await update();
			loading = false;
		};
	}}
	novalidate
>

	<!-- ── 2-column layout ──────────────────────────────────────────── -->
	<div class="grid grid-cols-1 lg:grid-cols-2 gap-6">

		<!-- ══ LEFT COLUMN ══════════════════════════════════════════════ -->
		<div class="space-y-5">

			<!-- Section: Informations principales -->
			<div class="bg-white dark:bg-zinc-900 rounded-xl border border-gray-200 dark:border-zinc-800 shadow-sm p-5 space-y-4 transition-colors">
				<h3 class="text-sm font-semibold text-gray-800 dark:text-zinc-200 pb-2 border-b border-gray-100 dark:border-zinc-800">Informations principales</h3>

				<!-- Titre -->
				<div class="space-y-1.5">
					<label for="title" class="text-sm font-medium text-gray-700 dark:text-zinc-300">
						Titre <span class="text-red-500" aria-hidden="true">*</span>
					</label>
					<input
						id="title"
						name="title"
						type="text"
						bind:value={title}
						required
						maxlength="100"
						placeholder="Ex: Serveur courriel hors ligne"
						aria-invalid={!!fieldErrors.title}
						class="w-full px-3.5 py-2.5 text-sm rounded-lg border transition-colors
							{fieldErrors.title ? 'border-red-400 focus:ring-red-400' : 'border-gray-200 dark:border-zinc-700 hover:border-gray-300 dark:hover:border-zinc-600 focus:ring-indigo-500'}
							bg-white dark:bg-zinc-900 text-gray-900 dark:text-zinc-100 placeholder:text-gray-400 dark:placeholder:text-zinc-500 focus:outline-none focus:ring-2 focus:border-transparent"
					/>
					{#if fieldErrors.title}
						<p class="text-xs text-red-500" role="alert">{fieldErrors.title}</p>
					{/if}
				</div>

				<!-- Description -->
				<div class="space-y-1.5">
					<label for="description" class="text-sm font-medium text-gray-700 dark:text-zinc-300">
						Description <span class="text-red-500" aria-hidden="true">*</span>
					</label>
					<textarea
						id="description"
						name="description"
						bind:value={description}
						required
						rows="5"
						placeholder="Décrivez le problème en détail : symptômes, impact, étapes pour reproduire..."
						aria-invalid={!!fieldErrors.description}
						class="w-full px-3.5 py-2.5 text-sm rounded-lg border resize-none transition-colors
							{fieldErrors.description ? 'border-red-400 focus:ring-red-400' : 'border-gray-200 dark:border-zinc-700 hover:border-gray-300 dark:hover:border-zinc-600 focus:ring-indigo-500'}
							bg-white dark:bg-zinc-900 text-gray-900 dark:text-zinc-100 placeholder:text-gray-400 dark:placeholder:text-zinc-500 focus:outline-none focus:ring-2 focus:border-transparent"
					></textarea>
					{#if fieldErrors.description}
						<p class="text-xs text-red-500" role="alert">{fieldErrors.description}</p>
					{/if}
				</div>

				<!-- Catégorie / Département -->
				<div class="space-y-1.5">
					<label for="originDepartment" class="text-sm font-medium text-gray-700 dark:text-zinc-300">
						Catégorie / Département
					</label>
					<div class="relative">
						<svg class="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 dark:text-zinc-500 pointer-events-none" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="1.75" aria-hidden="true">
							<path stroke-linecap="round" stroke-linejoin="round" d="M2.25 12.75V12A2.25 2.25 0 0 1 4.5 9.75h15A2.25 2.25 0 0 1 21.75 12v.75m-8.69-6.44-2.12-2.12a1.5 1.5 0 0 0-1.061-.44H4.5A2.25 2.25 0 0 0 2.25 6v12a2.25 2.25 0 0 0 2.25 2.25h15A2.25 2.25 0 0 0 21.75 18V9a2.25 2.25 0 0 0-2.25-2.25h-5.379a1.5 1.5 0 0 1-1.06-.44Z" />
						</svg>
						<select
							id="originDepartment"
							name="originDepartment"
							bind:value={originDepartment}
							class="w-full pl-9 pr-8 py-2.5 text-sm rounded-lg border border-gray-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 text-gray-800 dark:text-zinc-200 focus:outline-none focus:ring-2 focus:ring-indigo-500 appearance-none cursor-pointer"
						>
							<option value="">Sélectionner un département...</option>
							{#each departments as dept}
								<option value={dept}>{dept}</option>
							{/each}
						</select>
						<svg class="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 dark:text-zinc-500 pointer-events-none" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2" aria-hidden="true">
							<path stroke-linecap="round" stroke-linejoin="round" d="m19.5 8.25-7.5 7.5-7.5-7.5" />
						</svg>
					</div>
				</div>
			</div>

			<!-- Section: Qualification & Sévérité -->
			<div class="bg-white dark:bg-zinc-900 rounded-xl border border-gray-200 dark:border-zinc-800 shadow-sm p-5 space-y-4 transition-colors">
				<h3 class="text-sm font-semibold text-gray-800 dark:text-zinc-200 pb-2 border-b border-gray-100 dark:border-zinc-800">Qualification & Sévérité</h3>

				<!-- Priorité dropdown -->
				<div class="space-y-1.5">
					<label for="priority" class="text-sm font-medium text-gray-700 dark:text-zinc-300">
						Priorité <span class="text-red-500" aria-hidden="true">*</span>
					</label>
					<div class="relative">
						<span
							class="absolute left-3 top-1/2 -translate-y-1/2 w-3 h-3 rounded-full pointer-events-none"
							style="background: {currentPriority.color}"
							aria-hidden="true"
						></span>
						<select
							id="priority"
							name="priority"
							bind:value={priority}
							aria-invalid={!!fieldErrors.priority}
							class="w-full pl-8 pr-8 py-2.5 text-sm rounded-lg border focus:outline-none focus:ring-2 focus:ring-indigo-500 text-gray-800 dark:text-zinc-200 bg-white dark:bg-zinc-900 appearance-none cursor-pointer
								{fieldErrors.priority ? 'border-red-400' : 'border-gray-200 dark:border-zinc-700'}"
						>
							{#each priorityOptions as p}
								<option value={p.value}>P{p.value} — {p.label}</option>
							{/each}
						</select>
						<svg class="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 dark:text-zinc-500 pointer-events-none" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2" aria-hidden="true">
							<path stroke-linecap="round" stroke-linejoin="round" d="m19.5 8.25-7.5 7.5-7.5-7.5" />
						</svg>
					</div>
					{#if fieldErrors.priority}
						<p class="text-xs text-red-500" role="alert">{fieldErrors.priority}</p>
					{/if}
				</div>

				<!-- Priority preview chips -->
				<div class="flex flex-wrap gap-2 pt-1">
					{#each priorityOptions as p}
						{@const isSelected = priority === p.value}
						<label
							class="flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium cursor-pointer border transition-all duration-150
								{isSelected
									? 'bg-indigo-50 dark:bg-indigo-950/60 border-indigo-500 text-indigo-700 dark:text-indigo-300 font-semibold'
									: 'bg-gray-50 dark:bg-zinc-800/60 border-gray-200 dark:border-zinc-700 text-gray-600 dark:text-zinc-400 hover:border-gray-300 dark:hover:border-zinc-600'}"
						>
							<input type="radio" name="priority" value={p.value} bind:group={priority} class="sr-only" />
							<span class="w-2 h-2 rounded-full" style="background: {p.color}" aria-hidden="true"></span>
							P{p.value}
						</label>
					{/each}
				</div>
			</div>

		</div>

		<!-- ══ RIGHT COLUMN ═════════════════════════════════════════════ -->
		<div class="space-y-5">

			<!-- Section: Acteurs & Assignation -->
			<div class="bg-white dark:bg-zinc-900 rounded-xl border border-gray-200 dark:border-zinc-800 shadow-sm p-5 space-y-4 transition-colors">
				<h3 class="text-sm font-semibold text-gray-800 dark:text-zinc-200 pb-2 border-b border-gray-100 dark:border-zinc-800">Acteurs & Assignation</h3>

				<!-- Assigné à -->
				<div class="space-y-1.5">
					<label for="assignedTo" class="text-sm font-medium text-gray-700 dark:text-zinc-300">Assigné à</label>
					<div class="relative">
						<svg class="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 dark:text-zinc-500 pointer-events-none" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="1.75" aria-hidden="true">
							<path stroke-linecap="round" stroke-linejoin="round" d="M15.75 6a3.75 3.75 0 1 1-7.5 0 3.75 3.75 0 0 1 7.5 0ZM4.501 20.118a7.5 7.5 0 0 1 14.998 0A17.933 17.933 0 0 1 12 21.75c-2.676 0-5.216-.584-7.499-1.632Z" />
						</svg>
						<select
							id="assignedTo"
							name="assignedTo"
							bind:value={assignedTo}
							class="w-full pl-9 pr-8 py-2.5 text-sm rounded-lg border border-gray-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 text-gray-800 dark:text-zinc-200 focus:outline-none focus:ring-2 focus:ring-indigo-500 appearance-none cursor-pointer"
						>
							<option value="">Assigner à... (optionnel)</option>
							{#each technicians as tech}
								<option value={tech._id}>{tech.name} (Niv.{tech.level})</option>
							{/each}
						</select>
						<svg class="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 dark:text-zinc-500 pointer-events-none" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2" aria-hidden="true">
							<path stroke-linecap="round" stroke-linejoin="round" d="m19.5 8.25-7.5 7.5-7.5-7.5" />
						</svg>
					</div>
				</div>
			</div>

			<!-- Section: Informations (recap visuel) -->
			<div class="bg-indigo-50 dark:bg-indigo-950/40 rounded-xl border border-indigo-100 dark:border-indigo-900/50 p-5 space-y-3 transition-colors">
				<h3 class="text-sm font-semibold text-indigo-700 dark:text-indigo-300 flex items-center gap-2">
					<svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2" aria-hidden="true">
						<path stroke-linecap="round" stroke-linejoin="round" d="m11.25 11.25.041-.02a.75.75 0 0 1 1.063.852l-.708 2.836a.75.75 0 0 0 1.063.853l.041-.021M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Zm-9-3.75h.008v.008H12V8.25Z" />
					</svg>
					Récapitulatif
				</h3>
				<div class="space-y-2 text-xs text-indigo-700 dark:text-indigo-300">
					<div class="flex items-center gap-2">
						<svg class="w-3.5 h-3.5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2" aria-hidden="true">
							<path stroke-linecap="round" stroke-linejoin="round" d="M9 12.75 11.25 15 15 9.75M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" />
						</svg>
						Statut initial : <strong>Open</strong>
					</div>
					<div class="flex items-center gap-2">
						<span class="w-3.5 h-3.5 rounded-full shrink-0" style="background: {currentPriority.color}"></span>
						Priorité : <strong>P{priority} — {currentPriority.label}</strong>
					</div>
					{#if originDepartment}
						<div class="flex items-center gap-2">
							<svg class="w-3.5 h-3.5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2" aria-hidden="true">
								<path stroke-linecap="round" stroke-linejoin="round" d="M2.25 21h19.5m-18-18v18m10.5-18v18m6-13.5V21M6.75 6.75h.75m-.75 3h.75m-.75 3h.75m3-6h.75m-.75 3h.75m-.75 3h.75M6.75 21v-3.375c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125V21M3 3h12m-.75 4.5H21m-3.75 3.75h.008v.008h-.008v-.008Zm0 3h.008v.008h-.008v-.008Zm0 3h.008v.008h-.008v-.008Z" />
							</svg>
							Département : <strong>{originDepartment}</strong>
						</div>
					{/if}
					{#if assignedTo}
						{@const selectedTech = technicians.find((t) => t._id === assignedTo)}
						{#if selectedTech}
							<div class="flex items-center gap-2">
								<svg class="w-3.5 h-3.5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2" aria-hidden="true">
									<path stroke-linecap="round" stroke-linejoin="round" d="M15.75 6a3.75 3.75 0 1 1-7.5 0 3.75 3.75 0 0 1 7.5 0ZM4.501 20.118a7.5 7.5 0 0 1 14.998 0A17.933 17.933 0 0 1 12 21.75c-2.676 0-5.216-.584-7.499-1.632Z" />
								</svg>
								Assigné à : <strong>{selectedTech.name}</strong>
							</div>
						{/if}
					{/if}
				</div>
			</div>

		</div>
	</div>

	<!-- ── Form Actions ─────────────────────────────────────────────── -->
	<div class="flex items-center justify-end gap-3 mt-6 pt-5 border-t border-gray-200 dark:border-zinc-800">
		<a
			href="/tickets"
			class="px-5 py-2.5 text-sm font-semibold rounded-lg text-gray-700 dark:text-zinc-300 border border-gray-300 dark:border-zinc-700 hover:bg-gray-100 dark:hover:bg-zinc-800 transition-colors duration-150"
		>
			{t('cancel_btn')}
		</a>
		<button
			type="submit"
			disabled={loading}
			class="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-semibold transition-colors duration-200 shadow-sm disabled:opacity-70 disabled:cursor-not-allowed"
		>
			{#if loading}
				<svg class="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24" aria-hidden="true">
					<circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
					<path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 0 1 8-8V0C5.373 0 0 5.373 0 12h4Z"></path>
				</svg>
				Enregistrement…
			{:else}
				<svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2.5" aria-hidden="true">
					<path stroke-linecap="round" stroke-linejoin="round" d="M9 12.75 11.25 15 15 9.75M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" />
				</svg>
				{t('nav_create_ticket')}
			{/if}
		</button>
	</div>
</form>

{:else}

<!-- ══ MODE CRÉATION MULTIPLE (LOT) ════════════════════════════════════ -->
{#if bulkFormError}
	<div class="mb-5 p-4 rounded-lg bg-red-50 dark:bg-red-500/10 border border-red-200 dark:border-red-500/30 text-red-700 dark:text-red-300 text-sm flex items-start gap-2" role="alert">
		<svg class="w-4 h-4 shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20" aria-hidden="true">
			<path fill-rule="evenodd" d="M18 10A8 8 0 1 1 2 10a8 8 0 0 1 16 0Zm-8-5a.75.75 0 0 1 .75.75v4.5a.75.75 0 0 1-1.5 0v-4.5A.75.75 0 0 1 10 5Zm0 10a1 1 0 1 0 0-2 1 1 0 0 0 0 2Z" clip-rule="evenodd" />
		</svg>
		{bulkFormError}
	</div>
{/if}

<!-- Panneau de réglages rapides en lot -->
<div class="mb-6 bg-indigo-50 dark:bg-indigo-950/40 rounded-xl border border-indigo-100 dark:border-indigo-900/50 p-4 space-y-3">
	<h3 class="text-xs font-semibold text-indigo-900 dark:text-indigo-200 uppercase tracking-wider">
		Actions rapides globales (Appliquer à tous les tickets ci-dessous)
	</h3>
	<div class="flex flex-wrap items-center gap-3">
		<!-- Appliquer Département -->
		<select
			onchange={(e) => setAllBulkDepartment((e.target as HTMLSelectElement).value)}
			class="text-xs font-medium px-3 py-1.5 rounded-lg border border-indigo-200 dark:border-indigo-800 bg-white dark:bg-zinc-900 text-indigo-900 dark:text-indigo-200 cursor-pointer"
		>
			<option value="">Département à tous…</option>
			{#each departments as dept}
				<option value={dept}>{dept}</option>
			{/each}
		</select>

		<!-- Appliquer Technicien -->
		<select
			onchange={(e) => setAllBulkTechnician((e.target as HTMLSelectElement).value)}
			class="text-xs font-medium px-3 py-1.5 rounded-lg border border-indigo-200 dark:border-indigo-800 bg-white dark:bg-zinc-900 text-indigo-900 dark:text-indigo-200 cursor-pointer"
		>
			<option value="">Assigner technicien à tous…</option>
			{#each technicians as tech}
				<option value={tech._id}>{tech.name}</option>
			{/each}
		</select>

		<!-- Appliquer Priorité -->
		<select
			onchange={(e) => setAllBulkPriority(Number((e.target as HTMLSelectElement).value))}
			class="text-xs font-medium px-3 py-1.5 rounded-lg border border-indigo-200 dark:border-indigo-800 bg-white dark:bg-zinc-900 text-indigo-900 dark:text-indigo-200 cursor-pointer"
		>
			<option value="">Priorité à tous…</option>
			<option value="1">P1 — Très faible</option>
			<option value="2">P2 — Faible</option>
			<option value="3">P3 — Moyenne</option>
			<option value="4">P4 — Haute</option>
			<option value="5">P5 — Critique</option>
		</select>
	</div>
</div>

<form
	method="POST"
	action="?/createBulk"
	use:enhance={() => {
		bulkLoading = true;
		return async ({ update }) => {
			await update();
			bulkLoading = false;
		};
	}}
>
	<input type="hidden" name="tickets" value={JSON.stringify(bulkItems)} />

	<div class="space-y-4">
		{#each bulkItems as item, idx (item.id)}
			<div class="bg-white dark:bg-zinc-900 rounded-xl border border-gray-200 dark:border-zinc-800 shadow-sm p-5 space-y-4 relative">
				<div class="flex items-center justify-between border-b border-gray-100 dark:border-zinc-800 pb-3">
					<span class="inline-flex items-center gap-2 text-sm font-bold text-gray-900 dark:text-white">
						<span class="w-6 h-6 rounded-full bg-indigo-600 text-white text-xs flex items-center justify-center font-mono">
							{idx + 1}
						</span>
						Ticket #{idx + 1}
					</span>

					{#if bulkItems.length > 1}
						<button
							type="button"
							onclick={() => removeBulkRow(idx)}
							class="text-xs text-red-500 hover:text-red-700 dark:hover:text-red-400 font-semibold flex items-center gap-1 transition-colors"
						>
							<svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2" aria-hidden="true">
								<path stroke-linecap="round" stroke-linejoin="round" d="m14.74 9-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 0 1-2.244 2.077H8.084a2.25 2.25 0 0 1-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 0 0-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 0 1 3.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 0 0-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 0 0-7.5 0" />
							</svg>
							Retirer
						</button>
					{/if}
				</div>

				{#if bulkRowErrors[idx]}
					<p class="text-xs text-red-500 font-medium" role="alert">{bulkRowErrors[idx]}</p>
				{/if}

				<div class="grid grid-cols-1 md:grid-cols-2 gap-4">
					<!-- Titre -->
					<div class="space-y-1 md:col-span-2">
						<label for="bulk-title-{idx}" class="text-xs font-semibold text-gray-700 dark:text-zinc-300">
							Titre <span class="text-red-500">*</span>
						</label>
						<input
							id="bulk-title-{idx}"
							type="text"
							bind:value={item.title}
							required
							placeholder="Ex: Problème d'impression bureau B102"
							class="w-full px-3 py-2 text-sm rounded-lg border border-gray-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 text-gray-900 dark:text-zinc-100 focus:ring-2 focus:ring-indigo-500 focus:outline-none"
						/>
					</div>

					<!-- Description -->
					<div class="space-y-1 md:col-span-2">
						<label for="bulk-desc-{idx}" class="text-xs font-semibold text-gray-700 dark:text-zinc-300">
							Description <span class="text-red-500">*</span>
						</label>
						<textarea
							id="bulk-desc-{idx}"
							bind:value={item.description}
							required
							rows="2"
							placeholder="Brève description du problème…"
							class="w-full px-3 py-2 text-sm rounded-lg border border-gray-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 text-gray-900 dark:text-zinc-100 focus:ring-2 focus:ring-indigo-500 focus:outline-none resize-none"
						></textarea>
					</div>

					<!-- Priorité -->
					<div class="space-y-1">
						<label for="bulk-prio-{idx}" class="text-xs font-semibold text-gray-700 dark:text-zinc-300">Priorité</label>
						<select
							id="bulk-prio-{idx}"
							bind:value={item.priority}
							class="w-full px-3 py-2 text-sm rounded-lg border border-gray-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 text-gray-800 dark:text-zinc-200 cursor-pointer"
						>
							<option value={1}>P1 — Très faible</option>
							<option value={2}>P2 — Faible</option>
							<option value={3}>P3 — Moyenne</option>
							<option value={4}>P4 — Haute</option>
							<option value={5}>P5 — Critique</option>
						</select>
					</div>

					<!-- Département -->
					<div class="space-y-1">
						<label for="bulk-dept-{idx}" class="text-xs font-semibold text-gray-700 dark:text-zinc-300">Département</label>
						<select
							id="bulk-dept-{idx}"
							bind:value={item.originDepartment}
							class="w-full px-3 py-2 text-sm rounded-lg border border-gray-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 text-gray-800 dark:text-zinc-200 cursor-pointer"
						>
							<option value="">Sélectionner…</option>
							{#each departments as dept}
								<option value={dept}>{dept}</option>
							{/each}
						</select>
					</div>

					<!-- Assigné à -->
					<div class="space-y-1 md:col-span-2">
						<label for="bulk-assigned-{idx}" class="text-xs font-semibold text-gray-700 dark:text-zinc-300">Assigné à</label>
						<select
							id="bulk-assigned-{idx}"
							bind:value={item.assignedTo}
							class="w-full px-3 py-2 text-sm rounded-lg border border-gray-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 text-gray-800 dark:text-zinc-200 cursor-pointer"
						>
							<option value="">Non assigné</option>
							{#each technicians as tech}
								<option value={tech._id}>{tech.name}</option>
							{/each}
						</select>
					</div>
				</div>
			</div>
		{/each}
	</div>

	<!-- Bouton ajouter un ticket -->
	<div class="mt-4">
		<button
			type="button"
			onclick={addBulkRow}
			id="btn-add-bulk-row"
			class="w-full py-3 border-2 border-dashed border-indigo-200 dark:border-indigo-900/60 hover:border-indigo-400 dark:hover:border-indigo-700 rounded-xl text-indigo-600 dark:text-indigo-400 font-semibold text-sm flex items-center justify-center gap-2 transition-colors bg-indigo-50/40 dark:bg-indigo-950/20"
		>
			<svg class="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2" aria-hidden="true">
				<path stroke-linecap="round" stroke-linejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
			</svg>
			Ajouter un autre ticket à la liste ({bulkItems.length} actuellement)
		</button>
	</div>

	<!-- Form Actions -->
	<div class="flex items-center justify-end gap-3 mt-6 pt-5 border-t border-gray-200 dark:border-zinc-800">
		<button
			type="submit"
			disabled={bulkLoading || bulkItems.length === 0}
			id="btn-submit-bulk-create"
			class="inline-flex items-center gap-2 px-6 py-2.5 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-semibold transition-colors duration-200 shadow-sm disabled:opacity-70 disabled:cursor-not-allowed"
		>
			{#if bulkLoading}
				<svg class="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24" aria-hidden="true">
					<circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
					<path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 0 1 8-8V0C5.373 0 0 5.373 0 12h4Z"></path>
				</svg>
				Création des tickets...
			{:else}
				<svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2.5" aria-hidden="true">
					<path stroke-linecap="round" stroke-linejoin="round" d="M9 12.75 11.25 15 15 9.75M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" />
				</svg>
				Créer les {bulkItems.length} tickets simultanément
			{/if}
		</button>
	</div>
</form>

{/if}

