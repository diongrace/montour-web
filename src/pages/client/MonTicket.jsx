import { useCallback, useEffect, useRef, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { api } from '../../api/client';
import { IconeCloche } from '../../components/Icones';
import Logo from '../../components/Logo';
import { useTopic } from '../../hooks/useTopic';
import { alerter } from '../../utils/alerte';
import { heure } from '../../utils/format';
import VotreTour from './VotreTour';

const STATUTS_FINAUX = ['SERVI', 'ABSENT', 'ANNULE'];
const MESSAGES_FIN = {
  SERVI: 'Vous avez été servi. Merci de votre visite !',
  ABSENT: "Vous n'étiez pas là lors de l'appel. Vous pouvez reprendre un ticket.",
  ANNULE: 'Votre ticket a été annulé.',
};

/** Maquette 2 : le client suit sa position en direct. */
export default function MonTicket() {
  const { jeton } = useParams();
  const navigate = useNavigate();
  const [etat, setEtat] = useState(null);
  const [nomEtablissement, setNomEtablissement] = useState('');
  const [erreur, setErreur] = useState('');
  const [maxDevant, setMaxDevant] = useState(0);
  const dejaPrevenu = useRef(false);

  const charger = useCallback(async () => {
    try {
      const nouvelEtat = await api(`/api/public/tickets/${jeton}`);
      setEtat(nouvelEtat);
      // On garde la plus longue file vue, pour dessiner la barre de progression.
      setMaxDevant((max) => Math.max(max, nouvelEtat.personnesDevant));
    } catch (e) {
      setErreur(e.message);
    }
  }, [jeton]);

  useEffect(() => {
    charger();
  }, [charger]);

  // Le nom de l'établissement, affiché sous le logo.
  const slug = etat?.etablissementSlug;
  useEffect(() => {
    if (!slug) return;
    api(`/api/public/etablissements/${slug}`).then((e) => setNomEtablissement(e.nom)).catch(() => {});
  }, [slug]);

  // Chaque changement dans le service recharge la position. Si c'est notre ticket qui est appelé : alerte.
  useTopic(
    etat ? `/topic/services/${etat.serviceId}` : null,
    (evenement) => {
      if (evenement.jeton === jeton && evenement.statut === 'APPELE') alerter();
      charger();
    },
    charger,
  );

  useEffect(() => {
    if (!etat) return;
    if (etat.statut === 'EN_ATTENTE' && etat.personnesDevant > 0 && etat.personnesDevant <= 3 && !dejaPrevenu.current) {
      dejaPrevenu.current = true;
      alerter();
    }
    if (STATUTS_FINAUX.includes(etat.statut)) {
      localStorage.removeItem(`montour.ticket.${etat.serviceId}`);
    }
  }, [etat]);

  async function annuler() {
    if (!window.confirm('Voulez-vous vraiment annuler votre ticket ?')) return;
    try {
      await api(`/api/public/tickets/${jeton}`, { methode: 'DELETE' });
      localStorage.removeItem(`montour.ticket.${etat.serviceId}`);
      navigate(`/e/${etat.etablissementSlug}`);
    } catch (e) {
      setErreur(e.message);
    }
  }

  if (!etat) {
    return (
      <main className="page-mobile">
        <Logo />
        {erreur ? <p className="message-erreur">{erreur}</p> : <p className="texte-doux">Chargement…</p>}
      </main>
    );
  }

  if (etat.statut === 'APPELE') {
    return <VotreTour etat={etat} />;
  }

  if (STATUTS_FINAUX.includes(etat.statut)) {
    return (
      <main className="page-mobile">
        <Logo avecIcone={false} sousTitre={nomEtablissement} />
        <section className="carte" style={{ textAlign: 'center', display: 'flex', flexDirection: 'column', gap: 12 }}>
          <span className="numero" style={{ fontSize: 48, color: 'var(--texte-doux)' }}>{etat.code}</span>
          <p>{MESSAGES_FIN[etat.statut]}</p>
          <Link className="btn btn-primaire btn-pleine-largeur" to={`/e/${etat.etablissementSlug}`}>
            Prendre un nouveau ticket
          </Link>
        </section>
      </main>
    );
  }

  const progression = maxDevant === 0 ? 100 : Math.round(100 * (1 - etat.personnesDevant / maxDevant));
  const bientot = etat.personnesDevant <= 3;

  return (
    <main className="page-mobile">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Logo avecIcone={false} sousTitre={nomEtablissement} />
        <span className="pastille">
          <span className="point-direct" />
          En direct
        </span>
      </div>

      <section className="carte" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4, borderRadius: 20 }}>
        <span className="texte-doux" style={{ fontSize: 13 }}>Votre ticket · {etat.serviceNom}</span>
        <span className="numero" style={{ fontSize: 84, lineHeight: 1, letterSpacing: -2, color: 'var(--vert)', margin: '10px 0 6px' }}>
          {etat.code}
        </span>
        <span className="texte-doux" style={{ fontSize: 12 }}>Pris à {heure(etat.creeLe)}</span>

        <div className="grille-2" style={{ width: '100%', marginTop: 18 }}>
          <div className="chiffre">
            <strong>{etat.personnesDevant}</strong>
            <span className="texte-doux" style={{ fontSize: 12 }}>
              personne{etat.personnesDevant > 1 ? 's' : ''} devant vous
            </span>
          </div>
          <div className="chiffre">
            <strong>≈ {etat.attenteEstimeeMin} min</strong>
            <span className="texte-doux" style={{ fontSize: 12 }}>d'attente estimée</span>
          </div>
        </div>

        <div style={{ width: '100%', marginTop: 18, display: 'flex', flexDirection: 'column', gap: 8 }}>
          <div className="texte-doux" style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12 }}>
            <span>
              Numéro appelé : <strong style={{ color: 'var(--texte)' }}>{etat.dernierNumeroAppele ?? '—'}</strong>
            </span>
            <span>Votre tour : {etat.code}</span>
          </div>
          <div className="barre-progression">
            <div style={{ width: `${progression}%` }} />
          </div>
        </div>
      </section>

      <div className="alerte-orange">
        <IconeCloche taille={18} />
        {bientot ? (
          <span>
            <strong>C'est bientôt votre tour</strong> : rapprochez-vous de l'accueil.
          </span>
        ) : (
          <span>
            Vous pouvez vous éloigner. Ce téléphone sonnera et vibrera quand il restera <strong>3 personnes</strong> devant
            vous.
          </span>
        )}
      </div>

      {erreur && <p className="message-erreur">{erreur}</p>}

      <div style={{ marginTop: 'auto', display: 'flex', flexDirection: 'column', gap: 10 }}>
        <p className="texte-doux" style={{ textAlign: 'center', fontSize: 12 }}>
          Gardez cette page ouverte pour suivre votre tour.
        </p>
        <button type="button" className="btn btn-secondaire btn-pleine-largeur" onClick={annuler}>
          Annuler mon ticket
        </button>
      </div>
    </main>
  );
}
