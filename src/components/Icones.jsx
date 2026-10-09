/** Petites icônes SVG des maquettes (trait 2 px, couleur héritée du texte). */

function Icone({ taille = 20, children, ...props }) {
  return (
    <svg width={taille} height={taille} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"
      strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" {...props}>
      {children}
    </svg>
  );
}

export function IconeTicket(props) {
  return (
    <Icone {...props}>
      <path d="M4 7a2 2 0 0 1 2-2h12a2 2 0 0 1 2 2v2a2 2 0 0 0 0 4v2a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2v-2a2 2 0 0 0 0-4z" />
      <path d="M14 5v12" strokeDasharray="2 2" />
    </Icone>
  );
}

export function IconeCloche(props) {
  return (
    <Icone {...props}>
      <path d="M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9" />
      <path d="M10.3 21a1.94 1.94 0 0 0 3.4 0" />
      <path d="M2 4.5 4 3M22 4.5 20 3" />
    </Icone>
  );
}

export function IconeCadenas(props) {
  return (
    <Icone {...props}>
      <rect x="5" y="11" width="14" height="10" rx="2" />
      <path d="M8 11V7a4 4 0 0 1 8 0v4" />
    </Icone>
  );
}

export function IconeFleche(props) {
  return (
    <Icone {...props}>
      <path d="M5 12h14M13 6l6 6-6 6" />
    </Icone>
  );
}

export function IconeQrCode(props) {
  return (
    <Icone {...props}>
      <rect x="3" y="3" width="7" height="7" rx="1" />
      <rect x="14" y="3" width="7" height="7" rx="1" />
      <rect x="3" y="14" width="7" height="7" rx="1" />
      <path d="M14 14h3v3h-3zM20 14v.01M14 20h.01M17 20h4v-3" />
    </Icone>
  );
}
