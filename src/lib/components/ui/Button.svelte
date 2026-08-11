<script lang="ts">
	import type { Snippet } from 'svelte';

	type Variant = 'primary' | 'secondary' | 'danger' | 'ghost';
	type Size = 'sm' | 'md' | 'lg';

	interface Props {
		variant?: Variant;
		size?: Size;
		type?: 'button' | 'submit' | 'reset';
		disabled?: boolean;
		loading?: boolean;
		class?: string;
		children: Snippet;
		onclick?: () => void;
	}

	let {
		variant = 'primary',
		size = 'md',
		type = 'button',
		disabled = false,
		loading = false,
		class: className = '',
		children,
		onclick
	}: Props = $props();

	const base =
		'inline-flex items-center justify-center gap-2 font-semibold rounded-lg transition-all duration-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-offset-white dark:focus-visible:ring-offset-zinc-950 disabled:opacity-50 disabled:cursor-not-allowed active:scale-[0.98]';

	const variants: Record<Variant, string> = {
		primary:
			'bg-indigo-600 hover:bg-indigo-700 dark:hover:bg-indigo-500 text-white focus-visible:ring-indigo-500 shadow-sm dark:shadow-indigo-500/20',
		secondary:
			'bg-white dark:bg-zinc-800 hover:bg-gray-50 dark:hover:bg-zinc-700 text-gray-800 dark:text-zinc-100 border border-gray-300 dark:border-zinc-700 focus-visible:ring-gray-400 dark:focus-visible:ring-zinc-500',
		danger:
			'bg-red-600 hover:bg-red-700 dark:hover:bg-red-500 text-white focus-visible:ring-red-500 shadow-sm dark:shadow-red-500/20',
		ghost:
			'bg-transparent hover:bg-gray-100 dark:hover:bg-zinc-800 text-gray-600 dark:text-zinc-400 hover:text-gray-900 dark:hover:text-zinc-100 focus-visible:ring-gray-400 dark:focus-visible:ring-zinc-500'
	};

	const sizes: Record<Size, string> = {
		sm: 'px-3 py-1.5 text-sm',
		md: 'px-4 py-2.5 text-sm',
		lg: 'px-6 py-3 text-base'
	};
</script>

<button
	{type}
	class="{base} {variants[variant]} {sizes[size]} {className}"
	disabled={disabled || loading}
	{onclick}
>
	{#if loading}
		<svg
			class="animate-spin h-4 w-4"
			xmlns="http://www.w3.org/2000/svg"
			fill="none"
			viewBox="0 0 24 24"
			aria-hidden="true"
		>
			<circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4" />
			<path
				class="opacity-75"
				fill="currentColor"
				d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
			/>
		</svg>
	{/if}
	{@render children()}
</button>
