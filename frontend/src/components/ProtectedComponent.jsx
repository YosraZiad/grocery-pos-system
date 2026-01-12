import { useAuth } from '../context/AuthContext';

function ProtectedComponent({ permission, children, fallback = null }) {
  const { user } = useAuth();

  if (!user) {
    return fallback;
  }

  // التحقق من الصلاحية
  const hasPermission = user.permissions?.some(p => p.name === permission) ||
                       user.roles?.some(role => 
                         role.permissions?.some(p => p.name === permission)
                       );

  if (!hasPermission) {
    return fallback;
  }

  return children;
}

export default ProtectedComponent;
