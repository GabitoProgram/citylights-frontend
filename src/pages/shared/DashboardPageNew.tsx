import { useAuth } from '../../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import { useEffect } from 'react';

// Dashboards específicos por rol
import CasualUserDashboard from '../../components/CasualUserDashboard';
import AdminUserDashboard from '../../components/AdminUserDashboard';
import SuperUserDashboard from '../../components/SuperUserDashboard';

export default function DashboardPage() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!user) {
      navigate('/login');
    }
  }, [user, navigate]);

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Cargando...</p>
        </div>
      </div>
    );
  }

  // Determinar qué dashboard mostrar según el rol
  switch (user.role) {
    case 'USER_CASUAL':
      return <CasualUserDashboard />;
    
    case 'USER_ADMIN':
      return <AdminUserDashboard />;
    
    case 'SUPER_USER':
      return <SuperUserDashboard />;
    
    default:
      logout();
      navigate('/login');
      return null;
  }
}