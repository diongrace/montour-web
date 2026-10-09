import { useCallback, useEffect, useState } from 'react';
import { api, apiImage } from '../../api/client';
import { useAuth } from '../../auth/AuthContext';
import Logo from '../../components/Logo';
import { dateLongue, initiales } from '../../utils/format';

const SERVICE_VIDE = { nom: '', prefixe: '', dureeParDefautMin: 5 };
const AGENT_VIDE = { nom: '', email: '', motDePasse: '', role: 'AGENT' };
const ONGLETS = [
  { id: 'ensemble', titre: "Vue d'ensemble" },
  { id: 'services', titre: 'Services' },
  { id: 'guichets', titre: 'Guichets' },
  { id: 'agents', titre: 'Agents' },
];

/** Maquette 6 : le tableau de bord de l'administrateur. */
export default function TableauAdmin() {
  const { session, deconnexion } = useAuth();
  const [onglet, setOnglet] = useState('ensemble');
  const [nomEtablissement, setNomEtablissement] = useState('');
  const [stats, setStats] = useState(null);
  const [services, setServices] = useState([]);
  const [agents, setAgents] = useState([]);
  const [qrCode, setQrCode] = useState(null);
  const [nouveauService, setNouveauService] = useState(SERVICE_VIDE);
  const [nouvelAgent, setNouvelAgent] = useState(AGENT_VIDE);
  const [erreur, setErreur] = useState('');

  const appel = useCallback(
    (chemin, options = {}) =>
      api(chemin, { ...options, token: session.token }).catch((e) => {
        if (e.status === 401) deconnexion();
        throw e;
      }),
    [session.token, deconnexion],
  );

  const charger = useCallback(async () => {
    try {
      const [s, liste, equipe] = await Promise.all([
        appel('/api/admin/stats/jour'),
        appel('/api/admin/services'),
        appel('/api/admin/agents'),
      ]);
      setStats(s);
      setServices(liste);
      setAgents(equipe);
    } catch (e) {
      setErreur(e.message);
    }
  }, [appel]);

  useEffect(() => {
    charger();
  }, [charger]);

  useEffect(() => {
    api(`/api/public/etablissements/${session.etablissement}`).then((e) => setNomEtablissement(e.nom)).catch(() => {});
  }, [session.etablissement]);

  // Le QR code est une image protégée : on la télécharge avec le token puis on l'affiche.
  useEffect(() => {
    let url = null;
    apiImage('/api/admin/qrcode', session.token)
      .then((lien) => {
        url = lien;
        setQrCode(lien);
      })
      .catch(() => setQrCode(null));
    return () => {
      if (url) URL.revokeObjectURL(url);
    };
  }, [session.token]);

  async function executer(action) {
    setErreur('');
    try {
      await action();
      await charger();
    } catch (e) {
      setErreur(e.message);
    }
  }

  function creerService(evenement) {
    evenement.preventDefault();
    executer(async () => {
      await appel('/api/admin/services', {
        methode: 'POST',
        corps: {
          ...nouveauService,
          prefixe: nouveauService.prefixe.toUpperCase(),
          dureeParDefautMin: Number(nouveauService.dureeParDefautMin),
          ouvert: true,
        },
      });
      setNouveauService(SERVICE_VIDE);
    });
  }

  function basculerService(service) {
    executer(() =>
      appel(`/api/admin/services/${service.id}`, {
        methode: 'PUT',
        corps: { nom: service.nom, prefixe: service.prefixe, dureeParDefautMin: service.dureeParDefautMin,
          ouvert: !service.ouvert },
      }),
    );
  }

  function ajouterGuichet(service) {
    const nom = window.prompt(`Nom du nouveau guichet pour « ${service.nom} » :`);
    if (!nom) return;
    executer(() => appel(`/api/admin/services/${service.id}/guichets`, { methode: 'POST', corps: { nom, actif: true } }));
  }

  function basculerGuichet(guichet) {
    executer(() => appel(`/api/admin/guichets/${guichet.id}`, { methode: 'PUT',
      corps: { nom: guichet.nom, actif: !guichet.actif } }));
  }

  function creerAgent(evenement) {
    evenement.preventDefault();
    executer(async () => {
      await appel('/api/admin/agents', { methode: 'POST', corps: nouvelAgent });
      setNouvelAgent(AGENT_VIDE);
    });
  }

  const titre = ONGLETS.find((o) => o.id === onglet).titre;

  return (
    <div className="admin">
      <aside className="admin-menu">
        <Logo avecIcone={false} clair sousTitre={nomEtablissement} />
        <nav>
          {ONGLETS.map((o) => (
            <button key={o.id} type="button" className={onglet === o.id ? 'actif' : ''} onClick={() => setOnglet(o.id)}>
              {o.titre}
            </button>
          ))}
          <button type="button" onClick={() => window.open(`/salle/${session.etablissement}`, '_blank')}>
            Écran de salle
          </button>
        </nav>
        <div className="bas">
          <button type="button" onClick={deconnexion}>Déconnexion</button>
        </div>
      </aside>

      <main className="admin-contenu">
        <div className="entete-admin">
          <div>
            <h1 style={{ fontSize: 28 }}>{titre}</h1>
            <p className="texte-doux" style={{ fontSize: 13, marginTop: 4 }}>Aujourd'hui, {dateLongue()}</p>
          </div>
          {onglet === 'ensemble' && (
            <button type="button" className="btn btn-primaire" style={{ minHeight: 40 }} onClick={() => setOnglet('services')}>
              + Nouveau service
            </button>
          )}
        </div>

        {erreur && <p className="message-erreur">{erreur}</p>}

        {onglet === 'ensemble' && (
          <>
            {stats && (
              <div className="grille-4">
                <Chiffre libelle="Tickets pris" valeur={stats.ticketsPris} />
                <Chiffre libelle="Clients servis" valeur={stats.servis} />
                <Chiffre libelle="Attente moyenne" valeur={`${stats.attenteMoyenneMin} min`} />
                <Chiffre libelle="Absents" valeur={stats.absents} />
              </div>
            )}

            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 20, alignItems: 'flex-start' }}>
              <section className="carte" style={{ flex: '999 1 420px', minWidth: 0 }}>
                <h2 className="titre-carte" style={{ marginBottom: 10 }}>Services</h2>
                <TableauServices services={services} onBasculer={basculerService} />
              </section>

              <section className="carte" style={{ flex: '1 1 220px', display: 'flex', flexDirection: 'column', gap: 12,
                alignItems: 'center', textAlign: 'center' }}>
                <h2 className="titre-carte" style={{ alignSelf: 'flex-start' }}>QR code d'accueil</h2>
                {qrCode ? <img src={qrCode} alt="QR code à afficher à l'entrée" width={150} height={150} />
                  : <p className="texte-doux">Chargement…</p>}
                <p className="texte-doux" style={{ fontSize: 13 }}>
                  À imprimer et afficher à l'entrée. Il mène à la page de choix du service.
                </p>
                {qrCode && (
                  <a className="btn btn-contour btn-pleine-largeur" style={{ minHeight: 40 }} href={qrCode}
                    download="montour-qrcode.png">
                    Télécharger (PNG)
                  </a>
                )}
              </section>
            </div>

            <section className="carte">
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
                <h2 className="titre-carte">Agents</h2>
                <button type="button" className="btn btn-secondaire" style={{ minHeight: 36, fontSize: 13 }}
                  onClick={() => setOnglet('agents')}>
                  + Ajouter un agent
                </button>
              </div>
              <ListeAgents agents={agents} />
            </section>
          </>
        )}

        {onglet === 'services' && (
          <section className="carte">
            <TableauServices services={services} onBasculer={basculerService} />
            <form onSubmit={creerService} className="formulaire-ligne">
              <div className="champ" style={{ flex: '2 1 200px' }}>
                <label htmlFor="service-nom">Nouveau service</label>
                <input id="service-nom" required placeholder="Ex. Caisse" value={nouveauService.nom}
                  onChange={(e) => setNouveauService({ ...nouveauService, nom: e.target.value })} />
              </div>
              <div className="champ" style={{ flex: '1 1 90px' }}>
                <label htmlFor="service-prefixe">Préfixe</label>
                <input id="service-prefixe" required maxLength={3} placeholder="Ex. K" value={nouveauService.prefixe}
                  onChange={(e) => setNouveauService({ ...nouveauService, prefixe: e.target.value })} />
              </div>
              <div className="champ" style={{ flex: '1 1 110px' }}>
                <label htmlFor="service-duree">Durée (min)</label>
                <input id="service-duree" type="number" min={1} max={120} value={nouveauService.dureeParDefautMin}
                  onChange={(e) => setNouveauService({ ...nouveauService, dureeParDefautMin: e.target.value })} />
              </div>
              <button type="submit" className="btn btn-primaire">Ajouter</button>
            </form>
          </section>
        )}

        {onglet === 'guichets' && (
          <section className="carte" style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            <p className="texte-doux" style={{ fontSize: 13 }}>Cliquez sur un guichet pour l'activer ou le désactiver.</p>
            {services.map((service) => (
              <div key={service.id} style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: 10 }}>
                <strong style={{ minWidth: 190 }}>{service.nom}</strong>
                {service.guichets.map((g) => (
                  <button key={g.id} type="button" className={g.actif ? 'pastille' : 'pastille pastille-grise'}
                    onClick={() => basculerGuichet(g)}>
                    {g.nom}
                  </button>
                ))}
                <button type="button" className="pastille pastille-grise" onClick={() => ajouterGuichet(service)}>
                  + Guichet
                </button>
              </div>
            ))}
          </section>
        )}

        {onglet === 'agents' && (
          <section className="carte">
            <ListeAgents agents={agents} />
            <form onSubmit={creerAgent} className="formulaire-ligne">
              <div className="champ" style={{ flex: '1 1 180px' }}>
                <label htmlFor="agent-nom">Nom</label>
                <input id="agent-nom" required value={nouvelAgent.nom}
                  onChange={(e) => setNouvelAgent({ ...nouvelAgent, nom: e.target.value })} />
              </div>
              <div className="champ" style={{ flex: '1 1 200px' }}>
                <label htmlFor="agent-email">Email</label>
                <input id="agent-email" type="email" required value={nouvelAgent.email}
                  onChange={(e) => setNouvelAgent({ ...nouvelAgent, email: e.target.value })} />
              </div>
              <div className="champ" style={{ flex: '1 1 160px' }}>
                <label htmlFor="agent-mdp">Mot de passe</label>
                <input id="agent-mdp" type="password" required minLength={8} value={nouvelAgent.motDePasse}
                  onChange={(e) => setNouvelAgent({ ...nouvelAgent, motDePasse: e.target.value })} />
              </div>
              <div className="champ" style={{ flex: '1 1 120px' }}>
                <label htmlFor="agent-role">Rôle</label>
                <select id="agent-role" value={nouvelAgent.role}
                  onChange={(e) => setNouvelAgent({ ...nouvelAgent, role: e.target.value })}>
                  <option value="AGENT">Agent</option>
                  <option value="ADMIN">Admin</option>
                </select>
              </div>
              <button type="submit" className="btn btn-primaire">Créer le compte</button>
            </form>
          </section>
        )}
      </main>
    </div>
  );
}

