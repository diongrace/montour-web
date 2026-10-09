import { useState } from 'react';
import { IconeCloche } from '../../components/Icones';
import { heure } from '../../utils/format';

/** Maquette 3 : écran orange plein écran affiché quand le ticket est appelé. */
export default function VotreTour({ etat }) {
  const [enRoute, setEnRoute] = useState(false);

  function confirmer() {
    navigator.vibrate?.(0); // arrête la vibration
    setEnRoute(true);
  }

  return (
    <main className="ecran-tour">
      <span className="cercle-cloche">
        <IconeCloche taille={32} />
      </span>
      <h1 style={{ fontSize: 34, lineHeight: 1.1 }}>C'est votre tour !</h1>
      <p style={{ fontSize: 14, fontWeight: 500, marginTop: 10 }}>
        Ticket {etat.code} · {etat.serviceNom}
      </p>

      <div
        className="carte"
        style={{ width: '100%', maxWidth: 420, marginTop: 28, padding: '24px 20px', borderRadius: 24,
          boxShadow: '0 10px 30px rgba(90, 44, 0, 0.18)' }}
      >
        <span className="texte-doux" style={{ fontSize: 15 }}>Présentez-vous au</span>
        <span className="numero" style={{ display: 'block', fontSize: 52, color: 'var(--vert)', lineHeight: 1.15 }}>
          {etat.guichet}
        </span>
        {etat.appeleLe && (
          <span className="texte-doux" style={{ fontSize: 13 }}>Appelé à {heure(etat.appeleLe)}</span>
        )}
      </div>

      <p style={{ margin: '24px 8px 0', fontSize: 14, lineHeight: 1.5, maxWidth: 320 }}>
        Sans réponse de votre part, l'agent pourra passer au ticket suivant.
      </p>

      <button
        type="button"
        className="btn btn-pleine-largeur"
        style={{ marginTop: 'auto', maxWidth: 420, minHeight: 52, background: 'var(--encre)', color: '#FFFFFF' }}
        onClick={confirmer}
        disabled={enRoute}
      >
        {enRoute ? `Bien noté, l'agent vous attend au ${etat.guichet}` : "J'arrive"}
      </button>
    </main>
  );
}
