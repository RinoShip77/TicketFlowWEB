/**
 * Utilitaire d'alertes sonores basées sur le Web Audio API.
 * Génère une tonalité harmonieuse synthétisée sans dépendance externe.
 */

export function playUrgentTicketAlert() {
	if (typeof window === 'undefined') return;

	try {
		const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
		if (!AudioContextClass) return;

		const ctx = new AudioContextClass();

		// Tonalité 1 (La 5 = 880Hz) & Tonalité 2 (La 6 = 1760Hz)
		const osc1 = ctx.createOscillator();
		const osc2 = ctx.createOscillator();
		const gain = ctx.createGain();

		osc1.type = 'sine';
		osc2.type = 'triangle';

		osc1.frequency.setValueAtTime(880, ctx.currentTime);
		osc2.frequency.setValueAtTime(1760, ctx.currentTime);

		// Attaque douce et déclin naturel
		gain.gain.setValueAtTime(0.01, ctx.currentTime);
		gain.gain.linearRampToValueAtTime(0.18, ctx.currentTime + 0.05);
		gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.45);

		osc1.connect(gain);
		osc2.connect(gain);
		gain.connect(ctx.destination);

		osc1.start(ctx.currentTime);
		osc2.start(ctx.currentTime);

		osc1.stop(ctx.currentTime + 0.45);
		osc2.stop(ctx.currentTime + 0.45);
	} catch {
		// Ignorer si l'audio est bloqué par le navigateur sans interaction
	}
}
