<script lang="ts">
	import type { PageData } from './$types';

	interface Props {
		data: PageData;
	}

	let { data }: Props = $props();

	let searchQuery = $state('');
	let selectedDepartment = $state('');
	let currentPage = $state(1);
	const pageSize = 10;

	// Palette d'avatars inspirée de la capture d'écran
	const avatarStyles = [
		'bg-emerald-100 dark:bg-emerald-950/70 text-emerald-700 dark:text-emerald-300',
		'bg-sky-100 dark:bg-sky-950/70 text-sky-700 dark:text-sky-300',
		'bg-pink-100 dark:bg-pink-950/70 text-pink-700 dark:text-pink-300',
		'bg-cyan-100 dark:bg-cyan-950/70 text-cyan-700 dark:text-cyan-300',
		'bg-purple-100 dark:bg-purple-950/70 text-purple-700 dark:text-purple-300',
		'bg-indigo-100 dark:bg-indigo-950/70 text-indigo-700 dark:text-indigo-300',
		'bg-amber-100 dark:bg-amber-950/70 text-amber-700 dark:text-amber-300'
	];

	function getAvatarStyle(name: string): string {
		let h = 0;
		for (let i = 0; i < name.length; i++) {
			h = (h * 31 + name.charCodeAt(i)) % avatarStyles.length;
		}
		return avatarStyles[Math.abs(h)];
	}

	function getInitials(name: string): string {
		const parts = name.trim().split(' ');
		if (parts.length >= 2) {
			return (parts[0][0] + parts[1][0]).toUpperCase();
		}
		return name.slice(0, 2).toUpperCase();
	}

	// Filtres réactifs Svelte 5 ($derived direct)
	const filteredMembers = $derived(
		(data.members ?? []).filter((m) => {
			const matchesSearch =
				searchQuery === '' ||
				m.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
				m.email.toLowerCase().includes(searchQuery.toLowerCase());
			const matchesDept =
				selectedDepartment === '' || m.department === selectedDepartment;
			return matchesSearch && matchesDept;
		})
	);

	const totalPages = $derived(Math.ceil(filteredMembers.length / pageSize) || 1);

	const paginatedMembers = $derived(
		filteredMembers.slice((currentPage - 1) * pageSize, currentPage * pageSize)
	);

	const departments = ['IT', 'Executive Team', 'HR', 'Finance', 'Support Technique'];
</script>

<svelte:head>
	<title>Team Members — TicketFlow</title>
	<meta name="description" content="Gestion des membres de l'équipe et techniciens TicketFlow." />
</svelte:head>

