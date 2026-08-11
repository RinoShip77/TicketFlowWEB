<script lang="ts">
	import type { PageData } from './$types';
	import type { Ticket, TicketStatus, TicketPriority, DepartmentStat } from '$lib/types';
	import { getResolvedTheme } from '$lib/theme.svelte';

	interface Props {
		data: PageData;
	}

	let { data }: Props = $props();

	const { stats, tickets, user } = data;
	const firstName = user?.name?.split(' ')[0] ?? 'là';

	const resolvedTheme = $derived(getResolvedTheme());

	// ── Status badge ────────────────────────────────────────────────
	function statusBadge(status: TicketStatus) {
		const map: Record<TicketStatus, { label: string; color: string }> = {
			Open:          { label: 'Open',        color: 'text-blue-600 dark:text-blue-400' },
			'In progress': { label: 'In Progress', color: 'text-purple-600 dark:text-purple-400' },
			Resolved:      { label: 'Resolved',    color: 'text-green-600 dark:text-emerald-400' },
			Closed:        { label: 'Closed',      color: 'text-red-600 dark:text-red-400' }
		};
		return map[status] ?? { label: status, color: 'text-gray-500 dark:text-zinc-400' };
	}

	function formatDate(iso: string) {
		return new Intl.DateTimeFormat('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }).format(new Date(iso));
	}

	function avatarInitial(name: string) {
		return name.charAt(0).toUpperCase();
	}

	// Avatar color pool
	const avatarColors = [
		'bg-indigo-100 dark:bg-indigo-900/40 text-indigo-700 dark:text-indigo-300',
		'bg-purple-100 dark:bg-purple-900/40 text-purple-700 dark:text-purple-300',
		'bg-pink-100 dark:bg-pink-900/40 text-pink-700 dark:text-pink-300',
		'bg-orange-100 dark:bg-orange-900/40 text-orange-700 dark:text-orange-300',
		'bg-teal-100 dark:bg-teal-900/40 text-teal-700 dark:text-teal-300',
		'bg-green-100 dark:bg-green-900/40 text-green-700 dark:text-green-300'
	];
	function avatarColor(name: string): string {
		let h = 0;
		for (const c of name) h = (h * 31 + c.charCodeAt(0)) % avatarColors.length;
		return avatarColors[Math.abs(h)];
	}

	// ── Donut chart (SVG) — Category Analytics ─────────────────────
	const donutDepts = $derived(() => {
		if (!stats?.departments) return [];
		const total = stats.overview.total;
		const palette = ['#4f46e5', '#a855f7', '#f59e0b', '#10b981', '#3b82f6', '#ef4444'];
		let startAngle = -90;
		return stats.departments.slice(0, 5).map((d: DepartmentStat, i: number) => {
			const pct = d.count / total;
			const angle = pct * 360;
			const endAngle = startAngle + angle;
			const r = 60;
			const cx = 70;
			const cy = 70;
			const toRad = (deg: number) => (deg * Math.PI) / 180;
			const x1 = cx + r * Math.cos(toRad(startAngle));
			const y1 = cy + r * Math.sin(toRad(startAngle));
			const x2 = cx + r * Math.cos(toRad(endAngle));
			const y2 = cy + r * Math.sin(toRad(endAngle));
			const largeArc = angle > 180 ? 1 : 0;
			const path = `M ${cx} ${cy} L ${x1} ${y1} A ${r} ${r} 0 ${largeArc} 1 ${x2} ${y2} Z`;
			const item = { path, color: palette[i % palette.length], label: d.department, count: d.count, pct: Math.round(pct * 100) };
			startAngle = endAngle;
			return item;
		});
	});

	// ── Line chart (SVG) — Ticket Activity ──────────────────────────
	const lineChartData = $derived(() => {
		if (!stats) return { total: [], resolved: [], pending: [], months: [] };
		const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
		const total = stats.overview.total;
		const totalSeries = months.map((_, i) => Math.round(total * (0.45 + i * 0.05)));
		const resolvedSeries = totalSeries.map((v) => Math.round(v * 0.38));
		const pendingSeries = totalSeries.map((v) => Math.round(v * 0.2));

		const w = 480;
		const h = 160;
		const padX = 30;
		const padY = 16;
		const maxV = Math.max(...totalSeries);

		function toSvgPath(series: number[]) {
			return series
				.map((v, i) => {
					const x = padX + (i / (series.length - 1)) * (w - padX * 2);
					const y = padY + (1 - v / maxV) * (h - padY * 2);
					return `${i === 0 ? 'M' : 'L'} ${x} ${y}`;
				})
				.join(' ');
		}

		function toPoints(series: number[]) {
			return series.map((v, i) => {
				const x = padX + (i / (series.length - 1)) * (w - padX * 2);
				const y = padY + (1 - v / maxV) * (h - padY * 2);
				return { x, y };
			});
		}

		return {
			total: { path: toSvgPath(totalSeries), points: toPoints(totalSeries) },
			resolved: { path: toSvgPath(resolvedSeries), points: toPoints(resolvedSeries) },
			pending: { path: toSvgPath(pendingSeries), points: toPoints(pendingSeries) },
			months,
			w,
			h,
			padX,
			padY,
			maxV
		};
	});

	const statCards = $derived(() => {
		if (!stats) return [];
		return [
			{
				label: 'Total Tickets',
				value: stats.overview.total.toLocaleString(),
				icon: '🎫',
				iconBg: 'bg-indigo-50 dark:bg-indigo-950/50 border border-indigo-100 dark:border-indigo-900/50'
			},
			{
				label: 'Open Tickets',
				value: stats.overview.open.toLocaleString(),
				icon: '👤',
				iconBg: 'bg-indigo-50 dark:bg-indigo-950/50 border border-indigo-100 dark:border-indigo-900/50'
			},
			{
				label: 'In Progress',
				value: stats.overview.inProgress.toLocaleString(),
				icon: '⏱',
				iconBg: 'bg-amber-50 dark:bg-amber-950/50 border border-amber-100 dark:border-amber-900/50'
			},
			{
				label: 'Resolved',
				value: stats.overview.resolutionRate + '%',
				icon: '✓',
				iconBg: 'bg-emerald-50 dark:bg-emerald-950/50 border border-emerald-100 dark:border-emerald-900/50'
			}
		];
	});
</script>

<svelte:head>
	<title>Dashboard — TicketFlow</title>
	<meta name="description" content="Tableau de bord TicketFlow : statistiques et aperçu des tickets." />
</svelte:head>

<div class="space-y-6">

	<!-- ── Welcome + CTA ──────────────────────────────────────────── -->
	<div class="flex items-start justify-between">
		<div>
			<h2 class="text-2xl font-bold text-gray-900 dark:text-white">Welcome {firstName} 👋</h2>
			<p class="text-gray-500 dark:text-zinc-400 text-sm mt-1">Here's your support performance overview.</p>
		</div>
		<a
			href="/tickets/new"
			id="btn-create-ticket-dashboard"
			class="inline-flex items-center gap-2 px-4 py-2.5 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-semibold transition-colors duration-200 shadow-sm"
		>
			<svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2.5" aria-hidden="true">
				<path stroke-linecap="round" stroke-linejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
			</svg>
			+ Create Ticket
		</a>
	</div>

	<!-- ── Stat Cards ─────────────────────────────────────────────── -->
	{#if statCards().length > 0}
		<div class="grid grid-cols-2 lg:grid-cols-4 gap-4">
			{#each statCards() as card}
				<div class="bg-white dark:bg-zinc-900 rounded-xl border border-gray-200 dark:border-zinc-800 p-5 flex items-center justify-between shadow-sm transition-colors">
					<div>
						<p class="text-xs font-medium text-gray-500 dark:text-zinc-400 uppercase tracking-wider mb-1">{card.label}</p>
						<p class="text-3xl font-bold text-gray-900 dark:text-white">{card.value}</p>
					</div>
					<div class="w-12 h-12 rounded-xl {card.iconBg} flex items-center justify-center text-xl shrink-0">
						{card.icon}
					</div>
				</div>
			{/each}
		</div>
	{/if}

	<!-- ── Charts row ─────────────────────────────────────────────── -->
	<div class="grid grid-cols-1 lg:grid-cols-3 gap-4">

		<!-- Line Chart: Ticket Activity -->
		<div class="lg:col-span-2 bg-white dark:bg-zinc-900 rounded-xl border border-gray-200 dark:border-zinc-800 p-5 shadow-sm transition-colors">
			<div class="flex items-center justify-between mb-4">
				<h3 class="font-semibold text-gray-900 dark:text-white">Ticket Activity</h3>
				<span class="text-xs text-gray-400 dark:text-zinc-500">Last 30 Days</span>
			</div>

			{#if stats}
				{@const chart = lineChartData()}
				<div class="overflow-x-auto">
					<svg viewBox="0 0 {chart.w} {chart.h + 24}" width="100%" class="min-w-64" aria-label="Ticket activity line chart">
						<!-- Grid lines adapt to theme -->
						{#each [0, 0.25, 0.5, 0.75, 1] as frac}
							{@const y = chart.padY + frac * (chart.h - chart.padY * 2)}
							<line x1={chart.padX} y1={y} x2={chart.w - chart.padX} y2={y} stroke={resolvedTheme === 'dark' ? '#27272a' : '#f3f4f6'} stroke-width="1" />
						{/each}

						<!-- Lines -->
						<path d={chart.total.path} fill="none" stroke="#10b981" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" />
						<path d={chart.resolved.path} fill="none" stroke="#f59e0b" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" />
						<path d={chart.pending.path} fill="none" stroke="#a855f7" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" />

						<!-- Dots -->
						{#each chart.total.points as pt}
							<circle cx={pt.x} cy={pt.y} r="3" fill="#10b981" />
						{/each}

						<!-- Month labels -->
						{#each chart.months as m, i}
							{@const x = chart.padX + (i / (chart.months.length - 1)) * (chart.w - chart.padX * 2)}
							<text x={x} y={chart.h + 16} text-anchor="middle" font-size="9" fill={resolvedTheme === 'dark' ? '#71717a' : '#9ca3af'}>{m}</text>
						{/each}
					</svg>
				</div>

				<!-- Legend -->
				<div class="flex items-center gap-5 mt-3">
					<span class="flex items-center gap-1.5 text-xs text-gray-600 dark:text-zinc-400">
						<span class="w-5 h-0.5 bg-emerald-500 rounded inline-block"></span> Total Tickets
					</span>
					<span class="flex items-center gap-1.5 text-xs text-gray-600 dark:text-zinc-400">
						<span class="w-5 h-0.5 bg-amber-500 rounded inline-block"></span> Resolved Tickets
					</span>
					<span class="flex items-center gap-1.5 text-xs text-gray-600 dark:text-zinc-400">
						<span class="w-5 h-0.5 bg-purple-500 rounded inline-block"></span> Pending Tickets
					</span>
				</div>
			{:else}
				<p class="text-gray-400 dark:text-zinc-500 text-sm py-8 text-center">Données indisponibles</p>
			{/if}
		</div>

		<!-- Donut Chart: Category Analytics -->
		<div class="bg-white dark:bg-zinc-900 rounded-xl border border-gray-200 dark:border-zinc-800 p-5 shadow-sm transition-colors">
			<h3 class="font-semibold text-gray-900 dark:text-white mb-4">Category Analytics</h3>

			{#if stats && donutDepts().length > 0}
				{@const depts = donutDepts()}
				<div class="flex justify-center mb-4">
					<svg viewBox="0 0 140 140" width="140" height="140" aria-label="Category analytics donut chart">
						<!-- Donut slices -->
						{#each depts as slice}
							<path d={slice.path} fill={slice.color} />
						{/each}
						<!-- Center hole -->
						<circle cx="70" cy="70" r="36" fill={resolvedTheme === 'dark' ? '#18181b' : '#ffffff'} />
						<!-- Center text -->
						<text x="70" y="66" text-anchor="middle" font-size="11" font-weight="700" fill={resolvedTheme === 'dark' ? '#f4f4f5' : '#111827'}>
							{stats.overview.resolutionRate}%
						</text>
						<text x="70" y="78" text-anchor="middle" font-size="7" fill={resolvedTheme === 'dark' ? '#71717a' : '#9ca3af'}>Resolved</text>
					</svg>
				</div>

				<!-- Legend -->
				<div class="space-y-1.5">
					{#each depts as slice}
						<div class="flex items-center gap-2">
							<span class="w-2.5 h-2.5 rounded-full shrink-0" style="background: {slice.color}"></span>
							<span class="text-xs text-gray-700 dark:text-zinc-300 truncate flex-1">{slice.label}</span>
							<span class="text-xs text-gray-400 dark:text-zinc-500 shrink-0">{slice.pct}%</span>
						</div>
					{/each}
				</div>
			{:else}
				<p class="text-gray-400 dark:text-zinc-500 text-sm py-8 text-center">Données indisponibles</p>
			{/if}
		</div>
	</div>

	<!-- ── Bottom row: Ticket list + Recent Activities ──────────────── -->
	<div class="grid grid-cols-1 lg:grid-cols-3 gap-4">

		<!-- Ticket List preview -->
		<div class="lg:col-span-2 bg-white dark:bg-zinc-900 rounded-xl border border-gray-200 dark:border-zinc-800 shadow-sm overflow-hidden transition-colors">
			<div class="flex items-center justify-between px-5 py-4 border-b border-gray-100 dark:border-zinc-800">
				<h3 class="font-semibold text-gray-900 dark:text-white">Ticket List</h3>
				<a href="/tickets" class="text-xs font-medium text-indigo-600 dark:text-indigo-400 hover:underline transition-colors">View All</a>
			</div>

			<div class="overflow-x-auto">
				<table class="w-full text-sm" aria-label="Aperçu des tickets">
					<thead>
						<tr class="text-left text-xs font-medium text-gray-400 dark:text-zinc-500 border-b border-gray-100 dark:border-zinc-800">
							<th class="px-5 py-3">Ticket ID</th>
							<th class="px-4 py-3">Subject</th>
							<th class="px-4 py-3">Status</th>
							<th class="px-4 py-3 hidden md:table-cell">Assigned To</th>
							<th class="px-4 py-3 hidden lg:table-cell">Date</th>
							<th class="px-4 py-3">Action</th>
						</tr>
					</thead>
					<tbody class="divide-y divide-gray-100 dark:divide-zinc-800">
						{#each tickets.slice(0, 5) as ticket (ticket._id)}
							{@const sb = statusBadge(ticket.status)}
							<tr class="hover:bg-gray-50 dark:hover:bg-zinc-800/50 transition-colors duration-100">
								<td class="px-5 py-3 text-gray-500 dark:text-zinc-500 text-xs font-mono">
									#{ticket._id.slice(-4)}
								</td>
								<td class="px-4 py-3">
									<span class="text-gray-800 dark:text-zinc-200 font-medium line-clamp-1 max-w-[140px] block">{ticket.title}</span>
								</td>
								<td class="px-4 py-3">
									<span class="text-xs font-medium {sb.color}">{sb.label}</span>
								</td>
								<td class="px-4 py-3 hidden md:table-cell">
									{#if ticket.assignedTo}
										<div class="flex items-center gap-2">
											<div class="w-6 h-6 rounded-full {avatarColor(ticket.assignedTo.name)} flex items-center justify-center shrink-0">
												<span class="text-[10px] font-bold">{avatarInitial(ticket.assignedTo.name)}</span>
											</div>
											<span class="text-gray-700 dark:text-zinc-300 text-xs truncate max-w-[80px]">{ticket.assignedTo.name.split(' ')[0]}</span>
										</div>
									{:else}
										<span class="text-gray-400 dark:text-zinc-600 text-xs">—</span>
									{/if}
								</td>
								<td class="px-4 py-3 hidden lg:table-cell text-xs text-gray-400 dark:text-zinc-500">
									{formatDate(ticket.createdAt)}
								</td>
								<td class="px-4 py-3">
									<div class="flex items-center gap-2">
										<button class="text-gray-400 dark:text-zinc-500 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors" aria-label="Voir">
											<svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="1.75" aria-hidden="true">
												<path stroke-linecap="round" stroke-linejoin="round" d="M2.036 12.322a1.012 1.012 0 0 1 0-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178Z" />
												<path stroke-linecap="round" stroke-linejoin="round" d="M15 12a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z" />
											</svg>
										</button>
										<a href="/tickets/new" class="text-gray-400 dark:text-zinc-500 hover:text-amber-500 transition-colors" aria-label="Modifier">
											<svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="1.75" aria-hidden="true">
												<path stroke-linecap="round" stroke-linejoin="round" d="m16.862 4.487 1.687-1.688a1.875 1.875 0 1 1 2.652 2.652L10.582 16.07a4.5 4.5 0 0 1-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 0 1 1.13-1.897l8.932-8.931Zm0 0L19.5 7.125" />
											</svg>
										</a>
										<button class="text-gray-400 dark:text-zinc-500 hover:text-red-500 transition-colors" aria-label="Supprimer">
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
		</div>

		<!-- Recent Activities -->
		<div class="bg-white dark:bg-zinc-900 rounded-xl border border-gray-200 dark:border-zinc-800 shadow-sm overflow-hidden transition-colors">
			<div class="flex items-center justify-between px-5 py-4 border-b border-gray-100 dark:border-zinc-800">
				<h3 class="font-semibold text-gray-900 dark:text-white">Recent Activities</h3>
				<a href="/tickets" class="text-xs font-medium text-indigo-600 dark:text-indigo-400 hover:underline transition-colors">View All</a>
			</div>

			<div class="divide-y divide-gray-100 dark:divide-zinc-800">
				{#each tickets.slice(0, 5) as ticket (ticket._id + '-activity')}
					{@const sb = statusBadge(ticket.status)}
					<div class="px-4 py-3.5 flex gap-3 items-start">
						{#if ticket.assignedTo}
							<div class="w-8 h-8 rounded-full {avatarColor(ticket.assignedTo.name)} flex items-center justify-center shrink-0 mt-0.5">
								<span class="text-xs font-bold">{avatarInitial(ticket.assignedTo.name)}</span>
							</div>
						{:else}
							<div class="w-8 h-8 rounded-full bg-gray-100 dark:bg-zinc-800 flex items-center justify-center shrink-0 mt-0.5">
								<svg class="w-4 h-4 text-gray-400 dark:text-zinc-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="1.75" aria-hidden="true">
									<path stroke-linecap="round" stroke-linejoin="round" d="M15.75 6a3.75 3.75 0 1 1-7.5 0 3.75 3.75 0 0 1 7.5 0ZM4.501 20.118a7.5 7.5 0 0 1 14.998 0A17.933 17.933 0 0 1 12 21.75c-2.676 0-5.216-.584-7.499-1.632Z" />
								</svg>
							</div>
						{/if}

						<div class="min-w-0 flex-1">
							<p class="text-xs text-gray-800 dark:text-zinc-200 leading-snug">
								{ticket.assignedTo?.name ?? 'Système'} updated status to
								<span class="font-semibold {sb.color}">{sb.label}</span>
							</p>
							<p class="text-[10px] text-gray-400 dark:text-zinc-500 mt-0.5 truncate">Ticket #{ticket._id.slice(-4)} • {formatDate(ticket.updatedAt)}</p>
						</div>
					</div>
				{/each}
			</div>
		</div>

	</div>
</div>
