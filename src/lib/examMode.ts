/**
 * Mode Contrôle / Examen : activé au build via `vite build --mode controle`.
 * Désactive la génération automatique (MLD, MPD, SQL, Code) et applique
 * l'identité visuelle Rouge Contrôle.
 */
export const EXAM_MODE: boolean = import.meta.env.VITE_EXAM_MODE === 'true'
