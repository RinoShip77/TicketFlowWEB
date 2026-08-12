<!-- Layout principal de l'application authentifiée — Thème Adaptatif & Mobile Responsive -->
<script lang="ts">
	import type { Snippet } from 'svelte';
	import type { LayoutData } from './$types';
	import { page } from '$app/state';
	import { onMount } from 'svelte';
	import ThemeToggle from '$lib/components/ThemeToggle.svelte';
	import { initSettings, getSettings } from '$lib/settings.svelte';
	import { t } from '$lib/i18n.svelte';

	interface Props {
		children: Snippet;
		data: LayoutData;
	}

	let { children, data }: Props = $props();

	onMount(() => {
		initSettings();
	});

	const settings = $derived(getSettings());

	$effect(() => {
		if (typeof document !== 'undefined' && settings.language) {
			document.documentElement.lang = settings.language;
		}
	});

	let mobileMenuOpen = $state(false);

	const user = data.user;
	const userInitials = user?.name
		? user.name
				.split(' ')
				.map((n) => n[0])
				.join('')
				.toUpperCase()
				.slice(0, 2)
		: 'U';

	const navItems = $derived([
		{
			href: '/dashboard',
			label: t('nav_dashboard'),
			icon: `M3.75 6A2.25 2.25 0 0 1 6 3.75h2.25A2.25 2.25 0 0 1 10.5 6v2.25a2.25 2.25 0 0 1-2.25 2.25H6a2.25 2.25 0 0 1-2.25-2.25V6ZM3.75 15.75A2.25 2.25 0 0 1 6 13.5h2.25a2.25 2.25 0 0 1 2.25 2.25V18a2.25 2.25 0 0 1-2.25 2.25H6A2.25 2.25 0 0 1 3.75 18v-2.25ZM13.5 6a2.25 2.25 0 0 1 2.25-2.25H18A2.25 2.25 0 0 1 20.25 6v2.25A2.25 2.25 0 0 1 18 10.5h-2.25a2.25 2.25 0 0 1-2.25-2.25V6ZM13.5 15.75a2.25 2.25 0 0 1 2.25-2.25H18a2.25 2.25 0 0 1 2.25 2.25V18A2.25 2.25 0 0 1 18 20.25h-2.25A2.25 2.25 0 0 1 13.5 18v-2.25Z`,
			strokeIcon: true
		},
		{
			href: '/tickets',
			label: t('nav_tickets'),
			icon: `M16.5 6v.75m0 3v.75m0 3v.75m0 3V18m-9-5.25h5.25M7.5 15h3M3.375 5.25c-.621 0-1.125.504-1.125 1.125v3.026a2.999 2.999 0 0 1 0 5.198v3.026c0 .621.504 1.125 1.125 1.125h17.25c.621 0 1.125-.504 1.125-1.125v-3.026a3 3 0 0 1 0-5.198V6.375c0-.621-.504-1.125-1.125-1.125H3.375Z`,
			strokeIcon: true
		},
		{
			href: '/team-members',
			label: t('nav_team'),
			icon: `M15 19.128a9.38 9.38 0 0 0 2.625.372 9.337 9.337 0 0 0 4.121-.952 4.125 4.125 0 0 0-7.533-2.493M15 19.128v-.003c0-1.113-.285-2.16-.786-3.07M15 19.128v.106A12.318 12.318 0 0 1 8.624 21c-2.331 0-4.512-.645-6.374-1.766l-.001-.109a6.375 6.375 0 0 1 11.964-3.07M12 6.375a3.375 3.375 0 1 1-6.75 0 3.375 3.375 0 0 1 6.75 0Zm8.25 2.25a2.625 2.625 0 1 1-5.25 0 2.625 2.625 0 0 1 5.25 0Z`,
			strokeIcon: true
		},
		{
			href: '/settings',
			label: t('nav_settings'),
			icon: `M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z M15 12a3 3 0 11-6 0 3 3 0 016 0z`,
			strokeIcon: true
		}
	]);

	// Titre & Icône de page dynamique dérivé
	const headerInfo = $derived.by(() => {
		const path = page.url.pathname;
		if (path.startsWith('/dashboard')) {
			return {
				title: t('nav_dashboard'),
				icon: `M3.75 6A2.25 2.25 0 0 1 6 3.75h2.25A2.25 2.25 0 0 1 10.5 6v2.25a2.25 2.25 0 0 1-2.25 2.25H6a2.25 2.25 0 0 1-2.25-2.25V6ZM3.75 15.75A2.25 2.25 0 0 1 6 13.5h2.25a2.25 2.25 0 0 1 2.25 2.25V18a2.25 2.25 0 0 1-2.25 2.25H6A2.25 2.25 0 0 1 3.75 18v-2.25ZM13.5 6a2.25 2.25 0 0 1 2.25-2.25H18A2.25 2.25 0 0 1 20.25 6v2.25A2.25 2.25 0 0 1 18 10.5h-2.25a2.25 2.25 0 0 1-2.25-2.25V6ZM13.5 15.75a2.25 2.25 0 0 1 2.25-2.25H18a2.25 2.25 0 0 1 2.25 2.25V18A2.25 2.25 0 0 1 18 20.25h-2.25A2.25 2.25 0 0 1 13.5 18v-2.25Z`
			};
		}
		if (path.startsWith('/tickets/new')) {
			return {
				title: t('nav_create_ticket'),
				icon: `M12 9v6m3-3H9m12 0a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z`
			};
		}
		if (path.startsWith('/tickets')) {
			return {
				title: t('nav_tickets'),
				icon: `M16.5 6v.75m0 3v.75m0 3v.75m0 3V18m-9-5.25h5.25M7.5 15h3M3.375 5.25c-.621 0-1.125.504-1.125 1.125v3.026a2.999 2.999 0 0 1 0 5.198v3.026c0 .621.504 1.125 1.125 1.125h17.25c.621 0 1.125-.504 1.125-1.125v-3.026a3 3 0 0 1 0-5.198V6.375c0-.621-.504-1.125-1.125-1.125H3.375Z`
			};
		}
		if (path.startsWith('/team-members/new')) {
			return {
				title: t('nav_add_member'),
				icon: `M15 19.128a9.38 9.38 0 0 0 2.625.372 9.337 9.337 0 0 0 4.121-.952 4.125 4.125 0 0 0-7.533-2.493M15 19.128v-.003c0-1.113-.285-2.16-.786-3.07M15 19.128v.106A12.318 12.318 0 0 1 8.624 21c-2.331 0-4.512-.645-6.374-1.766l-.001-.109a6.375 6.375 0 0 1 11.964-3.07M12 6.375a3.375 3.375 0 1 1-6.75 0 3.375 3.375 0 0 1 6.75 0Zm8.25 2.25a2.625 2.625 0 1 1-5.25 0 2.625 2.625 0 0 1 5.25 0Z`
			};
		}
		if (path.startsWith('/team-members')) {
			return {
				title: t('nav_team'),
				icon: `M15 19.128a9.38 9.38 0 0 0 2.625.372 9.337 9.337 0 0 0 4.121-.952 4.125 4.125 0 0 0-7.533-2.493M15 19.128v-.003c0-1.113-.285-2.16-.786-3.07M15 19.128v.106A12.318 12.318 0 0 1 8.624 21c-2.331 0-4.512-.645-6.374-1.766l-.001-.109a6.375 6.375 0 0 1 11.964-3.07M12 6.375a3.375 3.375 0 1 1-6.75 0 3.375 3.375 0 0 1 6.75 0Zm8.25 2.25a2.625 2.625 0 1 1-5.25 0 2.625 2.625 0 0 1 5.25 0Z`
			};
		}
		if (path.startsWith('/settings')) {
			return {
				title: t('nav_settings'),
				icon: `M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z M15 12a3 3 0 11-6 0 3 3 0 016 0z`
			};
		}
		return {
			title: 'TicketFlow',
			icon: `M16.5 6v.75m0 3v.75m0 3v.75m0 3V18m-9-5.25h5.25M7.5 15h3M3.375 5.25c-.621 0-1.125.504-1.125 1.125v3.026a2.999 2.999 0 0 1 0 5.198v3.026c0 .621.504 1.125 1.125 1.125h17.25c.621 0 1.125-.504 1.125-1.125v-3.026a3 3 0 0 1 0-5.198V6.375c0-.621-.504-1.125-1.125-1.125H3.375Z`
		};
	});
