<!-- Layout principal de l'application authentifiée — Thème Adaptatif (Système/Light/Dark) -->
<script lang="ts">
	import type { Snippet } from 'svelte';
	import type { LayoutData } from './$types';
	import { page } from '$app/state';
	import ThemeToggle from '$lib/components/ThemeToggle.svelte';

	interface Props {
		children: Snippet;
		data: LayoutData;
	}

	let { children, data }: Props = $props();

	const user = data.user;
	const userInitials = user?.name
		? user.name
				.split(' ')
				.map((n) => n[0])
				.join('')
				.toUpperCase()
				.slice(0, 2)
		: 'U';

	const navItems = [
		{
			href: '/dashboard',
			label: 'Dashboard',
			icon: `<rect x="3" y="3" width="7" height="7" rx="1"/><rect x="14" y="3" width="7" height="7" rx="1"/><rect x="14" y="14" width="7" height="7" rx="1"/><rect x="3" y="14" width="7" height="7" rx="1"/>`,
			strokeIcon: false
		},
		{
			href: '/tickets',
			label: 'All Tickets',
			icon: `M9 5H7a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V7a2 2 0 0 0-2-2h-2M9 5a2 2 0 0 0 2 2h2a2 2 0 0 0 2-2M9 5a2 2 0 0 1 2-2h2a2 2 0 0 1 2 2`,
			strokeIcon: true
		},
		{
			href: '/team-members',
			label: 'Team Members',
			icon: `M16 11c1.66 0 2.99-1.34 2.99-3S17.66 5 16 5c-1.66 0-3 1.34-3 3s1.34 3 3 3zm-8 0c1.66 0 2.99-1.34 2.99-3S9.66 5 8 5C6.34 5 5 6.34 5 8s1.34 3 3 3zm0 2c-2.33 0-7 1.17-7 3.5V19h14v-2.5c0-2.33-4.67-3.5-7-3.5zm8 0c-.29 0-.62.02-.97.05 1.16.84 1.97 1.97 1.97 3.45V19h6v-2.5c0-2.33-4.67-3.5-7-3.5z`,
			strokeIcon: false
		}
	];

	// Titre de page dynamique basé sur l'URL
	const pageTitle = $derived(() => {
		const path = page.url.pathname;
		if (path.startsWith('/dashboard')) return 'Dashboard';
		if (path.startsWith('/tickets/new')) return 'Créer un ticket';
		if (path.startsWith('/tickets')) return 'Ticket List';
		if (path.startsWith('/team-members')) return 'Team Members';
		if (path.startsWith('/register')) return 'Créer Technicien';
		return 'TicketFlow';
	});
</script>

