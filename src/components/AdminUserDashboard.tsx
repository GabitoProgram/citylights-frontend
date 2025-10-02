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
  DollarSign
} from 'lucide-react';

export default function AdminUserDashboard() {
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
    { id: 'dashboard', name: 'Dashboard', icon: Home, path: '/dashboard' },
    { id: 'areas-comunes', name: 'Gestionar Áreas Comunes', icon: Building2, path: '/areas-comunes' },
    { id: 'reservas', name: 'Todas las Reservas', icon: Calendar, path: '/reservas' },
    { id: 'usuarios-casuales', name: 'Usuarios Casuales', icon: Users, path: '/usuarios' },
    { id: 'pagos', name: 'Gestión de Pagos', icon: CreditCard, path: '/pagos' },
    { id: 'facturas', name: 'Todas las Facturas', icon: Receipt, path: '/facturas' },
    { id: 'reportes', name: 'Reportes', icon: BarChart3, path: '/reportes' },
    { id: 'configuracion', name: 'Configuración', icon: Settings, path: '/configuracion' },
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
      <div className={`fixed inset-y-0 left-0 z-50 w-64 bg-primary-800 transform transition-transform duration-300 ease-in-out lg:translate-x-0 lg:static lg:inset-0 ${
        sidebarOpen ? 'translate-x-0' : '-translate-x-full'
      }`}>
        <div className="flex items-center justify-between h-16 px-4 bg-primary-900">
          <div className="flex items-center">
            <Building2 className="h-8 w-8 text-white mr-2" />
            <span className="text-white text-lg font-semibold">CityLights Admin</span>
          </div>
          <button
            onClick={() => setSidebarOpen(false)}
            className="lg:hidden text-white hover:text-gray-300"
          >
            <X className="h-6 w-6" />
          </button>
        </div>

        {/* User info */}
        <div className="p-4 border-b border-primary-700">
          <div className="flex items-center">
            <div className="h-10 w-10 bg-yellow-600 rounded-full flex items-center justify-center">
              <User className="h-6 w-6 text-white" />
            </div>
            <div className="ml-3">
              <div className="text-white text-sm font-medium">
                {user?.firstName} {user?.lastName}
              </div>
              <div className="text-yellow-300 text-xs">Administrador</div>
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
                      ? 'bg-primary-700 text-white'
                      : 'text-primary-100 hover:bg-primary-700 hover:text-white'
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
            className="w-full flex items-center px-3 py-2 text-sm font-medium text-primary-100 rounded-md hover:bg-primary-700 hover:text-white transition-colors"
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
          <h1 className="text-xl font-semibold text-gray-900">Panel de Administración</h1>
          <div className="flex items-center space-x-4">
            <Bell className="h-6 w-6 text-gray-400 hover:text-gray-500 cursor-pointer" />
          </div>
        </div>

        {/* Dashboard content */}
        <div className="p-6">
          <div className="mb-6">
            <h2 className="text-2xl font-bold text-gray-900">
              Panel de Administración - {user?.firstName}
            </h2>
            <p className="text-gray-600">
              Gestiona áreas comunes, usuarios casuales, reservas y configuraciones del sistema.
            </p>
          </div>

          {/* Quick stats */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-6">
            <div className="bg-white p-6 rounded-lg shadow">
              <div className="flex items-center">
                <Users className="h-8 w-8 text-blue-600 mr-3" />
                <div>
                  <h3 className="text-lg font-semibold text-gray-900">Usuarios</h3>
                  <p className="text-gray-600">Gestionar usuarios casuales</p>
                </div>
              </div>
            </div>

            <div className="bg-white p-6 rounded-lg shadow">
              <div className="flex items-center">
                <Building2 className="h-8 w-8 text-green-600 mr-3" />
                <div>
                  <h3 className="text-lg font-semibold text-gray-900">Áreas Comunes</h3>
                  <p className="text-gray-600">Crear y editar espacios</p>
                </div>
              </div>
            </div>

            <div className="bg-white p-6 rounded-lg shadow">
              <div className="flex items-center">
                <Calendar className="h-8 w-8 text-purple-600 mr-3" />
                <div>
                  <h3 className="text-lg font-semibold text-gray-900">Reservas</h3>
                  <p className="text-gray-600">Supervisar todas las reservas</p>
                </div>
              </div>
            </div>

            <div className="bg-white p-6 rounded-lg shadow">
              <div className="flex items-center">
                <BarChart3 className="h-8 w-8 text-orange-600 mr-3" />
                <div>
                  <h3 className="text-lg font-semibold text-gray-900">Reportes</h3>
                  <p className="text-gray-600">Análisis y estadísticas</p>
                </div>
              </div>
            </div>
          </div>

          {/* Sección de Nómina para Admins */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-6">
            <div 
              onClick={() => navigateTo('/pagos')}
              className="bg-gradient-to-br from-emerald-500 to-emerald-600 p-6 rounded-lg shadow text-white cursor-pointer hover:from-emerald-600 hover:to-emerald-700 transition-all duration-200 transform hover:scale-105"
            >
              <div className="flex items-center">
                <DollarSign className="h-8 w-8 mr-3" />
                <div>
                  <h3 className="text-lg font-semibold">Sistema de Nómina</h3>
                  <p className="text-emerald-100">Gestionar empleados y pagos</p>
                </div>
              </div>
            </div>
          </div>

          {/* Management sections */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="bg-white rounded-lg shadow">
              <div className="p-6 border-b border-gray-200">
                <h3 className="text-lg font-semibold text-gray-900">Acciones Rápidas</h3>
              </div>
              <div className="p-6 space-y-4">
                <button className="w-full text-left p-3 border border-gray-200 rounded-lg hover:bg-gray-50">
                  <div className="flex items-center">
                    <Building2 className="h-5 w-5 text-green-600 mr-3" />
                    <span className="font-medium">Crear nueva área común</span>
                  </div>
                </button>
                <button className="w-full text-left p-3 border border-gray-200 rounded-lg hover:bg-gray-50">
                  <div className="flex items-center">
                    <Users className="h-5 w-5 text-blue-600 mr-3" />
                    <span className="font-medium">Registrar nuevo usuario</span>
                  </div>
                </button>
                <button className="w-full text-left p-3 border border-gray-200 rounded-lg hover:bg-gray-50">
                  <div className="flex items-center">
                    <BarChart3 className="h-5 w-5 text-orange-600 mr-3" />
                    <span className="font-medium">Generar reporte mensual</span>
                  </div>
                </button>
              </div>
            </div>

            <div className="bg-white rounded-lg shadow">
              <div className="p-6 border-b border-gray-200">
                <h3 className="text-lg font-semibold text-gray-900">Actividad Reciente</h3>
              </div>
              <div className="p-6">
                <p className="text-gray-500">No hay actividad reciente</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}