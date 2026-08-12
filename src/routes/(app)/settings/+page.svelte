<script lang="ts">
	import { onMount } from 'svelte';
	import type { PageData } from './$types';
	import ThemeToggle from '$lib/components/ThemeToggle.svelte';
	import { getSettings, updateSettings, initSettings, type UserSettings } from '$lib/settings.svelte';
	import { playUrgentTicketAlert } from '$lib/sound';
	import { t } from '$lib/i18n.svelte';

	interface Props {
		data: PageData;
	}

	let { data }: Props = $props();

	const user = data.user;

	let savedMessageVisible = $state(false);
	let messageTimeout: ReturnType<typeof setTimeout>;

	onMount(() => {
		initSettings();
	});

	const settings = $derived(getSettings());

	function saveSetting<K extends keyof UserSettings>(key: K, value: UserSettings[K]) {
		updateSettings({ [key]: value });
		if (key === 'soundAlerts' && value === true) {
			playUrgentTicketAlert();
		}
		triggerSaveNotice();
	}

	function triggerSaveNotice() {
		savedMessageVisible = true;
		clearTimeout(messageTimeout);
		messageTimeout = setTimeout(() => {
			savedMessageVisible = false;
		}, 3000);
	}
</script>

<svelte:head>
	<title>{t('settings_title')} — TicketFlow</title>
	<meta name="description" content="Paramètres et préférences de l'application TicketFlow." />
</svelte:head>

