const API_URL = import.meta.env.VITE_API_URL ?? 'http://localhost:8080';

/** Erreur renvoyée par l'API, avec son statut HTTP (401, 404, 409...). */
export class ApiError extends Error {
  constructor(status, message) {
    super(message);
    this.status = status;
  }
}

/**
 * Appelle l'API MonTour et renvoie le JSON de la réponse.
 * En cas d'erreur, lance une ApiError avec le message "detail" envoyé par le backend.
 */
export async function api(chemin, { methode = 'GET', corps, token } = {}) {
  const entetes = {};
  if (corps !== undefined) entetes['Content-Type'] = 'application/json';
  if (token) entetes.Authorization = `Bearer ${token}`;

  let reponse;
  try {
    reponse = await fetch(`${API_URL}${chemin}`, {
      method: methode,
      headers: entetes,
      body: corps !== undefined ? JSON.stringify(corps) : undefined,
    });
  } catch {
    throw new ApiError(0, 'Impossible de joindre le serveur. Vérifiez votre connexion.');
  }

  if (reponse.status === 204) return null;
  const donnees = await reponse.json().catch(() => null);
  if (!reponse.ok) {
    throw new ApiError(reponse.status, donnees?.detail ?? 'Une erreur est survenue, réessayez.');
  }
  return donnees;
}

/** Télécharge une image protégée (le QR code) et renvoie une URL affichable dans <img>. */
export async function apiImage(chemin, token) {
  const reponse = await fetch(`${API_URL}${chemin}`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!reponse.ok) throw new ApiError(reponse.status, "Impossible de charger l'image");
  return URL.createObjectURL(await reponse.blob());
}
