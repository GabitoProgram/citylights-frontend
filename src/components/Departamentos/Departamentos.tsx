import { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import { 
  Building2, 
  Plus, 
  Edit, 
  Trash2, 
  Search, 
  Menu, 
  X, 
  LogOut,
  Home,
  Users,
  Calendar,
  BarChart3,
  Settings,
  Crown
} from 'lucide-react';

interface Departamento {
  id: number;
  numero: number;
  torre: string;
  propietario_id: string;
  propietario_nombre?: string;
  created_at: string;
  updated_at: string;
}

interface Consumo {
  id: number;
  departamento_id: number;
  medidor_id: number;
  lectura_anterior: number;
  lectura_actual: number;
  consumo: number;
  fecha_lectura: string;
  periodo: string;
}

interface Factura {
  id: number;
  departamento_id: number;
  numero_factura: string;
  monto_total: number;
  fecha_emision: string;
  fecha_vencimiento: string;
  estado: string;
}

const Departamentos = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState('');
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [activeTab, setActiveTab] = useState('departamentos');
  const [departamentos, setDepartamentos] = useState<Departamento[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showCreateModal, setShowCreateModal] = useState(false);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const navigateTo = (path: string) => {
    navigate(path);
    setSidebarOpen(false);
  };

  const menuItems = [
    { id: 'dashboard', name: 'Dashboard Principal', icon: Home, path: '/dashboard' },
    { id: 'areas-comunes', name: 'Gestionar Áreas Comunes', icon: Building2, path: '/areas-comunes' },
    { id: 'departamentos', name: 'Gestionar Departamentos', icon: Building2, path: '/departamentos' },
    { id: 'reservas', name: 'Todas las Reservas', icon: Calendar, path: '/reservas' },
    { id: 'usuarios', name: 'Gestión de Usuarios', icon: Users, path: '/usuarios' },
    { id: 'reportes', name: 'Reportes y Analytics', icon: BarChart3, path: '/reportes' },
    { id: 'configuracion', name: 'Configuración Global', icon: Settings, path: '/configuracion' }
  ];

  useEffect(() => {
    fetchDepartamentos();
  }, []);

  const fetchDepartamentos = async () => {
    setLoading(true);
    setError(null);
    try {
      const token = localStorage.getItem('access_token');
      console.log('🔍 [Frontend] Token encontrado:', token ? `${token.substring(0, 50)}...` : 'NO TOKEN');
      
      const response = await fetch('http://localhost:3000/api/proxy/departamento/departamentos/', {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      console.log('🔍 [Frontend] Response status:', response.status);
      console.log('🔍 [Frontend] Response headers:', Object.fromEntries(response.headers.entries()));

      if (response.ok) {
        const data = await response.json();
        setDepartamentos(data);
      } else {
        throw new Error('Error al cargar departamentos');
      }
    } catch (error) {
      console.error('Error:', error);
      setError('Error al cargar departamentos');
    } finally {
      setLoading(false);
    }
  };

  const createDepartamento = async () => {
    // Implementar lógica de creación
    setShowCreateModal(false);
  };

  const filteredDepartamentos = departamentos.filter(dept =>
    String(dept.numero).toLowerCase().includes(searchTerm.toLowerCase()) ||
    (dept.torre && dept.torre.toLowerCase().includes(searchTerm.toLowerCase()))
  );

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
          
          <nav className="mt-4 px-4">
            <ul className="space-y-2">
              {menuItems.map((item) => (
                <li key={item.id}>
                  <button
                    onClick={() => navigateTo(item.path)}
                    className={`w-full flex items-center px-3 py-2 text-sm font-medium rounded-md transition-colors ${
                      window.location.pathname === item.path
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
        <div className="flex-1 lg:ml-0">
          {/* Header */}
          <header className="bg-white/10 backdrop-blur-sm border-b border-white/10 sticky top-0 z-40">
            <div className="max-w-7xl mx-auto py-4 px-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center">
                  <button
                    onClick={() => setSidebarOpen(true)}
                    className="lg:hidden text-white hover:text-purple-200 mr-4"
                  >
                    <Menu className="h-6 w-6" />
                  </button>
                  <Building2 className="h-8 w-8 text-white mr-3" />
                  <h1 className="text-2xl font-bold text-white">Gestión de Departamentos</h1>
                </div>
                <div className="flex items-center space-x-4">
                  <div className="relative">
                    <Search className="h-5 w-5 absolute left-3 top-1/2 transform -translate-y-1/2 text-purple-300" />
                    <input
                      type="text"
                      placeholder="Buscar departamentos..."
                      className="pl-10 pr-4 py-2 bg-white/10 border border-white/20 text-white placeholder-purple-300 rounded-lg focus:ring-2 focus:ring-purple-400 focus:border-transparent"
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                    />
                  </div>
                </div>
              </div>
            </div>
          </header>

          {/* Content */}
          <main className="max-w-7xl mx-auto py-6 px-6">
            <div className="bg-white/10 backdrop-blur-sm rounded-xl p-6 border border-white/20">
              {/* Tabs */}
              <div className="flex space-x-1 mb-6 bg-black/20 p-1 rounded-lg">
                {['departamentos', 'consumos', 'facturas', 'morosidades'].map((tab) => (
                  <button
                    key={tab}
                    onClick={() => setActiveTab(tab)}
                    className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition-colors ${
                      activeTab === tab
                        ? 'bg-white text-purple-900'
                        : 'text-white hover:text-purple-200'
                    }`}
                  >
                    {tab.charAt(0).toUpperCase() + tab.slice(1)}
                  </button>
                ))}
              </div>

              {/* Error notification */}
              {error && (
                <div className="bg-red-500/20 border border-red-500/50 text-red-200 px-4 py-3 rounded mb-4">
                  {error}
                </div>
              )}

              {/* Loading */}
              {loading && (
                <div className="flex justify-center items-center h-64">
                  <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white"></div>
                </div>
              )}

              {/* Tab Content */}
              {!loading && activeTab === 'departamentos' && (
                <div>
                  <div className="flex justify-between items-center mb-4">
                    <h2 className="text-xl font-semibold text-white">Lista de Departamentos</h2>
                    <button 
                      onClick={() => setShowCreateModal(true)}
                      className="bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded-lg flex items-center"
                    >
                      <Plus className="h-4 w-4 mr-2" />
                      Nuevo Departamento
                    </button>
                  </div>
                  
                  <div className="bg-white/5 rounded-lg overflow-hidden">
                    <table className="w-full">
                      <thead className="bg-black/20">
                        <tr>
                          <th className="px-6 py-3 text-left text-xs font-medium text-purple-200 uppercase tracking-wider">Número</th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-purple-200 uppercase tracking-wider">Torre</th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-purple-200 uppercase tracking-wider">Propietario</th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-purple-200 uppercase tracking-wider">Acciones</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-white/10">
                        {filteredDepartamentos.map((departamento) => (
                          <tr key={departamento.id} className="hover:bg-white/5">
                            <td className="px-6 py-4 whitespace-nowrap text-white">{departamento.numero}</td>
                            <td className="px-6 py-4 whitespace-nowrap text-white">{departamento.torre}</td>
                            <td className="px-6 py-4 whitespace-nowrap text-white">{departamento.propietario_nombre || departamento.propietario_id}</td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                              <div className="flex space-x-2">
                                <button className="text-purple-300 hover:text-purple-100">
                                  <Edit className="h-4 w-4" />
                                </button>
                                <button className="text-red-300 hover:text-red-100">
                                  <Trash2 className="h-4 w-4" />
                                </button>
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {!loading && activeTab === 'consumos' && (
                <div>
                  <h2 className="text-xl font-semibold text-white mb-4">Gestión de Consumos</h2>
                  <p className="text-purple-200">Funcionalidad de consumos próximamente...</p>
                </div>
              )}

              {!loading && activeTab === 'facturas' && (
                <div>
                  <h2 className="text-xl font-semibold text-white mb-4">Gestión de Facturas</h2>
                  <p className="text-purple-200">Funcionalidad de facturas próximamente...</p>
                </div>
              )}

              {!loading && activeTab === 'morosidades' && (
                <div>
                  <h2 className="text-xl font-semibold text-white mb-4">Gestión de Morosidades</h2>
                  <p className="text-purple-200">Funcionalidad de morosidades próximamente...</p>
                </div>
              )}
            </div>
          </main>
        </div>

        {/* Backdrop for mobile sidebar */}
        {sidebarOpen && (
          <div 
            className="fixed inset-0 bg-black bg-opacity-50 z-40 lg:hidden"
            onClick={() => setSidebarOpen(false)}
          />
        )}

        {/* Create Modal */}
        {showCreateModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-lg p-6 w-full max-w-md">
              <h3 className="text-lg font-medium text-gray-900 mb-4">Nuevo Departamento</h3>
              <form>
                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Número
                  </label>
                  <input
                    type="text"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                    placeholder="Ej: 101"
                  />
                </div>
                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Tipo
                  </label>
                  <select className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-purple-500 focus:border-transparent">
                    <option value="">Seleccionar tipo</option>
                    <option value="estudio">Estudio</option>
                    <option value="1_dormitorio">1 Dormitorio</option>
                    <option value="2_dormitorios">2 Dormitorios</option>
                    <option value="3_dormitorios">3 Dormitorios</option>
                  </select>
                </div>
                <div className="mb-6">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    ID Propietario
                  </label>
                  <input
                    type="text"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                    placeholder="ID del propietario"
                  />
                </div>
                <div className="flex justify-end space-x-3">
                  <button
                    type="button"
                    onClick={() => setShowCreateModal(false)}
                    className="px-4 py-2 bg-gray-300 text-gray-700 rounded-md hover:bg-gray-400"
                  >
                    Cancelar
                  </button>
                  <button
                    type="button"
                    onClick={createDepartamento}
                    className="px-4 py-2 bg-purple-600 text-white rounded-md hover:bg-purple-700"
                  >
                    Crear
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
    </div>
  );
};

export default Departamentos;