<div class="flex h-screen bg-gray-50 dark:bg-zinc-950 text-gray-900 dark:text-zinc-100 overflow-hidden transition-colors duration-200">

	<!-- ── Sidebar ──────────────────────────────────────────────────── -->
	<aside class="w-52 shrink-0 flex flex-col bg-white dark:bg-zinc-900 border-r border-gray-200 dark:border-zinc-800 transition-colors duration-200">

		<!-- Logo -->
		<div class="px-5 py-5 border-b border-gray-100 dark:border-zinc-800/60">
			<a href="/dashboard" class="flex items-center gap-2.5 no-underline">
				<div class="w-8 h-8 rounded-lg bg-indigo-600 flex items-center justify-center shadow-sm">
					<svg class="w-4 h-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2.5" aria-hidden="true">
						<path stroke-linecap="round" stroke-linejoin="round" d="M16.5 6v.75m0 3v.75m0 3v.75m0 3V18m-9-5.25h5.25M7.5 15h3M3.375 5.25c-.621 0-1.125.504-1.125 1.125v3.026a2.999 2.999 0 0 1 0 5.198v3.026c0 .621.504 1.125 1.125 1.125h17.25c.621 0 1.125-.504 1.125-1.125v-3.026a3 3 0 0 1 0-5.198V6.375c0-.621-.504-1.125-1.125-1.125H3.375Z" />
					</svg>
				</div>
				<span class="font-bold text-indigo-600 dark:text-indigo-400 text-lg tracking-tight">TicketFlow</span>
			</a>
		</div>

		<!-- Nav items -->
		<nav class="flex-1 px-3 py-3 space-y-1" aria-label="Navigation principale">
			{#each navItems as item}
				{@const isActive = page.url.pathname.startsWith(item.href)}
				<a
					href={item.href}
					class="
						flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-150
						{isActive
							? 'bg-indigo-50 dark:bg-indigo-600/20 text-indigo-600 dark:text-indigo-400 font-semibold border border-indigo-100 dark:border-indigo-500/20'
							: 'text-gray-600 dark:text-zinc-400 hover:text-gray-900 dark:hover:text-zinc-100 hover:bg-gray-100 dark:hover:bg-zinc-800'}
					"
					aria-current={isActive ? 'page' : undefined}
				>
					<svg class="w-5 h-5 shrink-0" fill={item.strokeIcon ? 'none' : 'currentColor'} viewBox="0 0 24 24" stroke={item.strokeIcon ? 'currentColor' : 'none'} stroke-width="1.75" aria-hidden="true">
						{#if item.strokeIcon}
							<path stroke-linecap="round" stroke-linejoin="round" d={item.icon} />
						{:else}
							<path d={item.icon} />
						{/if}
					</svg>
					{item.label}
				</a>
			{/each}
		</nav>

		<!-- Logout -->
		<div class="px-3 py-4 border-t border-gray-200 dark:border-zinc-800">
			<form method="POST" action="/logout">
				<button
					type="submit"
					class="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-gray-500 dark:text-zinc-400 hover:text-red-600 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-500/10 transition-all duration-150"
				>
					<svg class="w-5 h-5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="1.75" aria-hidden="true">
						<path stroke-linecap="round" stroke-linejoin="round" d="M15.75 9V5.25A2.25 2.25 0 0 0 13.5 3h-6a2.25 2.25 0 0 0-2.25 2.25v13.5A2.25 2.25 0 0 0 7.5 21h6a2.25 2.25 0 0 0 2.25-2.25V15M12 9l-3 3m0 0 3 3m-3-3h12.75" />
					</svg>
					Logout
				</button>
			</form>
		</div>
	</aside>

	<!-- ── Main content ─────────────────────────────────────────────── -->
	<div class="flex-1 flex flex-col min-w-0 overflow-hidden">

		<!-- Topbar -->
		<header class="h-16 shrink-0 bg-white dark:bg-zinc-900 border-b border-gray-200 dark:border-zinc-800 flex items-center justify-between px-6 transition-colors duration-200">
			<h1 class="text-xl font-semibold text-gray-900 dark:text-white">{pageTitle()}</h1>

			<div class="flex items-center gap-4">
				<!-- Selecteur de Thème (Système / Clair / Sombre) -->
				<ThemeToggle />

				<div class="h-5 w-px bg-gray-200 dark:bg-zinc-700 hidden sm:block"></div>

				<!-- User info -->
				<div class="flex items-center gap-2.5 cursor-pointer group">
					<!-- Avatar -->
					<div class="w-9 h-9 rounded-full bg-indigo-100 dark:bg-indigo-900/50 border-2 border-indigo-200 dark:border-indigo-700 flex items-center justify-center">
						<span class="text-xs font-bold text-indigo-600 dark:text-indigo-300">{userInitials}</span>
					</div>
					<!-- Name & role -->
					<div class="hidden sm:block text-right">
						<p class="text-sm font-semibold text-gray-800 dark:text-zinc-200 leading-tight">{user?.name ?? 'Utilisateur'}</p>
						<p class="text-xs text-gray-500 dark:text-zinc-400 leading-tight">Technicien</p>
					</div>
				</div>
			</div>
		</header>

		<!-- Page content -->
		<main class="flex-1 overflow-auto bg-gray-50 dark:bg-zinc-950 transition-colors duration-200">
			<div class="p-6 lg:p-8">
				{@render children()}
			</div>
		</main>
	</div>
</div>