<div class="max-w-4xl space-y-6 pb-8">

	<!-- ── Header ──────────────────────────────────────────────────── -->
	<div class="flex items-center justify-between">
		<div>
			<h2 class="text-2xl font-bold text-gray-900 dark:text-white">{t('settings_title')}</h2>
			<p class="text-sm text-gray-500 dark:text-zinc-400 mt-1">
				{t('settings_subtitle')}
			</p>
		</div>

		<!-- Notification de sauvegarde -->
		{#if savedMessageVisible}
			<div class="flex items-center gap-2 px-3.5 py-2 rounded-lg bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200 dark:border-emerald-800 text-emerald-700 dark:text-emerald-300 text-xs font-semibold animate-fade-in shadow-xs">
				<svg class="w-4 h-4 text-emerald-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2.5" aria-hidden="true">
					<path stroke-linecap="round" stroke-linejoin="round" d="m4.5 12.75 6 6 9-13.5" />
				</svg>
				{t('settings_saved')}
			</div>
		{/if}
	</div>

	<!-- ── CARD 1: Apparence & Thème ───────────────────────────────── -->
	<div class="bg-white dark:bg-zinc-900 rounded-xl border border-gray-200 dark:border-zinc-800 shadow-sm p-6 space-y-6 transition-colors duration-200">
		<div class="flex items-center justify-between pb-4 border-b border-gray-100 dark:border-zinc-800">
			<div>
				<h3 class="text-base font-semibold text-gray-900 dark:text-white flex items-center gap-2">
					<svg class="w-5 h-5 text-indigo-600 dark:text-indigo-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2" aria-hidden="true">
						<path stroke-linecap="round" stroke-linejoin="round" d="M4.098 19.902a3.75 3.75 0 0 0 5.304 0l6.401-6.402M16.5 6.5l-3.5 3.5m-3.5-3.5l3.5 3.5m0-7.5a3.75 3.75 0 0 1 5.304 5.304l-6.402 6.401a3.75 3.75 0 0 1-5.304 0l-6.401-6.402a3.75 3.75 0 0 1 0-5.304l6.401-6.402Z" />
					</svg>
					{t('appearance_title')}
				</h3>
				<p class="text-xs text-gray-500 dark:text-zinc-400 mt-0.5">{t('appearance_desc')}</p>
			</div>
		</div>

		<!-- Switch Thème (Système / Clair / Sombre) -->
		<div class="flex items-center justify-between py-1">
			<div>
				<label class="text-sm font-medium text-gray-800 dark:text-zinc-200">{t('theme_label')}</label>
				<p class="text-xs text-gray-500 dark:text-zinc-400 mt-0.5">
					{t('theme_desc')}
				</p>
			</div>
			<ThemeToggle />
		</div>

		<hr class="border-gray-100 dark:border-zinc-800" />

		<!-- Mode Densité -->
		<div class="flex items-center justify-between py-1">
			<div>
				<label for="select-density" class="text-sm font-medium text-gray-800 dark:text-zinc-200">{t('density_label')}</label>
				<p class="text-xs text-gray-500 dark:text-zinc-400 mt-0.5">{t('density_desc')}</p>
			</div>
			<select
				id="select-density"
				value={settings.density}
				onchange={(e) => saveSetting('density', (e.target as HTMLSelectElement).value as any)}
				class="px-3 py-2 text-xs font-medium rounded-lg border border-gray-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 text-gray-800 dark:text-zinc-200 focus:ring-2 focus:ring-indigo-500 cursor-pointer"
			>
				<option value="comfortable">{t('density_comfortable')}</option>
				<option value="compact">{t('density_compact')}</option>
			</select>
		</div>

		<hr class="border-gray-100 dark:border-zinc-800" />

		<!-- Vue par défaut des tickets -->
		<div class="flex items-center justify-between py-1">
			<div>
				<label for="select-view" class="text-sm font-medium text-gray-800 dark:text-zinc-200">{t('default_view_label')}</label>
				<p class="text-xs text-gray-500 dark:text-zinc-400 mt-0.5">{t('default_view_desc')}</p>
			</div>
			<select
				id="select-view"
				value={settings.defaultTicketsView}
				onchange={(e) => saveSetting('defaultTicketsView', (e.target as HTMLSelectElement).value as any)}
				class="px-3 py-2 text-xs font-medium rounded-lg border border-gray-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 text-gray-800 dark:text-zinc-200 focus:ring-2 focus:ring-indigo-500 cursor-pointer"
			>
				<option value="list">{t('view_list')}</option>
				<option value="grid">{t('view_grid')}</option>
			</select>
		</div>
	</div>

	<!-- ── CARD 2: Notifications & Alertes ─────────────────────────── -->
	<div class="bg-white dark:bg-zinc-900 rounded-xl border border-gray-200 dark:border-zinc-800 shadow-sm p-6 space-y-6 transition-colors duration-200">
		<div class="pb-4 border-b border-gray-100 dark:border-zinc-800">
			<h3 class="text-base font-semibold text-gray-900 dark:text-white flex items-center gap-2">
				<svg class="w-5 h-5 text-indigo-600 dark:text-indigo-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2" aria-hidden="true">
					<path stroke-linecap="round" stroke-linejoin="round" d="M14.857 17.082a23.848 23.848 0 0 0 5.454-1.31A8.967 8.967 0 0 1 18 9.75V9A6 6 0 0 0 6 9v.75a8.967 8.967 0 0 1-2.312 6.022c1.733.64 3.56 1.085 5.455 1.31m5.714 0a24.255 24.255 0 0 1-5.714 0m5.714 0a3 3 0 1 1-5.714 0" />
				</svg>
				{t('notifs_title')}
			</h3>
			<p class="text-xs text-gray-500 dark:text-zinc-400 mt-0.5">{t('notifs_desc')}</p>
		</div>

		<!-- Email Notifications -->
		<div class="flex items-center justify-between py-1">
			<div>
				<div class="flex items-center gap-2">
					<label for="toggle-email-notifs" class="text-sm font-medium text-gray-800 dark:text-zinc-200">{t('email_notifs_label')}</label>
					<span class="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold bg-amber-100 dark:bg-amber-950/70 text-amber-700 dark:text-amber-300 border border-amber-200 dark:border-amber-800/60">
						{t('upcoming')}
					</span>
				</div>
				<p class="text-xs text-gray-500 dark:text-zinc-400 mt-0.5">
					{t('email_notifs_desc')}
				</p>
			</div>
			<button
				type="button"
				id="toggle-email-notifs"
				role="switch"
				aria-checked={settings.emailNotifications}
				onclick={() => saveSetting('emailNotifications', !settings.emailNotifications)}
				class="relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-indigo-500
					{settings.emailNotifications ? 'bg-indigo-600' : 'bg-gray-200 dark:bg-zinc-700'}"
			>
				<span
					class="pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow-sm ring-0 transition duration-200 ease-in-out
						{settings.emailNotifications ? 'translate-x-5' : 'translate-x-0'}"
				></span>
			</button>
		</div>

		<hr class="border-gray-100 dark:border-zinc-800" />

		<!-- Alertes sonores -->
		<div class="flex items-center justify-between py-1">
			<div>
				<div class="flex items-center gap-2">
					<label for="toggle-sound-alerts" class="text-sm font-medium text-gray-800 dark:text-zinc-200">{t('sound_alerts_label')}</label>
					{#if settings.soundAlerts}
						<button
							type="button"
							onclick={playUrgentTicketAlert}
							class="text-[10px] font-semibold px-2 py-0.5 rounded-md bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 hover:bg-indigo-100 dark:hover:bg-indigo-900/60 transition-colors inline-flex items-center gap-1"
						>
							<svg class="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2" aria-hidden="true">
								<path stroke-linecap="round" stroke-linejoin="round" d="M19.114 5.636a9 9 0 0 1 0 12.728M16.463 8.287a6 6 0 0 1 0 8.426M12 6.75v10.5l-4.5-3.75H4.5v-3h3L12 6.75Z" />
							</svg>
							{t('test_sound')}
						</button>
					{/if}
				</div>
				<p class="text-xs text-gray-500 dark:text-zinc-400 mt-0.5">
					{t('sound_alerts_desc')}
				</p>
			</div>
			<button
				type="button"
				id="toggle-sound-alerts"
				role="switch"
				aria-checked={settings.soundAlerts}
				onclick={() => saveSetting('soundAlerts', !settings.soundAlerts)}
				class="relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-indigo-500
					{settings.soundAlerts ? 'bg-indigo-600' : 'bg-gray-200 dark:bg-zinc-700'}"
			>
				<span
					class="pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow-sm ring-0 transition duration-200 ease-in-out
						{settings.soundAlerts ? 'translate-x-5' : 'translate-x-0'}"
				></span>
			</button>
		</div>

		<hr class="border-gray-100 dark:border-zinc-800" />

		<!-- Auto Refresh -->
		<div class="flex items-center justify-between py-1">
			<div>
				<div class="flex items-center gap-2">
					<label for="toggle-auto-refresh" class="text-sm font-medium text-gray-800 dark:text-zinc-200">{t('auto_refresh_label')}</label>
					{#if settings.autoRefresh}
						<span class="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-100 dark:bg-emerald-950/70 text-emerald-700 dark:text-emerald-300">
							<span class="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-ping"></span>
							{t('active')}
						</span>
					{/if}
				</div>
				<p class="text-xs text-gray-500 dark:text-zinc-400 mt-0.5">
					{t('auto_refresh_desc')}
				</p>
			</div>
			<button
				type="button"
				id="toggle-auto-refresh"
				role="switch"
				aria-checked={settings.autoRefresh}
				onclick={() => saveSetting('autoRefresh', !settings.autoRefresh)}
				class="relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-indigo-500
					{settings.autoRefresh ? 'bg-indigo-600' : 'bg-gray-200 dark:bg-zinc-700'}"
			>
				<span
					class="pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow-sm ring-0 transition duration-200 ease-in-out
						{settings.autoRefresh ? 'translate-x-5' : 'translate-x-0'}"
				></span>
			</button>
		</div>
	</div>

	<!-- ── CARD 3: Langue & Région ─────────────────────────────────── -->
	<div class="bg-white dark:bg-zinc-900 rounded-xl border border-gray-200 dark:border-zinc-800 shadow-sm p-6 space-y-6 transition-colors duration-200">
		<div class="pb-4 border-b border-gray-100 dark:border-zinc-800">
			<h3 class="text-base font-semibold text-gray-900 dark:text-white flex items-center gap-2">
				<svg class="w-5 h-5 text-indigo-600 dark:text-indigo-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2" aria-hidden="true">
					<path stroke-linecap="round" stroke-linejoin="round" d="m10.5 21 5.25-11.25L21 21m-9-3h7.5M3 5.621a48.474 48.474 0 0 1 6-.371m0 0c1.12 0 2.233.038 3.334.114M9 5.25V3m3.334 2.364C11.176 10.658 7.69 15.08 3 17.5m10.5-12.25c-1.332 2.335-3.003 4.455-4.966 6.27" />
				</svg>
				{t('lang_title')}
			</h3>
			<p class="text-xs text-gray-500 dark:text-zinc-400 mt-0.5">{t('lang_desc')}</p>
		</div>

		<!-- Langue -->
		<div class="flex items-center justify-between py-1">
			<div>
				<label for="select-language" class="text-sm font-medium text-gray-800 dark:text-zinc-200">{t('lang_label')}</label>
				<p class="text-xs text-gray-500 dark:text-zinc-400 mt-0.5">{t('lang_subdesc')}</p>
			</div>
			<select
				id="select-language"
				value={settings.language}
				onchange={(e) => saveSetting('language', (e.target as HTMLSelectElement).value as any)}
				class="px-3 py-2 text-xs font-medium rounded-lg border border-gray-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 text-gray-800 dark:text-zinc-200 focus:ring-2 focus:ring-indigo-500 cursor-pointer"
			>
				<option value="fr-CA">Français 🇨🇦 (Par défaut)</option>
				<option value="en-CA">English 🇨🇦</option>
			</select>
		</div>

		<hr class="border-gray-100 dark:border-zinc-800" />

		<!-- Éléments par page -->
		<div class="flex items-center justify-between py-1">
			<div>
				<label for="select-items-per-page" class="text-sm font-medium text-gray-800 dark:text-zinc-200">{t('items_per_page_label')}</label>
				<p class="text-xs text-gray-500 dark:text-zinc-400 mt-0.5">{t('items_per_page_desc')}</p>
			</div>
			<select
				id="select-items-per-page"
				value={String(settings.itemsPerPage)}
				onchange={(e) => saveSetting('itemsPerPage', parseInt((e.target as HTMLSelectElement).value, 10) as any)}
				class="px-3 py-2 text-xs font-medium rounded-lg border border-gray-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 text-gray-800 dark:text-zinc-200 focus:ring-2 focus:ring-indigo-500 cursor-pointer"
			>
				<option value="10">10 / page</option>
				<option value="25">25 / page</option>
				<option value="50">50 / page</option>
			</select>
		</div>
	</div>

	<!-- ── CARD 4: Profil Technicien ───────────────────────────────── -->
	{#if user}
		{@const userId = user._id ?? user.id}
		<a
			href={userId ? `/team-members/${userId}` : '/team-members'}
			class="bg-indigo-50/70 dark:bg-indigo-950/40 hover:bg-indigo-100/80 dark:hover:bg-indigo-900/60 rounded-xl border border-indigo-100 dark:border-indigo-900/50 p-6 flex items-center justify-between transition-colors duration-200 cursor-pointer group shadow-2xs hover:shadow-xs"
			aria-label="Voir la fiche détaillée de {user.name}"
		>
			<div class="flex items-center gap-4">
				<div class="w-12 h-12 rounded-full bg-indigo-600 text-white font-bold text-base flex items-center justify-center shadow-md">
					{user.name.split(' ').map((n) => n[0]).join('').toUpperCase().slice(0, 2)}
				</div>
				<div>
					<h4 class="font-semibold text-gray-900 dark:text-white text-base group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors flex items-center gap-1.5">
						{user.name}
						<svg class="w-4 h-4 text-indigo-500 opacity-0 group-hover:opacity-100 transition-opacity" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
							<path stroke-linecap="round" stroke-linejoin="round" d="m8.25 4.5 7.5 7.5-7.5 7.5" />
						</svg>
					</h4>
					<p class="text-xs text-gray-500 dark:text-zinc-400 mt-0.5">{user.email}</p>
				</div>
			</div>
			<span class="px-3 py-1 rounded-full text-xs font-semibold bg-indigo-100 dark:bg-indigo-900/70 text-indigo-700 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800">
				{getSettings().language === 'en-CA' ? 'Technician Level' : 'Technicien Niveau'} {user.level}
			</span>
		</a>
	{/if}

</div>