<div class="space-y-6">

	<!-- ── Header & CTA Button ──────────────────────────────────────── -->
	<div class="flex items-center justify-between">
		<h2 class="text-2xl font-bold text-gray-900 dark:text-white">Team Members</h2>
		<a
			href="/register"
			id="btn-add-member"
			class="inline-flex items-center gap-2 px-4 py-2.5 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-semibold transition-colors duration-200 shadow-sm"
		>
			<svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2.5" aria-hidden="true">
				<path stroke-linecap="round" stroke-linejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
			</svg>
			Add Member
		</a>
	</div>

	<!-- ── Table Container ─────────────────────────────────────────── -->
	<div class="bg-white dark:bg-zinc-900 rounded-xl border border-gray-200 dark:border-zinc-800 shadow-sm transition-colors duration-200">

		<!-- Filter Bar -->
		<div class="flex flex-wrap items-center gap-3 px-5 py-4 border-b border-gray-100 dark:border-zinc-800">
			<!-- Search bar -->
			<div class="relative flex-1 min-w-[200px] max-w-xs">
				<svg class="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 dark:text-zinc-500 pointer-events-none" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="1.75" aria-hidden="true">
					<path stroke-linecap="round" stroke-linejoin="round" d="m21 21-5.197-5.197m0 0A7.5 7.5 0 1 0 5.196 5.196a7.5 7.5 0 0 0 10.607 10.607Z" />
				</svg>
				<input
					type="text"
					bind:value={searchQuery}
					placeholder="Search members..."
					id="search-members"
					class="w-full pl-9 pr-3 py-2 text-sm rounded-lg border border-gray-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 text-gray-800 dark:text-zinc-200 placeholder:text-gray-400 dark:placeholder:text-zinc-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-colors"
				/>
			</div>

			<!-- Department Dropdown -->
			<div class="relative">
				<select
					bind:value={selectedDepartment}
					id="filter-department"
					class="appearance-none pl-3 pr-8 py-2 text-sm rounded-lg border border-gray-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 text-gray-700 dark:text-zinc-300 focus:outline-none focus:ring-2 focus:ring-indigo-500 cursor-pointer transition-colors"
				>
					<option value="">All Departments</option>
					{#each departments as dept}
						<option value={dept}>{dept}</option>
					{/each}
				</select>
				<svg class="absolute right-2.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 dark:text-zinc-500 pointer-events-none" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2" aria-hidden="true">
					<path stroke-linecap="round" stroke-linejoin="round" d="m19.5 8.25-7.5 7.5-7.5-7.5" />
				</svg>
			</div>
		</div>

		<!-- Members Table -->
		{#if paginatedMembers.length === 0}
			<div class="py-16 text-center">
				<svg class="w-10 h-10 text-gray-300 dark:text-zinc-600 mx-auto mb-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="1.5" aria-hidden="true">
					<path stroke-linecap="round" stroke-linejoin="round" d="M15 19.128a9.38 9.38 0 0 0 2.625.372 9.337 9.337 0 0 0 4.121-.952 4.125 4.125 0 0 0-7.533-2.493M15 19.128v-.003c0-1.113-.285-2.16-.786-3.07M15 19.128v.106A12.318 12.318 0 0 1 8.624 21c-2.331 0-4.512-.645-6.374-1.766l-.001-.109a6.375 6.375 0 0 1 11.964-3.07M12 6.375a3.375 3.375 0 1 1-6.75 0 3.375 3.375 0 0 1 6.75 0Zm8.25 2.25a2.625 2.625 0 1 1-5.25 0 2.625 2.625 0 0 1 5.25 0Z" />
				</svg>
				<p class="text-gray-500 dark:text-zinc-400 text-sm">Aucun membre trouvé.</p>
				<a href="/register" class="text-indigo-600 dark:text-indigo-400 text-sm hover:underline mt-1 inline-block">Ajouter un membre →</a>
			</div>
		{:else}
			<div class="overflow-x-auto">
				<table class="w-full text-sm" aria-label="Liste des membres de l'équipe">
					<thead>
						<tr class="text-left text-xs font-medium text-gray-400 dark:text-zinc-500 border-b border-gray-100 dark:border-zinc-800">
							<th class="px-5 py-3.5">Member</th>
							<th class="px-4 py-3.5">Department</th>
							<th class="px-4 py-3.5">Role</th>
							<th class="px-4 py-3.5">Status</th>
							<th class="px-4 py-3.5">Action</th>
						</tr>
					</thead>
					<tbody class="divide-y divide-gray-100 dark:divide-zinc-800">
						{#each paginatedMembers as member (member._id)}
							<tr class="hover:bg-gray-50 dark:hover:bg-zinc-800/50 transition-colors duration-100">
								<!-- Member (Avatar + Name + Email) -->
								<td class="px-5 py-3.5">
									<div class="flex items-center gap-3">
										<!-- Avatar Badge -->
										<div class="w-9 h-9 rounded-full {getAvatarStyle(member.name)} flex items-center justify-center shrink-0 font-semibold text-xs shadow-xs">
											{getInitials(member.name)}
										</div>
										<div>
											<p class="font-medium text-gray-900 dark:text-zinc-100 leading-tight">{member.name}</p>
											<p class="text-xs text-gray-400 dark:text-zinc-500 leading-tight mt-0.5">{member.email}</p>
										</div>
									</div>
								</td>

								<!-- Department -->
								<td class="px-4 py-3.5 text-gray-700 dark:text-zinc-300 font-normal">
									{member.department}
								</td>

								<!-- Role -->
								<td class="px-4 py-3.5 text-gray-700 dark:text-zinc-300 font-normal">
									{member.roleTitle}
								</td>

								<!-- Status Badge -->
								<td class="px-4 py-3.5">
									{#if member.status === 'Active'}
										<span class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-emerald-100 dark:bg-emerald-950/70 text-emerald-600 dark:text-emerald-400">
											Active
										</span>
									{:else}
										<span class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 dark:bg-red-950/70 text-red-600 dark:text-red-400">
											Inactive
										</span>
									{/if}
								</td>

								<!-- Action Icons -->
								<td class="px-4 py-3.5">
									<div class="flex items-center gap-2.5 text-gray-400 dark:text-zinc-500">
										<!-- View -->
										<button class="hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors" aria-label="Voir les détails">
											<svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="1.75" aria-hidden="true">
												<path stroke-linecap="round" stroke-linejoin="round" d="M2.036 12.322a1.012 1.012 0 0 1 0-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178Z" />
												<path stroke-linecap="round" stroke-linejoin="round" d="M15 12a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z" />
											</svg>
										</button>
										<!-- Edit -->
										<button class="hover:text-amber-500 transition-colors" aria-label="Modifier le membre">
											<svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="1.75" aria-hidden="true">
												<path stroke-linecap="round" stroke-linejoin="round" d="m16.862 4.487 1.687-1.688a1.875 1.875 0 1 1 2.652 2.652L10.582 16.07a4.5 4.5 0 0 1-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 0 1 1.13-1.897l8.932-8.931Zm0 0L19.5 7.125" />
											</svg>
										</button>
										<!-- Delete -->
										<button class="hover:text-red-500 transition-colors" aria-label="Supprimer le membre">
											<svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="1.75" aria-hidden="true">
												<path stroke-linecap="round" stroke-linejoin="round" d="m14.74 9-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 0 1-2.244 2.077H8.084a2.25 2.25 0 0 1-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 0 0-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 0 1 3.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 0 0-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 0 0-7.5 0" />
											</svg>
										</button>
									</div>
								</td>
							</tr>
						{/each}
					</tbody>
				</table>
			</div>

			<!-- Pagination Footer -->
			<div class="px-5 py-4 border-t border-gray-100 dark:border-zinc-800 flex items-center justify-between">
				<!-- Previous -->
				<button
					onclick={() => (currentPage = Math.max(1, currentPage - 1))}
					disabled={currentPage === 1}
					class="flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium text-gray-600 dark:text-zinc-400 hover:text-gray-900 dark:hover:text-zinc-100 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
				>
					<svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2" aria-hidden="true">
						<path stroke-linecap="round" stroke-linejoin="round" d="M15.75 19.5 8.25 12l7.5-7.5" />
					</svg>
					Previous
				</button>

				<!-- Page Numbers -->
				<div class="flex items-center gap-1">
					{#each Array.from({ length: Math.max(1, totalPages) }, (_, i) => i + 1) as p}
						<button
							onclick={() => (currentPage = p)}
							class="
								w-8 h-8 rounded-lg text-sm font-medium transition-colors duration-100
								{currentPage === p
									? 'bg-indigo-600 text-white font-semibold'
									: 'text-gray-600 dark:text-zinc-400 hover:bg-gray-100 dark:hover:bg-zinc-800 hover:text-gray-900 dark:hover:text-zinc-100'}
							"
							aria-current={currentPage === p ? 'page' : undefined}
						>
							{p}
						</button>
					{/each}
				</div>

				<!-- Next -->
				<button
					onclick={() => (currentPage = Math.min(totalPages, currentPage + 1))}
					disabled={currentPage === totalPages}
					class="flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium text-gray-600 dark:text-zinc-400 hover:text-gray-900 dark:hover:text-zinc-100 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
				>
					Next
					<svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2" aria-hidden="true">
						<path stroke-linecap="round" stroke-linejoin="round" d="m8.25 4.5 7.5 7.5-7.5 7.5" />
					</svg>
				</button>
			</div>
		{/if}
	</div>

</div>
