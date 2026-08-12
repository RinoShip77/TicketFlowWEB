/**
 * Dictionnaire de traduction internationale (i18n)
 * Français (Canada) 🇨🇦 par défaut avec bascule dynamique vers Anglais (Canada) 🇨🇦
 */

import { getSettings } from '$lib/settings.svelte';

export const translations = {
	'fr-CA': {
		// Navigation & Layout
		nav_dashboard: 'Tableau de bord',
		nav_tickets: 'Tous les billets',
		nav_team: "Membres de l'équipe",
		nav_settings: 'Paramètres',
		nav_create_ticket: 'Créer un billet',
		nav_add_member: 'Ajouter un membre',
		nav_logout: 'Déconnexion',

		// Dashboard
		welcome: 'Bienvenue',
		dashboard_sub: 'Voici un aperçu de vos performances de support.',
		total_tickets: 'BILLETS TOTAUX',
		open_tickets: 'BILLETS OUVERTS',
		in_progress_tickets: 'EN COURS',
		resolved_tickets: 'RÉSOLUS',
		ticket_activity: 'Activité des billets',
		last_30_days: '30 derniers jours',

		// Entêtes de tableau & Filtres
		search_placeholder: 'Rechercher...',
		search_members_placeholder: 'Rechercher des membres...',
		all_statuses: 'Tous les statuts',
		all_departments: 'Tous les départements',
		items_per_page: 'éléments par page',
		action: 'Action',
		open_btn: 'Ouvrir',
		delete_btn: 'Supprimer',
		cancel_btn: 'Annuler',
		apply_btn: 'Appliquer',
		save_btn: 'Enregistrer',

		// Liste des billets
		ticket_id: 'N° Billet',
		subject: 'Sujet',
		category: 'Catégorie',
		status: 'Statut',
		assigned_to: 'Assigné à',
		priority: 'Priorité',
		date: 'Date',
		unassigned: 'Non assigné',
		no_tickets_found: 'Aucun billet trouvé.',
		create_first_ticket: 'Créer le premier billet →',
		tickets_selected_single: '1 billet sélectionné',
		tickets_selected_plural: 'billets sélectionnés',
		apply_to_tickets: 'Appliquer aux billets',

		// Liste des techniciens / membres
		member: 'Membre',
		email: 'Courriel',
		department: 'Département',
		role: 'Rôle',
		level: 'Niveau',
		no_members_found: 'Aucun membre trouvé.',
		members_selected_single: '1 membre sélectionné',
		members_selected_plural: 'membres sélectionnés',

		// Statuts & Rôles
		status_open: 'Ouvert',
		status_in_progress: 'En cours',
		status_resolved: 'Résolu',
		status_closed: 'Fermé',
		status_active: 'Actif',
		status_inactive: 'Inactif',
		role_admin: 'Administrateur',
		role_technician: 'Technicien',

		// Création de billet
		create_ticket_title: 'Créer un nouveau billet',
		create_ticket_desc: 'Ajoutez un billet individuel ou plusieurs billets en une seule fois.',
		single_ticket: 'Billet unique',
		bulk_tickets: 'Lot de billets',

		// Écran Paramètres
		settings_title: 'Paramètres',
		settings_subtitle: "Personnalisez votre apparence, vos notifications et vos préférences d'utilisation.",
		settings_saved: 'Modifications enregistrées !',
		appearance_title: 'Apparence & Thème',
		appearance_desc: "Choisissez le mode visuel de l'interface.",
		theme_label: "Thème de l'application",
		theme_desc: "S'adapte à vos préférences système ou bascule directement en clair / sombre.",
		density_label: "Densité de l'interface",
		density_desc: "Ajuste l'espacement et la taille des tableaux.",
		density_comfortable: 'Confortable (Par défaut)',
		density_compact: 'Compacte',
		default_view_label: 'Vue par défaut des billets',
		default_view_desc: 'Sélectionne la présentation de la liste des billets.',
		view_list: 'Vue Liste (Tableau)',
		view_grid: 'Vue Grille (Cartes)',
		notifs_title: 'Notifications & Alertes',
		notifs_desc: 'Gérez la fréquence et le mode de vos avertissements en temps réel.',
		email_notifs_label: 'Notifications par courriel',
		email_notifs_desc: 'Recevoir un e-mail automatique à chaque attribution ou modification de vos billets (intégration SMTP).',
		upcoming: 'Prochainement',
		sound_alerts_label: 'Alertes sonores (Tickets Urgents P4/P5)',
		sound_alerts_desc: "Émettre un signal sonore synthétisé Web Audio lorsqu'un billet critique (P4/P5) nécessite votre attention.",
		test_sound: 'Tester le son',
		auto_refresh_label: 'Rafraîchissement automatique (60s)',
		auto_refresh_desc: 'Actualiser automatiquement les données du tableau de bord et des billets toutes les 60 secondes en arrière-plan.',
		active: 'Actif',
		lang_title: 'Langue & Affichage',
		lang_desc: 'Paramétrez la langue régionale et la taille des pages de résultats.',
		lang_label: "Langue d'affichage",
		lang_subdesc: "Langue principale de l'interface régionale.",
		items_per_page_label: 'Éléments par page',
		items_per_page_desc: 'Nombre de billets et membres affichés par page (10, 25 ou 50).'
	},
	'en-CA': {
		// Navigation & Layout
		nav_dashboard: 'Dashboard',
		nav_tickets: 'All Tickets',
		nav_team: 'Team Members',
		nav_settings: 'Settings',
		nav_create_ticket: 'Create Ticket',
		nav_add_member: 'Add Member',
		nav_logout: 'Sign out',

		// Dashboard
		welcome: 'Welcome',
		dashboard_sub: "Here's your support performance overview.",
		total_tickets: 'TOTAL TICKETS',
		open_tickets: 'OPEN TICKETS',
		in_progress_tickets: 'IN PROGRESS',
		resolved_tickets: 'RESOLVED',
		ticket_activity: 'Ticket Activity',
		last_30_days: 'Last 30 Days',

		// Entêtes de tableau & Filtres
		search_placeholder: 'Search...',
		search_members_placeholder: 'Search members...',
		all_statuses: 'All Statuses',
		all_departments: 'All Departments',
		items_per_page: 'items per page',
		action: 'Action',
		open_btn: 'Open',
		delete_btn: 'Delete',
		cancel_btn: 'Cancel',
		apply_btn: 'Apply',
		save_btn: 'Save',

		// Liste des billets
		ticket_id: 'Ticket ID',
		subject: 'Subject',
		category: 'Category',
		status: 'Status',
		assigned_to: 'Assigned To',
		priority: 'Priority',
		date: 'Date',
		unassigned: 'Unassigned',
		no_tickets_found: 'No tickets found.',
		create_first_ticket: 'Create first ticket →',
		tickets_selected_single: '1 ticket selected',
		tickets_selected_plural: 'tickets selected',
		apply_to_tickets: 'Apply to tickets',

		// Liste des techniciens / membres
		member: 'Member',
		email: 'Email',
		department: 'Department',
		role: 'Role',
		level: 'Level',
		no_members_found: 'No members found.',
		members_selected_single: '1 member selected',
		members_selected_plural: 'members selected',

		// Statuts & Rôles
		status_open: 'Open',
		status_in_progress: 'In Progress',
		status_resolved: 'Resolved',
		status_closed: 'Closed',
		status_active: 'Active',
		status_inactive: 'Inactive',
		role_admin: 'Admin',
		role_technician: 'Technician',

		// Création de billet
		create_ticket_title: 'Create New Ticket',
		create_ticket_desc: 'Add an individual ticket or multiple tickets at once.',
		single_ticket: 'Single Ticket',
		bulk_tickets: 'Bulk Tickets',

		// Écran Paramètres
		settings_title: 'Settings',
		settings_subtitle: 'Customize your appearance, notifications, and application preferences.',
		settings_saved: 'Settings saved!',
		appearance_title: 'Appearance & Theme',
		appearance_desc: 'Choose the visual mode for the interface.',
		theme_label: 'Application Theme',
		theme_desc: 'Adapts to system preferences or switches directly between light and dark.',
		density_label: 'Interface Density',
		density_desc: 'Adjusts spacing and table sizes.',
		density_comfortable: 'Comfortable (Default)',
		density_compact: 'Compact',
		default_view_label: 'Default Ticket View',
		default_view_desc: 'Selects the layout mode for ticket listing.',
		view_list: 'List View (Table)',
		view_grid: 'Grid View (Cards)',
		notifs_title: 'Notifications & Alerts',
		notifs_desc: 'Manage warning frequencies and modes in real time.',
		email_notifs_label: 'Email Notifications',
		email_notifs_desc: 'Receive automatic emails for ticket assignments or updates (SMTP integration).',
		upcoming: 'Upcoming',
		sound_alerts_label: 'Sound Alerts (Urgent Tickets P4/P5)',
		sound_alerts_desc: 'Emit a Web Audio synthesized sound signal when a critical ticket (P4/P5) requires attention.',
		test_sound: 'Test Sound',
		auto_refresh_label: 'Auto-Refresh (60s)',
		auto_refresh_desc: 'Automatically refresh dashboard and tickets data every 60 seconds in background.',
		active: 'Active',
		lang_title: 'Language & Display',
		lang_desc: 'Configure regional language and result page sizes.',
		lang_label: 'Display Language',
		lang_subdesc: 'Primary language of the regional interface.',
		items_per_page_label: 'Items Per Page',
		items_per_page_desc: 'Number of tickets and members shown per page (10, 25, or 50).'
	}
} as const;

export type TranslationKey = keyof typeof translations['fr-CA'];

/**
 * Fonction de traduction dynamique réactive avec Svelte 5.
 */
export function t(key: TranslationKey): string {
	const lang = getSettings().language ?? 'fr-CA';
	const dict = translations[lang as keyof typeof translations] ?? translations['fr-CA'];
	return (dict as any)[key] ?? (translations['fr-CA'] as any)[key] ?? key;
}
