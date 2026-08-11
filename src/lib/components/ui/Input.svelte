<script lang="ts">
	interface Props {
		id: string;
		name?: string;
		label: string;
		type?: 'text' | 'email' | 'password' | 'number';
		value?: string | number;
		placeholder?: string;
		required?: boolean;
		autocomplete?: string;
		error?: string;
		hint?: string;
		class?: string;
	}

	let {
		id,
		name,
		label,
		type = 'text',
		value = $bindable(''),
		placeholder = '',
		required = false,
		autocomplete,
		error = '',
		hint = '',
		class: className = ''
	}: Props = $props();
</script>

<div class="flex flex-col gap-1.5 {className}">
	<label for={id} class="text-sm font-medium text-zinc-300">
		{label}
		{#if required}
			<span class="text-indigo-400 ml-0.5" aria-hidden="true">*</span>
		{/if}
	</label>

	<input
		{id}
		name={name || id}
		{type}
		{placeholder}
		{required}
		{autocomplete}
		bind:value
		aria-describedby={error ? `${id}-error` : hint ? `${id}-hint` : undefined}
		aria-invalid={!!error}
		class="
			w-full rounded-lg px-3.5 py-2.5 text-sm
			bg-zinc-900 border transition-all duration-200
			text-zinc-100 placeholder:text-zinc-600
			focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent
			{error
			? 'border-red-500/70 focus:ring-red-500'
			: 'border-zinc-700/60 hover:border-zinc-600'}
		"
	/>

	{#if error}
		<p id="{id}-error" class="text-xs text-red-400 flex items-center gap-1" role="alert">
			<svg class="w-3.5 h-3.5 shrink-0" fill="currentColor" viewBox="0 0 20 20" aria-hidden="true">
				<path
					fill-rule="evenodd"
					d="M18 10A8 8 0 1 1 2 10a8 8 0 0 1 16 0Zm-8-5a.75.75 0 0 1 .75.75v4.5a.75.75 0 0 1-1.5 0v-4.5A.75.75 0 0 1 10 5Zm0 10a1 1 0 1 0 0-2 1 1 0 0 0 0 2Z"
					clip-rule="evenodd"
				/>
			</svg>
			{error}
		</p>
	{:else if hint}
		<p id="{id}-hint" class="text-xs text-zinc-500">{hint}</p>
	{/if}
</div>