</script>

<div class="flex h-screen bg-gray-50 dark:bg-zinc-950 text-gray-900 dark:text-zinc-100 overflow-hidden transition-colors duration-200">

	<!-- ── Backdrop mobile ─────────────────────────────────────────── -->
	{#if mobileMenuOpen}
		<div
			onclick={() => (mobileMenuOpen = false)}
			class="fixed inset-0 bg-black/50 backdrop-blur-xs z-40 md:hidden transition-opacity"
			aria-hidden="true"
		></div>
	{/if}

	<!-- ── Sidebar ──────────────────────────────────────────────────── -->
	<aside
		class="
			fixed inset-y-0 left-0 z-50 w-64 md:w-52 shrink-0 flex flex-col bg-white dark:bg-zinc-900 border-r border-gray-200 dark:border-zinc-800 transition-transform duration-300 ease-in-out md:static md:translate-x-0
			{mobileMenuOpen ? 'translate-x-0 shadow-2xl' : '-translate-x-full'}
		"
	>
		<!-- Logo -->
		<div class="px-5 py-5 border-b border-gray-100 dark:border-zinc-800/60 flex items-center justify-between">
			<a href="/dashboard" onclick={() => (mobileMenuOpen = false)} class="flex items-center gap-2.5 no-underline">
				<div class="w-8 h-8 rounded-lg bg-indigo-600 flex items-center justify-center shadow-sm">
					<svg class="w-4 h-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2.5" aria-hidden="true">
						<path stroke-linecap="round" stroke-linejoin="round" d="M16.5 6v.75m0 3v.75m0 3v.75m0 3V18m-9-5.25h5.25M7.5 15h3M3.375 5.25c-.621 0-1.125.504-1.125 1.125v3.026a2.999 2.999 0 0 1 0 5.198v3.026c0 .621.504 1.125 1.125 1.125h17.25c.621 0 1.125-.504 1.125-1.125v-3.026a3 3 0 0 1 0-5.198V6.375c0-.621-.504-1.125-1.125-1.125H3.375Z" />
					</svg>
				</div>
				<span class="font-bold text-indigo-600 dark:text-indigo-400 text-lg tracking-tight">TicketFlow</span>
			</a>
			<!-- Close button (Mobile only) -->
			<button
				type="button"
				onclick={() => (mobileMenuOpen = false)}
				class="p-1 rounded-md text-gray-400 hover:text-gray-600 dark:hover:text-zinc-200 md:hidden"
				aria-label="Fermer le menu"
			>
				<svg class="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
					<path stroke-linecap="round" stroke-linejoin="round" d="M6 18 18 6M6 6l12 12" />
				</svg>
			</button>
		</div>

		<!-- Nav items -->
		<nav class="flex-1 px-3 py-3 space-y-1" aria-label="Navigation principale">
			{#each navItems as item}
				{@const isActive = page.url.pathname.startsWith(item.href)}
				<a
					href={item.href}
					onclick={() => (mobileMenuOpen = false)}
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
					class="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-gray-500 dark:text-zinc-400 hover:text-red-600 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-500/10 transition-all duration-150 cursor-pointer"
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
		<header class="h-16 shrink-0 bg-white dark:bg-zinc-900 border-b border-gray-200 dark:border-zinc-800 flex items-center justify-between px-4 sm:px-6 transition-colors duration-200">

			<!-- Left: Hamburger (mobile) + Page Title & Icon -->
			<div class="flex items-center gap-3">
				<!-- Hamburger Button (Mobile) -->
				<button
					type="button"
					onclick={() => (mobileMenuOpen = !mobileMenuOpen)}
					class="p-2 rounded-lg text-gray-600 dark:text-zinc-300 hover:bg-gray-100 dark:hover:bg-zinc-800 md:hidden transition-colors"
					aria-label="Ouvrir le menu de navigation"
				>
					<svg class="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
						<path stroke-linecap="round" stroke-linejoin="round" d="M3.75 6.75h16.5M3.75 12h16.5m-16.5 5.25h16.5" />
					</svg>
				</button>

				<!-- Dynamic Page Title with Icon -->
				<div class="flex items-center gap-2.5">
					<div class="w-8 h-8 rounded-lg bg-indigo-50 dark:bg-indigo-950/60 border border-indigo-100 dark:border-indigo-900/50 flex items-center justify-center shrink-0">
						<svg class="w-4 h-4 text-indigo-600 dark:text-indigo-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="1.75" aria-hidden="true">
							<path stroke-linecap="round" stroke-linejoin="round" d={headerInfo.icon} />
						</svg>
					</div>
					<h1 class="text-lg sm:text-xl font-semibold text-gray-900 dark:text-white">{headerInfo.title}</h1>
				</div>
			</div>

			<!-- Right: Theme Toggle + User Info -->
			<div class="flex items-center gap-3 sm:gap-4">
				<!-- Theme Selector -->
				<ThemeToggle />

				<div class="h-5 w-px bg-gray-200 dark:bg-zinc-700 hidden sm:block"></div>

				<!-- User Profile Badge -->
				<div class="flex items-center gap-2.5 cursor-pointer">
					<div class="w-9 h-9 rounded-full bg-indigo-100 dark:bg-indigo-900/50 border-2 border-indigo-200 dark:border-indigo-700 flex items-center justify-center shrink-0 shadow-xs">
						<span class="text-xs font-bold text-indigo-600 dark:text-indigo-300">{userInitials}</span>
					</div>
					<div class="hidden md:block text-right">
						<p class="text-sm font-semibold text-gray-800 dark:text-zinc-200 leading-tight">{user?.name ?? 'Utilisateur'}</p>
						<p class="text-xs text-gray-500 dark:text-zinc-400 leading-tight">Technicien</p>
					</div>
				</div>
			</div>
		</header>

		<!-- Page content (Responsive Container) -->
		<main data-density={settings.density} class="flex-1 overflow-auto bg-gray-50 dark:bg-zinc-950 transition-colors duration-200">
			<div class="p-4 sm:p-6 lg:p-8">
				{@render children()}
			</div>
		</main>
	</div>
</div>
