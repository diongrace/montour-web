import { useCallback, useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { api } from '../../api/client';
import { IconeQrCode } from '../../components/Icones';
import { useTopic } from '../../hooks/useTopic';
import { activerSon, alerter } from '../../utils/alerte';
import { heureHorloge } from '../../utils/format';

/** Maquette 7 : écran pour la TV de la salle d'attente, le dernier numéro appelé en très grand. */
export default function EcranSalle() {
  const { slug } = useParams();
  const [nom, setNom] = useState('');
  const [appels, setAppels] = useState([]);
  const [horloge, setHorloge] = useState(() => new Date());

  const charger = useCallback(() => {
    api(`/api/public/etablissements/${slug}/ecran`).then(setAppels).catch(() => {});
  }, [slug]);

  useEffect(() => {
    api(`/api/public/etablissements/${slug}`).then((e) => setNom(e.nom)).catch(() => {});
    charger();
  }, [slug, charger]);

  useEffect(() => {
    const minuterie = setInterval(() => setHorloge(new Date()), 10000);
    return () => clearInterval(minuterie);
  }, []);

  useTopic(
    `/topic/etablissements/${slug}/ecran`,
    (appel) => {
      // Le nouvel appel passe en tête ; un rappel remonte le numéro sans le dupliquer.
      setAppels((precedents) => [appel, ...precedents.filter((a) => a.code !== appel.code)].slice(0, 6));
      alerter();
    },
    charger,
  );

  const [dernier, ...precedents] = appels;

  return (
    <main className="ecran-salle" onClick={activerSon}>
      <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '28px 44px' }}>
        <span className="numero" style={{ fontSize: 26 }}>
          MonTour <span style={{ fontWeight: 600, color: '#B7CDC5' }}>· {nom}</span>
        </span>
        <span className="numero" style={{ fontSize: 30 }}>{heureHorloge(horloge)}</span>
      </header>

      <div style={{ flexGrow: 1, display: 'flex', flexWrap: 'wrap', gap: 36, padding: '0 44px 28px' }}>
        <section style={{ flex: '3 1 460px', borderRadius: 28, background: 'var(--orange)', color: 'var(--encre)',
          display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 8, minHeight: 360 }}>
          {dernier ? (
            <>
              <span style={{ fontSize: 26, fontWeight: 700 }}>Numéro appelé</span>
              <span className="numero" style={{ fontSize: 'clamp(96px, 14vw, 200px)', lineHeight: 0.95, letterSpacing: -6 }}>
                {dernier.code}
              </span>
              <span className="numero" style={{ marginTop: 14, padding: '10px 30px', borderRadius: 999,
                background: 'var(--encre)', color: '#FFFFFF', fontSize: 40 }}>
                {dernier.guichet}
              </span>
            </>
          ) : (
            <span style={{ fontSize: 30, fontWeight: 700 }}>En attente du premier appel</span>
          )}
        </section>

        <section style={{ flex: '2 1 300px', display: 'flex', flexDirection: 'column', gap: 12 }}>
          <h2 style={{ fontFamily: 'var(--corps)', fontSize: 19, fontWeight: 700, color: '#B7CDC5' }}>Derniers appels</h2>
          {precedents.map((appel) => (
            <div key={`${appel.code}-${appel.heure}`} style={{ display: 'flex', justifyContent: 'space-between',
              alignItems: 'center', padding: '16px 22px', borderRadius: 14, background: 'var(--nuit-clair)' }}>
              <span className="numero" style={{ fontSize: 36 }}>{appel.code}</span>
              <span style={{ fontSize: 19, color: '#D5E3DE' }}>{appel.guichet}</span>
            </div>
          ))}
        </section>
      </div>

      <footer style={{ padding: '18px 44px', background: 'rgba(0,0,0,0.25)', fontSize: 19, display: 'flex',
        alignItems: 'center', gap: 14 }}>
        <IconeQrCode taille={26} style={{ color: 'var(--orange)', flex: 'none' }} />
        Pas encore de ticket ? Scannez le QR code à l'entrée et suivez votre tour sur votre téléphone.
      </footer>
    </main>
  );
}
