<script lang="ts">
	import { enhance } from '$app/forms';
	import type { ActionData } from './$types';
	import Button from '$lib/components/ui/Button.svelte';
	import Input from '$lib/components/ui/Input.svelte';
	import Alert from '$lib/components/ui/Alert.svelte';

	interface Props {
		form: ActionData;
	}

	let { form }: Props = $props();

	let loading = $state(false);
	let email = $state('');
	let name = $state('');
	let level = $state('1');
	let password = $state('');
	let confirmPassword = $state('');

	$effect(() => {
		if (form?.email) email = form.email;
		if (form?.name) name = form.name;
		if (form?.level) level = form.level;
	});

	const fieldErrors = $derived((form?.errors as Record<string, string>) ?? {});
</script>

<svelte:head>
	<title>Créer un compte — TicketFlow</title>
	<meta name="description" content="Créez votre compte technicien TicketFlow." />
</svelte:head>

<div class="bg-white dark:bg-zinc-900/90 backdrop-blur-sm border border-gray-200 dark:border-zinc-800/80 rounded-2xl p-8 shadow-xl dark:shadow-black/40 transition-colors duration-200">
	<div class="mb-6">
		<h1 class="text-xl font-bold text-gray-900 dark:text-white">Créer un compte</h1>
		<p class="text-sm text-gray-500 dark:text-zinc-400 mt-1">Rejoignez l'équipe TicketFlow.</p>
	</div>

	{#if form?.formError}
		<Alert variant="error" class="mb-5">
			{form.formError}
		</Alert>
	{/if}

	<form
		method="POST"
		use:enhance={() => {
			loading = true;
			return async ({ update }) => {
				await update();
				loading = false;
			};
		}}
		class="space-y-4"
		novalidate
	>
		<!-- Nom complet -->
		<Input
			id="name"
			label="Nom complet"
			type="text"
			bind:value={name}
			name="name"
			placeholder="Jean Dupont"
			required
			autocomplete="name"
			error={fieldErrors.name ?? ''}
		/>

		<!-- Email -->
		<Input
			id="email"
			label="Adresse email"
			type="email"
			bind:value={email}
			name="email"
			placeholder="vous@exemple.com"
			required
			autocomplete="email"
			error={fieldErrors.email ?? ''}
		/>

		<!-- Niveau -->
		<div class="flex flex-col gap-1.5">
			<label for="level" class="text-sm font-medium text-gray-700 dark:text-zinc-300">
				Niveau technique
				<span class="text-indigo-600 dark:text-indigo-400 ml-0.5" aria-hidden="true">*</span>
			</label>
			<select
				id="level"
				name="level"
				bind:value={level}
				required
				class="
					w-full rounded-lg px-3.5 py-2.5 text-sm
					bg-white dark:bg-zinc-900 border transition-all duration-200
					text-gray-900 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent
					{fieldErrors.level ? 'border-red-500 dark:border-red-500/70' : 'border-gray-300 dark:border-zinc-700 hover:border-gray-400 dark:hover:border-zinc-600'}
				"
			>
				{#each [1, 2, 3] as n}
					<option value={String(n)}>Niveau {n}</option>
				{/each}
			</select>
			{#if fieldErrors.level}
				<p class="text-xs text-red-600 dark:text-red-400 flex items-center gap-1" role="alert">
					{fieldErrors.level}
				</p>
			{/if}
			<p class="text-xs text-gray-500 dark:text-zinc-400">1 = Débutant · 2 = Intermédiaire · 3 = Expert</p>
		</div>

		<!-- Mot de passe -->
		<Input
			id="password"
			label="Mot de passe"
			type="password"
			bind:value={password}
			name="password"
			placeholder="••••••••"
			required
			autocomplete="new-password"
			hint="Minimum 8 caractères"
			error={fieldErrors.password ?? ''}
		/>

		<!-- Confirmation -->
		<Input
			id="confirmPassword"
			label="Confirmer le mot de passe"
			type="password"
			bind:value={confirmPassword}
			name="confirmPassword"
			placeholder="••••••••"
			required
			autocomplete="new-password"
			error={fieldErrors.confirmPassword ?? ''}
		/>

		<div class="pt-1">
			<Button type="submit" variant="primary" size="lg" {loading} class="w-full">
				{loading ? 'Création en cours…' : 'Créer mon compte'}
			</Button>
		</div>
	</form>

	<p class="text-sm text-gray-500 dark:text-zinc-400 text-center mt-6">
		Déjà un compte ?
		<a href="/login" class="text-indigo-600 dark:text-indigo-400 hover:underline font-medium transition-colors">
			Se connecter
		</a>
	</p>
</div>
