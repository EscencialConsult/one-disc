import { Routes, Route, Navigate } from 'react-router-dom';
import { CONFIG } from './lib/config.js';
import { Session } from './lib/session.js';
import Landing from './pages/Landing.jsx';
import SuperAdminDashboard from './pages/SuperAdminDashboard.jsx';
import AdminDashboard from './pages/AdminDashboard.jsx';
import Rrhh from './pages/Rrhh.jsx';
import Userboard from './pages/Userboard.jsx';
import TestDisc from './pages/TestDisc.jsx';
import RegistroRapido from './pages/RegistroRapido.jsx';

/**
 * Réplica de Auth.protectPage(): si no hay sesión → login;
 * si el rol no coincide → redirige a su dashboard.
 */
function Protected({ role, children }) {
  const session = Session.get();
  if (!session) return <Navigate to={CONFIG.routes.login} replace />;
  if (role && session.role !== role) return <Navigate to={Session.dashboardRoute()} replace />;
  return children;
}

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<Landing />} />
      <Route
        path={CONFIG.routes.superAdminDashboard}
        element={
          <Protected role={CONFIG.roles.SUPERADMIN}>
            <SuperAdminDashboard />
          </Protected>
        }
      />
      <Route
        path={CONFIG.routes.adminDashboard}
        element={
          <Protected role={CONFIG.roles.ADMIN}>
            <AdminDashboard />
          </Protected>
        }
      />
      <Route
        path={CONFIG.routes.rrhh}
        element={
          <Protected role={CONFIG.roles.ADMIN}>
            <Rrhh />
          </Protected>
        }
      />
      <Route
        path={CONFIG.routes.userboard}
        element={
          <Protected role={CONFIG.roles.USER}>
            <Userboard />
          </Protected>
        }
      />
      <Route
        path={CONFIG.routes.test}
        element={
          <Protected role={CONFIG.roles.USER}>
            <TestDisc />
          </Protected>
        }
      />
      {/* Link de Registro Rápido: público, sin login, uno fijo por empresa */}
      <Route path={CONFIG.routes.registroRapido} element={<RegistroRapido />} />
      {/* /informe se sirve estático desde public/informe/index.html (fuera del router) */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
