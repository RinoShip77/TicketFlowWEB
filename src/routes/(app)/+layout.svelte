<!-- Layout principal de l'application authentifiée -->
<script lang="ts">
	import type { Snippet } from 'svelte';
	import { page } from '$app/state';

	interface Props {
		children: Snippet;
	}

	let { children }: Props = $props();

	const navItems = [
		{
			href: '/dashboard',
			label: 'Dashboard',
			icon: 'M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6'
		},
		{
			href: '/tickets',
			label: 'Tickets',
			icon: 'M16.5 6v.75m0 3v.75m0 3v.75m0 3V18m-9-5.25h5.25M7.5 15h3M3.375 5.25c-.621 0-1.125.504-1.125 1.125v3.026a2.999 2.999 0 0 1 0 5.198v3.026c0 .621.504 1.125 1.125 1.125h17.25c.621 0 1.125-.504 1.125-1.125v-3.026a3 3 0 0 1 0-5.198V6.375c0-.621-.504-1.125-1.125-1.125H3.375Z'
		},
		{
			href: '/register',
			label: 'Créer Technicien',
			icon: 'M18 7.5v3m0 0v3m0-3h3m-3 0h-3m-2.25-4.125a3.375 3.375 0 1 1-6.75 0 3.375 3.375 0 0 1 6.75 0ZM3 19.235v-.11a6.375 6.375 0 0 1 12.75 0v.109A12.318 12.318 0 0 1 9.374 21c-2.331 0-4.512-.645-6.374-1.766Z'
		}
	];
</script>

<div class="flex h-screen bg-zinc-950 overflow-hidden">
	<!-- Sidebar -->
	<aside class="w-64 shrink-0 flex flex-col bg-zinc-900 border-r border-zinc-800/60">
		<!-- Logo -->
		<div class="px-5 py-5 border-b border-zinc-800/60">
			<div class="flex items-center gap-2.5">
				<div class="w-8 h-8 rounded-lg bg-indigo-600 flex items-center justify-center shadow-md shadow-indigo-500/30">
					<svg class="w-4.5 h-4.5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2.5" aria-hidden="true">
						<path stroke-linecap="round" stroke-linejoin="round" d="M16.5 6v.75m0 3v.75m0 3v.75m0 3V18m-9-5.25h5.25M7.5 15h3M3.375 5.25c-.621 0-1.125.504-1.125 1.125v3.026a2.999 2.999 0 0 1 0 5.198v3.026c0 .621.504 1.125 1.125 1.125h17.25c.621 0 1.125-.504 1.125-1.125v-3.026a3 3 0 0 1 0-5.198V6.375c0-.621-.504-1.125-1.125-1.125H3.375Z" />
					</svg>
				</div>
				<span class="font-bold text-white tracking-tight">TicketFlow</span>
			</div>
		</div>

		<!-- Nav items -->
		<nav class="flex-1 px-3 py-4 space-y-1" aria-label="Navigation principale">
			{#each navItems as item}
				{@const isActive = page.url.pathname.startsWith(item.href)}
				<a
					href={item.href}
					class="
						flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-150
						{isActive
							? 'bg-indigo-600/20 text-indigo-300 border border-indigo-500/20'
							: 'text-zinc-400 hover:text-zinc-100 hover:bg-zinc-800'}
					"
					aria-current={isActive ? 'page' : undefined}
				>
					<svg class="w-5 h-5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="1.75" aria-hidden="true">
						<path stroke-linecap="round" stroke-linejoin="round" d={item.icon} />
					</svg>
					{item.label}
				</a>
			{/each}
		</nav>

		<!-- Logout -->
		<div class="px-3 py-4 border-t border-zinc-800/60">
			<form method="POST" action="/logout">
				<button
					type="submit"
					class="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-zinc-400 hover:text-red-400 hover:bg-red-500/10 transition-all duration-150"
				>
					<svg class="w-5 h-5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="1.75" aria-hidden="true">
						<path stroke-linecap="round" stroke-linejoin="round" d="M15.75 9V5.25A2.25 2.25 0 0 0 13.5 3h-6a2.25 2.25 0 0 0-2.25 2.25v13.5A2.25 2.25 0 0 0 7.5 21h6a2.25 2.25 0 0 0 2.25-2.25V15M12 9l-3 3m0 0 3 3m-3-3h12.75" />
					</svg>
					Déconnexion
				</button>
			</form>
		</div>
	</aside>

	<!-- Main content -->
	<main class="flex-1 flex flex-col min-w-0 overflow-auto">
		<div class="flex-1 p-6 lg:p-8">
			{@render children()}
		</div>
	</main>
</div>
