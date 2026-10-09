import { useCallback, useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { api } from '../../api/client';
import { IconeCadenas } from '../../components/Icones';
import Logo from '../../components/Logo';
import { activerSon } from '../../utils/alerte';
import { personnes } from '../../utils/format';

/** Maquette 1 : le client choisit un service et prend un ticket. */
export default function ChoixService() {
  const { slug } = useParams();
  const navigate = useNavigate();
  const [etablissement, setEtablissement] = useState(null);
  const [erreur, setErreur] = useState('');
  const [serviceEnCours, setServiceEnCours] = useState(null);

  const charger = useCallback(() => {
    api(`/api/public/etablissements/${slug}`)
      .then(setEtablissement)
      .catch((e) => setErreur(e.message));
  }, [slug]);

  // Recharge la liste toutes les 15 secondes pour garder les files à jour.
  useEffect(() => {
    charger();
    const minuterie = setInterval(charger, 15000);
    return () => clearInterval(minuterie);
  }, [charger]);

  async function prendreTicket(service) {
    activerSon();
    // Anti-abus : un seul ticket actif par service sur ce téléphone.
    const cle = `montour.ticket.${service.id}`;
    const ticketExistant = localStorage.getItem(cle);
    if (ticketExistant) {
      navigate(`/t/${ticketExistant}`);
      return;
    }
    setServiceEnCours(service.id);
    setErreur('');
    try {
      const ticket = await api(`/api/public/services/${service.id}/tickets`, { methode: 'POST' });
      localStorage.setItem(cle, ticket.jeton);
      navigate(`/t/${ticket.jeton}`);
    } catch (e) {
      setErreur(e.message);
    } finally {
      setServiceEnCours(null);
    }
  }

  if (!etablissement) {
    return (
      <main className="page-mobile">
        <Logo />
        {erreur ? <p className="message-erreur">{erreur}</p> : <p className="texte-doux">Chargement…</p>}
      </main>
    );
  }

  const ouvert = etablissement.services.some((s) => s.ouvert);

  return (
    <main className="page-mobile">
      <Logo />

      <section className="carte-verte">
        <span style={{ fontSize: 12, opacity: 0.9 }}>Bienvenue au</span>
        <h1 style={{ fontSize: 22 }}>{etablissement.nom}</h1>
        <span style={{ fontSize: 13, opacity: 0.9 }}>{etablissement.adresse}</span>
        <span className="pastille">{ouvert ? 'Ouvert' : 'Fermé pour le moment'}</span>
      </section>

      <h2 style={{ fontFamily: 'var(--corps)', fontSize: 17, fontWeight: 700, marginTop: 4 }}>Choisissez un service</h2>
      {erreur && <p className="message-erreur">{erreur}</p>}

      {etablissement.services.map((service) => (
        <article
          key={service.id}
          className={`carte${service.ouvert ? '' : ' carte-ferme'}`}
          style={{ display: 'flex', flexDirection: 'column', gap: 14, padding: 14 }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <span className="lettre-service">{service.prefixe}</span>
            <div>
              <strong style={{ display: 'block', fontSize: 15 }}>{service.nom}</strong>
              <span className="texte-doux" style={{ fontSize: 13 }}>
                {service.ouvert
                  ? `${personnes(service.enAttente)} en attente · ≈ ${service.attenteEstimeeMin} min`
                  : 'Fermé pour le moment'}
              </span>
            </div>
          </div>
          {service.ouvert && (
            <button
              type="button"
              className="btn btn-primaire btn-pleine-largeur"
              disabled={serviceEnCours === service.id}
              onClick={() => prendreTicket(service)}
            >
              {serviceEnCours === service.id ? 'Un instant…' : 'Prendre un ticket'}
            </button>
          )}
        </article>
      ))}

      <p className="texte-doux" style={{ fontSize: 12, marginTop: 'auto', display: 'flex', gap: 8, lineHeight: 1.5 }}>
        <IconeCadenas taille={14} style={{ flex: 'none', marginTop: 2 }} />
        Aucun compte, aucune donnée personnelle. Votre ticket reste sur ce téléphone.
      </p>
    </main>
  );
}
