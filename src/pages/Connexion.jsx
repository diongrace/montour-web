import { useState } from 'react';
import { Navigate, useNavigate } from 'react-router-dom';
import { useAuth } from '../auth/AuthContext';
import Logo from '../components/Logo';

const PAGE_PAR_ROLE = { ADMIN: '/admin', AGENT: '/agent' };

/** Maquette 4 : connexion des agents et des administrateurs. */
export default function Connexion() {
  const { session, connexion } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [motDePasse, setMotDePasse] = useState('');
  const [erreur, setErreur] = useState('');
  const [envoi, setEnvoi] = useState(false);

  if (session) {
    return <Navigate to={PAGE_PAR_ROLE[session.role]} replace />;
  }

  async function soumettre(evenement) {
    evenement.preventDefault();
    setEnvoi(true);
    setErreur('');
    try {
      const utilisateur = await connexion(email, motDePasse);
      navigate(PAGE_PAR_ROLE[utilisateur.role]);
    } catch (e) {
      setErreur(e.status === 401 ? 'Email ou mot de passe incorrect. Réessayez.' : e.message);
    } finally {
      setEnvoi(false);
    }
  }

  return (
    <div className="connexion">
      <section className="connexion-gauche">
        <Logo clair />
        <h1 style={{ marginTop: 'auto', fontSize: 42, lineHeight: 1.08, maxWidth: 420 }}>
          Moins d'attente debout, plus de sérénité.
        </h1>
        <p style={{ fontSize: 16, lineHeight: 1.55, maxWidth: 420, opacity: 0.92 }}>
          Vos clients prennent un ticket en scannant un QR code et suivent leur tour en direct sur leur téléphone.
        </p>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
          <span className="pastille">Sans application</span>
          <span className="pastille">Temps réel</span>
          <span className="pastille">Aucune donnée personnelle</span>
        </div>
      </section>

      <section className="connexion-droite">
        <form
          className="carte"
          onSubmit={soumettre}
          style={{ width: '100%', maxWidth: 380, padding: '32px 28px', display: 'flex', flexDirection: 'column', gap: 18 }}
        >
          <div>
            <h2 style={{ fontSize: 26 }}>Espace professionnel</h2>
            <p className="texte-doux" style={{ marginTop: 6, fontSize: 14 }}>
              Connexion réservée aux agents et aux administrateurs.
            </p>
          </div>

          <div className="champ">
            <label htmlFor="email">Adresse email</label>
            <input id="email" type="email" autoComplete="username" required value={email}
              onChange={(e) => setEmail(e.target.value)} />
          </div>

          <div className={`champ${erreur ? ' en-erreur' : ''}`}>
            <label htmlFor="motDePasse">Mot de passe</label>
            <input id="motDePasse" type="password" autoComplete="current-password" required value={motDePasse}
              onChange={(e) => setMotDePasse(e.target.value)} />
            {erreur && <span className="erreur-champ">{erreur}</span>}
          </div>

          <button type="submit" className="btn btn-primaire" disabled={envoi}>
            {envoi ? 'Connexion…' : 'Se connecter'}
          </button>

          <p className="texte-doux" style={{ fontSize: 12, textAlign: 'center' }}>
            Mot de passe oublié ? Contactez votre administrateur.
          </p>
        </form>
      </section>
    </div>
  );
}