function Chiffre({ libelle, valeur }) {
  return (
    <div className="carte-chiffre">
      <span>{libelle}</span>
      <strong style={{ fontSize: 30 }}>{valeur}</strong>
    </div>
  );
}

function TableauServices({ services, onBasculer }) {
  return (
    <div className="defilement">
      <table className="tableau" style={{ minWidth: 460 }}>
        <thead>
          <tr>
            <th>Service</th>
            <th>Préfixe</th>
            <th>En attente</th>
            <th>Guichets</th>
            <th>État</th>
          </tr>
        </thead>
        <tbody>
          {services.map((service) => (
            <tr key={service.id}>
              <td><strong>{service.nom}</strong></td>
              <td>{service.prefixe}</td>
              <td>{service.enAttente}</td>
              <td>{service.guichets.filter((g) => g.actif).length}</td>
              <td>
                <button type="button" className={service.ouvert ? 'pastille' : 'pastille pastille-grise'}
                  title="Ouvrir / fermer le service" onClick={() => onBasculer(service)}>
                  {service.ouvert ? 'Ouvert' : 'Fermé'}
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function ListeAgents({ agents }) {
  return (
    <div className="grille-4">
      {agents.map((agent) => (
        <div key={agent.id} className="chiffre" style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
          <span className="avatar">{initiales(agent.nom)}</span>
          <span style={{ minWidth: 0 }}>
            <strong style={{ display: 'block', fontFamily: 'var(--corps)', fontSize: 14 }}>{agent.nom}</strong>
            <span className="texte-doux" style={{ fontSize: 12, overflowWrap: 'anywhere' }}>
              {agent.role === 'ADMIN' ? 'Administrateur' : 'Agent'} · {agent.email}
            </span>
          </span>
        </div>
      ))}
    </div>
  );
}
