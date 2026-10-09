import { IconeTicket } from './Icones';

/**
 * Le logo MonTour.
 * - avecIcone : le carré vert avec le ticket (pages client), ou juste le mot (poste agent).
 * - sousTitre : le nom de l'établissement sous le logo.
 * - clair : version blanche, sur fond vert.
 */
export default function Logo({ sousTitre, avecIcone = true, clair = false }) {
  return (
    <div className={`logo${clair ? ' logo-clair' : ''}`}>
      {avecIcone && (
        <span className="logo-icone">
          <IconeTicket taille={20} />
        </span>
      )}
      <span>
        MonTour
        {sousTitre && <span className="logo-sous-titre">{sousTitre}</span>}
      </span>
    </div>
  );
}
