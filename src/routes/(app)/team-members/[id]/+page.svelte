<script lang="ts">
	import { enhance } from '$app/forms';
	import type { ActionData, PageData } from './$types';

	interface Props {
		data: PageData;
		form: ActionData;
	}

	let { data, form }: Props = $props();

	// ── Données réactives ─────────────────────────────────────────────
	const member = $derived(data.member);

	// ── États locaux du formulaire d'édition ─────────────────────────
	let editName  = $state(data.member.name);
	let editEmail = $state(data.member.email);
	let editLevel = $state(String(data.member.level));

	// Sync quand le load recharge après une action
	$effect(() => {
		editName  = data.member.name;
		editEmail = data.member.email;
		editLevel = String(data.member.level);
	});

	// ── États UI ─────────────────────────────────────────────────────
	let nameEditing        = $state(false);
	let loadingUpdate      = $state(false);
	let updateSuccess      = $state(false);
	let updateSuccessTimer: ReturnType<typeof setTimeout>;
	let isDeletingModalOpen = $state(false);
	let isDeleting          = $state(false);

	// ── Feedback des actions ─────────────────────────────────────────
	const updateErrors = $derived(
		(form as any)?.action === 'updateMember'
			? ((form as any)?.errors as Record<string, string> ?? {})
			: {}
	);
	const updateFormError = $derived(
		(form as any)?.action === 'updateMember'
			? (form as any)?.formError as string | undefined
			: undefined
	);

	$effect(() => {
		if ((form as any)?.action === 'updateMember' && (form as any)?.success) {
			updateSuccess = true;
			clearTimeout(updateSuccessTimer);
			updateSuccessTimer = setTimeout(() => { updateSuccess = false; }, 3000);
		}
	});

	// ── Helpers visuels ──────────────────────────────────────────────
	const levelConfig: Record<number, { label: string; color: string; ring: string }> = {
		1: { label: 'Junior',   color: 'text-sky-600 dark:text-sky-400',    ring: 'ring-sky-400' },
		2: { label: 'Senior',   color: 'text-indigo-600 dark:text-indigo-400', ring: 'ring-indigo-400' },
		3: { label: 'Admin',    color: 'text-purple-600 dark:text-purple-400', ring: 'ring-purple-400' }
	};

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
		for (let i = 0; i < name.length; i++) h = (h * 31 + name.charCodeAt(i)) % avatarStyles.length;
		return avatarStyles[Math.abs(h)];
	}

	function getInitials(name: string): string {
		const parts = name.trim().split(' ');
		if (parts.length >= 2) return (parts[0][0] + parts[1][0]).toUpperCase();
		return name.slice(0, 2).toUpperCase();
	}

	function formatDate(iso: string): string {
		return new Intl.DateTimeFormat('fr-CA', {
			day: '2-digit', month: 'short', year: 'numeric'
		}).format(new Date(iso));
	}

	const memberShortId = $derived(`#${(member._id ?? member.id ?? '??????').slice(-6).toUpperCase()}`);
	const lc = $derived(levelConfig[member.level] ?? levelConfig[1]);
</script>

<svelte:head>
	<title>{member.name} — Team Members — TicketFlow</title>
	<meta name="description" content="Profil du technicien {member.name}, {member.email}" />
</svelte:head>

<!-- ── Breadcrumb ───────────────────────────────────────────────────── -->
<nav class="flex items-center gap-2 text-sm text-gray-400 dark:text-zinc-500 mb-5" aria-label="Fil d'Ariane">
	<a href="/team-members" class="hover:text-gray-700 dark:hover:text-zinc-200 transition-colors">Team Members</a>
	<svg class="w-3 h-3 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2.5" aria-hidden="true">
		<path stroke-linecap="round" stroke-linejoin="round" d="m8.25 4.5 7.5 7.5-7.5 7.5" />
	</svg>
	<span class="text-gray-600 dark:text-zinc-300 truncate max-w-[200px]">{member.name}</span>
</nav>

