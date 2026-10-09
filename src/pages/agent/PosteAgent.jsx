import { useCallback, useEffect, useState } from 'react';
import { api } from '../../api/client';
import { useAuth } from '../../auth/AuthContext';
import { IconeFleche } from '../../components/Icones';
import { useTopic } from '../../hooks/useTopic';
import { dureeMinSec, heure, initiales, minutesDepuis, personnes } from '../../utils/format';

const CLE_GUICHET = 'montour.guichet';

/** Maquette 5 : le poste de l'agent au guichet. */
export default function PosteAgent() {
  const { session, deconnexion } = useAuth();
  const [nomEtablissement, setNomEtablissement] = useState('');
  const [guichets, setGuichets] = useState([]);
  const [guichetId, setGuichetId] = useState(() => localStorage.getItem(CLE_GUICHET) ?? '');
  const [courant, setCourant] = useState(null);
  const [file, setFile] = useState([]);
  const [stats, setStats] = useState(null);
  const [erreur, setErreur] = useState('');
  const [occupe, setOccupe] = useState(false);
  const [maintenant, setMaintenant] = useState(() => new Date());

  // Appel protégé : ajoute le token, et déconnecte si le token a expiré.
  const appel = useCallback(
    (chemin, options = {}) =>
      api(chemin, { ...options, token: session.token }).catch((e) => {
        if (e.status === 401) deconnexion();
        throw e;
      }),
    [session.token, deconnexion],
  );

  useEffect(() => {
    api(`/api/public/etablissements/${session.etablissement}`).then((e) => setNomEtablissement(e.nom)).catch(() => {});
  }, [session.etablissement]);

  useEffect(() => {
    appel('/api/agent/guichets')
      .then((liste) => {
        setGuichets(liste);
        setGuichetId((actuel) => (liste.some((g) => String(g.id) === actuel) ? actuel : String(liste[0]?.id ?? '')));
      })
      .catch((e) => setErreur(e.message));
  }, [appel]);

  useEffect(() => {
    if (guichetId) localStorage.setItem(CLE_GUICHET, guichetId);
  }, [guichetId]);

  // Les durées "attend depuis X min" avancent toutes seules.
  useEffect(() => {
    const minuterie = setInterval(() => setMaintenant(new Date()), 30000);
    return () => clearInterval(minuterie);
  }, []);

  const guichet = guichets.find((g) => String(g.id) === guichetId);

  const rafraichir = useCallback(async () => {
    if (!guichet) return;
    const [ticketCourant, attente, chiffres] = await Promise.all([
      appel(`/api/agent/guichets/${guichet.id}/courant`).catch((e) => {
        if (e.status === 404) return null; // aucun client en cours à ce guichet
        throw e;
      }),
      appel(`/api/agent/services/${guichet.serviceId}/file`),
      appel('/api/agent/stats/jour'),
    ]);
    setCourant(ticketCourant);
    setFile(attente);
    setStats(chiffres);
    setMaintenant(new Date());
  }, [guichet, appel]);

  useEffect(() => {
    rafraichir().catch((e) => setErreur(e.message));
  }, [rafraichir]);

  // Un client prend un ticket ou un collègue appelle : la file se met à jour toute seule.
  const recharger = () => rafraichir().catch(() => {});
  useTopic(guichet ? `/topic/services/${guichet.serviceId}` : null, recharger, recharger);

  async function agir(chemin) {
    setOccupe(true);
    setErreur('');
    try {
      await appel(chemin, { methode: 'POST' });
      await rafraichir();
    } catch (e) {
      setErreur(e.message);
    } finally {
      setOccupe(false);
    }
  }

  return (
    <>
      <header className="barre">
        <span className="logo" style={{ color: 'var(--vert)' }}>MonTour</span>
        <span className="texte-doux" style={{ fontSize: 14 }}>{nomEtablissement}</span>
        <div className="droite">
          <label htmlFor="guichet" className="texte-doux" style={{ fontSize: 14 }}>Guichet</label>
          <select
            id="guichet"
            value={guichetId}
            onChange={(e) => setGuichetId(e.target.value)}
            style={{ minHeight: 40, borderRadius: 10, border: '1.5px solid var(--bordure)', padding: '0 12px',
              fontFamily: 'var(--corps)', fontSize: 14, background: 'var(--blanc)' }}
          >
            {guichets.map((g) => (
              <option key={g.id} value={g.id}>
                {g.nom} · {g.serviceNom}
              </option>
            ))}
          </select>
          <span className="avatar" title={session.nom}>{initiales(session.nom)}</span>
          <button type="button" className="lien-bouton" onClick={deconnexion}>Déconnexion</button>
        </div>
      </header>

      <main className="page-large">
        <div className="colonne-principale">
          {erreur && <p className="message-erreur">{erreur}</p>}

          <section className="carte" style={{ padding: 28, display: 'flex', flexDirection: 'column', gap: 16, borderRadius: 20 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 8 }}>
              <h1 className="titre-carte">Ticket en cours</h1>
              {courant && (
                <span className="pastille">
                  Appelé à {heure(courant.appeleLe)} · {minutesDepuis(courant.appeleLe, maintenant)} min
                </span>
              )}
            </div>
            <span className="numero" style={{ fontSize: 104, lineHeight: 1, letterSpacing: -3,
              color: courant ? 'var(--texte)' : 'var(--bordure)' }}>
              {courant ? courant.code : '—'}
            </span>
            <div className="grille-3">
              <button type="button" className="btn btn-primaire" disabled={!courant || occupe}
                onClick={() => agir(`/api/agent/tickets/${courant.id}/servi`)}>
                Servi
              </button>
              <button type="button" className="btn btn-secondaire" disabled={!courant || occupe}
                onClick={() => agir(`/api/agent/tickets/${courant.id}/absent`)}>
                Absent
              </button>
              <button type="button" className="btn btn-secondaire" disabled={!courant || occupe}
                onClick={() => agir(`/api/agent/tickets/${courant.id}/rappel`)}>
                Rappeler
              </button>
            </div>
          </section>

          <button
            type="button"
            className="btn btn-orange"
            disabled={!guichet || occupe || file.length === 0}
            onClick={() => agir(`/api/agent/guichets/${guichet.id}/suivant`)}
            style={{ minHeight: 104, borderRadius: 20, justifyContent: 'space-between', padding: '0 30px',
              textAlign: 'left', boxShadow: '0 10px 24px rgba(242, 140, 40, 0.3)' }}
          >
            <span>
              <span className="numero" style={{ display: 'block', fontSize: 28 }}>Appeler le suivant</span>
              <span style={{ fontSize: 14, fontWeight: 500 }}>
                {file.length > 0 ? `Prochain ticket : ${file[0].code}` : 'Personne en attente'}
              </span>
            </span>
            <IconeFleche taille={30} />
          </button>

          {stats && (
            <div className="grille-3">
              <div className="carte-chiffre">
                <span>Servis aujourd'hui</span>
                <strong>{stats.servis}</strong>
              </div>
              <div className="carte-chiffre">
                <span>Temps moyen de service</span>
                <strong>{dureeMinSec(stats.serviceMoyenSecondes)}</strong>
              </div>
              <div className="carte-chiffre">
                <span>Absents</span>
                <strong>{stats.absents}</strong>
              </div>
            </div>
          )}
        </div>

        <aside className="colonne-laterale carte" style={{ borderRadius: 20 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 14 }}>
            <h2 className="titre-carte">File d'attente</h2>
            <span className="texte-doux" style={{ fontSize: 13 }}>{personnes(file.length)}</span>
          </div>
          {file.length === 0 && <p className="texte-doux" style={{ fontSize: 14 }}>Personne n'attend pour le moment.</p>}
          <ol className="liste-file">
            {file.slice(0, 6).map((ticket, index) => (
              <li key={ticket.id} className={index === 0 ? 'suivant' : ''}>
                <span className="numero" style={{ fontSize: 18, color: 'var(--texte)' }}>{ticket.code}</span>
                <span>
                  {index === 0 ? 'Suivant · ' : ''}attend depuis {minutesDepuis(ticket.creeLe, maintenant)} min
                </span>
              </li>
            ))}
          </ol>
          {file.length > 6 && (
            <p className="texte-doux" style={{ fontSize: 12, marginTop: 12 }}>+ {file.length - 6} autres tickets</p>
          )}
        </aside>
      </main>
    </>
  );
}
