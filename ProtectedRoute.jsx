import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export const homeFor = (role) => `/${role}`;

// Sends visitors to /login, and sends users away from pages that belong to another role.
export default function ProtectedRoute({ role }) {
  const { user } = useAuth();
  if (!user) return <Navigate to="/login" replace />;
  if (role && user.role !== role) return <Navigate to={homeFor(user.role)} replace />;
  return <Outlet />;
}
