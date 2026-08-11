<!-- Groupe (auth) : layout centré pour les pages login/register -->
<script lang="ts">
	import type { Snippet } from 'svelte';

	interface Props {
		children: Snippet;
	}

	let { children }: Props = $props();
</script>

<div class="min-h-screen flex items-center justify-center bg-zinc-950 p-4">
	<!-- Grille décorative en arrière-plan -->
	<div
		class="absolute inset-0 bg-[linear-gradient(to_right,#ffffff08_1px,transparent_1px),linear-gradient(to_bottom,#ffffff08_1px,transparent_1px)] bg-[size:48px_48px] pointer-events-none"
		aria-hidden="true"
	></div>
	<!-- Glow violet centré -->
	<div
		class="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 rounded-full bg-indigo-600/10 blur-3xl pointer-events-none"
		aria-hidden="true"
	></div>

	<div class="relative z-10 w-full max-w-md">
		<!-- Logo / Marque -->
		<div class="text-center mb-8">
			<div class="inline-flex items-center gap-2.5 mb-3">
				<div class="w-9 h-9 rounded-xl bg-indigo-600 flex items-center justify-center shadow-lg shadow-indigo-500/30">
					<svg class="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2.5">
						<path stroke-linecap="round" stroke-linejoin="round" d="M16.5 6v.75m0 3v.75m0 3v.75m0 3V18m-9-5.25h5.25M7.5 15h3M3.375 5.25c-.621 0-1.125.504-1.125 1.125v3.026a2.999 2.999 0 0 1 0 5.198v3.026c0 .621.504 1.125 1.125 1.125h17.25c.621 0 1.125-.504 1.125-1.125v-3.026a3 3 0 0 1 0-5.198V6.375c0-.621-.504-1.125-1.125-1.125H3.375Z" />
					</svg>
				</div>
				<span class="text-xl font-bold text-white tracking-tight">TicketFlow</span>
			</div>
		</div>

		{@render children()}
	</div>
</div>
