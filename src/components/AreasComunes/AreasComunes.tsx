
import { useAuth } from '../../context/AuthContext';
// Importamos las páginas específicas por rol
import AreasComunesUserPage from '../../pages/booking/AreasComunesUserPage';
import AreasComunesAdminPage from '../../pages/booking/AreasComunesAdminPage';
import AreasComunesSuperPage from '../../pages/booking/AreasComunesSuperPage';

const AreasComunes = () => {
  const { user } = useAuth();

  // Renderiza la página correspondiente según el rol del usuario
  const renderAreasComunesByRole = () => {
    if (!user) {
      return (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="text-center">
            <h1 className="text-2xl font-bold text-gray-900">Cargando...</h1>
          </div>
        </div>
      );
    }

    switch (user.role) {
      case 'SUPER_USER':
        return <AreasComunesSuperPage />;
      case 'USER_ADMIN':
        return <AreasComunesAdminPage />;
      case 'USER_CASUAL':
        return <AreasComunesUserPage />;
      default:
        return (
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
            <div className="text-center">
              <h1 className="text-2xl font-bold text-red-600">Error</h1>
              <p className="mt-2 text-gray-600">Rol de usuario no reconocido</p>
            </div>
          </div>
        );
    }
  };

  return renderAreasComunesByRole();
};

export default AreasComunes;
