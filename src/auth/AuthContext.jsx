import { createContext, useContext, useState } from 'react';
import { Navigate } from 'react-router-dom';
import { api } from '../api/client';

const CLE_SESSION = 'montour.session';
const AuthContext = createContext(null);

function lireSession() {
  try {
    return JSON.parse(localStorage.getItem(CLE_SESSION));
  } catch {
    return null;
  }
}

/** Garde la session (token JWT, nom, rôle) en mémoire et dans le navigateur. */
export function AuthProvider({ children }) {
  const [session, setSession] = useState(lireSession);

  async function connexion(email, motDePasse) {
    const donnees = await api('/api/auth/login', { methode: 'POST', corps: { email, motDePasse } });
    localStorage.setItem(CLE_SESSION, JSON.stringify(donnees));
    setSession(donnees);
    return donnees;
  }

  function deconnexion() {
    localStorage.removeItem(CLE_SESSION);
    setSession(null);
  }

  return <AuthContext.Provider value={{ session, connexion, deconnexion }}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  return useContext(AuthContext);
}

/** Affiche la page seulement si l'utilisateur a l'un des rôles demandés. */
export function RoleRequis({ roles, children }) {
  const { session } = useAuth();
  if (!session || !roles.includes(session.role)) {
    return <Navigate to="/connexion" replace />;
  }
  return children;
}
