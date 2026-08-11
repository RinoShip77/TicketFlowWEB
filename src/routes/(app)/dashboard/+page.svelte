<script lang="ts">
	// Dashboard — page d'accueil de l'application (placeholder étape 2)
</script>

<svelte:head>
	<title>Dashboard — TicketFlow</title>
	<meta name="description" content="Tableau de bord TicketFlow — vue d'ensemble de vos tickets." />
</svelte:head>

<div class="space-y-6">
	<!-- Header -->
	<div>
		<h1 class="text-2xl font-bold text-white">Dashboard</h1>
		<p class="text-zinc-400 text-sm mt-1">Vue d'ensemble de l'activité.</p>
	</div>

	<!-- Stats cards placeholder -->
	<div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
		{#each [
			{ label: 'Tickets ouverts', value: '—', color: 'text-indigo-400', bg: 'bg-indigo-500/10 border-indigo-500/20' },
			{ label: 'En cours', value: '—', color: 'text-amber-400', bg: 'bg-amber-500/10 border-amber-500/20' },
			{ label: 'Résolus', value: '—', color: 'text-emerald-400', bg: 'bg-emerald-500/10 border-emerald-500/20' },
			{ label: 'Critiques', value: '—', color: 'text-red-400', bg: 'bg-red-500/10 border-red-500/20' },
		] as stat}
			<div class="rounded-xl border {stat.bg} p-5">
				<p class="text-xs font-medium text-zinc-400 uppercase tracking-wider">{stat.label}</p>
				<p class="text-3xl font-bold {stat.color} mt-2">{stat.value}</p>
			</div>
		{/each}
	</div>

	<!-- Placeholder content -->
	<div class="rounded-xl border border-zinc-800/60 bg-zinc-900/50 p-8 text-center">
		<div class="w-12 h-12 rounded-xl bg-indigo-600/20 border border-indigo-500/20 flex items-center justify-center mx-auto mb-4">
			<svg class="w-6 h-6 text-indigo-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="1.75" aria-hidden="true">
				<path stroke-linecap="round" stroke-linejoin="round" d="M16.5 6v.75m0 3v.75m0 3v.75m0 3V18m-9-5.25h5.25M7.5 15h3M3.375 5.25c-.621 0-1.125.504-1.125 1.125v3.026a2.999 2.999 0 0 1 0 5.198v3.026c0 .621.504 1.125 1.125 1.125h17.25c.621 0 1.125-.504 1.125-1.125v-3.026a3 3 0 0 1 0-5.198V6.375c0-.621-.504-1.125-1.125-1.125H3.375Z" />
			</svg>
		</div>
		<h2 class="text-white font-semibold mb-1">Bienvenue sur TicketFlow</h2>
		<p class="text-zinc-400 text-sm max-w-xs mx-auto">
			L'authentification est opérationnelle. Les données des tickets arrivent à l'étape 2.
		</p>
	</div>
</div>
