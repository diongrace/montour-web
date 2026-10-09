/** Formats d'affichage en français, comme sur les maquettes. */

/** "10 h 12" */
export function heure(iso) {
  if (!iso) return '';
  const date = new Date(iso);
  return `${date.getHours()} h ${String(date.getMinutes()).padStart(2, '0')}`;
}

/** "10:27" (écran de salle) */
export function heureHorloge(date) {
  return date.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' });
}

/** Nombre de minutes écoulées depuis une date. */
export function minutesDepuis(iso, maintenant = new Date()) {
  if (!iso) return 0;
  return Math.max(0, Math.floor((maintenant - new Date(iso)) / 60000));
}

/** "4 min 10" à partir d'un nombre de secondes. */
export function dureeMinSec(secondes) {
  if (!secondes) return '—';
  const min = Math.floor(secondes / 60);
  const sec = String(secondes % 60).padStart(2, '0');
  return min > 0 ? `${min} min ${sec}` : `${secondes} s`;
}

/** "mercredi 8 octobre" */
export function dateLongue(date = new Date()) {
  return date.toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long' });
}

/** "Awa Koné" -> "AK" */
export function initiales(nom = '') {
  return nom
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((mot) => mot[0].toUpperCase())
    .join('');
}

/** "1 personne" / "12 personnes" */
export function personnes(nombre) {
  return `${nombre} personne${nombre > 1 ? 's' : ''}`;
}
