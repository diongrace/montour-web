import { Navigate, Route, Routes } from 'react-router-dom';
import { RoleRequis } from './auth/AuthContext';
import ChoixService from './pages/client/ChoixService';
import MonTicket from './pages/client/MonTicket';
import Connexion from './pages/Connexion';
import PosteAgent from './pages/agent/PosteAgent';
import TableauAdmin from './pages/admin/TableauAdmin';
import EcranSalle from './pages/salle/EcranSalle';

export default function App() {
  return (
    <Routes>
      {/* Démo : la page d'accueil mène à l'établissement de démonstration. */}
      <Route path="/" element={<Navigate to="/e/centre-demo" replace />} />
      <Route path="/e/:slug" element={<ChoixService />} />
      <Route path="/t/:jeton" element={<MonTicket />} />
      <Route path="/connexion" element={<Connexion />} />
      <Route
        path="/agent"
        element={
          <RoleRequis roles={['AGENT', 'ADMIN']}>
            <PosteAgent />
          </RoleRequis>
        }
      />
      <Route
        path="/admin"
        element={
          <RoleRequis roles={['ADMIN']}>
            <TableauAdmin />
          </RoleRequis>
        }
      />
      <Route path="/salle/:slug" element={<EcranSalle />} />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
