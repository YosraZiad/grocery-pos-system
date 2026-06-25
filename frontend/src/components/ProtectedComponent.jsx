import { useAuth } from '../context/AuthContext';

function ProtectedComponent({ permission, children, fallback = null }) {
  const { hasPermission } = useAuth();

  if (!hasPermission(permission)) {
    return fallback;
  }

  return children;
}

export default ProtectedComponent;
