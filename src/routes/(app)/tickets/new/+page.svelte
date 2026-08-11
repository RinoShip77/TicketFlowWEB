<script lang="ts">
	import { enhance } from '$app/forms';
	import type { ActionData, PageData } from './$types';

	interface Props {
		data: PageData;
		form: ActionData;
	}

	let { data, form }: Props = $props();

	const { technicians } = data;

	let loading = $state(false);
	let title = $state((form as any)?.title ?? '');
	let description = $state((form as any)?.description ?? '');
	let priority = $state((form as any)?.priority ?? '3');
	let originDepartment = $state((form as any)?.originDepartment ?? '');
	let assignedTo = $state((form as any)?.assignedTo ?? '');

	const fieldErrors = $derived(((form as any)?.errors as Record<string, string>) ?? {});
	const formError = $derived((form as any)?.formError as string | undefined);

	const priorityOptions = [
		{ value: '1', label: 'Très faible', color: '#0ea5e9' },
		{ value: '2', label: 'Faible', color: '#3b82f6' },
		{ value: '3', label: 'Moyenne', color: '#f59e0b' },
		{ value: '4', label: 'Haute', color: '#f97316' },
		{ value: '5', label: 'Critique', color: '#ef4444' }
	];

	const departments = [
		'TI', 'Ressources Humaines', 'Comptabilité',
		'Support Technique', 'Equipe de direction', 'Marketing', 'Finance'
	];

	const currentPriority = $derived(priorityOptions.find((p) => p.value === priority) ?? priorityOptions[2]);
</script>

<svelte:head>
	<title>Créer un ticket — TicketFlow</title>
	<meta name="description" content="Créer un nouveau ticket de support TicketFlow." />
</svelte:head>

<!-- Page header -->
<div class="flex items-center justify-between mb-6">
	<h2 class="text-2xl font-bold text-gray-900 dark:text-white">Créer un nouveau ticket</h2>
	<a
		href="/tickets"
		class="inline-flex items-center gap-2 px-4 py-2.5 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-semibold transition-colors duration-200 shadow-sm"
	>
		<svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2.5" aria-hidden="true">
			<path stroke-linecap="round" stroke-linejoin="round" d="M6 18 18 6M6 6l12 12" />
		</svg>
		Cancel
	</a>
</div>

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
			Sauvegarder Brouillon
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
				Création...
			{:else}
				<svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2.5" aria-hidden="true">
					<path stroke-linecap="round" stroke-linejoin="round" d="M9 12.75 11.25 15 15 9.75M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" />
				</svg>
				Créer le ticket
			{/if}
		</button>
	</div>
</form>
