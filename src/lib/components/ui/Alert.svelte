<script lang="ts">
	import type { Snippet } from 'svelte';

	type AlertVariant = 'error' | 'success' | 'warning' | 'info';

	interface Props {
		variant?: AlertVariant;
		title?: string;
		children: Snippet;
		dismissible?: boolean;
		class?: string;
	}

	let {
		variant = 'error',
		title = '',
		children,
		dismissible = false,
		class: className = ''
	}: Props = $props();

	let visible = $state(true);

	const styles: Record<AlertVariant, { wrapper: string; icon: string }> = {
		error: {
			wrapper: 'bg-red-50 dark:bg-red-500/10 border-red-200 dark:border-red-500/30 text-red-800 dark:text-red-300',
			icon: 'text-red-500 dark:text-red-400'
		},
		success: {
			wrapper: 'bg-green-50 dark:bg-emerald-500/10 border-green-200 dark:border-emerald-500/30 text-green-800 dark:text-emerald-300',
			icon: 'text-green-500 dark:text-emerald-400'
		},
		warning: {
			wrapper: 'bg-amber-50 dark:bg-amber-500/10 border-amber-200 dark:border-amber-500/30 text-amber-800 dark:text-amber-300',
			icon: 'text-amber-500 dark:text-amber-400'
		},
		info: {
			wrapper: 'bg-indigo-50 dark:bg-indigo-500/10 border-indigo-200 dark:border-indigo-500/30 text-indigo-800 dark:text-indigo-300',
			icon: 'text-indigo-500 dark:text-indigo-400'
		}
	};

	const icons: Record<AlertVariant, string> = {
		error:
			'M18 10A8 8 0 1 1 2 10a8 8 0 0 1 16 0Zm-8-5a.75.75 0 0 1 .75.75v4.5a.75.75 0 0 1-1.5 0v-4.5A.75.75 0 0 1 10 5Zm0 10a1 1 0 1 0 0-2 1 1 0 0 0 0 2Z',
		success:
			'M10 18a8 8 0 1 0 0-16 8 8 0 0 0 0 16Zm3.857-9.809a.75.75 0 0 0-1.214-.882l-3.483 4.79-1.88-1.88a.75.75 0 1 0-1.06 1.061l2.5 2.5a.75.75 0 0 0 1.137-.089l4-5.5Z',
		warning:
			'M8.485 2.495c.673-1.167 2.357-1.167 3.03 0l6.28 10.875c.673 1.167-.17 2.625-1.516 2.625H3.72c-1.347 0-2.189-1.458-1.515-2.625L8.485 2.495ZM10 5a.75.75 0 0 1 .75.75v3.5a.75.75 0 0 1-1.5 0v-3.5A.75.75 0 0 1 10 5Zm0 9a1 1 0 1 0 0-2 1 1 0 0 0 0 2Z',
		info: 'M18 10A8 8 0 1 1 2 10a8 8 0 0 1 16 0Zm-7-4a1 1 0 1 1-2 0 1 1 0 0 1 2 0ZM9 9a.75.75 0 0 0 0 1.5h.253a.25.25 0 0 1 .244.304l-.459 2.066A1.75 1.75 0 0 0 10.747 15H11a.75.75 0 0 0 0-1.5h-.253a.25.25 0 0 1-.244-.304l.459-2.066A1.75 1.75 0 0 0 9.253 9H9Z'
	};
</script>

{#if visible}
	<div
		role="alert"
		class="flex gap-3 items-start rounded-lg border px-4 py-3 text-sm {styles[variant]
			.wrapper} {className}"
	>
		<svg
			class="w-5 h-5 shrink-0 mt-0.5 {styles[variant].icon}"
			fill="currentColor"
			viewBox="0 0 20 20"
			aria-hidden="true"
		>
			<path fill-rule="evenodd" d={icons[variant]} clip-rule="evenodd" />
		</svg>

		<div class="flex-1 min-w-0">
			{#if title}
				<p class="font-semibold mb-0.5">{title}</p>
			{/if}
			<div class="opacity-90">{@render children()}</div>
		</div>

		{#if dismissible}
			<button
				onclick={() => (visible = false)}
				class="shrink-0 opacity-60 hover:opacity-100 transition-opacity"
				aria-label="Fermer"
			>
				<svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
					<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
				</svg>
			</button>
		{/if}
	</div>
{/if}
