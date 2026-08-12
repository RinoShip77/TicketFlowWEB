<script lang="ts">
	import { enhance } from '$app/forms';
	import type { ActionData, PageData } from './$types';

	interface Props {
		data: PageData;
		form: ActionData;
	}

	let { data, form }: Props = $props();

	let creationMode = $state<'single' | 'bulk'>('single');

	// ── Mode création multiple (lot) ──────────────────────────────────
	interface BulkMemberItem {
		id: string;
		name: string;
		email: string;
		level: number;
		password: string;
	}

	let bulkItems = $state<BulkMemberItem[]>([
		{ id: '1', name: '', email: '', level: 1, password: '' },
		{ id: '2', name: '', email: '', level: 1, password: '' }
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
			{ id: String(Date.now()), name: '', email: '', level: 1, password: '' }
		];
	}

	function removeBulkRow(index: number) {
		if (bulkItems.length > 1) {
			bulkItems = bulkItems.filter((_, i) => i !== index);
		}
	}

	function setAllBulkLevel(level: number) {
		bulkItems = bulkItems.map((item) => ({ ...item, level }));
	}

	function setAllBulkPassword(pwd: string) {
		if (!pwd) return;
		bulkItems = bulkItems.map((item) => ({ ...item, password: pwd }));
	}

	// ── Mode création unique ─────────────────────────────────────────
	let loading = $state(false);
	let name = $state((form as any)?.name ?? '');
	let email = $state((form as any)?.email ?? '');
	let level = $state((form as any)?.level ?? '1');
	let password = $state('');
	let confirmPassword = $state('');

	const fieldErrors = $derived<Record<string, string>>(
		((form as any)?.action === 'createSingle' || !(form as any)?.action)
			? (((form as any)?.errors as Record<string, string>) ?? {})
			: {}
	);
	const formError = $derived<string | undefined>(
		((form as any)?.action === 'createSingle' || !(form as any)?.action)
			? ((form as any)?.formError as string | undefined)
			: undefined
	);

	const levelOptions = [
		{ value: '1', label: 'L1 — Junior (Technicien)', color: '#0ea5e9', role: 'Technician' },
		{ value: '2', label: 'L2 — Senior (Technicien)', color: '#6366f1', role: 'Technician' },
		{ value: '3', label: 'L3 — Admin (Administrateur)', color: '#a855f7', role: 'Admin' }
	];

	const currentLevel = $derived(levelOptions.find((l) => l.value === level) ?? levelOptions[0]);
</script>

<svelte:head>
	<title>Ajouter un membre — TicketFlow</title>
	<meta name="description" content="Créer un ou plusieurs comptes de techniciens TicketFlow." />
</svelte:head>

<!-- Page Header -->
<div class="flex flex-wrap items-center justify-between gap-4 mb-6">
	<div>
		<h2 class="text-2xl font-bold text-gray-900 dark:text-white">Ajouter un membre de l'équipe</h2>
		<p class="text-xs text-gray-500 dark:text-zinc-400 mt-0.5">Créez un profil individuel ou plusieurs comptes techniciens en lot.</p>
	</div>

	<a
		href="/team-members"
		class="inline-flex items-center gap-2 px-4 py-2.5 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-semibold transition-colors duration-200 shadow-sm"
	>
		<svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2.5" aria-hidden="true">
			<path stroke-linecap="round" stroke-linejoin="round" d="M6 18 18 6M6 6l12 12" />
		</svg>
		Annuler
	</a>
</div>

<!-- ── Mode Switcher Tab ──────────────────────────────────────────────── -->
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
			<path stroke-linecap="round" stroke-linejoin="round" d="M15.75 6a3.75 3.75 0 1 1-7.5 0 3.75 3.75 0 0 1 7.5 0ZM4.501 20.118a7.5 7.5 0 0 1 14.998 0" />
		</svg>
		Membre unique
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
			<path stroke-linecap="round" stroke-linejoin="round" d="M18 7.5v3m0 0v3m0-3h3m-3 0h-3m-2.25-4.125a3.375 3.375 0 1 1-6.75 0 3.375 3.375 0 0 1 6.75 0ZM3 19.235v-.11a6.375 6.375 0 0 1 12.75 0v.109A12.318 12.318 0 0 1 9.374 21c-2.331 0-4.512-.645-6.374-1.766Z" />
		</svg>
		Lot de membres
	</button>
