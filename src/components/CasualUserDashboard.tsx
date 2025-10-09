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
  MapPin
} from 'lucide-react';

export default function CasualUserDashboard() {
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

  // Función para manejar las secciones internas del dashboard
  const handleSectionChange = (sectionId: string) => {
    setActiveSection(sectionId);
    setSidebarOpen(false);
  };

  const menuItems = [
    { id: 'dashboard', name: 'Inicio', icon: Home, section: true },
    { id: 'areas-comunes', name: 'Ver Áreas Comunes', icon: Building2, path: '/areas-comunes' },
    { id: 'mis-reservas', name: 'Mis Reservas', icon: Calendar, path: '/reservas' },
    { id: 'hacer-reserva', name: 'Hacer Reserva', icon: MapPin, path: '/nueva-reserva' },
    { id: 'mis-pagos', name: 'Mis Pagos', icon: CreditCard, path: '/mis-pagos' },
    { id: 'mis-facturas', name: 'Mis Facturas', icon: Receipt, section: true },
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
      <div className={`fixed inset-y-0 left-0 z-50 w-64 bg-primary-800 transform transition-transform duration-300 ease-in-out lg:translate-x-0 lg:static lg:inset-0 flex flex-col ${
        sidebarOpen ? 'translate-x-0' : '-translate-x-full'
      }`}>
        <div className="flex items-center justify-between h-16 px-4 bg-primary-900">
          <div className="flex items-center">
            <Building2 className="h-8 w-8 text-white mr-2" />
            <span className="text-white text-lg font-semibold">CityLights</span>
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
            <div className="h-10 w-10 bg-primary-600 rounded-full flex items-center justify-center">
              <User className="h-6 w-6 text-white" />
            </div>
            <div className="ml-3">
              <div className="text-white text-sm font-medium">
                {user?.firstName} {user?.lastName}
              </div>
              <div className="text-primary-300 text-xs">Usuario Casual</div>
            </div>
          </div>
        </div>

        {/* Navigation */}
        <nav className="mt-4 px-4 flex-1">
          <ul className="space-y-2">
            {menuItems.map((item) => (
              <li key={item.id}>
                <button
                  onClick={() => {
                    if (item.section) {
                      handleSectionChange(item.id);
                    } else if (item.path) {
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

        {/* Logout - Mejorado para evitar superposición */}
        <div className="p-4 border-t border-primary-700 mt-auto">
          <button
            onClick={handleLogout}
            className="w-full flex items-center px-3 py-2 text-sm font-medium text-primary-100 rounded-md hover:bg-red-600 hover:text-white transition-colors"
          >
            <LogOut className="mr-3 h-5 w-5" />
            Cerrar Sesión
          </button>
        </div>
      </div>

      {/* Main content */}
      <div className="lg:pl-64">
        {/* Encabezado principal con saludo - AZUL */}
        <div className="bg-gradient-to-r from-blue-600 to-blue-700 text-white">
          <div className="px-6 py-6">
            <h1 className="text-3xl font-bold mb-2">
              ¡Bienvenido, {user?.firstName}!
            </h1>
            <p className="text-blue-100">
              Desde aquí puedes gestionar tus reservas y ver las áreas comunes disponibles.
            </p>
          </div>
        </div>

        {/* Top bar con Panel de Usuario */}
        <div className="flex items-center justify-between h-16 px-6 bg-white border-b border-gray-200">
          <button
            onClick={() => setSidebarOpen(true)}
            className="lg:hidden text-gray-500 hover:text-gray-700"
          >
            <Menu className="h-6 w-6" />
          </button>
          <h2 className="text-xl font-semibold text-gray-900">Panel de Usuario</h2>
          <div className="flex items-center space-x-4">
            <Bell className="h-6 w-6 text-gray-400 hover:text-gray-500 cursor-pointer" />
          </div>
        </div>
        {/* Dashboard content */}
        <div className="p-6">
          {/* Contenido dinámico según la sección activa */}
          {activeSection === 'dashboard' && (
            <>
              {/* Quick stats */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-6">
                <div className="bg-white p-6 rounded-lg shadow">
                  <div className="flex items-center">
                    <Calendar className="h-8 w-8 text-primary-600 mr-3" />
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900">Mis Reservas</h3>
                      <p className="text-gray-600">Ver y gestionar tus reservas</p>
                    </div>
                  </div>
                </div>

                <div className="bg-white p-6 rounded-lg shadow">
                  <div className="flex items-center">
                    <Building2 className="h-8 w-8 text-green-600 mr-3" />
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900">Áreas Disponibles</h3>
                      <p className="text-gray-600">Explora espacios comunes</p>
                    </div>
                  </div>
                </div>

                <div 
                  className="bg-white p-6 rounded-lg shadow cursor-pointer hover:shadow-lg transition-shadow"
                  onClick={() => navigateTo('/mis-pagos')}
                >
                  <div className="flex items-center">
                    <CreditCard className="h-8 w-8 text-orange-600 mr-3" />
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900">Mis Pagos</h3>
                      <p className="text-gray-600">Cuotas mensuales y pagos</p>
                    </div>
                  </div>
                </div>

                <div className="bg-white p-6 rounded-lg shadow">
                  <div className="flex items-center">
                    <Receipt className="h-8 w-8 text-blue-600 mr-3" />
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900">Mis Facturas</h3>
                      <p className="text-gray-600">Historial de pagos</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Resumen de Pagos Pendientes */}
              <div className="bg-white rounded-lg shadow mb-6">
                <div className="p-6 border-b border-gray-200">
                  <div className="flex items-center justify-between">
                    <h3 className="text-lg font-semibold text-gray-900">💳 Resumen de Pagos</h3>
                    <button
                      onClick={() => navigateTo('/mis-pagos')}
                      className="text-orange-600 hover:text-orange-700 text-sm font-medium"
                    >
                      Ver todos →
                    </button>
                  </div>
                </div>
                <div className="p-6">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                    <div className="text-center p-4 bg-orange-50 rounded-lg">
                      <div className="text-2xl font-bold text-orange-600">0</div>
                      <div className="text-sm text-gray-600">Cuotas Pendientes</div>
                    </div>
                    <div className="text-center p-4 bg-red-50 rounded-lg">
                      <div className="text-2xl font-bold text-red-600">$0</div>
                      <div className="text-sm text-gray-600">Total a Pagar</div>
                    </div>
                    <div className="text-center p-4 bg-green-50 rounded-lg">
                      <div className="text-2xl font-bold text-green-600">0</div>
                      <div className="text-sm text-gray-600">Pagos Realizados</div>
                    </div>
                  </div>
                  <div className="text-center">
                    <p className="text-gray-500 text-sm mb-3">
                      💡 Las cuotas mensuales de $100 se generan automáticamente el primer día de cada mes
                    </p>
                    <button
                      onClick={() => navigateTo('/mis-pagos')}
                      className="bg-orange-600 text-white px-4 py-2 rounded-lg hover:bg-orange-700 transition-colors flex items-center mx-auto"
                    >
                      <CreditCard className="h-4 w-4 mr-2" />
                      Ver Mis Pagos
                    </button>
                  </div>
                </div>
              </div>

              {/* Recent activity */}
              <div className="bg-white rounded-lg shadow">
                <div className="p-6 border-b border-gray-200">
                  <h3 className="text-lg font-semibold text-gray-900">Actividad Reciente</h3>
                </div>
                <div className="p-6">
                  <p className="text-gray-500">No hay actividad reciente</p>
                </div>
              </div>
            </>
          )}



          {/* Mis Facturas */}
          {activeSection === 'mis-facturas' && (
            <>
              <div className="mb-6">
                <h2 className="text-2xl font-bold text-gray-900">Mis Facturas</h2>
                <p className="text-gray-600">Historial de facturas y pagos realizados</p>
              </div>

              <div className="bg-white rounded-lg shadow">
                <div className="p-6 border-b border-gray-200">
                  <h3 className="text-lg font-semibold text-gray-900">Facturas Recientes</h3>
                </div>
                <div className="p-6">
                  <div className="space-y-4">
                    <div className="flex items-center justify-between p-4 border border-gray-200 rounded-lg">
                      <div className="flex items-center">
                        <Receipt className="h-8 w-8 text-green-600 mr-3" />
                        <div>
                          <h4 className="font-semibold text-gray-900">Factura #FAC-001</h4>
                          <p className="text-sm text-gray-600">Reserva Piscina - Diciembre 2024</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="font-semibold text-gray-900">$25.000</p>
                        <p className="text-sm text-green-600">Pagada</p>
                      </div>
                    </div>

                    <div className="flex items-center justify-between p-4 border border-gray-200 rounded-lg">
                      <div className="flex items-center">
                        <Receipt className="h-8 w-8 text-green-600 mr-3" />
                        <div>
                          <h4 className="font-semibold text-gray-900">Factura #FAC-002</h4>
                          <p className="text-sm text-gray-600">Reserva Salón Eventos - Noviembre 2024</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="font-semibold text-gray-900">$50.000</p>
                        <p className="text-sm text-green-600">Pagada</p>
                      </div>
                    </div>

                    <div className="flex items-center justify-between p-4 border border-gray-200 rounded-lg">
                      <div className="flex items-center">
                        <Receipt className="h-8 w-8 text-yellow-600 mr-3" />
                        <div>
                          <h4 className="font-semibold text-gray-900">Factura #FAC-003</h4>
                          <p className="text-sm text-gray-600">Reserva Gimnasio - Octubre 2024</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="font-semibold text-gray-900">$15.000</p>
                        <p className="text-sm text-yellow-600">Pendiente</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}