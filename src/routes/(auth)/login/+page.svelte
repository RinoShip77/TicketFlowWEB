<script lang="ts">
	import { enhance } from '$app/forms';
	import { page } from '$app/state';
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
	let password = $state('');

	$effect(() => {
		if (form?.email) {
			email = form.email;
		}
	});

	// Erreurs de champ
	const fieldErrors = $derived((form?.errors as Record<string, string>) ?? {});
	const justRegistered = $derived(page.url.searchParams.get('registered') === 'true');
</script>

<svelte:head>
	<title>Connexion — TicketFlow</title>
	<meta name="description" content="Connectez-vous à TicketFlow pour gérer vos tickets de support." />
</svelte:head>

<div class="bg-white dark:bg-zinc-900/90 backdrop-blur-sm border border-gray-200 dark:border-zinc-800/80 rounded-2xl p-8 shadow-xl dark:shadow-black/40 transition-colors duration-200">
	<div class="mb-6">
		<h1 class="text-xl font-bold text-gray-900 dark:text-white">Connexion</h1>
		<p class="text-sm text-gray-500 dark:text-zinc-400 mt-1">Accédez à votre espace technicien.</p>
	</div>

	{#if justRegistered}
		<Alert variant="success" class="mb-5">
			Compte créé avec succès ! Vous pouvez maintenant vous connecter.
		</Alert>
	{/if}

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

		<Input
			id="password"
			label="Mot de passe"
			type="password"
			bind:value={password}
			name="password"
			placeholder="••••••••"
			required
			autocomplete="current-password"
			error={fieldErrors.password ?? ''}
		/>

		<div class="pt-1">
			<Button type="submit" variant="primary" size="lg" {loading} class="w-full">
				{loading ? 'Connexion en cours…' : 'Se connecter'}
			</Button>
		</div>
	</form>

	<p class="text-sm text-gray-500 dark:text-zinc-400 text-center mt-6">
		Pas encore de compte ?
		<a href="/register" class="text-indigo-600 dark:text-indigo-400 hover:underline font-medium transition-colors">
			Créer un compte
		</a>
	</p>
</div>
