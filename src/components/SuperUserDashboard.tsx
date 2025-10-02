import { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
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
  Building,
  DollarSign
} from 'lucide-react';

export default function SuperUserDashboard() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [activeSection, setActiveSection] = useState('dashboard');

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const navigateTo = (path: string) => {
    if (path === '/dashboard') {
      // Si es dashboard, solo cambiar la sección activa, no navegar
      setActiveSection('dashboard');
      setSidebarOpen(false);
    } else {
      // Para otras rutas, navegar normalmente
      navigate(path);
      setSidebarOpen(false);
    }
  };

  const menuItems = [
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

  return (
    <div className="flex h-screen bg-gray-50">
      {/* Mobile sidebar backdrop */}
      {sidebarOpen && (
        <div className="fixed inset-0 z-40 lg:hidden">
          <div className="fixed inset-0 bg-gray-600 bg-opacity-75" onClick={() => setSidebarOpen(false)} />
        </div>
      )}

      {/* Sidebar */}
      <div className={`fixed inset-y-0 left-0 z-50 w-64 bg-gradient-to-b from-purple-900 to-purple-800 transform transition-transform duration-300 ease-in-out lg:translate-x-0 lg:static lg:inset-0 ${
        sidebarOpen ? 'translate-x-0' : '-translate-x-full'
      }`}>
        <div className="flex items-center justify-between h-16 px-4 bg-purple-950">
          <div className="flex items-center">
            <Crown className="h-8 w-8 text-yellow-400 mr-2" />
            <span className="text-white text-lg font-semibold">CityLights Master</span>
          </div>
          <button
            onClick={() => setSidebarOpen(false)}
            className="lg:hidden text-white hover:text-gray-300"
          >
            <X className="h-6 w-6" />
          </button>
        </div>

        {/* User info */}
        <div className="p-4 border-b border-purple-700">
          <div className="flex items-center">
            <div className="h-10 w-10 bg-gradient-to-br from-yellow-400 to-orange-500 rounded-full flex items-center justify-center">
              <Crown className="h-6 w-6 text-white" />
            </div>
            <div className="ml-3">
              <div className="text-white text-sm font-medium">
                {user?.firstName} {user?.lastName}
              </div>
              <div className="text-yellow-300 text-xs">Super Usuario</div>
            </div>
          </div>
        </div>

        {/* Navigation */}
        <nav className="mt-4 px-4">
          <ul className="space-y-2">
            {menuItems.map((item) => (
              <li key={item.id}>
                <button
                  onClick={() => {
                    if (item.id === 'dashboard') {
                      setActiveSection('dashboard');
                      setSidebarOpen(false);
                    } else {
                      navigateTo(item.path);
                    }
                  }}
                  className={`w-full flex items-center px-3 py-2 text-sm font-medium rounded-md transition-colors ${
                    activeSection === item.id
                      ? 'bg-purple-700 text-white'
                      : 'text-purple-100 hover:bg-purple-700 hover:text-white'
                  }`}
                >
                  <item.icon className="mr-3 h-5 w-5" />
                  {item.name}
                </button>
              </li>
            ))}
          </ul>
        </nav>

        {/* Logout */}
        <div className="absolute bottom-0 w-full p-4">
          <button
            onClick={handleLogout}
            className="w-full flex items-center px-3 py-2 text-sm font-medium text-purple-100 rounded-md hover:bg-purple-700 hover:text-white transition-colors"
          >
            <LogOut className="mr-3 h-5 w-5" />
            Cerrar Sesión
          </button>
        </div>
      </div>

      {/* Main content */}
      <div className="lg:pl-64">
        {/* Top bar */}
        <div className="flex items-center justify-between h-16 px-4 bg-white border-b border-gray-200">
          <button
            onClick={() => setSidebarOpen(true)}
            className="lg:hidden text-gray-500 hover:text-gray-700"
          >
            <Menu className="h-6 w-6" />
          </button>
          <h1 className="text-xl font-semibold text-gray-900">Panel de Super Usuario</h1>
          <div className="flex items-center space-x-4">
            <Bell className="h-6 w-6 text-gray-400 hover:text-gray-500 cursor-pointer" />
            <Crown className="h-6 w-6 text-yellow-500" />
          </div>
        </div>

        {/* Dashboard content */}
        <div className="p-6">
          <div className="mb-6">
            <h2 className="text-2xl font-bold text-gray-900">
              Control Total del Sistema - {user?.firstName}
            </h2>
            <p className="text-gray-600">
              Acceso completo a todas las funcionalidades del sistema, gestión de usuarios y roles.
            </p>
          </div>

          {/* Quick stats */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-6">
            <div className="bg-gradient-to-br from-blue-500 to-blue-600 p-6 rounded-lg shadow text-white">
              <div className="flex items-center">
                <Users className="h-8 w-8 mr-3" />
                <div>
                  <h3 className="text-lg font-semibold">Todos los Usuarios</h3>
                  <p className="text-blue-100">Gestión completa</p>
                </div>
              </div>
            </div>

            <div className="bg-gradient-to-br from-green-500 to-green-600 p-6 rounded-lg shadow text-white">
              <div className="flex items-center">
                <Shield className="h-8 w-8 mr-3" />
                <div>
                  <h3 className="text-lg font-semibold">Gestión de Roles</h3>
                  <p className="text-green-100">Cambiar permisos</p>
                </div>
              </div>
            </div>

            <div className="bg-gradient-to-br from-purple-500 to-purple-600 p-6 rounded-lg shadow text-white">
              <div className="flex items-center">
                <UserPlus className="h-8 w-8 mr-3" />
                <div>
                  <h3 className="text-lg font-semibold">Crear Admins</h3>
                  <p className="text-purple-100">Nuevos super usuarios</p>
                </div>
              </div>
            </div>

            <div className="bg-gradient-to-br from-orange-500 to-orange-600 p-6 rounded-lg shadow text-white">
              <div className="flex items-center">
                <Settings className="h-8 w-8 mr-3" />
                <div>
                  <h3 className="text-lg font-semibold">Sistema</h3>
                  <p className="text-orange-100">Configuración total</p>
                </div>
              </div>
            </div>
          </div>

          {/* Nueva sección de Nómina */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-6">
            <div 
              onClick={() => navigateTo('/pagos')}
              className="bg-gradient-to-br from-emerald-500 to-emerald-600 p-6 rounded-lg shadow text-white cursor-pointer hover:from-emerald-600 hover:to-emerald-700 transition-all duration-200 transform hover:scale-105"
            >
              <div className="flex items-center">
                <DollarSign className="h-8 w-8 mr-3" />
                <div>
                  <h3 className="text-lg font-semibold">Sistema de Nómina</h3>
                  <p className="text-emerald-100">Empleados y pagos</p>
                </div>
              </div>
            </div>
          </div>

          {/* Super user exclusive actions */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
            <div className="bg-white rounded-lg shadow border-l-4 border-purple-500">
              <div className="p-6 border-b border-gray-200">
                <h3 className="text-lg font-semibold text-gray-900 flex items-center">
                  <Crown className="h-5 w-5 text-purple-500 mr-2" />
                  Acciones Exclusivas de Super Usuario
                </h3>
              </div>
              <div className="p-6 space-y-4">
                <button className="w-full text-left p-3 border border-purple-200 rounded-lg hover:bg-purple-50">
                  <div className="flex items-center">
                    <UserPlus className="h-5 w-5 text-purple-600 mr-3" />
                    <span className="font-medium">Crear nuevo Super Usuario</span>
                  </div>
                </button>
                <button className="w-full text-left p-3 border border-blue-200 rounded-lg hover:bg-blue-50">
                  <div className="flex items-center">
                    <Shield className="h-5 w-5 text-blue-600 mr-3" />
                    <span className="font-medium">Crear nuevo User Admin</span>
                  </div>
                </button>
                <button className="w-full text-left p-3 border border-green-200 rounded-lg hover:bg-green-50">
                  <div className="flex items-center">
                    <Settings className="h-5 w-5 text-green-600 mr-3" />
                    <span className="font-medium">Cambiar roles de usuarios</span>
                  </div>
                </button>
              </div>
            </div>

            <div className="bg-white rounded-lg shadow">
              <div className="p-6 border-b border-gray-200">
                <h3 className="text-lg font-semibold text-gray-900">Gestión Administrativa</h3>
              </div>
              <div className="p-6 space-y-4">
                <button className="w-full text-left p-3 border border-gray-200 rounded-lg hover:bg-gray-50">
                  <div className="flex items-center">
                    <Building2 className="h-5 w-5 text-green-600 mr-3" />
                    <span className="font-medium">Gestionar áreas comunes</span>
                  </div>
                </button>
                <button className="w-full text-left p-3 border border-gray-200 rounded-lg hover:bg-gray-50">
                  <div className="flex items-center">
                    <BarChart3 className="h-5 w-5 text-orange-600 mr-3" />
                    <span className="font-medium">Reportes avanzados</span>
                  </div>
                </button>
                <button className="w-full text-left p-3 border border-gray-200 rounded-lg hover:bg-gray-50">
                  <div className="flex items-center">
                    <Receipt className="h-5 w-5 text-blue-600 mr-3" />
                    <span className="font-medium">Sistema de facturación</span>
                  </div>
                </button>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow">
            <div className="p-6 border-b border-gray-200">
              <h3 className="text-lg font-semibold text-gray-900">Actividad del Sistema</h3>
            </div>
            <div className="p-6">
              <p className="text-gray-500">Panel de monitoreo en tiempo real</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}