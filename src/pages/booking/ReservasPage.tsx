import { useAuth } from '../../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import { useEffect, useState } from 'react';
import { 
  Building2, 
  Calendar, 
  Home,
  LogOut,
  Menu,
  X,
  Bell,
  User,
  CreditCard,
  Receipt,
  Users,
  Settings,
  BarChart3,
  Shield,
  UserPlus,
  Crown,
  Building
} from 'lucide-react';

import Reservas from '../../components/Reservas/Reservas';

export default function ReservasPage() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  useEffect(() => {
    if (!user) {
      navigate('/login');
    }
  }, [user, navigate]);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const navigateTo = (path: string) => {
    navigate(path);
    setSidebarOpen(false);
  };

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

  // Menús según rol del usuario
  const getMenuItems = () => {
    switch (user.role) {
      case 'SUPER_USER':
        return [
          { id: 'dashboard', name: 'Dashboard Principal', icon: Home, path: '/dashboard' },
          { id: 'areas-comunes', name: 'Gestionar Áreas Comunes', icon: Building2, path: '/areas-comunes' },
          { id: 'departamentos', name: 'Gestión de Departamentos', icon: Building, path: '/departamentos' },
          { id: 'reservas', name: 'Todas las Reservas', icon: Calendar, path: '/reservas' },
          { id: 'usuarios', name: 'Gestión de Usuarios', icon: Users, path: '/usuarios' },
          { id: 'crear-admin', name: 'Crear Administradores', icon: UserPlus, path: '/crear-admin' },
          { id: 'roles', name: 'Gestión de Roles', icon: Shield, path: '/roles' },
          { id: 'pagos', name: 'Sistema de Pagos', icon: CreditCard, path: '/pagos' },
          { id: 'facturas', name: 'Todas las Facturas', icon: Receipt, path: '/facturas' },
          { id: 'reportes', name: 'Reportes Avanzados', icon: BarChart3, path: '/reportes' },
          { id: 'configuracion', name: 'Configuración Sistema', icon: Settings, path: '/configuracion' },
        ];
      
      case 'USER_ADMIN':
        return [
          { id: 'dashboard', name: 'Dashboard', icon: Home, path: '/dashboard' },
          { id: 'areas-comunes', name: 'Áreas Comunes', icon: Building2, path: '/areas-comunes' },
          { id: 'reservas', name: 'Panel de Reservas', icon: Calendar, path: '/reservas' },
          { id: 'usuarios', name: 'Usuarios del Edificio', icon: Users, path: '/usuarios' },
          { id: 'pagos', name: 'Gestión de Pagos', icon: CreditCard, path: '/pagos' },
          { id: 'facturas', name: 'Facturas', icon: Receipt, path: '/facturas' },
          { id: 'reportes', name: 'Reportes', icon: BarChart3, path: '/reportes' },
        ];
      
      case 'USER_CASUAL':
      default:
        return [
          { id: 'dashboard', name: 'Inicio', icon: Home, path: '/dashboard' },
          { id: 'areas-comunes', name: 'Reservar Áreas', icon: Building2, path: '/areas-comunes' },
          { id: 'reservas', name: 'Mis Reservas', icon: Calendar, path: '/reservas' },
          { id: 'pagos', name: 'Mis Pagos', icon: CreditCard, path: '/pagos' },
          { id: 'facturas', name: 'Mis Facturas', icon: Receipt, path: '/facturas' },
        ];
    }
  };

  const menuItems = getMenuItems();

  const getSidebarColor = () => {
    switch (user.role) {
      case 'SUPER_USER':
        return 'from-purple-900 to-purple-800';
      case 'USER_ADMIN':
        return 'from-blue-900 to-blue-800';
      case 'USER_CASUAL':
      default:
        return 'from-green-900 to-green-800';
    }
  };

  const getRoleIcon = () => {
    switch (user.role) {
      case 'SUPER_USER':
        return <Crown className="h-6 w-6 text-white" />;
      case 'USER_ADMIN':
        return <Shield className="h-6 w-6 text-white" />;
      case 'USER_CASUAL':
      default:
        return <User className="h-6 w-6 text-white" />;
    }
  };

  const getRoleColor = () => {
    switch (user.role) {
      case 'SUPER_USER':
        return 'text-yellow-300';
      case 'USER_ADMIN':
        return 'text-blue-300';
      case 'USER_CASUAL':
      default:
        return 'text-green-300';
    }
  };

  const getRoleName = () => {
    switch (user.role) {
      case 'SUPER_USER':
        return 'Super Usuario';
      case 'USER_ADMIN':
        return 'Administrador';
      case 'USER_CASUAL':
      default:
        return 'Usuario';
    }
  };

  return (
    <div className="flex h-screen bg-gray-50">
      {/* Mobile sidebar backdrop */}
      {sidebarOpen && (
        <div className="fixed inset-0 z-40 lg:hidden">
          <div className="fixed inset-0 bg-gray-600 bg-opacity-75" onClick={() => setSidebarOpen(false)} />
        </div>
      )}

      {/* Sidebar */}
      <div className={`fixed inset-y-0 left-0 z-50 w-64 bg-gradient-to-b ${getSidebarColor()} transform transition-transform duration-300 ease-in-out lg:translate-x-0 lg:static lg:inset-0 ${
        sidebarOpen ? 'translate-x-0' : '-translate-x-full'
      }`}>
        <div className="flex items-center justify-between h-16 px-4 bg-opacity-90 bg-black">
          <div className="flex items-center">
            {getRoleIcon()}
            <span className="text-white text-lg font-semibold ml-2">
              {user.role === 'SUPER_USER' ? 'CityLights Master' : 
               user.role === 'USER_ADMIN' ? 'CityLights Admin' : 'CityLights'}
            </span>
          </div>
          <button
            onClick={() => setSidebarOpen(false)}
            className="lg:hidden text-white hover:text-gray-300"
          >
            <X className="h-6 w-6" />
          </button>
        </div>

        {/* User info */}
        <div className="p-4 border-b border-opacity-30 border-white">
          <div className="flex items-center">
            <div className="h-10 w-10 bg-gradient-to-br from-indigo-400 to-purple-500 rounded-full flex items-center justify-center">
              {getRoleIcon()}
            </div>
            <div className="ml-3">
              <div className="text-white text-sm font-medium">
                {user?.firstName} {user?.lastName}
              </div>
              <div className={`text-xs ${getRoleColor()}`}>
                {getRoleName()}
              </div>
            </div>
          </div>
        </div>

        {/* Navigation */}
        <nav className="mt-5 px-2">
          {menuItems.map((item) => {
            const Icon = item.icon;
            const isActive = item.path === '/reservas';
            return (
              <button
                key={item.id}
                onClick={() => navigateTo(item.path)}
                className={`group flex items-center px-2 py-2 text-sm font-medium rounded-md w-full text-left mb-1 transition-colors ${
                  isActive
                    ? 'bg-white bg-opacity-20 text-white'
                    : 'text-gray-200 hover:bg-white hover:bg-opacity-10 hover:text-white'
                }`}
              >
                <Icon className="mr-3 h-5 w-5" />
                {item.name}
              </button>
            );
          })}
        </nav>

        {/* Logout button */}
        <div className="absolute bottom-0 w-full p-4 border-t border-opacity-30 border-white">
          <button
            onClick={handleLogout}
            className="group flex items-center px-2 py-2 text-sm font-medium rounded-md w-full text-left text-gray-200 hover:bg-white hover:bg-opacity-10 hover:text-white"
          >
            <LogOut className="mr-3 h-5 w-5" />
            Cerrar Sesión
          </button>
        </div>
      </div>

      {/* Main content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Top bar */}
        <header className="bg-white shadow-sm border-b border-gray-200">
          <div className="flex items-center justify-between px-4 py-3">
            <div className="flex items-center">
              <button
                onClick={() => setSidebarOpen(true)}
                className="lg:hidden text-gray-600 hover:text-gray-900"
              >
                <Menu className="h-6 w-6" />
              </button>
              <h1 className="text-xl font-semibold text-gray-900 lg:ml-0 ml-3">
                {user.role === 'USER_CASUAL' ? 'Mis Reservas' : 
                 user.role === 'USER_ADMIN' ? 'Panel de Reservas' : 'Todas las Reservas'}
              </h1>
            </div>
            
            <div className="flex items-center space-x-4">
              <button className="text-gray-600 hover:text-gray-900">
                <Bell className="h-5 w-5" />
              </button>
              <div className="flex items-center space-x-2">
                <div className="h-8 w-8 bg-gradient-to-br from-indigo-400 to-purple-500 rounded-full flex items-center justify-center">
                  {getRoleIcon()}
                </div>
                <span className="text-sm font-medium text-gray-700">
                  {user?.firstName}
                </span>
              </div>
            </div>
          </div>
        </header>

        {/* Main content area */}
        <main className="flex-1 overflow-y-auto p-6">
          <Reservas />
        </main>
      </div>
    </div>
  );
}