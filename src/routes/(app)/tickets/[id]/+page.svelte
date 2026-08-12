<script lang="ts">
	import { enhance } from '$app/forms';
	import type { ActionData, PageData } from './$types';
	import type { TicketStatus, TicketPriority } from '$lib/types';

	interface Props {
		data: PageData;
		form: ActionData;
	}

	let { data, form }: Props = $props();

	// ── Données réactives issues du load ─────────────────────────────
	const ticket = $derived(data.ticket);
	const technicians = $derived(data.technicians);

	// ── États locaux du formulaire d'édition ─────────────────────────
	let editTitle = $state(data.ticket.title);
	let editDescription = $state(data.ticket.description);
	let editStatus = $state<TicketStatus>(data.ticket.status);
	let editPriority = $state<string>(String(data.ticket.priority));
	let editAssignedTo = $state<string>(data.ticket.assignedTo?._id ?? data.ticket.assignedTo?.['id'] ?? '');
	let editDepartment = $state(data.ticket.originDepartment ?? '');

	// ── Sync quand le load recharge après une action ─────────────────
	$effect(() => {
		editTitle = data.ticket.title;
		editDescription = data.ticket.description;
		editStatus = data.ticket.status;
		editPriority = String(data.ticket.priority);
		editAssignedTo = data.ticket.assignedTo?._id ?? data.ticket.assignedTo?.['id'] ?? '';
		editDepartment = data.ticket.originDepartment ?? '';
	});

	// ── États UI ─────────────────────────────────────────────────────
	let loadingUpdate = $state(false);
	let loadingNote = $state(false);
	let noteText = $state('');
	let titleEditing = $state(false);
	let updateSuccess = $state(false);
	let updateSuccessTimer: ReturnType<typeof setTimeout>;

	let isDeletingModalOpen = $state(false);
	let isDeleting = $state(false);


	// ── Feedback des actions ─────────────────────────────────────────
	const updateErrors = $derived(
		(form as any)?.action === 'updateTicket' ? ((form as any)?.errors as Record<string, string> ?? {}) : {}
	);
	const updateFormError = $derived(
		(form as any)?.action === 'updateTicket' ? (form as any)?.formError as string | undefined : undefined
	);
	const noteError = $derived(
		(form as any)?.action === 'addNote' ? (form as any)?.noteError as string | undefined : undefined
	);

	$effect(() => {
		if ((form as any)?.action === 'updateTicket' && (form as any)?.success) {
			updateSuccess = true;
			clearTimeout(updateSuccessTimer);
			updateSuccessTimer = setTimeout(() => { updateSuccess = false; }, 3000);
		}
		if ((form as any)?.action === 'addNote' && (form as any)?.success) {
			noteText = '';
		}
	});

	// ── Helpers visuels ──────────────────────────────────────────────
	const statusConfig: Record<TicketStatus, { label: string; color: string; dot: string; bg: string }> = {
		'Open':        { label: 'Open',        color: 'text-blue-700 dark:text-blue-300',   dot: 'bg-blue-500',   bg: 'bg-blue-50 dark:bg-blue-950/40 border-blue-200 dark:border-blue-800/50' },
		'In progress': { label: 'In Progress', color: 'text-purple-700 dark:text-purple-300', dot: 'bg-purple-500', bg: 'bg-purple-50 dark:bg-purple-950/40 border-purple-200 dark:border-purple-800/50' },
		'Resolved':    { label: 'Resolved',    color: 'text-emerald-700 dark:text-emerald-300', dot: 'bg-emerald-500', bg: 'bg-emerald-50 dark:bg-emerald-950/40 border-emerald-200 dark:border-emerald-800/50' },
		'Closed':      { label: 'Closed',      color: 'text-red-700 dark:text-red-300',     dot: 'bg-red-500',    bg: 'bg-red-50 dark:bg-red-950/40 border-red-200 dark:border-red-800/50' }
	};

	const priorityConfig: Record<number, { label: string; color: string; ring: string; dot: string }> = {
		1: { label: 'Très faible', color: 'text-sky-600 dark:text-sky-400',      ring: 'ring-sky-400',    dot: '#0ea5e9' },
		2: { label: 'Faible',      color: 'text-blue-600 dark:text-blue-400',    ring: 'ring-blue-400',   dot: '#3b82f6' },
		3: { label: 'Moyenne',     color: 'text-amber-600 dark:text-amber-400',  ring: 'ring-amber-400',  dot: '#f59e0b' },
		4: { label: 'Haute',       color: 'text-orange-600 dark:text-orange-400', ring: 'ring-orange-400', dot: '#f97316' },
		5: { label: 'Critique',    color: 'text-red-600 dark:text-red-400',      ring: 'ring-red-500',    dot: '#ef4444' }
	};

	const departments = [
		'TI', 'Ressources Humaines', 'Comptabilité',
		'Support Technique', 'Equipe de direction', 'Marketing', 'Finance'
	];

	function formatDate(iso: string): string {
		return new Intl.DateTimeFormat('fr-CA', {
			day: '2-digit', month: 'short', year: 'numeric',
			hour: '2-digit', minute: '2-digit'
		}).format(new Date(iso));
	}

	function timeAgo(iso: string): string {
		const diff = Date.now() - new Date(iso).getTime();
		const mins = Math.floor(diff / 60000);
		if (mins < 1) return 'à l\'instant';
		if (mins < 60) return `il y a ${mins} min`;
		const hrs = Math.floor(mins / 60);
		if (hrs < 24) return `il y a ${hrs}h`;
		const days = Math.floor(hrs / 24);
		return `il y a ${days}j`;
	}

	function avatarInitials(name: string): string {
		return name.trim().split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
	}

	const avatarColors = [
		'bg-indigo-100 dark:bg-indigo-900/50 text-indigo-700 dark:text-indigo-300',
		'bg-purple-100 dark:bg-purple-900/50 text-purple-700 dark:text-purple-300',
		'bg-pink-100   dark:bg-pink-900/50   text-pink-700   dark:text-pink-300',
		'bg-amber-100  dark:bg-amber-900/50  text-amber-700  dark:text-amber-300',
		'bg-teal-100   dark:bg-teal-900/50   text-teal-700   dark:text-teal-300',
		'bg-emerald-100 dark:bg-emerald-900/50 text-emerald-700 dark:text-emerald-300',
	];
	function avatarColor(name: string): string {
		let h = 0;
		for (const c of name) h = (h * 31 + c.charCodeAt(0)) % avatarColors.length;
		return avatarColors[Math.abs(h)];
	}

	const ticketShortId = $derived(`#${ticket._id.slice(-6).toUpperCase()}`);
	const sc = $derived(statusConfig[ticket.status] ?? statusConfig['Open']);
	const pc = $derived(priorityConfig[ticket.priority] ?? priorityConfig[3]);
	const noteCount = $derived(ticket.notes?.length ?? 0);
