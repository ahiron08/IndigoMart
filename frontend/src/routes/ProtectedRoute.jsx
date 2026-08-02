import { Navigate, Outlet, useLocation } from 'react-router-dom';

import { useAuth } from '@/context/AuthContext.jsx';

const generalRoles = ['customer', 'user', 'creator', 'admin', 'seller'];

function ProtectedRoute({ roles }) {
  const { user, isLoading } = useAuth();
  const location = useLocation();

  if (isLoading) {
    return (
      <div className="grid min-h-dvh place-items-center bg-canvas" role="status">
        <span className="loader" aria-label="Restoring your session" />
      </div>
    );
  }

  if (!user) return <Navigate to="/login" replace state={{ from: location }} />;
  if (roles && !roles.includes(user.role)) return <Navigate to="/" replace />;
  return <Outlet />;
}

export default ProtectedRoute;