<!-- ── Layout 2 colonnes ────────────────────────────────────────────── -->
<div class="grid grid-cols-1 lg:grid-cols-3 gap-6">

	<!-- ══ COLONNE GAUCHE (2/3) ═════════════════════════════════════════ -->
	<div class="lg:col-span-2 space-y-5">

		<!-- ── Avatar + Nom éditable ──────────────────────────────────── -->
		<div class="bg-white dark:bg-zinc-900 rounded-xl border border-gray-200 dark:border-zinc-800 shadow-sm p-5 transition-colors">
			<div class="flex items-start gap-4">
				<!-- Avatar grand format -->
				<div class="w-16 h-16 rounded-2xl {getAvatarStyle(member.name)} flex items-center justify-center shrink-0 font-bold text-xl shadow-sm">
					{getInitials(member.name)}
				</div>

				<div class="flex-1 min-w-0">
					<!-- Nom éditable inline -->
					{#if nameEditing}
						<form
							method="POST"
							action="?/updateMember"
							use:enhance={() => {
								loadingUpdate = true;
								return async ({ update }) => { await update(); loadingUpdate = false; nameEditing = false; };
							}}
							class="flex items-center gap-2"
						>
							<input
								name="name"
								type="text"
								bind:value={editName}
								class="flex-1 text-xl font-bold bg-transparent border-b-2 border-indigo-500 focus:outline-none text-gray-900 dark:text-white pb-0.5"
								aria-label="Modifier le nom"
							/>
							<input type="hidden" name="email" value={editEmail} />
							<input type="hidden" name="level" value={editLevel} />

							<button type="submit" disabled={loadingUpdate}
								class="px-3 py-1 text-xs font-semibold rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white transition-colors disabled:opacity-50 shrink-0">
								{loadingUpdate ? '…' : 'OK'}
							</button>
							<button type="button" onclick={() => { nameEditing = false; editName = member.name; }}
								class="px-3 py-1 text-xs font-medium rounded-lg text-gray-500 dark:text-zinc-400 hover:bg-gray-100 dark:hover:bg-zinc-800 transition-colors shrink-0">
								Annuler
							</button>
						</form>
					{:else}
						<div class="flex items-start gap-2 group">
							<h1 class="text-xl font-bold text-gray-900 dark:text-white leading-snug flex-1">
								{member.name}
							</h1>
							<button
								onclick={() => nameEditing = true}
								class="opacity-0 group-hover:opacity-100 focus:opacity-100 p-1 rounded-md text-gray-400 dark:text-zinc-500 hover:text-indigo-600 dark:hover:text-indigo-400 hover:bg-gray-100 dark:hover:bg-zinc-800 transition-all shrink-0"
								aria-label="Modifier le nom"
							>
								<svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="1.75" aria-hidden="true">
									<path stroke-linecap="round" stroke-linejoin="round" d="m16.862 4.487 1.687-1.688a1.875 1.875 0 1 1 2.652 2.652L10.582 16.07a4.5 4.5 0 0 1-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 0 1 1.13-1.897l8.932-8.931Z" />
								</svg>
							</button>
						</div>
					{/if}

					{#if updateErrors?.name}
						<p class="text-xs text-red-500 mt-1" role="alert">{updateErrors.name}</p>
					{/if}

					<!-- Méta sous le nom -->
					<div class="flex flex-wrap items-center gap-x-4 gap-y-1 mt-2 text-xs text-gray-400 dark:text-zinc-500">
						<span class="flex items-center gap-1">
							<svg class="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2" aria-hidden="true">
								<path stroke-linecap="round" stroke-linejoin="round" d="M21.75 6.75v10.5a2.25 2.25 0 0 1-2.25 2.25h-15a2.25 2.25 0 0 1-2.25-2.25V6.75m19.5 0A2.25 2.25 0 0 0 19.5 4.5h-15a2.25 2.25 0 0 0-2.25 2.25m19.5 0v.243a2.25 2.25 0 0 1-1.07 1.916l-7.5 4.615a2.25 2.25 0 0 1-2.36 0L3.32 8.91a2.25 2.25 0 0 1-1.07-1.916V6.75" />
							</svg>
							{member.email}
						</span>
						<span class="flex items-center gap-1">
							<svg class="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2" aria-hidden="true">
								<path stroke-linecap="round" stroke-linejoin="round" d="M2.25 21h19.5m-18-18v18m10.5-18v18m6-13.5V21M6.75 6.75h.75m-.75 3h.75m-.75 3h.75m3-6h.75m-.75 3h.75m-.75 3h.75M6.75 21v-3.375c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125V21" />
							</svg>
							{member.department}
						</span>
					</div>
				</div>
			</div>
		</div>

		<!-- ── Formulaire d'édition complet ─────────────────────────── -->
		<div class="bg-white dark:bg-zinc-900 rounded-xl border border-gray-200 dark:border-zinc-800 shadow-sm p-5 space-y-4 transition-colors">
			<h2 class="text-sm font-semibold text-gray-800 dark:text-zinc-200 pb-2 border-b border-gray-100 dark:border-zinc-800">
				Informations du profil
			</h2>

			<form
				method="POST"
				action="?/updateMember"
				use:enhance={() => {
					loadingUpdate = true;
					return async ({ update }) => { await update(); loadingUpdate = false; };
				}}
				class="space-y-4"
			>
				<!-- Nom complet -->
				<div class="space-y-1.5">
					<label for="edit-name" class="text-xs font-medium text-gray-500 dark:text-zinc-400 uppercase tracking-wider">
						Nom complet
					</label>
					<input
						id="edit-name"
						name="name"
						type="text"
						bind:value={editName}
						aria-invalid={!!updateErrors?.name}
						class="w-full px-3.5 py-2.5 text-sm rounded-lg border transition-colors
							{updateErrors?.name
								? 'border-red-400 focus:ring-red-400'
								: 'border-gray-200 dark:border-zinc-700 hover:border-gray-300 dark:hover:border-zinc-600 focus:ring-indigo-500'}
							bg-white dark:bg-zinc-900 text-gray-800 dark:text-zinc-200
							focus:outline-none focus:ring-2 focus:border-transparent"
					/>
					{#if updateErrors?.name}
						<p class="text-xs text-red-500" role="alert">{updateErrors.name}</p>
					{/if}
				</div>

				<!-- Email -->
				<div class="space-y-1.5">
					<label for="edit-email" class="text-xs font-medium text-gray-500 dark:text-zinc-400 uppercase tracking-wider">
						Adresse e-mail
					</label>
					<input
						id="edit-email"
						name="email"
						type="email"
						bind:value={editEmail}
						aria-invalid={!!updateErrors?.email}
						class="w-full px-3.5 py-2.5 text-sm rounded-lg border transition-colors
							{updateErrors?.email
								? 'border-red-400 focus:ring-red-400'
								: 'border-gray-200 dark:border-zinc-700 hover:border-gray-300 dark:hover:border-zinc-600 focus:ring-indigo-500'}
							bg-white dark:bg-zinc-900 text-gray-800 dark:text-zinc-200
							focus:outline-none focus:ring-2 focus:border-transparent"
					/>
					{#if updateErrors?.email}
						<p class="text-xs text-red-500" role="alert">{updateErrors.email}</p>
					{/if}
				</div>

				<!-- Niveau (1 = Junior, 2 = Senior, 3 = Admin) -->
				<div class="space-y-1.5">
					<span class="text-xs font-medium text-gray-500 dark:text-zinc-400 uppercase tracking-wider block">
						Niveau d'accès
					</span>
					<input type="hidden" name="level" value={editLevel} />
					<div class="flex gap-2" role="group" aria-label="Sélection du niveau">
						{#each [1, 2, 3] as lvl}
							{@const lconf = levelConfig[lvl]}
							<button
								type="button"
								onclick={() => editLevel = String(lvl)}
								class="flex-1 py-2 text-sm font-semibold rounded-lg border-2 transition-all duration-100
									{editLevel === String(lvl)
										? `${lconf.ring} ring-2 ring-offset-1 dark:ring-offset-zinc-900 bg-white dark:bg-zinc-800 ${lconf.color}`
										: 'border-gray-200 dark:border-zinc-700 text-gray-400 dark:text-zinc-500 hover:border-gray-300 dark:hover:border-zinc-600'}"
								aria-pressed={editLevel === String(lvl)}
								aria-label="Niveau {lvl} — {lconf.label}"
							>
								L{lvl} — {lconf.label}
							</button>
						{/each}
					</div>
					{#if updateErrors?.level}
						<p class="text-xs text-red-500" role="alert">{updateErrors.level}</p>
					{/if}
				</div>

				{#if updateFormError}
					<div class="p-3 rounded-lg bg-red-50 dark:bg-red-500/10 border border-red-200 dark:border-red-500/30 text-red-700 dark:text-red-300 text-xs" role="alert">
						{updateFormError}
					</div>
				{/if}

				<div class="flex items-center justify-between pt-1">
					{#if updateSuccess}
						<span class="text-xs text-emerald-600 dark:text-emerald-400 flex items-center gap-1">
							<svg class="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2.5" aria-hidden="true">
								<path stroke-linecap="round" stroke-linejoin="round" d="m4.5 12.75 6 6 9-13.5" />
							</svg>
							Modifications enregistrées
						</span>
					{:else}
						<span></span>
					{/if}

					<button
						type="submit"
						disabled={loadingUpdate}
						id="btn-save-member"
						class="inline-flex items-center gap-2 px-4 py-2 text-sm font-semibold rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white transition-colors disabled:opacity-50 shadow-sm"
					>
						{#if loadingUpdate}
							<svg class="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24" aria-hidden="true">
								<circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"/>
								<path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z"/>
							</svg>
							Sauvegarde…
						{:else}
							Enregistrer les modifications
						{/if}
					</button>
				</div>
			</form>
		</div>
	</div>

	<!-- ══ COLONNE DROITE — Panneau sticky ═══════════════════════════════ -->
	<div class="space-y-4">
		<div class="lg:sticky lg:top-6 space-y-4">

			<!-- ── Carte Rôle & Statut ─────────────────────────────────── -->
			<div class="bg-white dark:bg-zinc-900 rounded-xl border border-gray-200 dark:border-zinc-800 shadow-sm p-5 transition-colors">
				<h2 class="text-sm font-semibold text-gray-800 dark:text-zinc-200 pb-3 border-b border-gray-100 dark:border-zinc-800 mb-4">
					Propriétés
				</h2>

				<dl class="space-y-3 text-sm">
					<div class="flex justify-between items-center">
						<dt class="text-xs text-gray-400 dark:text-zinc-500 uppercase tracking-wider">Rôle</dt>
						<dd>
							<span class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium
								{member.roleTitle === 'Admin'
									? 'bg-purple-100 dark:bg-purple-950/70 text-purple-700 dark:text-purple-300'
									: 'bg-gray-100 dark:bg-zinc-800 text-gray-600 dark:text-zinc-400'}">
								{member.roleTitle}
							</span>
						</dd>
					</div>

					<div class="flex justify-between items-center">
						<dt class="text-xs text-gray-400 dark:text-zinc-500 uppercase tracking-wider">Statut</dt>
						<dd>
							<span class="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium bg-emerald-100 dark:bg-emerald-950/70 text-emerald-600 dark:text-emerald-400">
								<span class="w-1.5 h-1.5 rounded-full bg-emerald-500" aria-hidden="true"></span>
								{member.status}
							</span>
						</dd>
					</div>

					<div class="flex justify-between items-center">
						<dt class="text-xs text-gray-400 dark:text-zinc-500 uppercase tracking-wider">Niveau</dt>
						<dd class="font-mono text-xs {lc.color} font-semibold">L{member.level} — {lc.label}</dd>
					</div>

					<div class="flex justify-between items-baseline">
						<dt class="text-xs text-gray-400 dark:text-zinc-500 uppercase tracking-wider">Département</dt>
						<dd class="text-xs text-gray-600 dark:text-zinc-400">{member.department}</dd>
					</div>
				</dl>
			</div>

			<!-- ── Carte Informations ──────────────────────────────────── -->
			<div class="bg-white dark:bg-zinc-900 rounded-xl border border-gray-200 dark:border-zinc-800 shadow-sm p-5 space-y-3 transition-colors">
				<h2 class="text-sm font-semibold text-gray-800 dark:text-zinc-200 pb-3 border-b border-gray-100 dark:border-zinc-800">
					Informations
				</h2>

				<dl class="space-y-2.5 text-sm">
					<div class="flex justify-between items-baseline">
						<dt class="text-xs text-gray-400 dark:text-zinc-500">ID</dt>
						<dd class="font-mono text-xs text-gray-600 dark:text-zinc-400">{memberShortId}</dd>
					</div>
					{#if member.createdAt}
						<div class="flex justify-between items-baseline">
							<dt class="text-xs text-gray-400 dark:text-zinc-500">Créé le</dt>
							<dd class="text-xs text-gray-600 dark:text-zinc-400 text-right">{formatDate(member.createdAt)}</dd>
						</div>
					{/if}
					<div class="flex justify-between items-baseline">
						<dt class="text-xs text-gray-400 dark:text-zinc-500">Email</dt>
						<dd class="text-xs text-gray-600 dark:text-zinc-400 text-right truncate max-w-[140px]">{member.email}</dd>
					</div>
				</dl>
			</div>

			<!-- ── Actions rapides ────────────────────────────────────── -->
			<div class="bg-white dark:bg-zinc-900 rounded-xl border border-gray-200 dark:border-zinc-800 shadow-sm p-5 space-y-2 transition-colors">
				<h2 class="text-sm font-semibold text-gray-800 dark:text-zinc-200 pb-3 border-b border-gray-100 dark:border-zinc-800 mb-3">
					Actions rapides
				</h2>

				<!-- Ajouter un technicien -->
				<a
					href="/register"
					class="w-full flex items-center justify-center gap-2 px-4 py-2 text-sm font-semibold rounded-lg
						text-indigo-700 dark:text-indigo-300 bg-indigo-50 dark:bg-indigo-950/40
						hover:bg-indigo-100 dark:hover:bg-indigo-900/50 border border-indigo-200 dark:border-indigo-800/50
						transition-colors"
				>
					<svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2" aria-hidden="true">
						<path stroke-linecap="round" stroke-linejoin="round" d="M18 7.5v3m0 0v3m0-3h3m-3 0h-3m-2.25-4.125a3.375 3.375 0 1 1-6.75 0 3.375 3.375 0 0 1 6.75 0ZM3 19.235v-.11a6.375 6.375 0 0 1 12.75 0v.109A12.318 12.318 0 0 1 9.374 21c-2.331 0-4.512-.645-6.374-1.766Z" />
					</svg>
					Ajouter un technicien
				</a>

				<!-- Supprimer le membre -->
				<button
					type="button"
					onclick={() => isDeletingModalOpen = true}
					id="btn-delete-member"
					class="w-full flex items-center justify-center gap-2 px-4 py-2 text-sm font-semibold rounded-lg
						text-red-700 dark:text-red-400 bg-transparent hover:bg-red-50 dark:hover:bg-red-950/40
						border border-red-200 dark:border-red-900/50 transition-colors mt-1"
				>
					<svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2" aria-hidden="true">
						<path stroke-linecap="round" stroke-linejoin="round" d="m14.74 9-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 0 1-2.244 2.077H8.084a2.25 2.25 0 0 1-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 0 0-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 0 1 3.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 0 0-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 0 0-7.5 0" />
					</svg>
					Supprimer le membre
				</button>
			</div>

		</div>
	</div>
</div>

<!-- ── Modal de confirmation de suppression ────────────────────────── -->
{#if isDeletingModalOpen}
	<div
		class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-fade-in"
		role="dialog"
		aria-modal="true"
		aria-labelledby="modal-delete-member-title"
	>
		<div class="w-full max-w-md bg-white dark:bg-zinc-900 rounded-xl shadow-2xl border border-gray-200 dark:border-zinc-800 p-6 space-y-4">
			<div class="flex items-center gap-3 text-red-600 dark:text-red-400">
				<div class="p-2 rounded-full bg-red-100 dark:bg-red-950/60 shrink-0">
					<svg class="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2" aria-hidden="true">
						<path stroke-linecap="round" stroke-linejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z" />
					</svg>
				</div>
				<h3 id="modal-delete-member-title" class="text-lg font-bold text-gray-900 dark:text-white">Confirmer la suppression</h3>
			</div>

			<p class="text-sm text-gray-600 dark:text-zinc-400 leading-relaxed">
				Êtes-vous sûr de vouloir supprimer définitivement le compte de <strong class="text-gray-900 dark:text-zinc-200">«&nbsp;{member.name}&nbsp;»</strong> ? Cette action est irréversible.
			</p>

			<form
				method="POST"
				action="?/deleteMember"
				use:enhance={() => {
					isDeleting = true;
					return async ({ update }) => {
						await update();
						isDeleting = false;
					};
				}}
				class="flex items-center justify-end gap-3 pt-2"
			>
				<button
					type="button"
					onclick={() => isDeletingModalOpen = false}
					disabled={isDeleting}
					class="px-4 py-2 text-sm font-medium text-gray-700 dark:text-zinc-300 hover:bg-gray-100 dark:hover:bg-zinc-800 rounded-lg transition-colors"
				>
					Annuler
				</button>

				<button
					type="submit"
					disabled={isDeleting}
					id="confirm-delete-member-btn"
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