</script>

<svelte:head>
	<title>{ticket.title} — TicketFlow</title>
	<meta name="description" content="Détail du ticket {ticketShortId} : {ticket.title}" />
</svelte:head>

<!-- ── Breadcrumb ───────────────────────────────────────────────────── -->
<nav class="flex items-center gap-2 text-sm text-gray-400 dark:text-zinc-500 mb-5" aria-label="Fil d'Ariane">
	<a href="/tickets" class="hover:text-gray-700 dark:hover:text-zinc-200 transition-colors">Tickets</a>
	<svg class="w-3 h-3 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2.5" aria-hidden="true">
		<path stroke-linecap="round" stroke-linejoin="round" d="m8.25 4.5 7.5 7.5-7.5 7.5" />
	</svg>
	<span class="font-mono text-gray-600 dark:text-zinc-300">{ticketShortId}</span>
</nav>

<!-- ── Layout 2 colonnes ────────────────────────────────────────────── -->
<div class="grid grid-cols-1 lg:grid-cols-3 gap-6">

	<!-- ══ COLONNE GAUCHE (2/3) ═════════════════════════════════════════ -->
	<div class="lg:col-span-2 space-y-5">

		<!-- ── Titre éditable ──────────────────────────────────────────── -->
		<div class="bg-white dark:bg-zinc-900 rounded-xl border border-gray-200 dark:border-zinc-800 shadow-sm p-5 transition-colors">
			<div class="flex items-start gap-3">
				<!-- Badge statut inline -->
				<span class="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold border shrink-0 mt-0.5 {sc.bg} {sc.color}">
					<span class="w-1.5 h-1.5 rounded-full {sc.dot}" aria-hidden="true"></span>
					{sc.label}
				</span>

				<div class="flex-1 min-w-0">
					{#if titleEditing}
						<form
							method="POST"
							action="?/updateTicket"
							use:enhance={() => {
								loadingUpdate = true;
								return async ({ update }) => { await update(); loadingUpdate = false; titleEditing = false; };
							}}
							class="flex items-center gap-2"
						>
							<input
								name="title"
								type="text"
								bind:value={editTitle}
								class="flex-1 text-xl font-bold bg-transparent border-b-2 border-indigo-500 focus:outline-none text-gray-900 dark:text-white pb-0.5"
								aria-label="Modifier le titre"
								autofocus
							/>
							<!-- Champs cachés pour conserver les autres valeurs -->
							<input type="hidden" name="description" value={editDescription} />
							<input type="hidden" name="status" value={editStatus} />
							<input type="hidden" name="priority" value={editPriority} />
							<input type="hidden" name="assignedTo" value={editAssignedTo} />
							<input type="hidden" name="originDepartment" value={editDepartment} />

							<button type="submit" disabled={loadingUpdate}
								class="px-3 py-1 text-xs font-semibold rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white transition-colors disabled:opacity-50 shrink-0">
								{loadingUpdate ? '…' : 'OK'}
							</button>
							<button type="button" onclick={() => { titleEditing = false; editTitle = ticket.title; }}
								class="px-3 py-1 text-xs font-medium rounded-lg text-gray-500 dark:text-zinc-400 hover:bg-gray-100 dark:hover:bg-zinc-800 transition-colors shrink-0">
								Annuler
							</button>
						</form>
					{:else}
						<div class="flex items-start gap-2 group">
							<h1 class="text-xl font-bold text-gray-900 dark:text-white leading-snug flex-1">
								{ticket.title}
							</h1>
							<button
								onclick={() => titleEditing = true}
								class="opacity-0 group-hover:opacity-100 focus:opacity-100 p-1 rounded-md text-gray-400 dark:text-zinc-500 hover:text-indigo-600 dark:hover:text-indigo-400 hover:bg-gray-100 dark:hover:bg-zinc-800 transition-all shrink-0"
								aria-label="Modifier le titre"
							>
								<svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="1.75" aria-hidden="true">
									<path stroke-linecap="round" stroke-linejoin="round" d="m16.862 4.487 1.687-1.688a1.875 1.875 0 1 1 2.652 2.652L10.582 16.07a4.5 4.5 0 0 1-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 0 1 1.13-1.897l8.932-8.931Z" />
								</svg>
							</button>
						</div>
					{/if}

					<!-- Métadonnées compactes sous le titre -->
					<div class="flex flex-wrap items-center gap-x-4 gap-y-1 mt-2 text-xs text-gray-400 dark:text-zinc-500">
						<span>Créé le {formatDate(ticket.createdAt)}</span>
						{#if ticket.originDepartment}
							<span class="flex items-center gap-1">
								<svg class="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2" aria-hidden="true">
									<path stroke-linecap="round" stroke-linejoin="round" d="M2.25 21h19.5m-18-18v18m10.5-18v18m6-13.5V21M6.75 6.75h.75m-.75 3h.75m-.75 3h.75m3-6h.75m-.75 3h.75m-.75 3h.75M6.75 21v-3.375c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125V21" />
								</svg>
								{ticket.originDepartment}
							</span>
						{/if}
						{#if ticket.assignedTo}
							<span class="flex items-center gap-1">
								<svg class="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2" aria-hidden="true">
									<path stroke-linecap="round" stroke-linejoin="round" d="M15.75 6a3.75 3.75 0 1 1-7.5 0 3.75 3.75 0 0 1 7.5 0ZM4.501 20.118a7.5 7.5 0 0 1 14.998 0" />
								</svg>
								{ticket.assignedTo.name}
							</span>
						{/if}
					</div>
				</div>
			</div>

			{#if updateErrors?.title}
				<p class="text-xs text-red-500 mt-2 ml-1" role="alert">{updateErrors.title}</p>
			{/if}
		</div>

		<!-- ── Description ─────────────────────────────────────────────── -->
		<div class="bg-white dark:bg-zinc-900 rounded-xl border border-gray-200 dark:border-zinc-800 shadow-sm p-5 space-y-4 transition-colors">
			<h2 class="text-sm font-semibold text-gray-800 dark:text-zinc-200 pb-2 border-b border-gray-100 dark:border-zinc-800">
				Description
			</h2>

			<form
				method="POST"
				action="?/updateTicket"
				use:enhance={() => {
					loadingUpdate = true;
					return async ({ update }) => { await update(); loadingUpdate = false; };
				}}
			>
				<!-- Champs cachés -->
				<input type="hidden" name="title" value={editTitle} />
				<input type="hidden" name="status" value={editStatus} />
				<input type="hidden" name="priority" value={editPriority} />
				<input type="hidden" name="assignedTo" value={editAssignedTo} />
				<input type="hidden" name="originDepartment" value={editDepartment} />

				<div class="space-y-3">
					<textarea
						name="description"
						id="ticket-description"
						bind:value={editDescription}
						rows="6"
						aria-label="Description du ticket"
						aria-invalid={!!updateErrors?.description}
						class="w-full px-3.5 py-2.5 text-sm rounded-lg border resize-none transition-colors
							{updateErrors?.description
								? 'border-red-400 focus:ring-red-400'
								: 'border-gray-200 dark:border-zinc-700 hover:border-gray-300 dark:hover:border-zinc-600 focus:ring-indigo-500'}
							bg-white dark:bg-zinc-900 text-gray-800 dark:text-zinc-200
							placeholder:text-gray-400 dark:placeholder:text-zinc-500
							focus:outline-none focus:ring-2 focus:border-transparent"
					></textarea>

					{#if updateErrors?.description}
						<p class="text-xs text-red-500" role="alert">{updateErrors.description}</p>
					{/if}

					{#if updateFormError}
						<div class="p-3 rounded-lg bg-red-50 dark:bg-red-500/10 border border-red-200 dark:border-red-500/30 text-red-700 dark:text-red-300 text-xs" role="alert">
							{updateFormError}
						</div>
					{/if}

					<div class="flex items-center justify-between">
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
							id="btn-save-description"
							class="inline-flex items-center gap-2 px-4 py-2 text-sm font-semibold rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white transition-colors disabled:opacity-50 shadow-sm"
						>
							{#if loadingUpdate}
								<svg class="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24" aria-hidden="true">
									<circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"/>
									<path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z"/>
								</svg>
								Sauvegarde…
							{:else}
								Enregistrer
							{/if}
						</button>
					</div>
				</div>
			</form>
		</div>

		<!-- ── Historique des notes ─────────────────────────────────────── -->
		<div class="bg-white dark:bg-zinc-900 rounded-xl border border-gray-200 dark:border-zinc-800 shadow-sm transition-colors">
			<div class="flex items-center justify-between px-5 py-4 border-b border-gray-100 dark:border-zinc-800">
				<h2 class="text-sm font-semibold text-gray-800 dark:text-zinc-200">
					Historique des notes
					{#if noteCount > 0}
						<span class="ml-1.5 inline-flex items-center justify-center w-5 h-5 text-[10px] font-bold rounded-full bg-indigo-100 dark:bg-indigo-900/60 text-indigo-700 dark:text-indigo-300">
							{noteCount}
						</span>
					{/if}
				</h2>
			</div>

			{#if ticket.notes && ticket.notes.length > 0}
				<div class="divide-y divide-gray-50 dark:divide-zinc-800/50">
					{#each ticket.notes as note (note._id ?? note.createdAt)}
						<div class="px-5 py-4 flex gap-3 items-start">
							<!-- Avatar technicien -->
							{#if note.technician?.name}
								<div class="w-8 h-8 rounded-full {avatarColor(note.technician.name)} flex items-center justify-center shrink-0 font-semibold text-xs mt-0.5">
									{avatarInitials(note.technician.name)}
								</div>
							{:else}
								<div class="w-8 h-8 rounded-full bg-gray-100 dark:bg-zinc-800 flex items-center justify-center shrink-0 mt-0.5">
									<svg class="w-4 h-4 text-gray-400 dark:text-zinc-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="1.75" aria-hidden="true">
										<path stroke-linecap="round" stroke-linejoin="round" d="M15.75 6a3.75 3.75 0 1 1-7.5 0 3.75 3.75 0 0 1 7.5 0ZM4.501 20.118a7.5 7.5 0 0 1 14.998 0" />
									</svg>
								</div>
							{/if}

							<div class="flex-1 min-w-0">
								<div class="flex items-baseline gap-2 mb-1">
									<span class="text-sm font-medium text-gray-800 dark:text-zinc-200">
										{note.technician?.name ?? 'Système'}
									</span>
									{#if note.createdAt}
										<span class="text-xs text-gray-400 dark:text-zinc-500" title={formatDate(note.createdAt)}>
											{timeAgo(note.createdAt)}
										</span>
									{/if}
								</div>
								<p class="text-sm text-gray-600 dark:text-zinc-400 leading-relaxed whitespace-pre-wrap">{note.text}</p>
							</div>
						</div>
					{/each}
				</div>
			{:else}
				<div class="py-12 text-center">
					<svg class="w-8 h-8 text-gray-200 dark:text-zinc-700 mx-auto mb-2" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="1.25" aria-hidden="true">
						<path stroke-linecap="round" stroke-linejoin="round" d="M8.625 9.75a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0Zm0 0H8.25m4.125 0a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0Zm0 0H12m4.125 0a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0Zm0 0h-.375m-13.5 3.01c0 1.6 1.123 2.994 2.707 3.227 1.087.16 2.185.283 3.293.369V21l4.184-4.183a1.14 1.14 0 0 1 .778-.332 48.294 48.294 0 0 0 5.83-.498c1.585-.233 2.708-1.626 2.708-3.228V6.741c0-1.602-1.123-2.995-2.707-3.228A48.394 48.394 0 0 0 12 3c-2.392 0-4.744.175-7.043.513C3.373 3.746 2.25 5.14 2.25 6.741v6.018Z" />
					</svg>
					<p class="text-sm text-gray-400 dark:text-zinc-500">Aucune note pour ce ticket.</p>
				</div>
			{/if}

			<!-- Formulaire ajout de note -->
			<div class="px-5 py-4 border-t border-gray-100 dark:border-zinc-800 bg-gray-50/50 dark:bg-zinc-800/20 rounded-b-xl">
				<h3 class="text-xs font-semibold text-gray-500 dark:text-zinc-400 uppercase tracking-wider mb-3">Ajouter une note</h3>

				<form
					method="POST"
					action="?/addNote"
					use:enhance={() => {
						loadingNote = true;
						return async ({ update }) => { await update(); loadingNote = false; };
					}}
				>
					<div class="space-y-2.5">
						<textarea
							name="noteText"
							id="note-text"
							bind:value={noteText}
							rows="3"
							placeholder="Votre commentaire ou action effectuée…"
							aria-label="Texte de la note"
							aria-invalid={!!noteError}
							class="w-full px-3.5 py-2.5 text-sm rounded-lg border resize-none transition-colors
								{noteError
									? 'border-red-400 focus:ring-red-400'
									: 'border-gray-200 dark:border-zinc-700 hover:border-gray-300 dark:hover:border-zinc-600 focus:ring-indigo-500'}
								bg-white dark:bg-zinc-900 text-gray-800 dark:text-zinc-200
								placeholder:text-gray-400 dark:placeholder:text-zinc-500
								focus:outline-none focus:ring-2 focus:border-transparent"
						></textarea>

						{#if noteError}
							<p class="text-xs text-red-500" role="alert">{noteError}</p>
						{/if}

						<div class="flex items-center justify-between">
							<span class="text-xs text-gray-400 dark:text-zinc-500">{noteText.length}/2000</span>
							<button
								type="submit"
								disabled={loadingNote || noteText.trim().length < 5}
								id="btn-add-note"
								class="inline-flex items-center gap-2 px-4 py-2 text-sm font-semibold rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white transition-colors disabled:opacity-40 shadow-sm"
							>
								{#if loadingNote}
									<svg class="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24" aria-hidden="true">
										<circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"/>
										<path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z"/>
									</svg>
									Ajout…
								{:else}
									<svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2" aria-hidden="true">
										<path stroke-linecap="round" stroke-linejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
									</svg>
									Ajouter la note
								{/if}
							</button>
						</div>
					</div>
				</form>
			</div>
		</div>
	</div>

	<!-- ══ COLONNE DROITE — Panneau de métadonnées (sticky) ═════════════ -->
	<div class="space-y-4">
		<div class="lg:sticky lg:top-6 space-y-4">

			<!-- ── Carte de mise à jour des métadonnées ─────────────────── -->
			<div class="bg-white dark:bg-zinc-900 rounded-xl border border-gray-200 dark:border-zinc-800 shadow-sm p-5 transition-colors">
				<h2 class="text-sm font-semibold text-gray-800 dark:text-zinc-200 pb-3 border-b border-gray-100 dark:border-zinc-800 mb-4">
					Propriétés
				</h2>

				<form
					method="POST"
					action="?/updateTicket"
					use:enhance={() => {
						loadingUpdate = true;
						return async ({ update }) => { await update(); loadingUpdate = false; };
					}}
					class="space-y-4"
				>
					<!-- Champs cachés pour conserver titre et description -->
					<input type="hidden" name="title" value={editTitle} />
					<input type="hidden" name="description" value={editDescription} />

					<!-- ── Statut ──────────────────────────────────────────── -->
					<div class="space-y-1.5">
						<label for="prop-status" class="text-xs font-medium text-gray-500 dark:text-zinc-400 uppercase tracking-wider">
							Statut
						</label>
						<div class="relative">
							<select
								id="prop-status"
								name="status"
								bind:value={editStatus}
								class="w-full pl-3 pr-8 py-2 text-sm rounded-lg border border-gray-200 dark:border-zinc-700
									bg-white dark:bg-zinc-900 text-gray-800 dark:text-zinc-200
									focus:outline-none focus:ring-2 focus:ring-indigo-500 appearance-none cursor-pointer transition-colors"
							>
								<option value="Open">Open</option>
								<option value="In progress">In Progress</option>
								<option value="Resolved">Resolved</option>
								<option value="Closed">Closed</option>
							</select>
							<svg class="absolute right-2.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 dark:text-zinc-500 pointer-events-none" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2" aria-hidden="true">
								<path stroke-linecap="round" stroke-linejoin="round" d="m19.5 8.25-7.5 7.5-7.5-7.5" />
							</svg>
						</div>
					</div>

					<!-- ── Priorité ────────────────────────────────────────── -->
					<div class="space-y-1.5">
						<span class="text-xs font-medium text-gray-500 dark:text-zinc-400 uppercase tracking-wider block">
							Priorité
						</span>
						<input type="hidden" name="priority" value={editPriority} />
						<div class="flex gap-1.5" role="group" aria-label="Sélection de la priorité">
							{#each [1, 2, 3, 4, 5] as p}
								{@const pc = priorityConfig[p]}
								<button
									type="button"
									onclick={() => editPriority = String(p)}
									class="flex-1 py-1.5 text-xs font-bold rounded-lg border-2 transition-all duration-100
										{editPriority === String(p)
											? `${pc.ring} ring-2 ring-offset-1 dark:ring-offset-zinc-900 bg-white dark:bg-zinc-800 ${pc.color}`
											: 'border-gray-200 dark:border-zinc-700 text-gray-400 dark:text-zinc-500 hover:border-gray-300 dark:hover:border-zinc-600'}"
									aria-pressed={editPriority === String(p)}
									aria-label="Priorité P{p} — {pc.label}"
								>
									P{p}
								</button>
							{/each}
						</div>
						{#if editPriority}
							<p class="text-xs {priorityConfig[Number(editPriority)]?.color ?? ''}">
								{priorityConfig[Number(editPriority)]?.label}
							</p>
						{/if}
					</div>

					<!-- ── Assigné à ───────────────────────────────────────── -->
					<div class="space-y-1.5">
						<label for="prop-assigned" class="text-xs font-medium text-gray-500 dark:text-zinc-400 uppercase tracking-wider">
							Assigné à
						</label>
						<div class="relative">
							<select
								id="prop-assigned"
								name="assignedTo"
								bind:value={editAssignedTo}
								class="w-full pl-3 pr-8 py-2 text-sm rounded-lg border border-gray-200 dark:border-zinc-700
									bg-white dark:bg-zinc-900 text-gray-800 dark:text-zinc-200
									focus:outline-none focus:ring-2 focus:ring-indigo-500 appearance-none cursor-pointer transition-colors"
							>
								<option value="">Non assigné</option>
								{#each technicians as tech}
									<option value={tech._id ?? tech.id}>{tech.name}</option>
								{/each}
							</select>
							<svg class="absolute right-2.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 dark:text-zinc-500 pointer-events-none" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2" aria-hidden="true">
								<path stroke-linecap="round" stroke-linejoin="round" d="m19.5 8.25-7.5 7.5-7.5-7.5" />
							</svg>
						</div>
					</div>

					<!-- ── Département ────────────────────────────────────── -->
					<div class="space-y-1.5">
						<label for="prop-department" class="text-xs font-medium text-gray-500 dark:text-zinc-400 uppercase tracking-wider">
							Département
						</label>
						<div class="relative">
							<select
								id="prop-department"
								name="originDepartment"
								bind:value={editDepartment}
								class="w-full pl-3 pr-8 py-2 text-sm rounded-lg border border-gray-200 dark:border-zinc-700
									bg-white dark:bg-zinc-900 text-gray-800 dark:text-zinc-200
									focus:outline-none focus:ring-2 focus:ring-indigo-500 appearance-none cursor-pointer transition-colors"
							>
								<option value="">Aucun département</option>
								{#each departments as dept}
									<option value={dept}>{dept}</option>
								{/each}
							</select>
							<svg class="absolute right-2.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 dark:text-zinc-500 pointer-events-none" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2" aria-hidden="true">
								<path stroke-linecap="round" stroke-linejoin="round" d="m19.5 8.25-7.5 7.5-7.5-7.5" />
							</svg>
						</div>
					</div>

					<!-- Bouton Appliquer les propriétés -->
					<button
						type="submit"
						disabled={loadingUpdate}
						id="btn-update-properties"
						class="w-full py-2 text-sm font-semibold rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white transition-colors disabled:opacity-50 shadow-sm"
					>
						{loadingUpdate ? 'Enregistrement…' : 'Appliquer les modifications'}
					</button>
				</form>
			</div>

			<!-- ── Carte informations ────────────────────────────────────── -->
			<div class="bg-white dark:bg-zinc-900 rounded-xl border border-gray-200 dark:border-zinc-800 shadow-sm p-5 space-y-3 transition-colors">
				<h2 class="text-sm font-semibold text-gray-800 dark:text-zinc-200 pb-3 border-b border-gray-100 dark:border-zinc-800">
					Informations
				</h2>

				<dl class="space-y-2.5 text-sm">
					<div class="flex justify-between items-baseline">
						<dt class="text-xs text-gray-400 dark:text-zinc-500">ID</dt>
						<dd class="font-mono text-xs text-gray-600 dark:text-zinc-400">{ticketShortId}</dd>
					</div>
					<div class="flex justify-between items-baseline">
						<dt class="text-xs text-gray-400 dark:text-zinc-500">Créé le</dt>
						<dd class="text-xs text-gray-600 dark:text-zinc-400 text-right">{formatDate(ticket.createdAt)}</dd>
					</div>
					<div class="flex justify-between items-baseline">
						<dt class="text-xs text-gray-400 dark:text-zinc-500">Modifié le</dt>
						<dd class="text-xs text-gray-600 dark:text-zinc-400 text-right">{formatDate(ticket.updatedAt)}</dd>
					</div>
					<div class="flex justify-between items-baseline">
						<dt class="text-xs text-gray-400 dark:text-zinc-500">Notes</dt>
						<dd class="text-xs text-gray-600 dark:text-zinc-400">{noteCount}</dd>
					</div>
				</dl>
			</div>

			<!-- ── Actions rapides ────────────────────────────────────────── -->
			<div class="bg-white dark:bg-zinc-900 rounded-xl border border-gray-200 dark:border-zinc-800 shadow-sm p-5 space-y-2 transition-colors">
				<h2 class="text-sm font-semibold text-gray-800 dark:text-zinc-200 pb-3 border-b border-gray-100 dark:border-zinc-800 mb-3">
					Actions rapides
				</h2>

				<!-- Résoudre -->
				{#if ticket.status !== 'Resolved' && ticket.status !== 'Closed'}
					<form method="POST" action="?/updateTicket" use:enhance>
						<input type="hidden" name="title" value={editTitle} />
						<input type="hidden" name="description" value={editDescription} />
						<input type="hidden" name="status" value="Resolved" />
						<input type="hidden" name="priority" value={editPriority} />
						<input type="hidden" name="assignedTo" value={editAssignedTo} />
						<input type="hidden" name="originDepartment" value={editDepartment} />
						<button type="submit" id="btn-resolve-ticket"
							class="w-full flex items-center justify-center gap-2 px-4 py-2 text-sm font-semibold rounded-lg
								text-emerald-700 dark:text-emerald-300 bg-emerald-50 dark:bg-emerald-950/40
								hover:bg-emerald-100 dark:hover:bg-emerald-900/50 border border-emerald-200 dark:border-emerald-800/50
								transition-colors">
							<svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2.5" aria-hidden="true">
								<path stroke-linecap="round" stroke-linejoin="round" d="m4.5 12.75 6 6 9-13.5" />
							</svg>
							Marquer comme résolu
						</button>
					</form>
				{/if}

				<!-- Fermer -->
				{#if ticket.status !== 'Closed'}
					<form method="POST" action="?/updateTicket" use:enhance>
						<input type="hidden" name="title" value={editTitle} />
						<input type="hidden" name="description" value={editDescription} />
						<input type="hidden" name="status" value="Closed" />
						<input type="hidden" name="priority" value={editPriority} />
						<input type="hidden" name="assignedTo" value={editAssignedTo} />
						<input type="hidden" name="originDepartment" value={editDepartment} />
						<button type="submit" id="btn-close-ticket"
							class="w-full flex items-center justify-center gap-2 px-4 py-2 text-sm font-semibold rounded-lg
								text-red-700 dark:text-red-300 bg-red-50 dark:bg-red-950/40
								hover:bg-red-100 dark:hover:bg-red-900/50 border border-red-200 dark:border-red-800/50
								transition-colors">
							<svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2" aria-hidden="true">
								<path stroke-linecap="round" stroke-linejoin="round" d="M6 18 18 6M6 6l12 12" />
							</svg>
							Fermer le ticket
						</button>
					</form>
				{/if}

				<!-- Rouvrir si fermé ou résolu -->
				{#if ticket.status === 'Resolved' || ticket.status === 'Closed'}
					<form method="POST" action="?/updateTicket" use:enhance>
						<input type="hidden" name="title" value={editTitle} />
						<input type="hidden" name="description" value={editDescription} />
						<input type="hidden" name="status" value="Open" />
						<input type="hidden" name="priority" value={editPriority} />
						<input type="hidden" name="assignedTo" value={editAssignedTo} />
						<input type="hidden" name="originDepartment" value={editDepartment} />
						<button type="submit"
							class="w-full flex items-center justify-center gap-2 px-4 py-2 text-sm font-semibold rounded-lg
								text-blue-700 dark:text-blue-300 bg-blue-50 dark:bg-blue-950/40
								hover:bg-blue-100 dark:hover:bg-blue-900/50 border border-blue-200 dark:border-blue-800/50
								transition-colors">
							<svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2" aria-hidden="true">
								<path stroke-linecap="round" stroke-linejoin="round" d="M16.023 9.348h4.992v-.001M2.985 19.644v-4.992m0 0h4.992m-4.993 0 3.181 3.183a8.25 8.25 0 0 0 13.803-3.7M4.031 9.865a8.25 8.25 0 0 1 13.803-3.7l3.181 3.182m0-4.991v4.99" />
							</svg>
							Rouvrir le ticket
						</button>
					</form>
				{/if}

				<!-- Supprimer le ticket -->
				<button
					type="button"
					onclick={() => isDeletingModalOpen = true}
					id="btn-delete-ticket"
					class="w-full flex items-center justify-center gap-2 px-4 py-2 text-sm font-semibold rounded-lg
						text-red-700 dark:text-red-400 bg-transparent hover:bg-red-50 dark:hover:bg-red-950/40
						border border-red-200 dark:border-red-900/50 transition-colors mt-2"
				>
					<svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2" aria-hidden="true">
						<path stroke-linecap="round" stroke-linejoin="round" d="m14.74 9-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 0 1-2.244 2.077H8.084a2.25 2.25 0 0 1-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 0 0-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 0 1 3.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 0 0-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 0 0-7.5 0" />
					</svg>
					Supprimer le ticket
				</button>
			</div>

		</div>
	</div>
</div>

<!-- ── Modal de confirmation de suppression ────────────────────────── -->
{#if isDeletingModalOpen}
	<div class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-fade-in" role="dialog" aria-modal="true" aria-labelledby="modal-delete-detail-title">
		<div class="w-full max-w-md bg-white dark:bg-zinc-900 rounded-xl shadow-2xl border border-gray-200 dark:border-zinc-800 p-6 space-y-4">
			<div class="flex items-center gap-3 text-red-600 dark:text-red-400">
				<div class="p-2 rounded-full bg-red-100 dark:bg-red-950/60 shrink-0">
					<svg class="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2" aria-hidden="true">
						<path stroke-linecap="round" stroke-linejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z" />
					</svg>
				</div>
				<h3 id="modal-delete-detail-title" class="text-lg font-bold text-gray-900 dark:text-white">Confirmer la suppression</h3>
			</div>

			<p class="text-sm text-gray-600 dark:text-zinc-400 leading-relaxed">
				Êtes-vous sûr de vouloir supprimer définitivement le ticket <strong class="text-gray-900 dark:text-zinc-200">« {ticket.title} »</strong> ? Vous serez redirigé vers la liste des tickets.
			</p>

			<form
				method="POST"
				action="?/deleteTicket"
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
					id="confirm-delete-detail-btn"
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