</div>

<!-- ══ MODE MEMBRE UNIQUE ═════════════════════════════════════════════ -->
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
				<h3 class="text-sm font-semibold text-gray-800 dark:text-zinc-200 pb-2 border-b border-gray-100 dark:border-zinc-800">Informations du profil</h3>

				<!-- Nom complet -->
				<div class="space-y-1.5">
					<label for="name" class="text-sm font-medium text-gray-700 dark:text-zinc-300">
						Nom complet <span class="text-red-500" aria-hidden="true">*</span>
					</label>
					<div class="relative">
						<svg class="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 dark:text-zinc-500 pointer-events-none" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="1.75" aria-hidden="true">
							<path stroke-linecap="round" stroke-linejoin="round" d="M15.75 6a3.75 3.75 0 1 1-7.5 0 3.75 3.75 0 0 1 7.5 0ZM4.501 20.118a7.5 7.5 0 0 1 14.998 0" />
						</svg>
						<input
							id="name"
							name="name"
							type="text"
							bind:value={name}
							required
							placeholder="Ex: Jean Tremblay"
							aria-invalid={!!fieldErrors.name}
							class="w-full pl-9 pr-3.5 py-2.5 text-sm rounded-lg border transition-colors
								{fieldErrors.name ? 'border-red-400 focus:ring-red-400' : 'border-gray-200 dark:border-zinc-700 hover:border-gray-300 dark:hover:border-zinc-600 focus:ring-indigo-500'}
								bg-white dark:bg-zinc-900 text-gray-900 dark:text-zinc-100 placeholder:text-gray-400 dark:placeholder:text-zinc-500 focus:outline-none focus:ring-2 focus:border-transparent"
						/>
					</div>
					{#if fieldErrors.name}
						<p class="text-xs text-red-500" role="alert">{fieldErrors.name}</p>
					{/if}
				</div>

				<!-- Adresse email -->
				<div class="space-y-1.5">
					<label for="email" class="text-sm font-medium text-gray-700 dark:text-zinc-300">
						Adresse email <span class="text-red-500" aria-hidden="true">*</span>
					</label>
					<div class="relative">
						<svg class="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 dark:text-zinc-500 pointer-events-none" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="1.75" aria-hidden="true">
							<path stroke-linecap="round" stroke-linejoin="round" d="M21.75 6.75v10.5a2.25 2.25 0 0 1-2.25 2.25h-15a2.25 2.25 0 0 1-2.25-2.25V6.75m19.5 0A2.25 2.25 0 0 0 19.5 4.5h-15a2.25 2.25 0 0 0-2.25 2.25m19.5 0v.243a2.25 2.25 0 0 1-1.07 1.916l-7.5 4.615a2.25 2.25 0 0 1-2.36 0L3.32 8.91a2.25 2.25 0 0 1-1.07-1.916V6.75" />
						</svg>
						<input
							id="email"
							name="email"
							type="email"
							bind:value={email}
							required
							placeholder="jean.tremblay@company.com"
							aria-invalid={!!fieldErrors.email}
							class="w-full pl-9 pr-3.5 py-2.5 text-sm rounded-lg border transition-colors
								{fieldErrors.email ? 'border-red-400 focus:ring-red-400' : 'border-gray-200 dark:border-zinc-700 hover:border-gray-300 dark:hover:border-zinc-600 focus:ring-indigo-500'}
								bg-white dark:bg-zinc-900 text-gray-900 dark:text-zinc-100 placeholder:text-gray-400 dark:placeholder:text-zinc-500 focus:outline-none focus:ring-2 focus:border-transparent"
						/>
					</div>
					{#if fieldErrors.email}
						<p class="text-xs text-red-500" role="alert">{fieldErrors.email}</p>
					{/if}
				</div>
			</div>

			<!-- Section: Sécurité & Niveau d'accès -->
			<div class="bg-white dark:bg-zinc-900 rounded-xl border border-gray-200 dark:border-zinc-800 shadow-sm p-5 space-y-4 transition-colors">
				<h3 class="text-sm font-semibold text-gray-800 dark:text-zinc-200 pb-2 border-b border-gray-100 dark:border-zinc-800">Sécurité & Niveau d'accès</h3>

				<!-- Mot de passe -->
				<div class="space-y-1.5">
					<label for="password" class="text-sm font-medium text-gray-700 dark:text-zinc-300">
						Mot de passe initial <span class="text-red-500" aria-hidden="true">*</span>
					</label>
					<div class="relative">
						<svg class="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 dark:text-zinc-500 pointer-events-none" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="1.75" aria-hidden="true">
							<path stroke-linecap="round" stroke-linejoin="round" d="M16.5 10.5V6.75a4.5 4.5 0 1 0-9 0v3.75m-.75 11.25h10.5a2.25 2.25 0 0 0 2.25-2.25v-6.75a2.25 2.25 0 0 0-2.25-2.25H6.75a2.25 2.25 0 0 0-2.25 2.25v6.75a2.25 2.25 0 0 0 2.25 2.25Z" />
						</svg>
						<input
							id="password"
							name="password"
							type="password"
							bind:value={password}
							required
							placeholder="•••••••• (min 8 caractères)"
							aria-invalid={!!fieldErrors.password}
							class="w-full pl-9 pr-3.5 py-2.5 text-sm rounded-lg border transition-colors
								{fieldErrors.password ? 'border-red-400 focus:ring-red-400' : 'border-gray-200 dark:border-zinc-700 hover:border-gray-300 dark:hover:border-zinc-600 focus:ring-indigo-500'}
								bg-white dark:bg-zinc-900 text-gray-900 dark:text-zinc-100 placeholder:text-gray-400 dark:placeholder:text-zinc-500 focus:outline-none focus:ring-2 focus:border-transparent"
						/>
					</div>
					{#if fieldErrors.password}
						<p class="text-xs text-red-500" role="alert">{fieldErrors.password}</p>
					{/if}
				</div>

				<!-- Confirmation mot de passe -->
				<div class="space-y-1.5">
					<label for="confirmPassword" class="text-sm font-medium text-gray-700 dark:text-zinc-300">
						Confirmer le mot de passe <span class="text-red-500" aria-hidden="true">*</span>
					</label>
					<div class="relative">
						<svg class="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 dark:text-zinc-500 pointer-events-none" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="1.75" aria-hidden="true">
							<path stroke-linecap="round" stroke-linejoin="round" d="M9 12.75 11.25 15 15 9.75m-6 9a9 9 0 1 1 0-18 9 9 0 0 1 0 18Z" />
						</svg>
						<input
							id="confirmPassword"
							name="confirmPassword"
							type="password"
							bind:value={confirmPassword}
							required
							placeholder="Répétez le mot de passe"
							aria-invalid={!!fieldErrors.confirmPassword}
							class="w-full pl-9 pr-3.5 py-2.5 text-sm rounded-lg border transition-colors
								{fieldErrors.confirmPassword ? 'border-red-400 focus:ring-red-400' : 'border-gray-200 dark:border-zinc-700 hover:border-gray-300 dark:hover:border-zinc-600 focus:ring-indigo-500'}
								bg-white dark:bg-zinc-900 text-gray-900 dark:text-zinc-100 placeholder:text-gray-400 dark:placeholder:text-zinc-500 focus:outline-none focus:ring-2 focus:border-transparent"
						/>
					</div>
					{#if fieldErrors.confirmPassword}
						<p class="text-xs text-red-500" role="alert">{fieldErrors.confirmPassword}</p>
					{/if}
				</div>

				<!-- Niveau d'accès dropdown -->
				<div class="space-y-1.5 pt-2">
					<label for="level" class="text-sm font-medium text-gray-700 dark:text-zinc-300">
						Niveau d'accès <span class="text-red-500" aria-hidden="true">*</span>
					</label>
					<div class="relative">
						<span
							class="absolute left-3 top-1/2 -translate-y-1/2 w-3 h-3 rounded-full pointer-events-none"
							style="background: {currentLevel.color}"
							aria-hidden="true"
						></span>
						<select
							id="level"
							name="level"
							bind:value={level}
							aria-invalid={!!fieldErrors.level}
							class="w-full pl-8 pr-8 py-2.5 text-sm rounded-lg border focus:outline-none focus:ring-2 focus:ring-indigo-500 text-gray-800 dark:text-zinc-200 bg-white dark:bg-zinc-900 appearance-none cursor-pointer
								{fieldErrors.level ? 'border-red-400' : 'border-gray-200 dark:border-zinc-700'}"
						>
							{#each levelOptions as l}
								<option value={l.value}>{l.label}</option>
							{/each}
						</select>
						<svg class="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 dark:text-zinc-500 pointer-events-none" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2" aria-hidden="true">
							<path stroke-linecap="round" stroke-linejoin="round" d="m19.5 8.25-7.5 7.5-7.5-7.5" />
						</svg>
					</div>
					{#if fieldErrors.level}
						<p class="text-xs text-red-500" role="alert">{fieldErrors.level}</p>
					{/if}
				</div>

				<!-- Level chips preview -->
				<div class="flex flex-wrap gap-2 pt-1">
					{#each levelOptions as l}
						{@const isSelected = level === l.value}
						<label
							class="flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium cursor-pointer border transition-all duration-150
								{isSelected
									? 'bg-indigo-50 dark:bg-indigo-950/60 border-indigo-500 text-indigo-700 dark:text-indigo-300 font-semibold'
									: 'bg-gray-50 dark:bg-zinc-800/60 border-gray-200 dark:border-zinc-700 text-gray-600 dark:text-zinc-400 hover:border-gray-300 dark:hover:border-zinc-600'}"
						>
							<input type="radio" name="level" value={l.value} bind:group={level} class="sr-only" />
							<span class="w-2 h-2 rounded-full" style="background: {l.color}" aria-hidden="true"></span>
							L{l.value} ({l.role})
						</label>
					{/each}
				</div>
			</div>

		</div>

		<!-- ══ RIGHT COLUMN ═════════════════════════════════════════════ -->
		<div class="space-y-5">

			<!-- Section: Attribution du rôle -->
			<div class="bg-white dark:bg-zinc-900 rounded-xl border border-gray-200 dark:border-zinc-800 shadow-sm p-5 space-y-4 transition-colors">
				<h3 class="text-sm font-semibold text-gray-800 dark:text-zinc-200 pb-2 border-b border-gray-100 dark:border-zinc-800">Attribution du rôle</h3>

				<div class="p-3.5 rounded-lg bg-gray-50 dark:bg-zinc-800/50 border border-gray-200 dark:border-zinc-700/60 space-y-2">
					<div class="flex justify-between items-center text-sm">
						<span class="text-xs text-gray-500 dark:text-zinc-400 uppercase tracking-wider">Rôle système</span>
						<span class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold
							{currentLevel.role === 'Admin'
								? 'bg-purple-100 dark:bg-purple-950/70 text-purple-700 dark:text-purple-300'
								: 'bg-indigo-100 dark:bg-indigo-950/70 text-indigo-700 dark:text-indigo-300'}">
							{currentLevel.role}
						</span>
					</div>
					<div class="flex justify-between items-center text-sm">
						<span class="text-xs text-gray-500 dark:text-zinc-400 uppercase tracking-wider">Statut initial</span>
						<span class="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium bg-emerald-100 dark:bg-emerald-950/70 text-emerald-600 dark:text-emerald-400">
							<span class="w-1.5 h-1.5 rounded-full bg-emerald-500" aria-hidden="true"></span>
							Active
						</span>
					</div>
				</div>
			</div>

			<!-- Section: Récapitulatif -->
			<div class="bg-indigo-50 dark:bg-indigo-950/40 rounded-xl border border-indigo-100 dark:border-indigo-900/50 p-5 space-y-3 transition-colors">
				<h3 class="text-sm font-semibold text-indigo-700 dark:text-indigo-300 flex items-center gap-2">
					<svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2" aria-hidden="true">
						<path stroke-linecap="round" stroke-linejoin="round" d="m11.25 11.25.041-.02a.75.75 0 0 1 1.063.852l-.708 2.836a.75.75 0 0 0 1.063.853l.041-.021M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Zm-9-3.75h.008v.008H12V8.25Z" />
					</svg>
					Récapitulatif du nouveau membre
				</h3>
				<div class="space-y-2 text-xs text-indigo-700 dark:text-indigo-300">
					<div class="flex items-center gap-2">
						<svg class="w-3.5 h-3.5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2" aria-hidden="true">
							<path stroke-linecap="round" stroke-linejoin="round" d="M15.75 6a3.75 3.75 0 1 1-7.5 0 3.75 3.75 0 0 1 7.5 0ZM4.501 20.118a7.5 7.5 0 0 1 14.998 0" />
						</svg>
						Nom : <strong>{name || 'Non spécifié'}</strong>
					</div>
					<div class="flex items-center gap-2">
						<svg class="w-3.5 h-3.5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2" aria-hidden="true">
							<path stroke-linecap="round" stroke-linejoin="round" d="M21.75 6.75v10.5a2.25 2.25 0 0 1-2.25 2.25h-15a2.25 2.25 0 0 1-2.25-2.25V6.75" />
						</svg>
						Email : <strong>{email || 'Non spécifié'}</strong>
					</div>
					<div class="flex items-center gap-2">
						<span class="w-3.5 h-3.5 rounded-full shrink-0" style="background: {currentLevel.color}"></span>
						Niveau : <strong>L{level} — {currentLevel.role}</strong>
					</div>
				</div>
			</div>

		</div>
	</div>

	<!-- ── Form Actions ─────────────────────────────────────────────── -->
	<div class="flex items-center justify-end gap-3 mt-6 pt-5 border-t border-gray-200 dark:border-zinc-800">
		<a
			href="/team-members"
			class="px-5 py-2.5 text-sm font-semibold rounded-lg text-gray-700 dark:text-zinc-300 border border-gray-300 dark:border-zinc-700 hover:bg-gray-100 dark:hover:bg-zinc-800 transition-colors duration-150"
		>
			Annuler
		</a>
		<button
			type="submit"
			disabled={loading}
			id="btn-submit-single-member"
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
				Créer le membre
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
		Actions rapides globales (Appliquer à tous les membres ci-dessous)
	</h3>
	<div class="flex flex-wrap items-center gap-3">
		<!-- Appliquer Niveau -->
		<select
			onchange={(e) => setAllBulkLevel(Number((e.target as HTMLSelectElement).value))}
			class="text-xs font-medium px-3 py-1.5 rounded-lg border border-indigo-200 dark:border-indigo-800 bg-white dark:bg-zinc-900 text-indigo-900 dark:text-indigo-200 cursor-pointer"
		>
			<option value="1">Niveau à tous : L1 Junior</option>
			<option value="2">Niveau à tous : L2 Senior</option>
			<option value="3">Niveau à tous : L3 Admin</option>
		</select>

		<!-- Appliquer Mot de passe commun -->
		<div class="flex items-center gap-2">
			<input
				type="password"
				id="bulk-common-pwd"
				placeholder="Mot de passe commun…"
				class="text-xs px-3 py-1.5 rounded-lg border border-indigo-200 dark:border-indigo-800 bg-white dark:bg-zinc-900 text-indigo-900 dark:text-indigo-200"
			/>
			<button
				type="button"
				onclick={() => {
					const el = document.getElementById('bulk-common-pwd') as HTMLInputElement;
					if (el?.value) setAllBulkPassword(el.value);
				}}
				class="text-xs font-semibold px-3 py-1.5 rounded-lg bg-indigo-600 text-white hover:bg-indigo-700 transition-colors"
			>
				Appliquer mot de passe à tous
			</button>
		</div>
	</div>
</div>

<!-- Formulaire Lot -->
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
	<!-- Champ caché contenant le JSON serialisé -->
	<input type="hidden" name="members" value={JSON.stringify(bulkItems)} />

	<div class="space-y-4">
		{#each bulkItems as item, index (item.id)}
			<div class="bg-white dark:bg-zinc-900 rounded-xl border border-gray-200 dark:border-zinc-800 shadow-sm p-4 space-y-3 transition-colors">
				<div class="flex items-center justify-between">
					<span class="text-xs font-bold text-gray-500 dark:text-zinc-400">Membre #{index + 1}</span>
					{#if bulkItems.length > 1}
						<button
							type="button"
							onclick={() => removeBulkRow(index)}
							class="text-xs text-red-500 hover:text-red-700 dark:hover:text-red-400 transition-colors flex items-center gap-1"
						>
							<svg class="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2" aria-hidden="true">
								<path stroke-linecap="round" stroke-linejoin="round" d="M6 18 18 6M6 6l12 12" />
							</svg>
							Supprimer
						</button>
					{/if}
				</div>

				{#if bulkRowErrors[index]}
					<p class="text-xs text-red-500 font-medium" role="alert">{bulkRowErrors[index]}</p>
				{/if}

				<div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
					<!-- Nom complet -->
					<div>
						<label for="bulk-name-{index}" class="text-xs font-medium text-gray-700 dark:text-zinc-300 block mb-1">Nom complet</label>
						<input
							id="bulk-name-{index}"
							type="text"
							bind:value={item.name}
							placeholder="Ex: Sophie Martin"
							required
							class="w-full px-3 py-1.5 text-xs rounded-lg border border-gray-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 text-gray-900 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-indigo-500"
						/>
					</div>

					<!-- Email -->
					<div>
						<label for="bulk-email-{index}" class="text-xs font-medium text-gray-700 dark:text-zinc-300 block mb-1">Email</label>
						<input
							id="bulk-email-{index}"
							type="email"
							bind:value={item.email}
							placeholder="sophie@company.com"
							required
							class="w-full px-3 py-1.5 text-xs rounded-lg border border-gray-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 text-gray-900 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-indigo-500"
						/>
					</div>

					<!-- Niveau -->
					<div>
						<label for="bulk-level-{index}" class="text-xs font-medium text-gray-700 dark:text-zinc-300 block mb-1">Niveau d'accès</label>
						<select
							id="bulk-level-{index}"
							bind:value={item.level}
							class="w-full px-3 py-1.5 text-xs rounded-lg border border-gray-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 text-gray-800 dark:text-zinc-200 focus:outline-none focus:ring-2 focus:ring-indigo-500"
						>
							<option value={1}>L1 — Junior (Technician)</option>
							<option value={2}>L2 — Senior (Technician)</option>
							<option value={3}>L3 — Admin (Admin)</option>
						</select>
					</div>

					<!-- Mot de passe -->
					<div>
						<label for="bulk-password-{index}" class="text-xs font-medium text-gray-700 dark:text-zinc-300 block mb-1">Mot de passe initial</label>
						<input
							id="bulk-password-{index}"
							type="password"
							bind:value={item.password}
							placeholder="Min. 8 car."
							required
							class="w-full px-3 py-1.5 text-xs rounded-lg border border-gray-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 text-gray-900 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-indigo-500"
						/>
					</div>
				</div>
			</div>
		{/each}
	</div>

	<!-- Ajouter un membre + Soumettre -->
	<div class="flex flex-wrap items-center justify-between gap-4 mt-6 pt-5 border-t border-gray-200 dark:border-zinc-800">
		<button
			type="button"
			onclick={addBulkRow}
			class="inline-flex items-center gap-1.5 px-4 py-2 text-sm font-semibold rounded-lg text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-950/40 hover:bg-indigo-100 dark:hover:bg-indigo-900/60 transition-colors"
		>
			<svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2.5" aria-hidden="true">
				<path stroke-linecap="round" stroke-linejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
			</svg>
			Ajouter un autre membre
		</button>

		<div class="flex items-center gap-3">
			<a
				href="/team-members"
				class="px-5 py-2.5 text-sm font-semibold rounded-lg text-gray-700 dark:text-zinc-300 border border-gray-300 dark:border-zinc-700 hover:bg-gray-100 dark:hover:bg-zinc-800 transition-colors duration-150"
			>
				Annuler
			</a>
			<button
				type="submit"
				disabled={bulkLoading}
				id="btn-submit-bulk-members"
				class="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-semibold transition-colors duration-200 shadow-sm disabled:opacity-70 disabled:cursor-not-allowed"
			>
				{#if bulkLoading}
					<svg class="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24" aria-hidden="true">
						<circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
						<path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 0 1 8-8V0C5.373 0 0 5.373 0 12h4Z"></path>
					</svg>
					Création en lot...
				{:else}
					<svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2.5" aria-hidden="true">
						<path stroke-linecap="round" stroke-linejoin="round" d="M9 12.75 11.25 15 15 9.75M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" />
					</svg>
					Créer les {bulkItems.length} membres
				{/if}
			</button>
		</div>
	</div>
</form>

{/if}
