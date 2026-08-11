<script lang="ts">
	import { onMount } from 'svelte';
	import { getTheme, setTheme, initTheme, type ThemeOption } from '$lib/theme.svelte';

	interface Props {
		class?: string;
		compact?: boolean;
	}

	let { class: className = '', compact = false }: Props = $props();

	onMount(() => {
		initTheme();
	});

	const currentTheme = $derived(getTheme());

	const options: { id: ThemeOption; label: string; icon: string }[] = [
		{
			id: 'system',
			label: 'Système',
			icon: 'M9 17.25v1.007a3 3 0 0 1-.879 2.122L7.5 21h9l-.621-.621A3 3 0 0 1 15 18.257V17.25m6-12V15a2.25 2.25 0 0 1-2.25 2.25H5.25A2.25 2.25 0 0 1 3 15V5.25m18 0A2.25 2.25 0 0 0 18.75 3H5.25A2.25 2.25 0 0 0 3 5.25m18 0v8.25a2.25 2.25 0 0 1-2.25 2.25H5.25A2.25 2.25 0 0 1 3 13.5V5.25'
		},
		{
			id: 'light',
			label: 'Clair',
			icon: 'M12 3v2.25m0 13.5V21m8.966-8.966h-2.25m-13.5 0h-2.25m15.356-6.856-1.591 1.59m-12 12-1.591 1.59m15.182 0-1.591-1.591m-12-12-1.591-1.591M12 8.25a3.75 3.75 0 1 0 0 7.5 3.75 3.75 0 0 0 0-7.5Z'
		},
		{
			id: 'dark',
			label: 'Sombre',
			icon: 'M21.752 15.002A9.72 9.72 0 0 1 18 15.75c-5.385 0-9.75-4.365-9.75-9.75 0-1.33.266-2.597.748-3.752A9.753 9.753 0 0 0 3 11.25C3 16.635 7.365 21 12.75 21a9.753 9.753 0 0 0 9.002-5.998Z'
		}
	];
</script>

<div
	class="inline-flex items-center p-1 rounded-xl bg-gray-200/70 dark:bg-zinc-800/80 border border-gray-300/60 dark:border-zinc-700/60 backdrop-blur-sm transition-colors {className}"
	role="radiogroup"
	aria-label="Sélection du thème"
>
	{#each options as opt}
		{@const active = currentTheme === opt.id}
		<button
			type="button"
			role="radio"
			aria-checked={active}
			onclick={() => setTheme(opt.id)}
			title="Thème {opt.label}"
			class="
				flex items-center gap-1.5 rounded-lg text-xs font-medium transition-all duration-200
				{compact ? 'px-2 py-1' : 'px-2.5 py-1.5'}
				{active
					? 'bg-white dark:bg-zinc-700 text-indigo-600 dark:text-indigo-400 shadow-sm border border-black/5 dark:border-white/10 font-semibold'
					: 'text-gray-600 dark:text-zinc-400 hover:text-gray-900 dark:hover:text-zinc-200 hover:bg-black/5 dark:hover:bg-white/5'}
			"
		>
			<svg class="w-3.5 h-3.5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2" aria-hidden="true">
				<path stroke-linecap="round" stroke-linejoin="round" d={opt.icon} />
			</svg>
			{#if !compact}
				<span>{opt.label}</span>
			{/if}
		</button>
	{/each}
</div>
